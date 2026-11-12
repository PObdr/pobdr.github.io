const NS = 'http://www.w3.org/2000/svg';
const INK = 'http://www.inkscape.org/namespaces/inkscape';
const SODI = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd';
const MAX_IMAGE = 24000000;

export function validateOverview(value, complete = true) {
  if (value == null) return null;
  if (typeof value !== 'object' || typeof value.dataUrl !== 'string' ||
      value.dataUrl.length > MAX_IMAGE || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value.dataUrl)) {
    throw new Error('Přehledová mapa musí být vložený PNG obrázek');
  }
  const bytes = atob(value.dataUrl.slice(value.dataUrl.indexOf(',') + 1));
  if (bytes.length < 24 || bytes.slice(0, 8) !== '\x89PNG\r\n\x1a\n') {
    throw new Error('Neplatný PNG obrázek');
  }
  const word = (i) => bytes.charCodeAt(i) * 16777216 + bytes.charCodeAt(i + 1) * 65536 +
    bytes.charCodeAt(i + 2) * 256 + bytes.charCodeAt(i + 3);
  const width = word(16);
  const height = word(20);
  if (!width || !height || width * height > 16000000 || width > 8192 || height > 8192 ||
      value.width !== width || value.height !== height) throw new Error('Neplatné rozměry obrázku');
  if (typeof value.credit !== 'string' || value.credit.length > 500 || typeof value.permitted !== 'boolean' ||
      (complete && (!value.credit.trim() || value.permitted !== true))) {
    throw new Error('Doplň zdroj obrázku a potvrď oprávnění k použití');
  }
  if (!Array.isArray(value.points) || value.points.length > 4 || (complete && value.points.length !== 4) ||
      !value.points.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => Number.isFinite(x) && x >= 0 && x <= 1))) {
    throw new Error('Označ čtyři rohy výřezu v přehledové mapě');
  }
  const points = value.points;
  const turns = points.length === 4 ? points.map((b, i) => {
    const a = points[(i + 3) % 4];
    const c = points[(i + 1) % 4];
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  }) : [];
  if (turns.length && !turns.every((x) => x > 1e-8) && !turns.every((x) => x < -1e-8)) {
    throw new Error('Rohy označ postupně po obvodu, bez křížení');
  }
  return { dataUrl: value.dataUrl, width, height, credit: value.credit.trim(),
    permitted: value.permitted, points: points.map((p) => [...p]) };
}

export async function readOverviewImage(file) {
  if (!file || !['image/png', 'image/jpeg'].includes(file.type) || file.size > 12000000) {
    throw new Error('Vyber PNG nebo JPEG do 12 MB');
  }
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = header.length === 8 && header.join(',') === '137,80,78,71,13,10,26,10';
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  if (!png && !jpeg) throw new Error('Soubor není platný PNG nebo JPEG');
  const image = await createImageBitmap(file);
  try {
    if (!image.width || !image.height || image.width * image.height > 16000000 ||
        image.width > 8192 || image.height > 8192) throw new Error('Obrázek může mít nejvýše 16 megapixelů a stranu 8192 px');
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length > MAX_IMAGE) throw new Error('Vložený obrázek je příliš velký');
    return { dataUrl, width: image.width, height: image.height };
  } finally {
    image.close();
  }
}

