import { arrangeSvgPages, keepPrintPage } from '../export/svg-pages.js';
import {
  PROVIDER, planOverview, renderOverview, drawOverview
} from './overview-osm.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';
const SODI = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd';

export function validateOverview(value) {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Neplatná volba přehledové situace');
  }
  // Old manually uploaded images are deliberately not restored.
  return { version: 2, provider: PROVIDER.id };
}

export function createOverviewControl(onChange) {
  const root = document.createElement('div');
  root.id = 'overview-controls';
  const label = document.createElement('label');
  const enabled = document.createElement('input');
  enabled.type = 'checkbox';
  enabled.checked = true;
  label.append(enabled, ' Přehledová situace OSM – 2. stránka');
  const body = document.createElement('div');
  const note = document.createElement('p');
  note.setAttribute('role', 'status');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Automatický přehled okolí pracovního výřezu');
  Object.assign(canvas.style, {
    width: '100%', height: 'auto', display: 'none', border: '1px solid #ddd'
  });
  const attribution = document.createElement('a');
  attribution.href = PROVIDER.copyright;
  attribution.textContent = PROVIDER.credit;
  attribution.target = '_blank';
  attribution.rel = 'noopener';
  const explanation = document.createElement('small');
  explanation.textContent = 'Sever nahoře. Červeně je pracovní výřez DIO. Měřítko je místní, přibližné. Podklad se načítá pouze pro tento náhled.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Opakovat načtení přehledu';
  body.append(note, canvas, attribution, explanation, retry);
  root.append(label, body);
  let plan;
  let asset;
  let controller;
  let loading = false;
  let error = '';
  let revision = 0;
  let busy = false;

  function ready() {
    return !enabled.checked || Boolean(asset && plan && asset.plan.key === plan.key);
  }

  function draw() {
    body.hidden = !enabled.checked;
    canvas.style.display = asset ? 'block' : 'none';
    if (asset) drawOverview(canvas, asset);
    note.textContent = error || (loading ? 'Načítám přehled OSM…' :
      !plan ? 'Přehled se připraví po načtení pracovního výřezu.' :
      asset ? 'Automatický přehled připraven k exportu.' : 'Připravuji přehled…');
    retry.hidden = !error;
    retry.disabled = busy || loading;
    enabled.disabled = busy;
  }

  function changed() {
    draw();
    onChange();
  }

  async function start() {
    if (!enabled.checked || !root.isConnected || !plan || loading || asset || error) return;
    const request = ++revision;
    const requested = plan;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    loading = true;
    changed();
    try {
      const rendered = await renderOverview(requested, active.signal);
      if (request !== revision) return;
      asset = rendered;
    } catch (failure) {
      active.abort();
      if (request === revision && failure.name !== 'AbortError') {
        error = `${failure.message}. Export s přehledem není dostupný; opakuj načtení nebo přehled vypni.`;
      }
    } finally {
      if (request === revision) {
        loading = false;
        changed();
      }
    }
  }

  enabled.onchange = () => {
    if (!enabled.checked) {
      revision += 1;
      controller?.abort();
      loading = false;
    }
    changed();
    queueMicrotask(start);
  };
  retry.onclick = () => {
    error = '';
    queueMicrotask(start);
  };

  return {
    get enabled() {
      return enabled.checked;
    },
    ready,
    snapshot() {
      return { version: 2, provider: PROVIDER.id };
    },
    mount(container, disabled) {
      busy = disabled;
      container.append(root);
      draw();
      queueMicrotask(start);
    },
    setProject(data) {
      const next = planOverview(data);
      if (plan?.key === next.key) return;
      revision += 1;
      controller?.abort();
      plan = next;
      asset = null;
      loading = false;
      error = '';
      draw();
      queueMicrotask(start);
    },
    preset(value) {
      if (value === 'dio' || value === 'extended') {
        enabled.checked = true;
      }
      queueMicrotask(start);
    },
    reset() {
      revision += 1;
      controller?.abort();
      plan = null;
      asset = null;
      loading = false;
      error = '';
      draw();
    },
    adopt(active) {
      this.reset();
      enabled.checked = active;
      draw();
    },
    export(data) {
      const current = planOverview(data);
      if (!enabled.checked || !asset || asset.plan.key !== current.key) {
        throw new Error('Přehled aktuálního výřezu ještě není načtený');
      }
      return { plan: asset.plan, dataUrl: asset.dataUrl };
    }
  };
}

