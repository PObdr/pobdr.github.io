const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';
const SODI = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd';

export function arrangeSvgPages(source) {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG export');
  const root = doc.documentElement;
  if (root.querySelector(':scope > g[data-dio-sheet]')) return source;
  const overview = root.querySelector(':scope > g#overview-page');
  if (!overview) return source;
  const read = (node) => ['x', 'y', 'width', 'height'].map((key) =>
    Number(node.getAttribute(key) || 0));
  const pages = [...root.getElementsByTagNameNS(INK, 'page')];
  const boxes = pages.length === 2 ? pages.map(read) : [
    read(root.querySelector('#paper-background, #background rect')),
    read(overview.querySelector(':scope > rect'))
  ];
  if (!boxes.every((box) => box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) ||
      boxes[0][0] !== 0 || boxes[0][1] !== 0) throw new Error('Neplatné rozměry listů');
  const viewBox = root.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  const physical = root.getAttribute('width');
  const mmPerUnit = Number.parseFloat(physical) / viewBox[2];
  if (!physical.endsWith('mm') || !Number.isFinite(mmPerUnit) || mmPerUnit <= 0) {
    throw new Error('Neplatný fyzický rozměr exportu');
  }
  const first = boxes[0];
  const old = boxes[1];
  const second = [first[2] + 30 / mmPerUnit, 0, old[2], old[3]];
  const element = (tag, attrs) => {
    const node = doc.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  let defs = root.querySelector(':scope > defs');
  if (!defs) {
    defs = element('defs', {});
    root.prepend(defs);
  }
  const groups = [first, second].map((box, index) => {
    const id = `diogen-sheet-clip-${index + 1}`;
    if (root.querySelector(`#${id}`)) throw new Error('Kolize identifikátoru ořezu');
    const clip = element('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
    clip.append(element('rect', { x: box[0], y: box[1], width: box[2], height: box[3] }));
    defs.append(clip);
    const group = element('g', {
      id: `diogen-sheet-${index + 1}`, 'data-dio-sheet': index + 1,
      'clip-path': `url(#${id})`
    });
    group.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
    group.setAttributeNS(INK, 'inkscape:label', index ? 'Přehled – 2. stránka' : 'Detail – 1. stránka');
    return group;
  });
  const nonDrawing = new Set(['title', 'desc', 'metadata', 'defs', 'style', 'namedview']);
  for (const node of [...root.children]) {
    if (node !== overview && !nonDrawing.has(node.localName)) groups[0].append(node);
  }
  const placement = element('g', { transform: `translate(${second[0] - old[0]} ${-old[1]})` });
  placement.append(overview);
  groups[1].append(placement);
  root.append(...groups);
  let named = root.getElementsByTagNameNS(SODI, 'namedview')[0];
  if (!named) {
    named = doc.createElementNS(SODI, 'sodipodi:namedview');
    root.append(named);
  }
  for (const page of pages) page.remove();
  for (const [index, box] of [first, second].entries()) {
    const page = doc.createElementNS(INK, 'inkscape:page');
    page.setAttribute('id', `dio-page-${index + 1}`);
    ['x', 'y', 'width', 'height'].forEach((key, i) => page.setAttribute(key, box[i]));
    named.append(page);
  }
  const width = second[0] + second[2];
  const height = Math.max(first[3], second[3]);
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('width', `${width * mmPerUnit}mm`);
  root.setAttribute('height', `${height * mmPerUnit}mm`);
  const metadata = root.querySelector('metadata');
  if (metadata) metadata.textContent = JSON.stringify({ ...JSON.parse(metadata.textContent),
    pageLayout: { gapMm: 30, mmPerUnit, pages: [first, second] }
  }, null, 2);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}

export function keepPrintPage(root, number) {
  for (const sheet of [...root.querySelectorAll(':scope > g[data-dio-sheet]')]) {
    if (Number(sheet.getAttribute('data-dio-sheet')) !== number) sheet.remove();
  }
  return root;
}

