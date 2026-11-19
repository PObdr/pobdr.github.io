import { initial, clone, History, moveSign, paperUnit, metreUnit } from './model.js';
import { element, inspectSvg, resourceData, makeMark } from './svg.js';
import { install, decorate, makeSign, configureSign, insertionPhase, prepareProject, validate } from './sign-editor.js';

const $ = (id) => document.getElementById(id);
let project = initial();
let history = new History(project.scene);
let selected = null;
let tool = 'select';
let drawing = [];
let drag = null;
let view = null;
let dirty = false;
let catalog = [];
let chosenAsset = null;
let saveTimer;
const canvas = $('canvas');
const notify = (text) => { $('status').textContent = text; };
const box = () => project.background?.box || [0, 0, 297, 210];
const id = () => crypto.randomUUID();
const selection = () => [...project.scene.poles, ...project.scene.marks].find((item) => item.id === selected);
const safe = (fn) => async (...args) => {
  try { await fn(...args); } catch (error) { notify(error.message); }
};

function change(fn) {
  const before = clone(project.scene);
  try {
    fn();
    validate(project);
    history.commit(project.scene);
    changed();
  } catch (error) {
    project.scene = before;
    render();
    throw error;
  }
}

function changed() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveLocal().catch(() => {
    $('save-status').textContent = 'Lokální uložení selhalo. Ulož pracovní JSON.';
  }), 700);
  render();
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diogen-editor-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocal() {
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put(project, 'current');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    $('save-status').textContent = 'Lokální záloha uložena. Pro přenos použij pracovní JSON.';
  } finally {
    db.close();
  }
}

async function restoreLocal() {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('projects').objectStore('projects').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

function adopt(value) {
  prepareProject(value, () => {
    const answer = prompt('Starý projekt: zařadit dosavadní značky jako původní, nebo nové? Zadej původní / nové.', 'nové');
    if (answer === null) return null;
    if (answer.trim().toLocaleLowerCase('cs') === 'původní') return 'existing';
    if (answer.trim().toLocaleLowerCase('cs') === 'nové') return 'new';
    throw new Error('Zadej původní nebo nové. Projekt se nezměnil.');
  });
  if (value?.background) value.background = inspectSvg(value.background.svg);
  for (const asset of Object.values(value?.assets || {})) Object.assign(asset, inspectSvg(asset.svg));
  validate(value);
  project = value;
  history = new History(project.scene);
  selected = null;
  drawing = [];
  tool = 'select';
  view = null;
  changed();
}

function download(text, mime, name) {
  const href = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

function layerContent(interactive) {
  const layer = element('g', { 'data-diogen-editor': 'objects-v1' });
  const unit = paperUnit(project, box());
  for (const mark of project.scene.marks) {
    const group = makeMark(mark, metreUnit(project, box()));
    if (interactive) group.dataset.object = mark.id;
    if (interactive && mark.id === selected) group.style.filter = 'drop-shadow(0 0 0.5px #136d65)';
    layer.append(group);
  }
  for (const pole of project.scene.poles) {
    const group = element('g', { transform: `translate(${pole.x},${pole.y}) rotate(${pole.angle})` });
    if (interactive) group.dataset.object = pole.id;
    const signs = pole.signs.map((sign) => makeSign(sign, project.assets[sign.asset], unit));
    const height = signs.reduce((total, sign) => total + sign.height + unit, 0);
    group.append(element('line', { x1: 0, y1: 0, x2: 0, y2: -height - unit * 2, stroke: '#63736b', 'stroke-width': unit * 0.7 }));
    let y = -height - unit * 2;
    for (const [index, sign] of signs.entries()) {
      if (interactive) sign.group.dataset.signIndex = index;
      sign.group.setAttribute('transform', `translate(0,${y})`);
      group.append(sign.group);
      y += sign.height + unit;
    }
    group.append(element('circle', { cx: 0, cy: 0, r: unit * 1.2, fill: '#63736b' }));
    if (interactive && pole.id === selected) {
      group.append(element('rect', {
        x: -Math.max(...signs.map((sign) => sign.width), unit * 4) / 2 - unit,
        y: -height - unit * 3,
        width: Math.max(...signs.map((sign) => sign.width), unit * 4) + unit * 2,
        height: height + unit * 5,
        fill: 'none', stroke: '#136d65', 'stroke-width': unit * 0.3,
        'stroke-dasharray': `${unit} ${unit}`, 'pointer-events': 'none'
      }));
    }
    layer.append(group);
  }
  return layer;
}

function exportSvg() {
  const bounds = box();
  const root = element('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: bounds.join(' '),
    width: `${project.scene.widthMm}mm`,
    height: `${project.scene.widthMm * bounds[3] / bounds[2]}mm`
  });
  root.append(element('title', {}, 'DIOGEN – pracovní dopravní situace'));
  root.append(element('metadata', {}, JSON.stringify({
    type: 'diogen-editor-export', version: 1, scale: project.scene.scale,
    reviewStatus: 'unreviewed', coordinateSpace: 'source-svg-viewBox',
    backgroundEmbedded: Boolean(project.background), schematicMarkings: true,
    displayMode: project.scene.displayMode, signScale: project.scene.signScale
  }, null, 2)));
  root.append(element('rect', { x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3], fill: 'white' }));
  if (project.background) root.append(element('image', {
    x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3], href: resourceData(project.background)
  }));
  root.append(layerContent(false));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}

