export const NS = 'http://www.w3.org/2000/svg';

export function element(name, attrs = {}, text) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function inspectSvg(source) {
  if (typeof source !== 'string' || source.length > 25000000 || /<!DOCTYPE|<!ENTITY/i.test(source)) {
    throw new Error('Nepovolené nebo příliš velké SVG (limit 25 MB textu).');
  }
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.querySelector('parsererror') || root.localName !== 'svg' || root.namespaceURI !== NS) {
    throw new Error('Soubor není platné SVG.');
  }
  const allowed = new Set(('svg g defs symbol use path rect circle ellipse line polyline polygon text tspan ' +
    'textPath image clipPath mask pattern marker linearGradient radialGradient stop style title desc metadata').split(' '));
  for (const node of [root, ...root.querySelectorAll('*')]) {
    const inMetadata = node.closest('metadata');
    if (inMetadata && node.namespaceURI !== NS) continue;
    if (node.namespaceURI === NS && !allowed.has(node.localName)) {
      throw new Error(`Nepodporovaný SVG prvek: ${node.localName}.`);
    }
    if (node.namespaceURI !== NS) {
      if (/inkscape|sodipodi/.test(node.namespaceURI || '')) continue;
      throw new Error('Nepovolený jmenný prostor v SVG.');
    }
    for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.localName) || ['base', 'src'].includes(attr.localName)) {
        throw new Error('Aktivní obsah v SVG není povolen.');
      }
      if (attr.localName === 'href') {
        const href = attr.value.trim();
        const raster = node.localName === 'image' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(href);
        if (!href.startsWith('#') && !raster) throw new Error('SVG odkazuje na externí nebo aktivní zdroj.');
      }
      if (attr.namespaceURI === 'http://www.w3.org/2000/xmlns/') continue;
      if (!(attr.localName === 'href' && attr.value.startsWith('data:image/'))) checkCss(attr.value);
    }
    if (node.localName === 'style') checkCss(node.textContent);
  }
  let box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (!box || box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) {
    throw new Error('SVG musí obsahovat platný viewBox.');
  }
  if (box.some((number) => Math.abs(number) > 1e9)) throw new Error('Příliš velké souřadnice.');
  const width = root.getAttribute('width') || '';
  const match = width.match(/^([\d.]+)\s*(mm|cm|in|px|pt)?$/);
  const factors = { mm: 1, cm: 10, in: 25.4, px: 25.4 / 96, pt: 25.4 / 72 };
  const widthMm = match ? Number(match[1]) * factors[match[2] || 'px'] : null;
  return { svg: new XMLSerializer().serializeToString(root), box, widthMm };
}

function checkCss(value) {
  if (/\\|@import|@font-face|expression\s*\(|javascript:|https?:|\/\//i.test(value) &&
      !/^https?:\/\/(www\.w3\.org|www\.inkscape\.org|sodipodi\.sourceforge\.net)\//.test(value)) {
    throw new Error('Nepovolený externí nebo aktivní obsah SVG.');
  }
  for (const match of value.matchAll(/url\s*\(([^)]*)\)/gi)) {
    if (!/^['"]?#[^\s'"()]+['"]?$/.test(match[1].trim())) throw new Error('Externí CSS zdroj není povolen.');
  }
}

const imageCache = new WeakMap();

export function resourceData(resource) {
  if (!imageCache.has(resource)) imageCache.set(resource, svgData(resource.svg));
  return imageCache.get(resource);
}

export function svgData(source) {
  const bytes = new TextEncoder().encode(source);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return 'data:image/svg+xml;base64,' + btoa(binary);
}

export function makeSign(sign, asset, unit) {
  const width = sign.widthMm * unit;
  const ratio = sign.kind === 'text' ? 0.45 : sign.kind === 'asset' ? asset.box[3] / asset.box[2] : 1;
  const height = width * ratio;
  const group = element('g');
  if (sign.kind === 'asset') {
    group.append(element('image', { x: -width / 2, y: 0, width, height, href: resourceData(asset) }));
  } else {
    if (sign.kind === 'speed') {
      group.append(element('circle', { cx: 0, cy: height / 2, r: width * 0.45, fill: 'white', stroke: '#c51e2b', 'stroke-width': width * 0.09 }));
    } else {
      group.append(element('rect', { x: -width / 2, y: 0, width, height, rx: width * 0.025, fill: 'white', stroke: '#172b36', 'stroke-width': width * 0.025 }));
    }
    const lines = sign.text.split('\n').slice(0, 3);
    const size = Math.min(height * 0.52 / lines.length, width * 1.25 / Math.max(...lines.map((line) => line.length), 1));
    lines.forEach((line, index) => group.append(element('text', {
      x: 0, y: height / 2 + (index - (lines.length - 1) / 2) * size * 1.1,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': size, 'font-family': 'sans-serif', 'font-weight': 700, fill: '#172b36'
    }, line)));
  }
  return { group, width, height };
}

export function makeMark(mark, metre) {
  const group = element('g');
  const points = mark.points;
  if (mark.kind === 'zebra') {
    const [a, b] = [points[0], points.at(-1)];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    const stripe = 0.5 * metre;
    const depth = mark.widthM * metre;
    group.setAttribute('transform', `translate(${a}) rotate(${angle})`);
    for (let x = 0; x + stripe <= length && x / stripe < 4000; x += stripe * 2) {
      group.append(element('rect', { x, y: -depth / 2, width: stripe, height: depth, fill: mark.color }));
    }
  } else {
    group.append(element(mark.kind === 'area' ? 'polygon' : 'polyline', {
      points: points.map((point) => point.join(',')).join(' '),
      fill: mark.kind === 'area' ? mark.color : 'none',
      'fill-opacity': mark.kind === 'area' ? 0.3 : 1,
      stroke: mark.color, 'stroke-width': mark.widthM * metre,
      'stroke-linejoin': 'round', 'stroke-linecap': 'butt',
      ...(mark.kind === 'dashed' ? { 'stroke-dasharray': `${3 * metre} ${3 * metre}` } : {})
    }));
    if (mark.kind === 'arrow') {
      const [a, b] = points.slice(-2);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      group.append(element('path', {
        d: `M 0 0 L ${-metre * 1.5} ${metre * 0.6} L ${-metre} 0 L ${-metre * 1.5} ${-metre * 0.6} Z`,
        transform: `translate(${b}) rotate(${angle})`, fill: mark.color
      }));
    }
  }
  return group;
}
