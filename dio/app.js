import { frame, reconcile, visibleByDefault } from './model.js';
import { load } from './sources.js';
import { exportSets } from './set-export.js';
import { SETS, PRESETS, selectedSets, selectedFeatures, setOf } from './sets.js';

const $ = (id) => document.getElementById(id);
const map = L.map('map').setView([50.0755, 14.4378], 17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
let data;
let result;
let bbox;
let first;
let selecting = false;
let busy = false;
let rectangle;
let overlay;
let chosen = [...PRESETS.dio];
let storageKey;
const status = (text) => { $('status').textContent = text; };
const ready = () => data && chosen.every((id) => data.coverage?.[id]);

function save() {
  if (!data) return;
  data.selectedSets = [...chosen];
  try {
    localStorage.setItem(storageKey, JSON.stringify({ decisions: data.decisions, visibility: data.visibility }));
  } catch {
    $('summary').textContent = 'Lokální uložení selhalo; použij pracovní JSON.';
  }
}

function setControls() {
  $('sets').replaceChildren();
  const names = { loaded: 'Načteno', partial: 'Načteno částečně', failed: 'Načtení selhalo' };
  for (const set of SETS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = chosen.includes(set.id);
    input.disabled = busy || set.id === 'base';
    const state = data?.coverage?.[set.id];
    const text = busy && input.checked ? 'Načítání / ověřování' : state ? `${names[state]}${input.checked ? '' : ' – skryto'}` : 'Nenačteno';
    label.append(input, ` ${set.label} — ${text}`);
    const small = document.createElement('small');
    small.textContent = set.description;
    label.append(small);
    input.onchange = () => {
      chosen = selectedSets(input.checked ? [...chosen, set.id] : chosen.filter((id) => id !== set.id));
      $('preset').value = 'custom';
      refresh();
    };
    $('sets').append(label);
  }
  $('load').textContent = data ? 'Donačíst / opakovat neúspěšné zdroje' : 'Načíst vybrané sady';
  $('export').disabled = busy || !ready();
}

function render() {
  if (overlay) map.removeLayer(overlay);
  if (!data) return;
  const doc = new DOMParser().parseFromString(exportSets(data, {
    sets: chosen, diagnostic: $('diagnostic').checked, preview: true,
    scale: Number($('scale').value), raw: $('mode').value === 'raw'
  }), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatné SVG');
  const svg = doc.documentElement;
  overlay = L.svgOverlay(svg, [[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { interactive: true }).addTo(map);
  svg.addEventListener('click', (event) => {
    const object = event.target.closest('[data-object]');
    if (object && !selecting) {
      L.DomEvent.stopPropagation(event);
      detail(object.getAttribute('data-object'));
    }
  });
}

function refresh() {
  setControls();
  $('layers').replaceChildren();
  if (!data) return;
  data.selectedSets = [...chosen];
  const raw = selectedFeatures(data.raw, chosen, $('diagnostic').checked);
  result = reconcile(raw, data.decisions);
  const rawMode = $('mode').value === 'raw';
  const categories = new Set(result.output.filter((f) => rawMode || !f.suppressed).map((f) => rawMode ? `${f.category} / ${f.source}` : f.category));
  if (chosen.includes('vegetation')) categories.add('Koruny – doložený průměr ze zdroje');
  for (const category of [...categories].sort()) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = data.visibility[category] ?? visibleByDefault(category);
    input.onchange = () => {
      data.visibility[category] = input.checked;
      save();
      render();
    };
    label.append(input, ` ${category}`);
    $('layers').append(label);
  }
  render();
  const missing = chosen.filter((id) => !data.coverage[id]);
  const incomplete = chosen.filter((id) => data.coverage[id] !== 'loaded');
  $('summary').textContent = missing.length ? 'Nově vybrané sady je nutné donačíst.' : `${raw.length} zdrojových prvků. ${incomplete.length ? 'Podklad je částečný; viz podrobnosti.' : 'Vybrané sady připravené.'}`;
  save();
}

function detail(id) {
  const f = result.output.find((o) => o.id === id);
  if (!f) return;
  $('detail').replaceChildren();
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify({ category: f.category, reason: f.reason, sources: f.members.map((member) => data.raw.find((o) => o.id === member)) }, null, 2);
  $('detail').append(pre);
  function button(text, key, value) {
    const b = document.createElement('button');
    b.textContent = text;
    b.onclick = () => {
      data.decisions[key] = value;
      save();
      refresh();
      detail(id);
    };
    $('detail').append(b);
  }
  for (const c of result.candidates.filter((c) => f.members.includes(c.a) || f.members.includes(c.b))) {
    const note = document.createElement('p');
    note.textContent = `${c.a} ↔ ${c.b}: ${c.distance.toFixed(2)} m${c.conflict ? ' – rozpor druhu' : ''}`;
    $('detail').append(note);
    button('Sloučit', c.key, 'merge');
    button('Rozdělit / neslučovat', c.key, 'separate');
  }
  if (f.suppressed && f.kind === 'line') button('Obnovit kresbu', `rail|${id}`, 'separate');
}

function adopt(value) {
  if (value.version !== 2 || !Array.isArray(value.raw) || value.raw.length > 100000 || !Array.isArray(value.bbox) || value.bbox.length !== 4 || !value.bbox.every(Number.isFinite)) throw new Error('Neplatný pracovní JSON');
  const dimensions = frame(value.bbox);
  if (Math.min(dimensions.width, dimensions.height) < 5 || Math.max(dimensions.width, dimensions.height) > 551) throw new Error('Neplatný výřez');
  const ids = new Set();
  for (const f of value.raw) {
    if (typeof f.id !== 'string' || ids.has(f.id) || typeof f.source !== 'string' || typeof f.category !== 'string' || !f.attrs || !['point', 'line', 'area'].includes(f.kind) || !Array.isArray(f.coords)) throw new Error('Neplatný objekt');
    const coords = f.kind === 'point' ? [f.coords] : f.coords.flat();
    if (!coords.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) throw new Error('Neplatné souřadnice');
    ids.add(f.id);
  }
  data = value;
  bbox = data.bbox;
  data.coverage ||= Object.fromEntries([...new Set(data.raw.map(setOf))].filter((id) => id !== 'control').map((id) => [id, 'partial']));
  chosen = selectedSets(data.selectedSets || chosen);
  let hash = 2166136261;
  const text = JSON.stringify(data.raw);
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  storageKey = `dio-v2-${hash >>> 0}`;
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {}
  data.decisions = { ...stored.decisions, ...data.decisions };
  data.visibility = { ...stored.visibility, ...data.visibility };
  data.errors ||= [];
  $('preset').value = 'custom';
  $('load').disabled = false;
  $('json').disabled = false;
  refresh();
  map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
}

$('preset').onchange = () => {
  if (PRESETS[$('preset').value]) chosen = [...PRESETS[$('preset').value]];
  refresh();
};
$('select').onclick = () => {
  selecting = true;
  first = null;
  bbox = null;
  data = null;
  for (const id of ['load', 'export', 'json']) $(id).disabled = true;
  $('layers').replaceChildren();
  $('detail').replaceChildren();
  if (overlay) map.removeLayer(overlay);
  if (rectangle) map.removeLayer(rectangle);
  setControls();
  $('summary').textContent = 'Klikni na dva protilehlé rohy.';
};
map.on('click', ({ latlng }) => {
  if (!selecting) return;
  if (!first) {
    first = latlng;
    $('summary').textContent = 'Klikni na druhý roh.';
    return;
  }
  const box = L.latLngBounds(first, latlng);
  const proposed = [box.getWest(), box.getSouth(), box.getEast(), box.getNorth()];
  const { width, height } = frame(proposed);
  selecting = false;
  if (Math.min(width, height) < 5 || Math.max(width, height) > 550) {
    $('summary').textContent = 'Strany musí mít 5–550 m; vyber znovu.';
    return;
  }
  bbox = proposed;
  rectangle = L.rectangle(box, { fill: false, interactive: false }).addTo(map);
  $('load').disabled = false;
  $('summary').textContent = `${width.toFixed(0)} × ${height.toFixed(0)} m`;
});
$('load').onclick = async () => {
  if (!bbox || busy) return;
  busy = true;
  for (const id of ['load', 'select', 'export', 'json', 'import', 'preset', 'diagnostic']) $(id).disabled = true;
  setControls();
  $('summary').textContent = 'Načítám vybrané sady; původní výsledek zůstává zobrazen.';
  try {
    const next = await load(bbox, status, { sets: chosen, diagnostic: $('diagnostic').checked });
    if (data) {
      next.raw = [...new Map([...data.raw, ...next.raw].map((f) => [f.id, f])).values()];
      next.coverage = { ...data.coverage, ...next.coverage };
      next.decisions = data.decisions;
      next.visibility = data.visibility;
    }
    adopt(next);
  } catch (error) {
    $('summary').textContent = `Načtení selhalo: ${error.message}`;
  } finally {
    busy = false;
    for (const id of ['load', 'select', 'import', 'preset', 'diagnostic']) $(id).disabled = false;
    $('json').disabled = !data;
    setControls();
  }
};
$('mode').onchange = refresh;
$('diagnostic').onchange = refresh;
$('scale').onchange = render;
function download(text, type, name) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$('export').onclick = () => {
  if (!ready()) return;
  download(exportSets(data, {
    sets: chosen, diagnostic: $('diagnostic').checked, scale: Number($('scale').value),
    raw: $('mode').value === 'raw', controls: $('control').checked
  }), 'image/svg+xml;charset=utf-8', 'dio-vybrane-sady.svg');
};
$('json').onclick = () => {
  if (data) download(JSON.stringify(data, null, 2), 'application/json', 'dio-pracovni.json');
};
$('import').onchange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 50000000) throw new Error('Soubor přesahuje 50 MB');
    adopt(JSON.parse(await file.text()));
  } catch (error) {
    $('summary').textContent = error.message;
  }
};
setControls();