export function createOverviewControl(onChange) {
  const root = document.createElement('div');
  root.id = 'overview-controls';
  root.innerHTML = `<label><input type="checkbox" checked> Přehledová situace – 2. stránka</label>
    <div><small>Vlož vlastní PNG/JPEG (např. obrázek stažený z Mapy.com). Zachovej logo a copyright. Klikni postupně na čtyři rohy pracovního výřezu.</small>
    <input type="file" accept="image/png,image/jpeg">
    <label>Zdroj a copyright <input type="text" maxlength="500" value="Mapy.com – zdroje dle vloženého obrázku"></label>
    <label><input type="checkbox"> Mám oprávnění použít obrázek v tomto výstupu.</label>
    <canvas style="width:100%;height:auto;display:none;cursor:crosshair" aria-label="Označení čtyř rohů výřezu"></canvas>
    <button type="button">Označit rohy znovu</button><p role="status"></p></div>`;
  const enabled = root.querySelector('input[type=checkbox]');
  const body = root.querySelector('div');
  const file = root.querySelector('input[type=file]');
  const credit = root.querySelector('input[type=text]');
  const permitted = root.querySelectorAll('input[type=checkbox]')[1];
  const canvas = root.querySelector('canvas');
  const note = root.querySelector('p');
  let image;
  let bitmap;
  let points = [];
  let reading = false;
  let errorText = '';
  let revision = 0;
  function snapshot() {
    return image ? { ...image, credit: credit.value, permitted: permitted.checked,
      points: points.map((p) => [...p]) } : null;
  }
  function ready() {
    if (!enabled.checked) return true;
    if (reading || !bitmap) return false;
    try { return Boolean(validateOverview(snapshot())); } catch { return false; }
  }
  function draw() {
    canvas.style.display = image ? 'block' : 'none';
    if (image && bitmap) {
      canvas.width = Math.min(640, image.width);
      canvas.height = Math.round(canvas.width * image.height / image.width);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      if (points.length) {
        ctx.beginPath();
        points.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x * canvas.width, y * canvas.height);
          else ctx.lineTo(x * canvas.width, y * canvas.height);
        });
        if (points.length === 4) ctx.closePath();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    body.hidden = !enabled.checked;
    note.textContent = errorText || (!enabled.checked ? '' : reading ? 'Načítám obrázek…' :
      !image ? 'Pro druhou stránku vlož obrázek, nebo tuto vrstvu vypni.' :
      points.length !== 4 ? `Označeno ${points.length}/4 rohů.` :
      !permitted.checked ? 'Potvrď oprávnění k použití obrázku.' :
      ready() ? 'Přehledová situace připravena.' : 'Zkontroluj zdroj a pořadí rohů.');
  }
  function changed(clearError = true) {
    if (clearError === true || clearError instanceof Event) errorText = '';
    draw();
    onChange();
  }
  enabled.onchange = changed;
  credit.oninput = changed;
  permitted.onchange = changed;
  root.querySelector('button').onclick = () => { points = []; changed(); };
  canvas.onclick = (event) => {
    if (!image || points.length === 4 || reading) return;
    const rect = canvas.getBoundingClientRect();
    points.push([Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))]);
    changed();
  };
  async function setBitmap(request) {
    const element = new Image();
    element.src = image.dataUrl;
    await element.decode();
    if (request === revision) { bitmap = element; draw(); onChange(); }
  }
  file.onchange = async () => {
    const selected = file.files[0];
    if (!selected) return;
    const request = ++revision;
    reading = true;
    changed();
    try {
      const next = await readOverviewImage(selected);
      if (request !== revision) return;
      image = next;
      bitmap = null;
      points = [];
      permitted.checked = false;
      await setBitmap(request);
    } catch (error) {
      if (request === revision) errorText = error.message;
    } finally {
      if (request === revision) { reading = false; changed(false); }
    }
  };
  return {
    get enabled() { return enabled.checked; },
    snapshot, ready,
    mount(container, busy) {
      container.append(root);
      for (const input of root.querySelectorAll('input, button')) input.disabled = busy || reading;
      draw();
    },
    preset(value) {
      if (value === 'dio' || value === 'extended') enabled.checked = true;
    },
    reset() {
      revision += 1;
      image = bitmap = null;
      points = [];
      reading = false;
      errorText = '';
      file.value = '';
      permitted.checked = false;
      draw();
    },
    adopt(active, value) {
      this.reset();
      enabled.checked = active;
      if (value) {
        image = { dataUrl: value.dataUrl, width: value.width, height: value.height };
        points = value.points.map((p) => [...p]);
        credit.value = value.credit;
        permitted.checked = value.permitted;
        setBitmap(revision).catch(() => { note.textContent = 'Obrázek se nepodařilo zobrazit.'; });
      }
      draw();
    }
  };
}

