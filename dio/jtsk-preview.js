import { createPreviewProjection, projectPath } from './preview-projection.js';

import { jtskFrame } from './jtsk.js';
import { selectionBoundary } from './selection.js';
import { projectCrossingMasks } from './crossing-mask.js';

const NS = 'http://www.w3.org/2000/svg';

export function projectPreview(svg, bbox, selection) {
  if (JSON.parse(svg.querySelector('metadata').textContent).projection !== 'EPSG:5514') throw new Error('Náhled vyžaduje nepřevedenou kresbu S-JTSK');
  const p = createPreviewProjection(bbox);
  const m = p.matrix(p.gridWidth / 2, p.gridHeight / 2);
  const factor = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  // Only this disposable DOM is reprojected. Project data and export remain EPSG:5514.
  for (const id of ['background', 'legend', 'jtsk-orientation']) svg.querySelector(`#${id}`)?.remove();
  for (const object of svg.querySelectorAll('[data-object]')) {
    const symbol = object.querySelector(':scope > g[transform]');
    const text = object.querySelector(':scope > text');
    const path = object.querySelector(':scope > path');
    if (symbol) {
      const match = /^translate\(([-+\d.eE]+)[ ,]+([-+\d.eE]+)\)$/.exec(symbol.getAttribute('transform'));
      if (!match) throw new Error('Neznámé ukotvení symbolu');
      symbol.setAttribute('transform', `matrix(${p.matrix(Number(match[1]), Number(match[2])).join(' ')})`);
    } else if (text) {
      const x = Number(text.getAttribute('x'));
      const y = Number(text.getAttribute('y'));
      text.setAttribute('transform', `matrix(${p.matrix(x, y).join(' ')})`);
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
    } else if (path) {
      path.setAttribute('d', projectPath(path.getAttribute('d'), p.point));
      const parent = path.closest('[stroke-width]');
      if (parent) path.setAttribute('stroke-width', Number(parent.getAttribute('stroke-width')) * factor);
      if (path.hasAttribute('stroke-dasharray')) {
        path.setAttribute('stroke-dasharray', path.getAttribute('stroke-dasharray').split(/[ ,]+/).map((n) => Number(n) * factor).join(' '));
      }
    } else {
      throw new Error('Neznámý objekt náhledu');
    }
  }
  projectCrossingMasks(svg, p, projectPath);
  for (const circle of [...svg.querySelectorAll('circle[cx][cy]')]) {
    const g = svg.ownerDocument.createElementNS(NS, 'g');
    g.setAttribute('transform', `matrix(${p.matrix(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))).join(' ')})`);
    circle.replaceWith(g);
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    g.append(circle);
  }
  const clip = svg.querySelector('#clip');
  const polygon = svg.ownerDocument.createElementNS(NS, 'polygon');
  const grid = jtskFrame(bbox);
  const boundary = selection ? selectionBoundary(selection, 16).map(([e, n]) =>
    p.point([e - grid.left, grid.top - n])) : p.boundary;
  polygon.setAttribute('points', boundary.map((v) => v.join(',')).join(' '));
  clip.replaceChildren(polygon);
  svg.setAttribute('viewBox', `0 0 ${p.width} ${p.height}`);
  const metadata = svg.querySelector('metadata');
  metadata.textContent = JSON.stringify({
    projection: 'EPSG:3857', usage: 'Disposable map preview only',
    sourceGeometryCRS: 'EPSG:5514', originEN: [p.left, p.top]
  });
  return p;
}
