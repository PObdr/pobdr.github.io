import { toWgs } from './jtsk.js';

const DEG = Math.PI / 180;
const MIN = 5;
const MAX = 550;

function point(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
}

export function validateSelection(value) {
  if (!value || value.crs !== 'EPSG:5514' || value.version !== 1) {
    throw new Error('Neplatný souřadnicový systém výběru');
  }
  if (![value.origin, value.axisX, value.axisY].every(point)) {
    throw new Error('Neplatné osy výběru');
  }
  const { axisX: x, axisY: y, width, height } = value;
  const determinant = x[0] * y[1] - x[1] * y[0];
  if (Math.abs(Math.hypot(...x) - 1) > 1e-9 ||
      Math.abs(Math.hypot(...y) - 1) > 1e-9 ||
      Math.abs(x[0] * y[0] + x[1] * y[1]) > 1e-9 ||
      Math.abs(determinant + 1) > 1e-9) {
    throw new Error('Výběr musí mít kolmé jednotkové osy bez zrcadlení');
  }
  if (![width, height].every(Number.isFinite) ||
      Math.min(width, height) < MIN || Math.max(width, height) > MAX) {
    throw new Error('Strany musí mít 5–550 m');
  }
  for (const p of selectionBoundary(value)) {
    const [lon, lat] = toWgs(...p);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
        lon < 11.8 || lon > 18.9 || lat < 48 || lat > 51.2) {
      throw new Error('Výběr mimo podporované území');
    }
  }
  return value;
}

export function rectangleFromThree(a, b, c, strict = true) {
  if (![a, b, c].every(point)) {
    throw new Error('Neplatné body výběru');
  }
  const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (width < 1e-6) {
    throw new Error('První dva body musí být různé');
  }
  const u = [(b[0] - a[0]) / width, (b[1] - a[1]) / width];
  const n = [u[1], -u[0]];
  const signed = (c[0] - b[0]) * n[0] + (c[1] - b[1]) * n[1];
  const side = signed < 0 ? -1 : 1;
  const value = {
    version: 1,
    crs: 'EPSG:5514',
    origin: [...(side === 1 ? a : b)],
    axisX: u.map((v) => v * side || 0),
    axisY: n.map((v) => v * side || 0),
    width,
    height: Math.abs(signed)
  };
  return strict ? validateSelection(value) : value;
}

export function selectionToEN(selection, [x, y]) {
  const { origin, axisX, axisY } = selection;
  return [
    origin[0] + x * axisX[0] + y * axisY[0],
    origin[1] + x * axisX[1] + y * axisY[1]
  ];
}

export function enToSelection(selection, [east, north]) {
  const dx = east - selection.origin[0];
  const dy = north - selection.origin[1];
  return [
    dx * selection.axisX[0] + dy * selection.axisX[1],
    dx * selection.axisY[0] + dy * selection.axisY[1]
  ];
}

export function selectionBoundary(selection, steps = 1) {
  const { width, height } = selection;
  const result = [];
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  for (let edge = 0; edge < 4; edge += 1) {
    const a = corners[edge];
    const b = corners[(edge + 1) % 4];
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      result.push(selectionToEN(selection, [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
      ]));
    }
  }
  return result;
}

export function selectionBbox(selection) {
  validateSelection(selection);
  const samples = selectionBoundary(selection, 16);
  const points = samples.flatMap(([e, n]) => [
    toWgs(e - 1, n - 1), toWgs(e + 1, n + 1),
    toWgs(e - 1, n + 1), toWgs(e + 1, n - 1)
  ]);
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1]))
  ];
}

export function selectionMatrix(selection, origin) {
  const p = enToSelection(selection, origin);
  return [
    selection.axisX[0], selection.axisY[0],
    -selection.axisX[1], -selection.axisY[1], ...p
  ];
}

export function selectionNorthAngles(selection, trueBearing) {
  const grid = Math.atan2(selection.axisX[1], -selection.axisY[1]) / DEG;
  return { grid, true: grid + trueBearing };
}
