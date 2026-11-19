import { validate as validateBase } from './model.js';
import { element, makeSign as drawSign } from './svg.js';

let editor;
let active = null;
let filterId = 0;

export function dimensions(sign, asset) {
  const ratio = sign.kind === 'asset' ? asset.box[3] / asset.box[2] : sign.kind === 'text' ? 0.45 : 1;
  return {
    width: 600 / Math.max(1, ratio),
    height: 600 * ratio / Math.max(1, ratio)
  };
}

export function configureSign(sign, asset, phase = 'new') {
  const size = dimensions(sign, asset);
  return {
    ...sign,
    phase,
    physicalWidthMm: size.width,
    physicalHeightMm: size.height,
    dimensionSource: 'estimate'
  };
}

export function prepareProject(value, choosePhase) {
  if (value?.type !== 'diogen-editor' || value.version !== 1 || !value.scene) return value;
  const scene = value.scene;
  const signs = (scene.poles || []).flatMap((pole) => pole.signs || []);
  if (scene.signSchema !== 2) {
    const phase = signs.length ? choosePhase() : 'new';
    if (!['new', 'existing'].includes(phase)) throw new Error('Načtení projektu zrušeno.');
    signs.forEach((sign) => {
      const asset = value.assets?.[sign.asset];
      const configured = configureSign(sign, asset, phase);
      const ratio = configured.physicalHeightMm / configured.physicalWidthMm;
      const width = sign.widthMm * scene.scale / 7.5;
      Object.assign(sign, configured, {
        physicalWidthMm: width,
        physicalHeightMm: width * ratio,
        dimensionSource: 'legacy'
      });
    });
    scene.signSchema = 2;
    scene.signScale = 7.5;
    scene.displayMode = 'normal';
  }
  return value;
}

export function validate(value) {
  validateBase(value);
  const scene = value.scene;
  if (scene.signSchema !== 2 || !['normal', 'design'].includes(scene.displayMode) ||
      !Number.isFinite(scene.signScale) || scene.signScale < 0.1 || scene.signScale > 100) {
    throw new Error('Neplatné nastavení zobrazení značek.');
  }
  for (const sign of scene.poles.flatMap((pole) => pole.signs)) {
    if (!['new', 'existing'].includes(sign.phase) ||
        !['estimate', 'manual', 'legacy'].includes(sign.dimensionSource) ||
        ![sign.physicalWidthMm, sign.physicalHeightMm].every((n) => Number.isFinite(n) && n >= 10 && n <= 20000)) {
      throw new Error('Neplatné rozměry nebo zařazení značky (rozměry 10 až 20000 mm).');
    }
  }
  return value;
}

export function makeSign(sign, asset, unit) {
  const scene = editor.project().scene;
  const widthMm = sign.physicalWidthMm / scene.scale * scene.signScale;
  const drawing = drawSign({ ...sign, widthMm }, asset, unit);
  const height = sign.physicalHeightMm / scene.scale * scene.signScale * unit;
  const content = element('g', { transform: `scale(1,${height / drawing.height})` });
  content.append(...drawing.group.childNodes);
  drawing.group.append(content);
  drawing.group.dataset.phase = sign.phase;
  if (scene.displayMode === 'design' && sign.phase === 'existing') {
    const name = `diogen-existing-${++filterId}`;
    const defs = element('defs');
    const filter = element('filter', { id: name, 'color-interpolation-filters': 'sRGB' });
    filter.append(element('feColorMatrix', { type: 'saturate', values: 0 }));
    defs.append(filter);
    drawing.group.prepend(defs);
    content.setAttribute('filter', `url(#${name})`);
  }
  return { ...drawing, height };
}

function select(parent, title, value, options, action) {
  const label = document.createElement('label');
  label.append(title);
  const input = document.createElement('select');
  for (const [key, text] of options) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = text;
    input.append(option);
  }
  input.value = value;
  input.onchange = () => {
    try {
      const next = input.value;
      input.onchange = null;
      editor.change(() => action(next));
    } catch (error) {
      editor.notify(error.message);
    }
  };
  label.append(input);
  parent.append(label);
}

