import { frame, reconcile, visibleByDefault } from './model.js';
import { load } from './sources.js';
import { exportSvg } from './svg-export.js';

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
let rectangle;
let overlay;
let storageKey;
const status = (text) => { $('status').textContent = text; };

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ decisions: data.decisions, visibility: data.visibility }));
  } catch {
    status('Lokální uložení selhalo; použij pracovní JSON.');
  }
}

function render() {
  if (!data) return;
  if (overlay) map.removeLayer(overlay);
  const doc = new DOMParser().parseFromString(exportSvg(data, result, {
    preview: true, scale: Number($('scale').value), raw: $('mode').value === 'raw'
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

function update() {
  result = reconcile(data.raw, data.decisions);
  $('layers').replaceChildren();
  const rawMode = $('mode').value === 'raw';
  const categories = new Set(result.output.filter((f) => rawMode || !f.suppressed).map((f) => rawMode ? `${f.category} / ${f.source}` : f.category));
  categories.add('Koruny – doložený průměr ze zdroje');
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
  const count = result.output.filter((f) => f.suppressed).length;
  const pending = result.candidates.filter((c) => !c.auto && !data.decisions[c.key]).length;
  status(`${data.raw.length} zdrojových objektů; ${count} potlačených kreseb; ${pending} kandidátů ke kontrole.\n${data.errors.length ? 'NEÚPLNÁ DATA: ' + data.errors.join('; ') : 'Ověřit v terénu.'}`);
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
      update();
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
  update();
  $('export').disabled = false;
  $('json').disabled = false;
  map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
}

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
  status('Klikni na dva protilehlé rohy.');
};
map.on('click', ({ latlng }) => {
  if (!selecting) return;
  if (!first) {
    first = latlng;
    status('Klikni na druhý roh.');
    return;
  }
  const box = L.latLngBounds(first, latlng);
  const proposed = [box.getWest(), box.getSouth(), box.getEast(), box.getNorth()];
  const { width, height } = frame(proposed);
  selecting = false;
  if (Math.min(width, height) < 5 || Math.max(width, height) > 550) {
    status('Strany musí mít 5–550 m; vyber znovu.');
    return;
  }
  bbox = proposed;
  rectangle = L.rectangle(box, { fill: false, interactive: false }).addTo(map);
  $('load').disabled = false;
  status(`${width.toFixed(0)} × ${height.toFixed(0)} m`);
});
$('load').onclick = async () => {
  if (!bbox) return;
  for (const id of ['load', 'select', 'export', 'json', 'import']) $(id).disabled = true;
  data = null;
  if (overlay) map.removeLayer(overlay);
  $('layers').replaceChildren();
  $('detail').replaceChildren();
  try {
    adopt(await load(bbox, (source) => status(`Načítám ${source}…`)));
  } catch (error) {
    status(error.message);
  } finally {
    for (const id of ['load', 'select', 'import']) $(id).disabled = false;
  }
};
$('mode').onchange = () => { if (data) update(); };
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
  if (data) download(exportSvg(data, result, { scale: Number($('scale').value), raw: $('mode').value === 'raw', controls: $('control').checked }), 'image/svg+xml;charset=utf-8', 'dio-povrch-vrstvy.svg');
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
    status(error.message);
  }
};