export function appendOverviewPage(source, data, options = {}) {
  if (options.preview || data.includeOverview === false) return source;
  const overview = validateOverview(data.overview);
  if (!overview) throw new Error('Chybí přehledová mapa. Vlož obrázek nebo vypni druhou stránku.');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG podklad');
  const root = doc.documentElement;
  const box = root.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  const scale = options.scale || 500;
  const unit = scale / 1000;
  const pageWidth = 210 * unit;
  const pageHeight = 297 * unit;
  const left = box[2] + 10 * unit;
  const element = (tag, attrs = {}, text) => {
    const node = doc.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const page = element('g', { id: 'overview-page' });
  page.setAttributeNS(INK, 'inkscape:groupmode', 'layer');
  page.setAttributeNS(INK, 'inkscape:label', 'Přehledová situace – 2. stránka');
  page.append(element('rect', { x: left, width: pageWidth, height: pageHeight, fill: 'white' }));
  page.append(element('text', { x: left + 10 * unit, y: 15 * unit, 'font-size': 5 * unit }, 'Přehledová situace'));
  const availableWidth = 190 * unit;
  const availableHeight = 235 * unit;
  const ratio = Math.min(availableWidth / overview.width, availableHeight / overview.height);
  const width = overview.width * ratio;
  const height = overview.height * ratio;
  const x = left + (pageWidth - width) / 2;
  const y = 25 * unit + (availableHeight - height) / 2;
  page.append(element('image', { x, y, width, height, href: overview.dataUrl, preserveAspectRatio: 'xMidYMid meet' }));
  page.append(element('polygon', {
    points: overview.points.map(([a, b]) => `${x + a * width},${y + b * height}`).join(' '),
    fill: '#dc2626', 'fill-opacity': '0.12', stroke: '#dc2626', 'stroke-width': 0.5 * unit
  }));
  page.append(element('text', { x: left + 10 * unit, y: 268 * unit, 'font-size': 2.8 * unit },
    'Červeně: pracovní výřez, rohy označené ručně. Přehled není georeferencované zaměření.'));
  const creditLines = overview.credit.match(/.{1,80}(?:\s|$)|.{1,80}/g) || [];
  creditLines.slice(0, 7).forEach((line, i) => page.append(element('text', {
    x: left + 10 * unit, y: (274 + i * 3) * unit, 'font-size': 2.5 * unit
  }, line.trim())));
  root.append(page);
  let named = root.getElementsByTagNameNS(SODI, 'namedview')[0];
  if (!named) {
    named = doc.createElementNS(SODI, 'sodipodi:namedview');
    named.setAttribute('id', 'dio-pages');
    root.append(named);
  }
  for (const [i, bounds] of [[0, [0, 0, box[2], box[3]]], [1, [left, 0, pageWidth, pageHeight]]]) {
    const node = doc.createElementNS(INK, 'inkscape:page');
    node.setAttribute('id', `dio-page-${i + 1}`);
    ['x', 'y', 'width', 'height'].forEach((key, j) => node.setAttribute(key, bounds[j]));
    named.append(node);
  }
  const totalWidth = left + pageWidth;
  const totalHeight = Math.max(box[3], pageHeight);
  root.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  root.setAttribute('width', `${totalWidth / unit}mm`);
  root.setAttribute('height', `${totalHeight / unit}mm`);
  const metadata = root.querySelector('metadata');
  const previous = JSON.parse(metadata.textContent);
  metadata.textContent = JSON.stringify({ ...previous, overview: {
    page: 2, georeferenced: false, outline: 'manually placed image coordinates',
    credit: overview.credit, primaryPageViewBox: box
  } });
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}

export async function printExport(source, scale) {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
  const pages = [...svg.getElementsByTagNameNS(INK, 'page')];
  const boxes = pages.length ? pages.map((p) => ['x', 'y', 'width', 'height'].map((key) => Number(p.getAttribute(key)))) :
    [svg.getAttribute('viewBox').split(/[ ,]+/).map(Number)];
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:1px;height:1px;border:0;left:-9999px';
  document.body.append(frame);
  const doc = frame.contentDocument;
  const style = doc.createElement('style');
  style.textContent = 'html,body{margin:0}section{break-after:page}section:last-child{break-after:auto}svg{display:block;overflow:hidden}' +
    boxes.map((b, i) => `@page p${i}{size:${b[2] * 1000 / scale}mm ${b[3] * 1000 / scale}mm;margin:0}.p${i}{page:p${i}}`).join('');
  doc.head.append(style);
  boxes.forEach((box, i) => {
    const section = doc.createElement('section');
    section.className = `p${i}`;
    const copy = doc.importNode(svg, true);
    copy.setAttribute('viewBox', box.join(' '));
    copy.setAttribute('width', `${box[2] * 1000 / scale}mm`);
    copy.setAttribute('height', `${box[3] * 1000 / scale}mm`);
    section.append(copy);
    doc.body.append(section);
  });
  await Promise.all([...doc.querySelectorAll('image')].map((node) => {
    const image = new Image();
    image.src = node.getAttribute('href');
    return image.decode();
  }));
  frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
  frame.contentWindow.focus();
  frame.contentWindow.print();
}
