import { selectedFeatures } from '../core/sets.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';

function clipSegment(a, b, width, height) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  let start = 0;
  let end = 1;
  for (const [p, q] of [[-dx, a[0]], [dx, width - a[0]],
    [-dy, a[1]], [dy, height - a[1]]]) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) start = Math.max(start, t);
    else end = Math.min(end, t);
    if (start > end) return null;
  }
  return [
    [a[0] + start * dx, a[1] + start * dy],
    [a[0] + end * dx, a[1] + end * dy]
  ];
}

export function streetNameLabels(raw, width, height, matrix, fontSize) {
  const candidates = new Map();
  const project = ([x, y]) => [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5]
  ];
  for (const feature of raw) {
    const attrs = feature.attrs || {};
    const value = attrs['name:cs'] || attrs.name;
    if (feature.source !== 'OSM' || feature.kind !== 'line' ||
        !attrs.highway || typeof value !== 'string' || !value.trim()) continue;
    const name = value.trim();
    const textWidth = [...name].length * fontSize * 0.6;
    for (const line of feature.coords) {
      for (let i = 1; i < line.length; i += 1) {
        const segment = clipSegment(project(line[i - 1]), project(line[i]), width, height);
        if (!segment) continue;
        const [a, b] = segment;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy);
        if (length < textWidth + fontSize * 2) continue;
        let angle = Math.atan2(dy, dx);
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle <= -Math.PI / 2) angle += Math.PI;
        const x = (a[0] + b[0]) / 2;
        const y = (a[1] + b[1]) / 2;
        const rx = Math.abs(Math.cos(angle)) * textWidth / 2 +
          Math.abs(Math.sin(angle)) * fontSize;
        const ry = Math.abs(Math.sin(angle)) * textWidth / 2 +
          Math.abs(Math.cos(angle)) * fontSize;
        if (x - rx < fontSize || x + rx > width - fontSize ||
            y - ry < fontSize || y + ry > height - fontSize) continue;
        const label = {
          name, x, y, angle: angle * 180 / Math.PI, length,
          bounds: [x - rx, y - ry, x + rx, y + ry], sourceId: feature.id
        };
        if (!candidates.has(name)) candidates.set(name, []);
        candidates.get(name).push(label);
      }
    }
  }
  const labels = [];
  const overlaps = (a, b) => a[0] < b[2] && a[2] > b[0] &&
    a[1] < b[3] && a[3] > b[1];
  for (const name of [...candidates.keys()].sort()) {
    const choices = candidates.get(name).sort((a, b) => b.length - a.length);
    const best = choices.find((choice) =>
      !labels.some((label) => overlaps(choice.bounds, label.bounds)));
    if (best) labels.push(best);
  }
  return labels;
}

export function addStreetNames(source, data, options = {}) {
  if (options.preview) return source;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG export názvů ulic');
  const root = doc.documentElement;
  const metadata = JSON.parse(root.querySelector('metadata').textContent);
  const rect = root.querySelector('#clip rect');
  if (!rect) throw new Error('Chybí obdélníkový rám exportu');
  const width = Number(rect.getAttribute('width'));
  const height = Number(rect.getAttribute('height'));
  const fontSize = (options.scale || 500) / 1000 * 2.2;
  const matrix = metadata.sourceSvgToExport || [1, 0, 0, 1, 0, 0];
  const raw = selectedFeatures(data.raw, options.sets || data.selectedSets, options.diagnostic);
  const labels = streetNameLabels(raw, width, height, matrix, fontSize);
  const layer = doc.createElementNS(NS, 'g');
  layer.setAttribute('id', 'street-names');
  layer.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
  layer.setAttributeNS(INK, 'inkscape:label', 'Názvy ulic');
  layer.setAttribute('clip-path', 'url(#clip)');
  layer.setAttribute('font-family', 'sans-serif');
  layer.setAttribute('font-size', fontSize);
  layer.setAttribute('fill', '#334155');
  layer.setAttribute('stroke', 'white');
  layer.setAttribute('stroke-width', fontSize * 0.22);
  layer.setAttribute('stroke-linejoin', 'round');
  layer.setAttribute('paint-order', 'stroke fill');
  layer.setAttribute('text-anchor', 'middle');
  layer.setAttribute('dominant-baseline', 'central');
  const description = doc.createElementNS(NS, 'desc');
  description.textContent = 'Názvy komunikací OSM; jeden popisek na název ve výřezu. Krátké úseky a kolidující popisky se vynechávají.';
  layer.append(description);
  for (const label of labels) {
    const text = doc.createElementNS(NS, 'text');
    text.setAttribute('transform', `translate(${label.x} ${label.y}) rotate(${label.angle})`);
    text.setAttribute('data-source-id', label.sourceId);
    text.textContent = label.name;
    layer.append(text);
  }
  root.querySelector('#street-names')?.remove();
  root.insertBefore(layer, root.querySelector('#jtsk-orientation') || root.querySelector('#legend'));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}
