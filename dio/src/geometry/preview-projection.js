import { jtskFrame, toWgs, fromWgs } from './jtsk.js';

const R = 6378137;
const DEG = Math.PI / 180;

export function mercator(lon, lat) {
  return [R * lon * DEG, R * Math.log(Math.tan(Math.PI / 4 + lat * DEG / 2))];
}

export function createPreviewProjection(bbox) {
  const grid = jtskFrame(bbox);
  const absolute = ([x, y]) => mercator(...toWgs(grid.left + x, grid.top - y));
  const edge = [];
  for (let i = 0; i < 8; i += 1) {
    const t = i / 8;
    edge.push([grid.width * t, 0]);
  }
  for (let i = 0; i < 8; i += 1) edge.push([grid.width, grid.height * i / 8]);
  for (let i = 0; i < 8; i += 1) edge.push([grid.width * (1 - i / 8), grid.height]);
  for (let i = 0; i < 8; i += 1) edge.push([0, grid.height * (1 - i / 8)]);
  const projected = edge.map(absolute);
  const left = Math.min(...projected.map((p) => p[0]));
  const right = Math.max(...projected.map((p) => p[0]));
  const bottom = Math.min(...projected.map((p) => p[1]));
  const top = Math.max(...projected.map((p) => p[1]));
  const point = (p) => {
    const [x, y] = absolute(p);
    return [x - left, top - y];
  };
  return {
    left, top, width: right - left, height: top - bottom,
    gridWidth: grid.width, gridHeight: grid.height,
    boundary: edge.map(point), point,
    matrix(x, y) {
      const p = point([x, y]);
      const a = point([x + 1, y]);
      const b = point([x, y + 1]);
      return [a[0] - p[0], a[1] - p[1], b[0] - p[0], b[1] - p[1], ...p];
    }
  };
}

export function projectPath(d, point) {
  // The source renderer emits absolute M/L/Z only; never reinterpret symbol H/V/C commands.
  const parts = d.match(/[MLZ]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
  if (d.replace(/[MLZ]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[\s,]/gi, '')) throw new Error('Neznámá geometrie náhledu');
  const result = [];
  let i = 0;
  while (i < parts.length) {
    const command = parts[i++];
    if (command === 'Z') {
      result.push('Z');
      continue;
    }
    if (!['M', 'L'].includes(command) || i + 1 >= parts.length) throw new Error('Neplatná cesta náhledu');
    const x = Number(parts[i++]);
    const y = Number(parts[i++]);
    if (![x, y].every(Number.isFinite)) throw new Error('Neplatný bod náhledu');
    result.push(`${command} ${point([x, y]).join(' ')}`);
  }
  return result.join(' ');
}

export function gridAngleOnMap(lon, lat) {
  const [east, north] = fromWgs(lon, lat);
  const a = mercator(...toWgs(east, north));
  const b = mercator(...toWgs(east, north + 10));
  return Math.atan2(b[0] - a[0], b[1] - a[1]) / DEG;
}