function renderCanvas() {
  const bounds = box();
  canvas.setAttribute('viewBox', (view || bounds).join(' '));
  canvas.replaceChildren(element('rect', { x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3], fill: 'white' }));
  if (project.background) canvas.append(element('image', {
    x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3],
    href: resourceData(project.background), 'pointer-events': 'none'
  }));
  canvas.append(layerContent(true));
  if (drawing.length) canvas.append(element('polyline', {
    points: drawing.map((point) => point.join(',')).join(' '), fill: 'none',
    stroke: '#136d65', 'stroke-width': paperUnit(project, bounds) * 0.5, 'pointer-events': 'none'
  }));
  $('finish').disabled = drawing.length < 2;
}

function field(parent, title, value, type, action) {
  const label = document.createElement('label');
  label.append(title);
  const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
  if (type !== 'textarea') input.type = type;
  input.value = value;
  input.onchange = safe(() => {
    const value = type === 'number' ? Number(input.value) : input.value;
    input.onchange = null;
    change(() => action(value));
  });
  label.append(input);
  parent.append(label);
  return input;
}

function button(parent, title, action) {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = title;
  node.onclick = safe(action);
  parent.append(node);
  return node;
}

function render() {
  renderCanvas();
  $('paper-width').value = project.scene.widthMm;
  $('scale').value = project.scene.scale;
  $('undo').disabled = history.index === 0;
  $('redo').disabled = history.index >= history.items.length - 1;
  const parent = $('properties');
  parent.replaceChildren();
  const item = selection();
  if (!item) parent.textContent = 'Vyber objekt ve výkresu.';
  else if (item.signs) {
    field(parent, 'Natočení sestavy [°]', item.angle, 'number', (value) => { item.angle = value; });
    field(parent, 'X [jednotky SVG]', item.x, 'number', (value) => { item.x = value; });
    field(parent, 'Y [jednotky SVG]', item.y, 'number', (value) => { item.y = value; });
    item.signs.forEach((sign, index) => {
      const row = document.createElement('div');
      row.className = 'sign-row';
      const label = document.createElement('strong');
      label.textContent = `${index + 1}. ${sign.kind === 'asset' ? project.assets[sign.asset].label : 'Pracovní šablona'}`;
      row.append(label);
      field(row, 'Šířka ve výkresu [mm]', sign.widthMm, 'number', (value) => { sign.widthMm = value; });
      if (sign.kind !== 'asset') field(row, 'Text / hodnota (nejvýše 3 řádky)', sign.text, 'textarea', (value) => { sign.text = value; });
      button(row, 'Nahradit vybranou značkou', async () => {
        const replacement = await currentSign();
        if (!project.scene.poles.includes(item)) throw new Error('Vybraný sloupek už není v projektu.');
        change(() => { item.signs[index] = { ...replacement, phase: sign.phase }; });
      });
      button(row, '↑', () => change(() => moveSign(item, index, -1))).setAttribute('aria-label', 'Značka výš');
      button(row, '↓', () => change(() => moveSign(item, index, 1))).setAttribute('aria-label', 'Značka níž');
      button(row, 'Odebrat', () => change(() => { item.signs.splice(index, 1); }));
      parent.append(row);
    });
  } else {
    field(parent, 'Šířka čáry / hloubka přechodu [m]', item.widthM, 'number', (value) => { item.widthM = value; });
    button(parent, 'Bílá', () => change(() => { item.color = '#ffffff'; }));
    button(parent, 'Žlutá', () => change(() => { item.color = '#ffd300'; }));
    parent.append(document.createTextNode(' Body se zatím upravují překreslením; celou kresbu lze posunout tažením.'));
  }
  if (item) {
    button(parent, 'Duplikovat', () => change(() => {
      const copy = clone(item);
      copy.id = id();
      const delta = paperUnit(project, box()) * 5;
      if (copy.signs) { copy.x += delta; copy.y += delta; }
      else copy.points = copy.points.map(([x, y]) => [x + delta, y + delta]);
      project.scene[copy.signs ? 'poles' : 'marks'].push(copy);
      selected = copy.id;
    }));
    button(parent, 'Smazat objekt', remove);
  }
  $('objects').replaceChildren();
  [...project.scene.poles, ...project.scene.marks].forEach((object, index) => {
    const node = button($('objects'), `${index + 1}. ${object.signs ? `Sloupek · ${object.signs.length} značek` : object.kind}`, () => {
      selected = object.id; tool = 'select'; render();
    });
    node.setAttribute('aria-pressed', object.id === selected);
  });
  $('append-sign').disabled = !item?.signs;
  decorate();
}

