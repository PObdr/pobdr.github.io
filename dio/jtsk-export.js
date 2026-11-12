import { frame } from './model.js';
import { exportSets } from './set-export.js';
import { jtskFrame, northAngle } from './jtsk.js';
import { rose } from './rose.js';
import { crossingDrawing } from './crossings.js';
import { selectedFeatures } from './sets.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';

export function exportJtsk(data, options = {}) {
  if (data.crs !== 'EPSG:5514' || data.version !== 3) throw new Error('Export vyžaduje projekt S-JTSK');
  const f = jtskFrame(data.bbox);
  const old = frame(data.bbox);
  const scale = options.scale || 500;
  const total = f.height + (options.preview ? 0 : 24);
  // The existing renderer handles styles, source provenance and thematic sublayers.
  // Its old canvas dimensions are replaced; feature coordinates are already JTSK offsets.
  const doc = new DOMParser().parseFromString(exportSets(data, options), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG podklad');
  const root = doc.documentElement;
  const raw = selectedFeatures(data.raw, options.sets || data.selectedSets, options.diagnostic);
  const byId = new Map(raw.map((feature) => [feature.id, feature]));
  for (const object of [...root.querySelectorAll('[data-object]')]) {
    const feature = byId.get(object.getAttribute('data-object'));
    if (!feature) continue;
    const drawing = crossingDrawing(feature, raw);
    if (drawing === null) continue;
    if (!drawing) {
      object.remove();
      continue;
    }
    const fragment = new DOMParser().parseFromString(
      `<svg xmlns="${NS}">${drawing}</svg>`, 'image/svg+xml'
    );
    if (fragment.querySelector('parsererror')) throw new Error('Neplatné značení přechodu');
    const title = object.querySelector(':scope > title');
    const path = doc.importNode(fragment.documentElement.firstElementChild, true);
    object.replaceChildren(...(title ? [title, path] : [path]));
  }
  root.setAttribute('viewBox', `0 0 ${f.width} ${total}`);
  root.setAttribute('width', `${f.width * 1000 / scale}mm`);
  root.setAttribute('height', `${total * 1000 / scale}mm`);
  const clip = doc.querySelector('#clip rect');
  clip.setAttribute('width', f.width);
  clip.setAttribute('height', f.height);
  const background = doc.querySelector('#background rect');
  background.setAttribute('width', f.width);
  background.setAttribute('height', total);
  const legend = doc.querySelector('#legend');
  const border = legend.querySelector('rect');
  border.setAttribute('width', f.width);
  border.setAttribute('height', f.height);
  for (const child of [...legend.children]) {
    if (child !== border) child.setAttribute('transform', `translate(0 ${f.height - old.height})`);
  }
  const metadata = doc.querySelector('metadata');
  const previous = JSON.parse(metadata.textContent);
  metadata.textContent = JSON.stringify({
    ...previous, projection: 'EPSG:5514', units: 'metres',
    transformation: data.transformation,
    originEN: [f.left, f.top],
    svgToEN: 'E=originE+x; N=originN-y',
    boundsEN: [f.left, f.bottom, f.right, f.top],
    selectedSets: options.sets || data.selectedSets,
    warning: 'Working map; approximately 1 m datum transformation; not surveying'
  });
  function layer(label, id) {
    const g = doc.createElementNS(NS, 'g');
    g.setAttribute('id', id);
    g.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
    g.setAttributeNS(INK, 'inkscape:label', label);
    return g;
  }
  const orientation = layer('Orientace a souřadnice S-JTSK', 'jtsk-orientation');
  const compass = layer('Růžice – zeměpisný a síťový sever', 'jtsk-compass');
  const size = Math.min(scale / 1000 * 8, f.width / 5, f.height / 5);
  const angle = northAngle((data.bbox[0] + data.bbox[2]) / 2, (data.bbox[1] + data.bbox[3]) / 2);
  const fragment = new DOMParser().parseFromString(`<svg xmlns="${NS}"><g transform="translate(${f.width - size * 1.8} ${size * 1.8})">${rose(angle, size)}</g></svg>`, 'image/svg+xml');
  compass.append(doc.importNode(fragment.documentElement.firstElementChild, true));
  orientation.append(compass);
  const crosses = layer('Kontrolní křížky', 'jtsk-corners');
  const arm = Math.min(scale / 1000 * 2, f.width / 10, f.height / 10);
  for (const [x, y] of [[0, 0], [f.width, 0], [f.width, f.height], [0, f.height]]) {
    const path = doc.createElementNS(NS, 'path');
    path.setAttribute('d', `M ${x - arm} ${y} H ${x + arm} M ${x} ${y - arm} V ${y + arm}`);
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', scale / 1000 * .18);
    crosses.append(path);
  }
  orientation.append(crosses);
  if (!options.preview) {
    const text = doc.createElementNS(NS, 'text');
    text.setAttribute('x', '1');
    text.setAttribute('y', f.height + 19);
    text.setAttribute('font-size', Math.min(scale / 1000 * 2.2, f.width / 120));
    text.textContent = `EPSG:5514; počátek E ${f.left.toFixed(3)}, N ${f.top.toFixed(3)} m; S = zeměpisný, Ns = síťový sever. Převod není geodetické zaměření.`;
    orientation.append(text);
  }
  root.append(orientation);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}
