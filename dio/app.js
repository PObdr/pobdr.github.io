import { createInterface } from './interface.js';
import { createOverviewControl, validateOverview, appendOverviewPage, printExport } from './overview.js';
import { frame, reconcile, visibleByDefault } from './model.js';
import { load } from './sources.js';
import { exportSelection as exportJtsk } from './selection-export.js';
import { createSelectionControl } from './selection-control.js';
import { validateSelection, selectionBbox } from './selection.js';
import { projectDataset } from './jtsk.js';
import { createMap, gridOverlay, gridSelection } from './jtsk-map.js';
import { SETS, PRESETS, selectedSets, selectedFeatures, setOf } from './sets.js';

const $ = (id) => document.getElementById(id);
const ui = createInterface();
const map = createMap('map');
map.on('dio:basemaperror', () => ui.mapError());
let data;
let result;
let bbox;
let selection;
let selecting = false;
let busy = false;
let rectangle;
let overlay;
let chosen = [...PRESETS.dio];
let storageKey;
const status = (text) => {
  $('status').textContent = text;
  ui.progress(text);
};
const overview = createOverviewControl(() => {
  if (!overview.enabled) $('preset').value = 'custom';
  if (data) {
    data.includeOverview = overview.enabled;
    data.overview = overview.snapshot();
  }
  setControls();
});
const pdfButton = document.createElement('button');
pdfButton.type = 'button';
pdfButton.id = 'overview-print';
pdfButton.textContent = 'Tisk / PDF';
pdfButton.disabled = true;
$('export').after(pdfButton);
const ready = () => data && chosen.every((id) => data.coverage?.[id]) && overview.ready();

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
  const names = { loaded: 'OK', partial: 'Část', failed: 'Chyba' };
  for (const set of SETS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = chosen.includes(set.id);
    input.disabled = busy || set.id === 'base';
    const state = data?.coverage?.[set.id];
    label.className = 'set-option';
    label.title = set.description;
    const caption = document.createElement('span');
    caption.textContent = set.label;
    const badge = document.createElement('span');
    badge.className = `set-state ${state || 'waiting'}`;
    badge.textContent = busy && input.checked ? 'Načítání' : names[state] || '';
    label.append(input, caption, badge);
    input.onchange = () => {
      chosen = selectedSets(input.checked ? [...chosen, set.id] : chosen.filter((id) => id !== set.id));
      $('preset').value = 'custom';
      refresh();
    };
    $('sets').append(label);
  }
  overview.mount($('overview-slot'), busy);
  $('load').textContent = busy ? 'Načítám podklady' : data ? 'Obnovit podklady' : 'Načíst podklady';
  $('export').disabled = busy || !ready();
  pdfButton.disabled = busy || !ready();
}

