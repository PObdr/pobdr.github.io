import { frame, visibleByDefault } from './model.js';

export const escapeXml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[c]);

export function crownDiameter(members) {
  for (const f of members) {
    const match = /^([0-9]+(?:[.,][0-9]+)?)\s*(m|cm|ft)?$/.exec(String(f.attrs.diameter_crown || '').trim());
    if (!match) continue;
    const meters = Number(match[1].replace(',', '.')) * (match[2] === 'cm' ? 0.01 : match[2] === 'ft' ? 0.3048 : 1);
    if (meters > 0 && meters < 100) return meters;
  }
  return null;
}

function symbol(category, size) {
  const circle = `<circle r="${size}"/>`;
  if (category === 'Lampy') return `${circle}<path d="M ${-size * .7} ${-size * .7} L ${size * .7} ${size * .7} M ${-size * .7} ${size * .7} L ${size * .7} ${-size * .7}"/>`;
  if (category === 'Stromy') return `<circle r="${size}" stroke="#28753b"/><circle r="${size * .15}" fill="#28753b"/>`;
  if (category === 'Patníky') return `<rect x="${-size * .5}" y="${-size * .5}" width="${size}" height="${size}" fill="currentColor"/>`;
  if (category.startsWith('Označníky')) return `<path d="M 0 ${size} V ${-size} H ${size} V 0 H 0"/>`;
  if (category === 'Lavičky') return `<path d="M ${-size} 0 H ${size} M ${-size} ${size * .4} H ${size} M ${-size * .7} 0 V ${size} M ${size * .7} 0 V ${size}"/>`;
  if (category === 'Koše') return `<path d="M ${-size * .6} ${-size} H ${size * .6} L ${size * .4} ${size} H ${-size * .4} Z"/>`;
  if (category === 'Stojany na kola') return `<path d="M ${-size} ${size} V ${-size} H ${size} V ${size}"/>`;
  if (category === 'Přístřešky') return `<rect x="${-size}" y="${-size * .5}" width="${2 * size}" height="${size}"/>`;
  if (category.startsWith('Značky')) return `<path d="M 0 ${-size} L ${size} ${size} H ${-size} Z"/>`;
  return `${circle}<path d="M ${-size * .5} 0 H ${size * .5}"/>`;
}

export function exportSvg(data, result, options = {}) {
  const { width, height } = frame(data.bbox);
  const scale = options.scale || 500;
  const size = scale / 1000 * 1.2;
  const all = new Map(data.raw.map((f) => [f.id, f]));
  const groups = new Map();
  function add(label, markup, shown) {
    if (!groups.has(label)) groups.set(label, { label, shown, content: [] });
    groups.get(label).content.push(markup);
  }
  function draw(f, originals) {
    const title = escapeXml(JSON.stringify({ id: f.id, category: f.category, reason: f.reason, sources: originals.map((o) => ({ id: o.id, source: o.source, attributes: o.attrs })) }));
    let drawing;
    if (f.kind === 'point') {
      drawing = `<g transform="translate(${f.coords.join(' ')})" fill="white">${symbol(f.category, size)}</g>`;
    } else {
      const d = f.coords.filter((p) => p.length >= 2).map((p) => `M ${p.map((v) => v.join(',')).join(' L ')}${f.kind === 'area' ? ' Z' : ''}`).join(' ');
      const vegetation = /Strom|Keř|Tráv|Záhon|zeleň|Živý/.test(f.category);
      const fill = f.kind === 'area' ? vegetation ? '#e3efdf' : /TSK|Parkování/.test(f.category) ? '#dce9f7' : '#eeeeee' : 'none';
      const dash = /Ploty|Bariéry|Zakryté/.test(f.category) ? 'stroke-dasharray="1 0.6"' : '';
      drawing = `<path d="${d}" fill="${fill}" fill-opacity="0.45" fill-rule="evenodd" ${dash}/>`;
    }
    return `<g data-object="${escapeXml(f.id)}" style="pointer-events:${f.kind === 'area' ? 'visiblePainted' : 'all'}"><title>${title}</title>${drawing}</g>`;
  }
  const ordered = [...result.output].sort((a, b) => ({ area: 0, line: 1, point: 2 })[a.kind] - ({ area: 0, line: 1, point: 2 })[b.kind]);
  for (const f of ordered) {
    const active = options.raw || !f.suppressed;
    const originals = (f.members || [f.id]).map((id) => all.get(id)).filter(Boolean);
    if (active) {
      const label = options.raw ? `${f.category} / ${f.source}` : f.category;
      add(label, draw(f, options.raw ? [all.get(f.id)] : originals), data.visibility[label] ?? visibleByDefault(f.category));
      if (f.category === 'Stromy' && f.kind === 'point') {
        const diameter = crownDiameter(options.raw ? [all.get(f.id)] : originals);
        if (diameter) add('Koruny – doložený průměr ze zdroje', `<circle cx="${f.coords[0]}" cy="${f.coords[1]}" r="${diameter / 2}" fill="none" stroke="#28753b"><title>${escapeXml(JSON.stringify(originals.map((o) => ({ id: o.id, diameter_crown: o.attrs.diameter_crown }))))}</title></circle>`, data.visibility['Koruny – doložený průměr ze zdroje'] ?? true);
      }
    }
  }
  if (options.controls && !options.raw) {
    for (const f of data.raw) add(`Kontrola / ${f.source} / ${f.category}`, draw(f, [f]), false);
  }
  const content = [...groups.values()].map((g, i) => `<g id="layer-${i}" inkscape:groupmode="layer" inkscape:label="${escapeXml(g.label)}" style="display:${g.shown ? 'inline' : 'none'}" clip-path="url(#clip)" fill="none" stroke="#374151" color="#374151" stroke-width="${scale / 1000 * .18}">
${g.content.join('\n')}
</g>`).join('\n');
  const total = height + (options.preview ? 0 : 14);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width * 1000 / scale}mm" height="${total * 1000 / scale}mm" viewBox="0 0 ${width} ${total}" font-family="sans-serif">
  <title>DIO – pracovní podklad, ověřit v terénu</title>
  <metadata>${escapeXml(JSON.stringify({ bbox: data.bbox, date: data.date, errors: data.errors, decisions: data.decisions, projection: 'Local approximate equirectangular', warning: 'Incomplete data; schematic symbols; no complete traffic-sign inventory' }))}</metadata>
  <defs><clipPath id="clip"><rect width="${width}" height="${height}"/></clipPath></defs>
  <g id="background" inkscape:groupmode="layer" inkscape:label="Pozadí" style="display:${options.preview ? 'none' : 'inline'}"><rect width="${width}" height="${total}" fill="white"/></g>
${content}
  <g id="legend" inkscape:groupmode="layer" inkscape:label="Rám a zdroje">
    <rect width="${width}" height="${height}" fill="none" stroke="black" stroke-width="0.15"/>
    ${options.preview ? '' : `<text x="1" y="${height + 4}" font-size="${Math.min(2, width / 170)}">PRACOVNÍ PODKLAD – OVĚŘIT | 1:${scale} | IPR Praha, MHMP, TSK; © OSM contributors, ODbL | ${data.date.slice(0, 10)}${data.errors.length ? ' | NEÚPLNÁ DATA' : ''}</text><path d="M 1 ${height + 8} h ${Math.min(10, width / 3)}" stroke="black"/><text x="1" y="${height + 12}" font-size="1.6">${Math.min(10, width / 3).toFixed(1)} m</text>`}
  </g>
</svg>`;
}