function remove() {
  change(() => {
    project.scene.poles = project.scene.poles.filter((item) => item.id !== selected);
    project.scene.marks = project.scene.marks.filter((item) => item.id !== selected);
    selected = null;
  });
}

async function currentSign() {
  if (chosenAsset) {
    const key = 'catalog-' + chosenAsset.id;
    if (!Object.hasOwn(project.assets, key)) {
      const target = project;
      const asset = chosenAsset;
      const response = await fetch(new URL(asset.svg, catalogBase));
      if (!response.ok) throw new Error(`SVG značky nelze načíst (${response.status}).`);
      const source = await response.text();
      if (project !== target) throw new Error('Projekt se během načítání změnil.');
      project.assets[key] = { ...inspectSvg(source), label: asset.label, source: asset.svg, reviewStatus: 'unreviewed' };
    }
    return configureSign({ kind: 'asset', asset: key, text: '', widthMm: 9 }, project.assets[key], insertionPhase());
  }
  return configureSign({ kind: $('template').value, text: $('template').value === 'speed' ? '50' : 'MIMO\nZÁSOBOVÁNÍ', widthMm: 9 }, null, insertionPhase());
}

function point(event) {
  const at = new DOMPoint(event.clientX, event.clientY).matrixTransform(canvas.getScreenCTM().inverse());
  return [at.x, at.y];
}