function render() {
  if (overlay) map.removeLayer(overlay);
  if (!data) return;
  const doc = new DOMParser().parseFromString(exportJtsk(data, {
    sets: chosen, diagnostic: $('diagnostic').checked, preview: true,
    scale: Number($('scale').value), raw: $('mode').value === 'raw'
  }), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatné SVG');
  const svg = doc.documentElement;
  overlay = gridOverlay(svg, bbox, data.selection).addTo(map);

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
  $('summary').textContent = missing.length ? 'Změněné sady je potřeba načíst.' : incomplete.length ? 'Částečný podklad' : 'Podklad připraven';
  save();
}

function adopt(value) {
  if (![2, 3].includes(value.version) || !Array.isArray(value.raw) || value.raw.length > 100000 || !Array.isArray(value.bbox) || value.bbox.length !== 4 || !value.bbox.every(Number.isFinite)) throw new Error('Neplatný pracovní JSON');
  if (value.includeOverview !== undefined && typeof value.includeOverview !== 'boolean') {
    throw new Error('Neplatná volba přehledové situace');
  }
  const importedOverview = validateOverview(value.overview, false);
  const dimensions = frame(value.bbox);
  if (value.selection) {
    validateSelection(value.selection);
    if (value.version !== 3 || value.crs !== 'EPSG:5514') {
      throw new Error('Natočený výřez vyžaduje projekt EPSG:5514');
    }
    const expected = selectionBbox(value.selection);
    if (expected.some((v, i) => Math.abs(v - value.bbox[i]) > 1e-8)) {
      throw new Error('Nesouhlasí datová obálka natočeného výřezu');
    }
  } else if (Math.min(dimensions.width, dimensions.height) < 5 ||
      Math.max(dimensions.width, dimensions.height) > 551) {
    throw new Error('Neplatný výřez');
  }
  const ids = new Set();
  for (const f of value.raw) {
    if (typeof f.id !== 'string' || ids.has(f.id) || typeof f.source !== 'string' || typeof f.category !== 'string' || !f.attrs || !['point', 'line', 'area'].includes(f.kind) || !Array.isArray(f.coords)) throw new Error('Neplatný objekt');
    const coords = f.kind === 'point' ? [f.coords] : f.coords.flat();
    if (!coords.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) throw new Error('Neplatné souřadnice');
    ids.add(f.id);
  }
  const adopted = projectDataset(value);
  picker.cancel();
  selecting = false;
  data = adopted;
  overview.adopt(data.includeOverview !== false, importedOverview);
  overview.setProject(data);
  data.includeOverview = overview.enabled;
  data.overview = overview.snapshot();
  bbox = data.bbox;
  selection = data.selection;
  if (rectangle) map.removeLayer(rectangle);
  rectangle = gridSelection(bbox, selection).addTo(map);
  data.coverage ||= Object.fromEntries([...new Set(data.raw.map(setOf))].filter((id) => id !== 'control').map((id) => [id, 'partial']));
  chosen = selectedSets(data.selectedSets || chosen);
  let hash = 2166136261;
  const text = JSON.stringify(data.raw);
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  storageKey = `dio-v3-${hash >>> 0}`;
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
  if (!busy) ui.complete(data);
  map.fitBounds(gridSelection(bbox, selection).getBounds());
}

$('preset').onchange = () => {
  overview.preset($('preset').value);
  if (data) data.includeOverview = overview.enabled;
  if (PRESETS[$('preset').value]) chosen = [...PRESETS[$('preset').value]];
  refresh();
};
$('select').textContent = 'Vybrat výřez';
const picker = createSelectionControl(map, {
  message: (text) => { $('summary').textContent = text; },
  onStart() {
    selecting = true;
    ui.selecting();
    selection = null;
    bbox = null;
    data = null;
    overview.reset();
    for (const id of ['load', 'export', 'json']) $(id).disabled = true;
    $('layers').replaceChildren();
    if (overlay) map.removeLayer(overlay);
    if (rectangle) map.removeLayer(rectangle);
    setControls();
  },
  onCancel() {
    selecting = false;
    ui.cancelSelection();
  },
  onComplete(value, bounds) {
    selecting = false;
    selection = value;
    bbox = bounds;
    rectangle = gridSelection(bbox, selection).addTo(map);
    $('load').disabled = false;
    $('summary').textContent = `${value.width.toFixed(1)} × ${value.height.toFixed(1)} m`;
    ui.selectionReady();
  }
});
$('select').onclick = () => picker.start();
$('load').onclick = async () => {
  if (!bbox || busy) return;
  busy = true;
  ui.begin();
  for (const id of ['load', 'select', 'export', 'json', 'import', 'preset', 'diagnostic']) $(id).disabled = true;
  setControls();
  $('summary').textContent = 'Načítám podklady';
  try {
    const loaded = await load(bbox, status, { sets: chosen, diagnostic: $('diagnostic').checked });
    status('Převádím geometrii do EPSG:5514…');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const next = projectDataset(loaded);
    next.includeOverview = overview.enabled;
    next.overview = overview.snapshot();
    if (selection) next.selection = structuredClone(selection);
    if (data) {
      next.raw = [...new Map([...data.raw, ...next.raw].map((f) => [f.id, f])).values()];
      next.coverage = { ...data.coverage, ...next.coverage };
      next.decisions = data.decisions;
      next.visibility = data.visibility;
    }
    adopt(next);
    status('Geometrie připravena v EPSG:5514. Chyby zdrojů: ' + (data.errors.join('; ') || 'žádné'));
    ui.complete(data);
  } catch (error) {
    $('summary').textContent = 'Načtení selhalo';
    ui.fail(error.message);
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
function exportDocument() {
  const options = {
    sets: chosen, diagnostic: $('diagnostic').checked, scale: Number($('scale').value),
    raw: $('mode').value === 'raw', controls: $('control').checked,
    overview: overview.enabled ? overview.export(data) : null
  };
  return appendOverviewPage(exportJtsk(data, options), data, options);
}
$('export').onclick = () => {
  if (!ready()) return;
  try {
    download(exportDocument(), 'image/svg+xml;charset=utf-8', 'dio-s-jtsk.svg');
  } catch (error) {
    $('summary').textContent = 'Operace se nezdařila';
    ui.fail(error.message);
  }
};
pdfButton.onclick = async () => {
  if (!ready()) return;
  try {
    await printExport(exportDocument(), Number($('scale').value));
  } catch (error) {
    $('summary').textContent = 'Operace se nezdařila';
    ui.fail(error.message);
  }
};
$('json').onclick = () => {
  if (data) download(JSON.stringify(data, null, 2), 'application/json', 'dio-pracovni-jtsk.json');
};
$('import').onchange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 50000000) throw new Error('Soubor přesahuje 50 MB');
    adopt(JSON.parse(await file.text()));
  } catch (error) {
    $('summary').textContent = 'Operace se nezdařila';
    ui.fail(error.message);
  }
};
setControls();