export function appendOverviewPage(source, data, options = {}) {
  if (options.preview || data.includeOverview === false) return source;
  const asset = options.overview;
  if (!asset || asset.plan.key !== planOverview(data).key ||
      !asset.dataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('Chybí automatický OSM přehled aktuálního výřezu');
  }
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG podklad');
  const root = doc.documentElement;
  if (root.querySelector('#overview-page')) throw new Error('Přehled už je připojen');
  const box = root.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  const unit = (options.scale ?? 500) / 1000;
  if (box.length !== 4 || !box.every(Number.isFinite) || unit <= 0 ||
      !Number.isFinite(unit) || box[0] !== 0 || box[1] !== 0) {
    throw new Error('Neplatný rám exportu');
  }
  const width = 210 * unit;
  const height = 297 * unit;
  const left = box[2] + 10 * unit;
  const element = (tag, attributes = {}, text) => {
    const node = doc.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      node.setAttribute(key, value);
    }
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const page = element('g', { id: 'overview-page' });
  page.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
  page.setAttributeNS(INK, 'inkscape:label', 'Přehledová situace OSM – 2. stránka');
  page.append(element('rect', { x: left, width, height, fill: 'white' }));
  const text = (x, y, size, value, extra = {}) => element('text', {
    x: left + x * unit, y: y * unit, 'font-size': size * unit,
    'font-family': 'sans-serif', ...extra
  }, value);
  page.append(text(10, 16, 5, 'Přehledová situace'));
  const p = asset.plan;
  const ratio = 190 * unit / p.width;
  const x = left + 10 * unit;
  const y = 30 * unit;
  page.append(element('image', {
    x, y, width: 190 * unit, height: p.height * ratio,
    href: asset.dataUrl, preserveAspectRatio: 'xMidYMid meet'
  }));
  page.append(element('polygon', {
    points: p.points.map(([a, b]) => `${x + a * ratio},${y + b * ratio}`).join(' '),
    fill: '#dc2626', 'fill-opacity': '0.12', stroke: '#dc2626',
    'stroke-width': 0.5 * unit, 'data-outline-crs': 'EPSG:3857'
  }));
  const baseY = 186;
  const barMm = p.scalePixels * ratio / unit;
  for (let i = 0; i < 2; i += 1) {
    page.append(element('rect', {
      x: left + (12 + i * barMm / 2) * unit, y: baseY * unit,
      width: barMm * unit / 2, height: 1.2 * unit,
      fill: i === 0 ? 'black' : 'white', stroke: 'black',
      'stroke-width': 0.18 * unit
    }));
    page.append(text(12 + i * barMm / 2, baseY + 5, 2.5,
      String(p.scaleMetres * i / 2), { 'text-anchor': 'middle' }));
  }
  page.append(text(12 + barMm, baseY + 5, 2.5,
    `${p.scaleMetres} m`, { 'text-anchor': 'middle' }));
  page.append(text(180, 190, 3, 'S', { 'text-anchor': 'middle' }));
  page.append(element('path', {
    d: `M ${left + 180 * unit} ${194 * unit} l ${-2 * unit} ${6 * unit} l ${2 * unit} ${-1.5 * unit} l ${2 * unit} ${1.5 * unit} Z`,
    fill: 'black'
  }));
  page.append(text(10, 211, 3, 'Červeně: pracovní výřez DIO. Zeměpisný sever je nahoře.'));
  page.append(text(10, 219, 2.5, 'Grafické měřítko je přibližné, místní; podklad není geodetické zaměření.'));
  page.append(text(10, 274, 3, PROVIDER.credit));
  page.append(text(10, 280, 2.5, PROVIDER.copyright));
  root.append(page);
  let named = root.getElementsByTagNameNS(SODI, 'namedview')[0];
  if (!named) {
    named = doc.createElementNS(SODI, 'sodipodi:namedview');
    root.append(named);
  }
  for (const [index, bounds] of [[1, [0, 0, box[2], box[3]]], [2, [left, 0, width, height]]]) {
    const node = doc.createElementNS(INK, 'inkscape:page');
    node.setAttribute('id', `dio-page-${index}`);
    ['x', 'y', 'width', 'height'].forEach((key, i) => {
      node.setAttribute(key, bounds[i]);
    });
    named.append(node);
  }
  const totalWidth = left + width;
  const totalHeight = Math.max(box[3], height);
  root.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  root.setAttribute('width', `${totalWidth / unit}mm`);
  root.setAttribute('height', `${totalHeight / unit}mm`);
  const metadata = root.querySelector('metadata');
  if (metadata) {
    metadata.textContent = JSON.stringify({ ...JSON.parse(metadata.textContent), overview: {
      page: 2, provider: PROVIDER.id, projection: 'EPSG:3857',
      sourceCRS: 'EPSG:5514', zoom: p.zoom, originPixel: [p.left, p.top],
      outline: 'automatic coordinate transformation; sampled boundary',
      scaleMetres: p.scaleMetres, scaleIsApproximate: true,
      credit: PROVIDER.credit, copyright: PROVIDER.copyright,
      primaryPageViewBox: box
    } }, null, 2);
  }
  return arrangeSvgPages('<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(root));
}

export async function printExport(source, scale) {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('Neplatné měřítko');
  const docSvg = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (docSvg.querySelector('parsererror')) throw new Error('Neplatné SVG');
  const svg = docSvg.documentElement;
  const pages = [...svg.getElementsByTagNameNS(INK, 'page')];
  const boxes = pages.length ? pages.map((page) =>
    ['x', 'y', 'width', 'height'].map((key) => Number(page.getAttribute(key)))) :
    [svg.getAttribute('viewBox').split(/[ ,]+/).map(Number)];
  const frame = document.createElement('iframe');
  Object.assign(frame.style, {
    position: 'fixed', width: '1px', height: '1px', border: '0', left: '-9999px'
  });
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    const style = doc.createElement('style');
    style.textContent = `
      html, body {
        margin: 0;
      }
      section {
        break-after: page;
      }
      section:last-child {
        break-after: auto;
      }
      svg {
        display: block;
        overflow: hidden;
      }
    ` + boxes.map((box, i) => `
      @page p${i} {
        size: ${box[2] * 1000 / scale}mm ${box[3] * 1000 / scale}mm;
        margin: 0;
      }
      .p${i} {
        page: p${i};
      }
    `).join('\n');
    doc.head.append(style);
    boxes.forEach((box, i) => {
      const section = doc.createElement('section');
      section.className = `p${i}`;
      const copy = doc.importNode(svg, true);
      keepPrintPage(copy, i + 1);
      copy.setAttribute('viewBox', box.join(' '));
      copy.setAttribute('width', `${box[2] * 1000 / scale}mm`);
      copy.setAttribute('height', `${box[3] * 1000 / scale}mm`);
      section.append(copy);
      doc.body.append(section);
    });
    await Promise.all([...doc.querySelectorAll('image')].map(async (node) => {
      const image = new Image();
      image.src = node.getAttribute('href');
      await image.decode();
    }));
    await doc.fonts.ready;
    frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
    frame.contentWindow.focus();
    frame.contentWindow.print();
  } catch (failure) {
    frame.remove();
    throw failure;
  }
}
