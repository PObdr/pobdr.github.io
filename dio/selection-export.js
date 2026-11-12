import { addDetailScale } from './scale-bar.js';
import { exportJtsk } from './jtsk-export.js';
import { toWgs, northAngle } from './jtsk.js';
import { rose } from './rose.js';
import { northUpSelection } from './north-up.js';
import { addStreetNames } from './street-names.js';
import {
  validateSelection, selectionMatrix, selectionToEN, selectionNorthAngles
} from './selection.js';

const NS = 'http://www.w3.org/2000/svg';

export function exportSelection(data, options = {}) {
  const source = exportJtsk(data, options);
  if (!data.selection) {
    return addDetailScale(addStreetNames(source, data, options), options);
  }
  const selected = validateSelection(data.selection);
  if (options.preview) return source;
  const center = toWgs(...selectionToEN(selected, [selected.width / 2, selected.height / 2]));
  const trueBearing = northAngle(...center);
  const selection = northUpSelection(selected, trueBearing);
  const { width, height } = selection;
  const scale = options.scale || 500;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Neplatný SVG export');
  }
  const root = doc.documentElement;
  const total = height + 24;
  const metadata = doc.querySelector('metadata');
  const previous = JSON.parse(metadata.textContent);
  const matrix = selectionMatrix(selection, data.origin);
  const inverse = [
    selection.origin[0], selection.origin[1],
    ...selection.axisX, ...selection.axisY
  ];
  metadata.textContent = JSON.stringify({
    ...previous,
    selection,
    sourceSelection: selected,
    orientationPolicy: 'true-north-upper-half; horizontal-right',
    exportHalfTurn: selection !== selected,
    svgToEN: 'EN=selection.origin+x*selection.axisX+y*selection.axisY',
    svgToENCoefficients: inverse,
    sourceOriginEN: data.origin,
    originEN: selection.origin,
    sourceSvgToExport: matrix
  }, null, 2);
  root.setAttribute('viewBox', `0 0 ${width} ${total}`);
  root.setAttribute('width', `${width * 1000 / scale}mm`);
  root.setAttribute('height', `${total * 1000 / scale}mm`);
  doc.querySelector('#background rect').setAttribute('width', width);
  doc.querySelector('#background rect').setAttribute('height', total);
  const clip = doc.querySelector('#clip');
  clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  clip.firstElementChild.setAttribute('width', width);
  clip.firstElementChild.setAttribute('height', height);

  // Clip in final page coordinates, outside the rotation of every data layer.
  for (const layer of [...root.children]) {
    if (!/^set-|^layer-/.test(layer.id)) continue;
    for (const clipped of layer.querySelectorAll('[clip-path]')) {
      clipped.removeAttribute('clip-path');
    }
    layer.removeAttribute('clip-path');
    const wrapper = doc.createElementNS(NS, 'g');
    wrapper.setAttribute('clip-path', 'url(#clip)');
    layer.replaceWith(wrapper);
    wrapper.append(layer);
    layer.setAttribute('transform', `matrix(${matrix.join(' ')})`);
  }

  const legend = doc.querySelector('#legend');
  const border = legend.querySelector('rect');
  border.setAttribute('width', width);
  border.setAttribute('height', height);
  const previousHeight = previous.originEN[1] - previous.boundsEN[1];
  for (const child of [...legend.children]) {
    if (child === border) continue;
    const old = child.getAttribute('transform') || '';
    child.setAttribute('transform', `translate(0 ${height - previousHeight}) ${old}`);
  }

  const legendTexts = legend.querySelectorAll('text');
  legendTexts[0]?.setAttribute('font-size', Math.min(2, width / 170));
  const bar = legend.querySelector('path');
  if (bar) {
    bar.setAttribute('d', `M 1 ${height + 8} h ${Math.min(10, width / 3)}`);
    bar.removeAttribute('transform');
  }
  if (legendTexts[1]) {
    legendTexts[1].textContent = `${Math.min(10, width / 3).toFixed(1)} m`;
  }

  const orientation = doc.querySelector('#jtsk-orientation');
  const compass = orientation.querySelector('#jtsk-compass');
  const size = Math.min(scale / 1000 * 8, width / 5, height / 5);
  const angles = selectionNorthAngles(selection, trueBearing);
  const fragment = new DOMParser().parseFromString(
    `<svg xmlns="${NS}"><g transform="translate(${width - size * 1.8} ${size * 1.8})">${rose(angles.true, size, angles.grid)}</g></svg>`,
    'image/svg+xml'
  );
  if (fragment.querySelector('parsererror')) {
    throw new Error('Neplatná růžice');
  }
  compass.replaceChildren(doc.importNode(fragment.documentElement.firstElementChild, true));
  const crosses = orientation.querySelector('#jtsk-corners');
  crosses.replaceChildren();
  const arm = Math.min(scale / 1000 * 2, width / 10, height / 10);
  for (const [x, y] of [[0, 0], [width, 0], [width, height], [0, height]]) {
    const path = doc.createElementNS(NS, 'path');
    path.setAttribute('d', `M ${x - arm} ${y} H ${x + arm} M ${x} ${y - arm} V ${y + arm}`);
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', scale / 1000 * 0.18);
    crosses.append(path);
  }
  const note = orientation.querySelector(':scope > text');
  note.setAttribute('y', height + 19);
  note.setAttribute('font-size', Math.min(scale / 1000 * 2.2, width / 120));
  note.textContent = `EPSG:5514; natočený výřez; S = zeměpisný, Ns = síťový sever. Převod není geodetické zaměření.`;
  const rotated = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
  return addDetailScale(addStreetNames(rotated, data, options), options);
}
