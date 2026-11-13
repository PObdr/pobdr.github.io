const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';

export function formatScale(scale) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Neplatné měřítko');
  }
  return `1 : ${new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 6
  }).format(scale)}`;
}

function floorStep(limit) {
  const power = 10 ** Math.floor(Math.log10(limit));
  for (const factor of [5, 2, 1]) {
    const candidate = factor * power;
    if (candidate <= limit * (1 + 1e-12)) return candidate;
  }
  throw new Error('Nelze sestavit dělení měřítka');
}

function label(value) {
  return new Intl.NumberFormat('cs-CZ', {
    maximumSignificantDigits: 8
  }).format(value);
}

export function scaleLayout(widthMetres, scale) {
  formatScale(scale);
  if (!Number.isFinite(widthMetres) || widthMetres <= 0) {
    throw new Error('Neplatná šířka výkresu');
  }
  const unit = scale / 1000;
  const widthMm = widthMetres / unit;
  const fontMm = Math.min(2, widthMm / 28);
  const marginMm = Math.min(3, widthMm * 0.06);
  const usableMm = widthMm - 2 * marginMm;
  const targetMm = Math.min(80, usableMm * 0.72);
  const divisions = targetMm < 30 ? 2 : 4;
  const step = floorStep(targetMm * unit / divisions);
  const length = step * divisions;
  const labels = Array.from({ length: divisions + 1 }, (_, i) =>
    `${label(step * i)}${i === divisions ? ' m' : ''}`);
  const numeric = formatScale(scale);
  return {
    unit, widthMm, fontMm, divisions, step, length, labels, numeric,
    x: (widthMetres - length) / 2,
    numericX: widthMetres / 2,
    footerHeight: 16 * unit,
    legibleAtPrintSize: fontMm >= 1.5
  };
}

export function addDetailScale(source, options = {}) {
  if (options.preview) return source;
  const scale = options.scale ?? 500;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatné SVG');
  const root = doc.documentElement;
  const box = root.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);
  if (box.length !== 4 || !box.every(Number.isFinite) ||
      box[0] !== 0 || box[1] !== 0 || box[2] <= 0 || box[3] <= 0) {
    throw new Error('Neplatný rám exportu');
  }
  if (root.querySelector('#detail-scale')) return source;
  const layout = scaleLayout(box[2], scale);
  const { unit, fontMm, x, step, divisions, length } = layout;
  const actualWidth = Number.parseFloat(root.getAttribute('width'));
  const actualHeight = Number.parseFloat(root.getAttribute('height'));
  if (!root.getAttribute('width')?.endsWith('mm') ||
      !root.getAttribute('height')?.endsWith('mm') ||
      Math.abs(actualWidth - box[2] / unit) > 1e-6 ||
      Math.abs(actualHeight - box[3] / unit) > 1e-6) {
    throw new Error('Měřítko neodpovídá fyzickým rozměrům SVG');
  }
  const legend = root.querySelector('#legend');
  if (!legend) throw new Error('Chybí legenda exportu');
  const oldTexts = [...legend.querySelectorAll(':scope > text')];
  oldTexts[0]?.replaceChildren(doc.createTextNode(
    oldTexts[0].textContent.replace(/\s*\|\s*1\s*:\s*\d[\d \u00a0\u202f]*(?=\|)/, ' | ')
  ));
  const oldBar = legend.querySelector(':scope > path');
  if (oldBar && oldTexts[1] && /^\s*[\d.,]+\s+m\s*$/.test(oldTexts[1].textContent)) {
    oldBar.remove();
    oldTexts[1].remove();
  }
  const element = (tag, attributes, text) => {
    const node = doc.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const group = element('g', {
    id: 'detail-scale', fill: 'black', stroke: 'none',
    'font-family': 'sans-serif', 'text-anchor': 'middle',
    'data-scale-denominator': scale,
    'data-print-legible': String(layout.legibleAtPrintSize)
  });
  group.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
  group.setAttributeNS(INK, 'inkscape:label', 'Číselné a grafické měřítko');
  const top = box[3];
  const baseline = top + 8.5 * unit;
  group.append(element('text', {
    x: layout.numericX, y: top + 5.5 * unit,
    'font-size': 2 * fontMm * unit
  }, layout.numeric));
  for (let i = 0; i < divisions; i += 1) {
    group.append(element('rect', {
      x: x + i * step, y: baseline, width: step, height: 1.2 * unit,
      fill: i % 2 === 0 ? 'black' : 'white',
      stroke: 'black', 'stroke-width': 0.18 * unit
    }));
  }
  for (let i = 0; i <= divisions; i += 1) {
    const at = x + i * step;
    group.append(element('path', {
      d: `M ${at} ${baseline} v ${2 * unit}`,
      stroke: 'black', 'stroke-width': 0.18 * unit
    }));
    const text = element('text', {
      x: at, y: baseline + 4.5 * unit, 'font-size': fontMm * unit
    });
    text.append(doc.createTextNode(label(step * i)));
    if (i === divisions) {
      text.append(element('tspan', {
        'text-anchor': 'start', 'data-scale-unit': 'm'
      }, ' m'));
    }
    group.append(text);
  }
  const totalHeight = box[3] + layout.footerHeight;
  root.setAttribute('viewBox', `0 0 ${box[2]} ${totalHeight}`);
  root.setAttribute('height', `${totalHeight / unit}mm`);
  root.querySelector('#background rect')?.setAttribute('height', totalHeight);
  const metadata = root.querySelector('metadata');
  if (metadata) {
    const previous = JSON.parse(metadata.textContent);
    metadata.textContent = JSON.stringify({ ...previous, detailScale: {
      denominator: scale, units: 'm', barLengthMetres: length,
      mainDivisionMetres: step, divisions,
      physicalSizeRequired: '100%; no fit-to-page',
      legibleAtPrintSize: layout.legibleAtPrintSize
    } }, null, 2);
  }
  root.append(group);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(root);
}