let busy = false;
canvas.addEventListener('pointerdown', safe(async (event) => {
  if (event.button !== 0 || busy) return;
  canvas.focus();
  const at = point(event);
  if (tool === 'pole') {
    busy = true;
    try {
      const sign = await currentSign();
      change(() => {
        const pole = { id: id(), x: at[0], y: at[1], angle: 0, signs: [sign] };
        project.scene.poles.push(pole);
        selected = pole.id;
        tool = 'select';
      });
      notify('Sloupek vložen. Přesuň ho tažením; značky uprav vpravo.');
    } finally { busy = false; }
  } else if (tool === 'draw') {
    drawing.push(at);
    renderCanvas();
  } else {
    selected = event.target.closest('[data-object]')?.dataset.object || null;
    const item = selection();
    drag = item ? { at, original: clone(item), id: event.pointerId } : { at, view: [...(view || box())], id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    render();
  }
}));

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const at = point(event);
  const delta = [at[0] - drag.at[0], at[1] - drag.at[1]];
  if (drag.original) {
    const item = selection();
    if (item?.signs) { item.x = drag.original.x + delta[0]; item.y = drag.original.y + delta[1]; }
    else if (item) item.points = drag.original.points.map(([x, y]) => [x + delta[0], y + delta[1]]);
  } else {
    view = [drag.view[0] - delta[0], drag.view[1] - delta[1], drag.view[2], drag.view[3]];
    drag.at = at;
    drag.view = [...view];
  }
  renderCanvas();
});

function endDrag(cancel = false) {
  if (!drag) return;
  if (drag.original) {
    if (cancel) Object.assign(selection(), drag.original);
    else { history.commit(project.scene); changed(); }
  }
  drag = null;
  render();
}
canvas.onpointerup = () => endDrag();
canvas.onpointercancel = () => endDrag(true);

function finish() {
  if (drawing.length < ($('mark-kind').value === 'area' ? 3 : 2)) throw new Error('Přidej další body.');
  const mark = { id: id(), kind: $('mark-kind').value, points: clone(drawing), widthM: Number($('mark-width').value), color: $('mark-color').value };
  change(() => { project.scene.marks.push(mark); });
  drawing = [];
  selected = mark.id;
  tool = 'select';
  render();
  notify('Pracovní značení vloženo. Rozměry a provedení ověř.');
}

