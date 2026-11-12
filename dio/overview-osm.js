import { toWgs, jtskFrame } from './jtsk.js';

export const PROVIDER = Object.freeze({
  id: 'osm-carto',
  template: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  credit: '© OpenStreetMap contributors',
  copyright: 'https://www.openstreetmap.org/copyright',
  tileSize: 256,
  maxZoom: 18
});

export const WIDTH = 1024;
export const HEIGHT = 768;
const R = 6371008.8;
const D = Math.PI / 180;

export function worldPoint(lon, lat, zoom) {
  if (![lon, lat].every(Number.isFinite) || Math.abs(lat) > 85) {
    throw new Error('Neplatné souřadnice přehledu');
  }
  const size = 256 * 2 ** zoom;
  const sine = Math.sin(lat * D);
  return [
    (lon + 180) / 360 * size,
    (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size
  ];
}

export function mapBoundary(data) {
  let origin;
  let axisX;
  let axisY;
  let width;
  let height;
  if (data.selection) {
    ({ origin, axisX, axisY, width, height } = data.selection);
  } else {
    const frame = jtskFrame(data.bbox);
    origin = [frame.left, frame.top];
    axisX = [1, 0];
    axisY = [0, -1];
    ({ width, height } = frame);
  }
  if (![origin, axisX, axisY].every((p) =>
    Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) ||
      ![width, height].every((n) => Number.isFinite(n) && n >= 5 && n <= 551) ||
      Math.abs(Math.hypot(...axisX) - 1) > 1e-6 ||
      Math.abs(Math.hypot(...axisY) - 1) > 1e-6 ||
      Math.abs(axisX[0] * axisY[0] + axisX[1] * axisY[1]) > 1e-6) {
    throw new Error('Neplatný pracovní výřez přehledu');
  }
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const boundary = [];
  for (let side = 0; side < 4; side += 1) {
    const a = corners[side];
    const b = corners[(side + 1) % 4];
    for (let i = 0; i < 8; i += 1) {
      const x = a[0] + (b[0] - a[0]) * i / 8;
      const y = a[1] + (b[1] - a[1]) * i / 8;
      boundary.push(toWgs(
        origin[0] + axisX[0] * x + axisY[0] * y,
        origin[1] + axisX[1] * x + axisY[1] * y
      ));
    }
  }
  return boundary;
}

function niceLength(limit) {
  const power = 10 ** Math.floor(Math.log10(limit));
  return [5, 2, 1].map((n) => n * power).find((n) => n <= limit);
}

export function planOverview(data) {
  const boundary = mapBoundary(data);
  const world = boundary.map(([lon, lat]) => worldPoint(lon, lat, 0));
  const minX = Math.min(...world.map((p) => p[0]));
  const maxX = Math.max(...world.map((p) => p[0]));
  const minY = Math.min(...world.map((p) => p[1]));
  const maxY = Math.max(...world.map((p) => p[1]));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * cy / 256))) / D;
  const groundPerWorldPixel = 2 * Math.PI * R * Math.cos(lat * D) / 256;
  const neededX = Math.max((maxX - minX) * 4, 800 / groundPerWorldPixel);
  const neededY = Math.max((maxY - minY) * 4, 600 / groundPerWorldPixel);
  const zoom = Math.max(0, Math.min(PROVIDER.maxZoom, Math.floor(Math.log2(
    Math.min(WIDTH / neededX, HEIGHT / neededY)
  ))));
  const factor = 2 ** zoom;
  const left = cx * factor - WIDTH / 2;
  const top = cy * factor - HEIGHT / 2;
  const points = world.map(([x, y]) => [x * factor - left, y * factor - top]);
  const tiles = [];
  for (let y = Math.floor(top / 256); y <= Math.floor((top + HEIGHT - 1e-7) / 256); y += 1) {
    for (let x = Math.floor(left / 256); x <= Math.floor((left + WIDTH - 1e-7) / 256); x += 1) {
      if (x < 0 || y < 0 || x >= 2 ** zoom || y >= 2 ** zoom) {
        throw new Error('Přehled zasahuje mimo podporovanou mapu');
      }
      const url = PROVIDER.template.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
      tiles.push({ url, x: x * 256 - left, y: y * 256 - top });
    }
  }
  if (tiles.length > 20) throw new Error('Přehled vyžaduje příliš mnoho dlaždic');
  const scaleY = HEIGHT - 42;
  const scaleLatitude = Math.atan(Math.sinh(Math.PI *
    (1 - 2 * (top + scaleY) / (256 * factor))));
  const metresPerPixel = 2 * Math.PI * R * Math.cos(scaleLatitude) / (256 * factor);
  const scaleMetres = niceLength(metresPerPixel * WIDTH / 4);
  return {
    key: JSON.stringify({ provider: PROVIDER.id, boundary }),
    width: WIDTH, height: HEIGHT, zoom, left, top, points, tiles,
    scaleY, scaleMetres, scalePixels: scaleMetres / metresPerPixel,
    metresPerPixel, credit: PROVIDER.credit
  };
}

