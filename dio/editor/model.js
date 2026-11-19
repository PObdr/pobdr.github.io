export const clone = (value) => structuredClone(value);

export function initial() {
  return {
    type: 'diogen-editor',
    version: 1,
    background: null,
    assets: {},
    scene: { widthMm: 297, scale: 500, poles: [], marks: [] }
  };
}

function bounded(value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error('Neplatná číselná hodnota projektu.');
  }
}

export function validate(value) {
  if (value?.type !== 'diogen-editor' || value.version !== 1) {
    throw new Error('Toto není pracovní projekt editoru DIOGEN.');
  }
  const scene = value.scene;
  if (!scene || !Array.isArray(scene.poles) || !Array.isArray(scene.marks) ||
      !value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets)) {
    throw new Error('Neplatná struktura projektu.');
  }
  bounded(scene.widthMm, 10, 3000);
  bounded(scene.scale, 1, 100000);
  if (scene.poles.length + scene.marks.length > 2000 || Object.keys(value.assets).length > 1000) {
    throw new Error('Projekt je příliš rozsáhlý.');
  }
  const ids = new Set();
  for (const item of [...scene.poles, ...scene.marks]) {
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) {
      throw new Error('Duplicitní nebo neplatné ID.');
    }
    ids.add(item.id);
    if (scene.poles.includes(item)) {
      bounded(item.x, -1e8, 1e8);
      bounded(item.y, -1e8, 1e8);
      bounded(item.angle, -360, 360);
      if (!Array.isArray(item.signs) || item.signs.length > 20) throw new Error('Neplatný sloupek.');
      for (const sign of item.signs) {
        bounded(sign.widthMm, 1, 100);
        if (!['speed', 'text', 'asset'].includes(sign.kind) ||
            typeof sign.text !== 'string' || sign.text.length > 200) throw new Error('Neplatná značka.');
        if (sign.kind === 'asset' && !Object.hasOwn(value.assets, sign.asset)) {
          throw new Error('Chybí vložený SVG prostředek.');
        }
      }
    } else {
      if (!['line', 'dashed', 'arrow', 'zebra', 'area'].includes(item.kind) ||
          !['#ffffff', '#ffd300', '#172b36'].includes(item.color) ||
          !Array.isArray(item.points) || item.points.length < 2 || item.points.length > 1000) {
        throw new Error('Neplatné vodorovné značení.');
      }
      bounded(item.widthM, 0.05, 20);
      for (const point of item.points) {
        if (!Array.isArray(point) || point.length !== 2) throw new Error('Neplatný bod.');
        point.forEach((number) => bounded(number, -1e8, 1e8));
      }
      if (item.kind === 'area' && item.points.length < 3) throw new Error('Plocha potřebuje tři body.');
    }
  }
  return value;
}

export class History {
  constructor(scene) {
    this.reset(scene);
  }

  reset(scene) {
    this.items = [clone(scene)];
    this.index = 0;
  }

  commit(scene) {
    if (JSON.stringify(scene) === JSON.stringify(this.items[this.index])) return;
    this.items = this.items.slice(0, this.index + 1);
    this.items.push(clone(scene));
    if (this.items.length > 40) this.items.shift();
    this.index = this.items.length - 1;
  }

  step(delta) {
    this.index = Math.max(0, Math.min(this.items.length - 1, this.index + delta));
    return clone(this.items[this.index]);
  }
}

export function moveSign(pole, index, direction) {
  const next = index + direction;
  if (next < 0 || next >= pole.signs.length) return;
  [pole.signs[index], pole.signs[next]] = [pole.signs[next], pole.signs[index]];
}

export function paperUnit(project, box) {
  return box[2] / project.scene.widthMm;
}

export function metreUnit(project, box) {
  return paperUnit(project, box) * 1000 / project.scene.scale;
}