const catalogBase = new URL('../assets/signs/vl6-1-unreviewed/', location.href);
function filterCatalog() {
  const query = $('search').value.toLocaleLowerCase('cs');
  const matches = catalog.filter((asset) => asset.label.toLocaleLowerCase('cs').includes(query));
  $('catalog').replaceChildren();
  matches.slice(0, 100).forEach((asset) => {
    const option = document.createElement('option');
    option.value = asset.id;
    option.textContent = asset.label;
    $('catalog').append(option);
  });
  $('catalog-status').textContent = `${matches.length} výsledků, zobrazeno nejvýše 100. Neověřené převody.`;
}
$('load-catalog').onclick = safe(async () => {
  $('catalog-status').textContent = 'Načítám katalog…';
  try {
    const response = await fetch(new URL('catalog.json', catalogBase));
    if (!response.ok) throw new Error(`Katalog není dostupný (${response.status}).`);
    const value = await response.json();
    if (!Array.isArray(value.assets)) throw new Error('Neplatný katalog.');
    catalog = value.assets.filter((asset) => typeof asset.id === 'string' && typeof asset.label === 'string' &&
      /^svg\/[A-Za-z0-9_-]+\.svg$/.test(asset.svg) && /^(A|B|C|P|IP|IS|IJ|IZ|E)\d/i.test(asset.label));
    filterCatalog();
  } catch (error) {
    $('catalog-status').textContent = 'Knihovna se nenačetla. Můžeš opakovat nebo použít pracovní šablony.';
    throw error;
  }
});
$('search').oninput = filterCatalog;
$('use-asset').onclick = safe(() => {
  chosenAsset = catalog.find((asset) => asset.id === $('catalog').value);
  if (!chosenAsset) throw new Error('Vyber variantu v seznamu.');
  notify(`Vybráno: ${chosenAsset.label}. Vlož nový sloupek nebo přidej na vybraný.`);
});
$('template').onchange = () => { chosenAsset = null; notify('Vybraná pracovní parametrická šablona.'); };
$('new-pole').onclick = () => { tool = 'pole'; drawing = []; notify('Klikni do výkresu na patu nového sloupku.'); renderCanvas(); };
$('append-sign').onclick = safe(async () => {
  const pole = selection();
  if (!pole?.signs) throw new Error('Vyber sloupek.');
  const sign = await currentSign();
  if (!project.scene.poles.includes(pole)) throw new Error('Vybraný sloupek už není v projektu.');
  change(() => { pole.signs.push(sign); });
});
$('select-tool').onclick = () => { tool = 'select'; drawing = []; renderCanvas(); notify('Vyber nebo táhni objekt. Prázdné místo posouvá výřez.'); };
$('draw').onclick = () => { tool = 'draw'; drawing = []; notify('Klikej body. Enter dokončí, Esc zruší.'); };
$('mark-kind').onchange = () => { $('mark-width').value = $('mark-kind').value === 'zebra' ? 3 : 0.125; };
$('finish').onclick = safe(finish);
$('undo').onclick = () => { project.scene = history.step(-1); selected = null; drawing = []; changed(); };
$('redo').onclick = () => { project.scene = history.step(1); selected = null; changed(); };
function zoom(factor) {
  const bounds = view || box();
  view = [bounds[0] + bounds[2] * (1 - factor) / 2, bounds[1] + bounds[3] * (1 - factor) / 2, bounds[2] * factor, bounds[3] * factor];
  renderCanvas();
}
$('zoom-in').onclick = () => zoom(0.8);
$('zoom-out').onclick = () => zoom(1.25);
$('fit').onclick = () => { view = null; renderCanvas(); };
$('paper-width').onchange = safe(() => change(() => { project.scene.widthMm = Number($('paper-width').value); }));
$('scale').onchange = safe(() => change(() => { project.scene.scale = Number($('scale').value); }));
$('save').onclick = () => { download(JSON.stringify(project, null, 2), 'application/json', 'diogen-editor.json'); dirty = false; };
$('export').onclick = safe(() => download(exportSvg(), 'image/svg+xml', 'diogen-editor.svg'));
$('map-file').onchange = safe(async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 25000000) throw new Error('SVG přesahuje 25 MB.');
  if (dirty && !confirm('Nový podklad nahradí celý projekt. Máš uložený pracovní JSON?')) return;
  const background = inspectSvg(await file.text());
  const next = initial();
  next.background = background;
  next.scene.widthMm = background.widthMm || 297;
  adopt(next);
  notify('Podklad vložen jako uzamčené SVG. Ověř měřítko. Vícestránkové SVG se zde edituje jako jedno plátno; export nezachovává definice stránek Inkscapu.');
  event.target.value = '';
});
$('project-file').onchange = safe(async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 50000000) throw new Error('Projekt přesahuje 50 MB.');
  if (dirty && !confirm('Nahradit rozpracovaný projekt načteným JSON?')) return;
  adopt(JSON.parse(await file.text()));
  notify('Projekt obnoven včetně vložených SVG a parametrů.');
  event.target.value = '';
});
$('restore').onclick = safe(async () => {
  if (dirty && !confirm('Nahradit projekt lokální zálohou?')) return;
  const value = await restoreLocal();
  if (!value) throw new Error('Lokální záloha není dostupná.');
  adopt(value);
});
window.addEventListener('beforeunload', (event) => {
  if (dirty) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('keydown', safe((event) => {
  if (event.target.closest('input, textarea, select, button, summary')) return;
  if (event.key === 'Escape') { endDrag(true); drawing = []; tool = 'select'; render(); }
  if (event.key === 'Enter' && tool === 'draw') { event.preventDefault(); finish(); }
  if (event.key === 'Delete' && selection()) { event.preventDefault(); remove(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    project.scene = history.step(event.shiftKey ? 1 : -1);
    selected = null;
    changed();
  }
}));
install({
  project: () => project,
  selection,
  canvas,
  change,
  field,
  button,
  render,
  currentSign,
  notify
});
history.reset(project.scene);
restoreLocal().then((value) => { $('restore').hidden = !value; }).catch(() => {
  $('save-status').textContent = 'Lokální záloha není dostupná. Používej pracovní JSON.';
});
render();
