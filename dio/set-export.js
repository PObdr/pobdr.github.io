import { exportSvg, escapeXml } from './svg-export.js';
import { selectedFeatures, selectedSets, setOf, layerPath } from './sets.js';
import { reconcile } from './model.js';

export function exportSets(data, options = {}) {
  const selected = selectedSets(options.sets || data.selectedSets);
  const raw = selectedFeatures(data.raw, selected, Boolean(options.diagnostic));
  const filtered = { ...data, raw, selectedSets: selected };
  const result = reconcile(raw, data.decisions);
  const svg = exportSvg(filtered, result, options);
  const routes = new Map();
  for (const f of raw) {
    const name = options.raw ? `${f.category} / ${f.source}` : f.category;
    const path = layerPath(f.category, setOf(f));
    if (options.raw) path.push(f.source);
    routes.set(escapeXml(name), path);
    routes.set(escapeXml(`Kontrola / ${f.source} / ${f.category}`), ['Kontrola – původní zdroje', f.source, f.category]);
  }
  routes.set(escapeXml('Koruny – doložený průměr ze zdroje'), ['Vegetace', 'Stromy', 'Koruny – doložený průměr ze zdroje']);
  const tree = new Map();
  let count = 0;
  // Contract with svg-export.js: generated top-level data layers end on their own </g> line.
  const remaining = svg.replace(/<g id="layer-\d+"[^>]*>[\s\S]*?\n<\/g>/g, (markup) => {
    const label = /inkscape:label="([^"]*)"/.exec(markup)?.[1];
    const path = routes.get(label);
    if (!path) throw new Error('Neznámá vrstva při sestavování sad');
    let node = tree;
    for (const part of path.slice(0, -1)) {
      if (!node.has(part)) node.set(part, new Map());
      node = node.get(part);
    }
    node.set(`${path.at(-1)}:${count}`, markup);
    count += 1;
    return '';
  });
  let id = 0;
  function serialize(node) {
    return [...node].map(([label, child]) => {
      if (typeof child === 'string') return child;
      const hidden = label === 'Kontrola – původní zdroje' ? ' style="display:none"' : '';
      return `<g id="set-${id++}" inkscape:groupmode="layer" inkscape:label="${escapeXml(label)}"${hidden}>\n${serialize(child)}\n</g>`;
    }).join('\n');
  }
  return remaining.replace('  <g id="legend"', `${serialize(tree)}\n  <g id="legend"`);
}