function imageTile(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let done = false;
    const finish = (error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve(image);
    };
    const abort = () => {
      image.src = '';
      finish(new DOMException('Zrušeno', 'AbortError'));
    };
    const timer = setTimeout(() => {
      image.src = '';
      finish(new Error('Vypršel čas načítání dlaždice OSM'));
    }, 20000);
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'strict-origin-when-cross-origin';
    image.onload = () => {
      if (image.naturalWidth !== 256 || image.naturalHeight !== 256) {
        finish(new Error('OSM vrátilo neplatnou dlaždici'));
      } else {
        finish();
      }
    };
    image.onerror = () => finish(new Error('Dlaždici OSM nelze načíst; zkontroluj připojení nebo dostupnost služby'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

export async function renderOverview(plan, signal) {
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const context = canvas.getContext('2d');
  let next = 0;
  async function worker() {
    while (next < plan.tiles.length && !signal.aborted) {
      const tile = plan.tiles[next++];
      const image = await imageTile(tile.url, signal);
      context.drawImage(image, tile.x, tile.y);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, plan.tiles.length) }, worker));
  if (signal.aborted) throw new DOMException('Zrušeno', 'AbortError');
  let dataUrl;
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    throw new Error('OSM podklad nelze vložit do exportu (CORS)');
  }
  return { plan, canvas, dataUrl };
}

export function drawOverview(canvas, asset) {
  canvas.width = asset.plan.width;
  canvas.height = asset.plan.height;
  const ctx = canvas.getContext('2d');
  const p = asset.plan;
  ctx.drawImage(asset.canvas, 0, 0);
  ctx.beginPath();
  p.points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fillRect(12, p.scaleY - 18, p.scalePixels + 75, 58);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, p.scaleY);
  ctx.lineTo(24 + p.scalePixels, p.scaleY);
  for (let i = 0; i <= 2; i += 1) {
    const x = 24 + p.scalePixels * i / 2;
    ctx.moveTo(x, p.scaleY - 5);
    ctx.lineTo(x, p.scaleY + 5);
  }
  ctx.stroke();
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#111';
  ctx.fillText('0', 20, p.scaleY + 26);
  ctx.fillText(`${p.scaleMetres} m`, 24 + p.scalePixels, p.scaleY + 26);
  ctx.fillStyle = 'white';
  ctx.fillRect(p.width - 75, 12, 60, 90);
  ctx.fillStyle = '#111';
  ctx.fillText('S', p.width - 50, 35);
  ctx.beginPath();
  ctx.moveTo(p.width - 45, 43);
  ctx.lineTo(p.width - 55, 76);
  ctx.lineTo(p.width - 45, 68);
  ctx.lineTo(p.width - 35, 76);
  ctx.closePath();
  ctx.fill();
}
