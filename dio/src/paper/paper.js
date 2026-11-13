export const SCALES = Object.freeze([
  100, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000
]);
export const FORMATS = Object.freeze({ A4: [210, 297], A3: [297, 420] });
const NS = 'http://www.w3.org/2000/svg';

export function validatePrintSettings(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Neplatné nastavení papíru');
  }
  const result = {
    format: value.format ?? 'free', mode: value.mode ?? 'recommended',
    orientation: value.orientation ?? 'auto', marginMm: value.marginMm ?? 10,
    scale: value.scale ?? 500
  };
  if (!['free', 'A4', 'A3'].includes(result.format) ||
      !['recommended', 'exact', 'manual'].includes(result.mode) ||
      !['auto', 'portrait', 'landscape'].includes(result.orientation) ||
      !Number.isFinite(result.marginMm) || result.marginMm < 0 || result.marginMm > 50 ||
      !Number.isFinite(result.scale) || result.scale < 1 || result.scale > 1000000) {
    throw new Error('Neplatný papír, okraje nebo měřítko (1 až 1 000 000)');
  }
  return result;
}

export function solvePaper(dimensions, input = {}) {
  const settings = validatePrintSettings(input);
  const { width, height } = dimensions || {};
  if (![width, height].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error('Neplatné rozměry výřezu');
  }
  const sizeAt = (scale) => [width * 1000 / scale, (height + 24) * 1000 / scale + 16];
  if (settings.format === 'free') {
    const size = sizeAt(settings.scale);
    return { ...settings, widthMm: size[0], heightMm: size[1],
      contentWidthMm: size[0], contentHeightMm: size[1], fits: true,
      orientation: 'unchanged', requiredScale: settings.scale };
  }
  const portrait = FORMATS[settings.format];
  const candidates = [
    { orientation: 'portrait', size: portrait },
    { orientation: 'landscape', size: [...portrait].reverse() }
  ].filter((item) => settings.orientation === 'auto' || settings.orientation === item.orientation);
  for (const item of candidates) {
    const availableWidth = item.size[0] - 2 * settings.marginMm;
    const availableHeight = item.size[1] - 2 * settings.marginMm - 16;
    if (availableWidth <= 0 || availableHeight <= 0) throw new Error('Okraje nezanechávají místo pro výkres');
    item.required = Math.max(1, width * 1000 / availableWidth,
      (height + 24) * 1000 / availableHeight);
  }
  candidates.sort((a, b) => a.required - b.required);
  const best = candidates[0];
  let scale = settings.scale;
  if (settings.mode === 'exact') scale = Math.ceil(best.required * 1e6) / 1e6;
  if (settings.mode === 'recommended') {
    scale = SCALES.find((n) => n >= best.required);
    if (!scale) throw new Error('Výřez se nevejde v nabízených měřítkách; použij přesné přizpůsobení');
  }
  if (scale > 1000000) throw new Error('Požadované měřítko je příliš malé');
  const size = sizeAt(scale);
  return { ...settings, scale, orientation: best.orientation,
    widthMm: best.size[0], heightMm: best.size[1],
    contentWidthMm: size[0], contentHeightMm: size[1],
    requiredScale: best.required,
    fits: size[0] <= best.size[0] - 2 * settings.marginMm + 1e-7 &&
      size[1] <= best.size[1] - 2 * settings.marginMm + 1e-7 };
}

export function fitDetailPage(source, layout) {
  if (layout.format === 'free') return source;
  if (!layout.fits) throw new Error('Výkres se na vybraný papír nevejde. Změň měřítko nebo formát.');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatné SVG detailu');
  const root = doc.documentElement;
  if (root.querySelector('#paper-content')) throw new Error('Papír už byl nastaven');
  const box = root.getAttribute('viewBox').split(/[ ,]+/).map(Number);
  const unit = layout.scale / 1000;
  if (box.length !== 4 || !box.every(Number.isFinite) || box[0] !== 0 || box[1] !== 0 ||
      Math.abs(box[2] / unit - layout.contentWidthMm) > 1e-5 ||
      Math.abs(box[3] / unit - layout.contentHeightMm) > 1e-5 ||
      Math.abs(Number.parseFloat(root.getAttribute('width')) - box[2] / unit) > 1e-5 ||
      Math.abs(Number.parseFloat(root.getAttribute('height')) - box[3] / unit) > 1e-5) {
    throw new Error('Rozměry detailu nesouhlasí s výpočtem papíru');
  }
  const width = layout.widthMm * unit;
  const height = layout.heightMm * unit;
  const dx = (width - box[2]) / 2;
  const dy = (height - box[3]) / 2;
  const content = doc.createElementNS(NS, 'g');
  content.setAttribute('id', 'paper-content');
  content.setAttribute('transform', `translate(${dx} ${dy})`);
  const nonDrawing = new Set(['defs', 'metadata', 'title', 'desc', 'style', 'namedview']);
  for (const node of [...root.children]) {
    if (!nonDrawing.has(node.localName)) content.append(node);
  }
  const background = doc.createElementNS(NS, 'rect');
  background.setAttribute('id', 'paper-background');
  background.setAttribute('width', width);
  background.setAttribute('height', height);
  background.setAttribute('fill', 'white');
  root.append(background, content);
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('width', `${layout.widthMm}mm`);
  root.setAttribute('height', `${layout.heightMm}mm`);
  const metadata = root.querySelector('metadata');
  if (metadata) {
    const previous = JSON.parse(metadata.textContent);
    const coefficients = previous.svgToENCoefficients ||
      (previous.originEN ? [...previous.originEN, 1, 0, 0, -1] : null);
    const adjusted = coefficients ? [
      coefficients[0] - dx * coefficients[2] - dy * coefficients[4],
      coefficients[1] - dx * coefficients[3] - dy * coefficients[5],
      ...coefficients.slice(2)
    ] : null;
    metadata.textContent = JSON.stringify({ ...previous,
      ...(adjusted ? { contentOriginEN: previous.originEN,
        originEN: adjusted.slice(0, 2), contentSvgToENCoefficients: coefficients,
        svgToENCoefficients: adjusted,
        svgToEN: 'EN=originEN+x*axisX+y*axisY; see svgToENCoefficients' } : {}),
      paper: { ...layout, contentTranslation: [dx, dy],
        mapRotationChanged: false, print: '100%; no fit-to-page' }
    }, null, 2);
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}