export function install(api) {
  editor = api;
  prepareProject(editor.project(), () => 'new');
  const toolbar = document.querySelector('.toolbar');
  const controls = document.createElement('div');
  controls.id = 'sign-controls';
  toolbar.append(controls);
  const insertion = document.createElement('label');
  insertion.textContent = 'Přidávaná značka';
  const phase = document.createElement('select');
  phase.id = 'insert-phase';
  for (const [value, title] of [['new', 'Nová'], ['existing', 'Původní']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = title;
    phase.append(option);
  }
  insertion.append(phase);
  document.getElementById('new-pole').before(insertion);
  api.canvas.addEventListener('pointerdown', (event) => {
    const sign = event.target.closest('[data-sign-index]');
    active = sign ? Number(sign.dataset.signIndex) : null;
  }, true);
  const style = document.createElement('style');
  style.textContent = `
    #sign-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .sign-row[data-active="true"] {
      outline: 2px solid #136d65;
    }

    .sign-preview {
      display: block;
      width: 80px;
      height: 65px;
      margin: 6px 0;
    }
  `;
  document.head.append(style);
}

export function insertionPhase() {
  return document.getElementById('insert-phase')?.value || 'new';
}

export function decorate() {
  if (!editor) return;
  const scene = editor.project().scene;
  const controls = document.getElementById('sign-controls');
  controls.replaceChildren();
  select(controls, 'Zobrazení', scene.displayMode, [
    ['normal', 'Běžné – vše barevně'],
    ['design', 'Návrh – původní černobíle']
  ], (value) => { scene.displayMode = value; });
  editor.field(controls, 'Zvětšení symbolů v situaci [×]', scene.signScale, 'number', (value) => {
    scene.signScale = value;
  });
  const pole = editor.selection();
  const groups = editor.canvas.querySelectorAll('[data-object]');
  groups.forEach((group) => {
    const item = scene.poles.find((entry) => entry.id === group.dataset.object);
    if (!item) return;
    [...group.children].filter((child) => child.localName === 'g').forEach((sign, index) => {
      sign.dataset.signIndex = index;
    });
  });
  if (!pole?.signs) return;
  const rows = document.querySelectorAll('#properties .sign-row');
  rows.forEach((row, index) => {
    const sign = pole.signs[index];
    row.dataset.active = String(active === index);
    const oldWidth = [...row.querySelectorAll('label')].find((node) => node.textContent.startsWith('Šířka ve výkresu'));
    oldWidth?.remove();
    const preview = makeSign(sign, editor.project().assets[sign.asset], 1);
    const svg = element('svg', {
      viewBox: `${-preview.width / 2 - 1} -1 ${preview.width + 2} ${preview.height + 2}`,
      class: 'sign-preview', 'aria-label': `Náhled značky ${index + 1}`
    });
    svg.append(preview.group);
    row.prepend(svg);
    editor.button(row, 'Vybrat tuto značku', () => {
      active = index;
      editor.render();
    });
    select(row, 'Zařazení značky', sign.phase, [
      ['existing', 'Původní'], ['new', 'Nová']
    ], (value) => { sign.phase = value; });
    editor.field(row, 'Šířka tabule [mm skutečnosti]', sign.physicalWidthMm, 'number', (value) => {
      sign.physicalWidthMm = value;
      sign.dimensionSource = 'manual';
    });
    editor.field(row, 'Výška tabule [mm skutečnosti]', sign.physicalHeightMm, 'number', (value) => {
      sign.physicalHeightMm = value;
      sign.dimensionSource = 'manual';
    });
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = sign.dimensionSource === 'manual'
      ? 'Ručně zadané rozměry – ověř podle příslušného vzorového listu.'
      : sign.dimensionSource === 'legacy'
        ? 'Převzato ze starého projektu; rozměry tabule nejsou ověřené.'
        : 'Rozměry neověřeny: náhradní velikost podle poměru SVG, delší strana 600 mm. Zadej rozměry tabule.';
    row.append(note);
    editor.button(row, 'Přidat vybranou značku pod tuto', async () => {
      const next = await editor.currentSign();
      if (!scene.poles.includes(pole) || pole.signs[index] !== sign) {
        throw new Error('Sestava se během načítání změnila.');
      }
      editor.change(() => {
        pole.signs.splice(index + 1, 0, next);
        active = index + 1;
      });
    });
  });
  const hint = document.createElement('p');
  hint.className = 'note';
  hint.textContent = 'Vyber šablonu nebo variantu v knihovně vlevo. Přidání a nahrazení pracuje s touto volbou; každá značka má vlastní zařazení i rozměry.';
  document.getElementById('properties').prepend(hint);
}
