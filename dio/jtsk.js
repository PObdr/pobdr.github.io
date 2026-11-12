// Adapted from Profily ulic, Bára Soukupová (MIT); see PROJECTION-LICENSE.txt.
// EPSG:5514 and Helmert EPSG:1623. Numerical round-trip precision is not surveying accuracy.
const D = Math.PI / 180;
const A = 6377397.155;
const E2 = 0.006674372230614;
const E = Math.sqrt(E2);
const PHI0 = 49.5 * D;
const LAM0 = 24.83333333333333 * D;
const S0 = 78.5 * D;
const ALPHA = Math.sqrt(1 + E2 * Math.cos(PHI0) ** 4 / (1 - E2));
const U0 = Math.asin(Math.sin(PHI0) / ALPHA);
const G = ((1 + E * Math.sin(PHI0)) / (1 - E * Math.sin(PHI0))) ** (ALPHA * E / 2);
const K = Math.tan(U0 / 2 + Math.PI / 4) / Math.tan(PHI0 / 2 + Math.PI / 4) ** ALPHA * G;
const N0 = A * Math.sqrt(1 - E2) / (1 - E2 * Math.sin(PHI0) ** 2);
const N = Math.sin(S0);
const RHO0 = 0.9999 * N0 / Math.tan(S0);
const AD = Math.PI / 2 - 1.04216856380474;
const RX = 4.998 / 3600 * D;
const RY = 1.587 / 3600 * D;
const RZ = 5.261 / 3600 * D;
const M = 1 + 3.56e-6;
const WA = 6378137;
const WF = 1 / 298.257223563;
const WE2 = WF * (2 - WF);

export function toWgs(east, north) {
  const x = -north;
  const y = -east;
  const rho = Math.hypot(x, y);
  const d = Math.atan2(y, x) / N;
  const s = 2 * (Math.atan((RHO0 / rho) ** (1 / N) * Math.tan(S0 / 2 + Math.PI / 4)) - Math.PI / 4);
  const u = Math.asin(Math.cos(AD) * Math.sin(s) - Math.sin(AD) * Math.cos(s) * Math.cos(d));
  const lam = LAM0 - Math.asin(Math.cos(s) * Math.sin(d) / Math.cos(u)) / ALPHA;
  let phi = u;
  for (let i = 0; i < 10; i += 1) {
    phi = 2 * (Math.atan(K ** (-1 / ALPHA) * Math.tan(u / 2 + Math.PI / 4) ** (1 / ALPHA) * ((1 + E * Math.sin(phi)) / (1 - E * Math.sin(phi))) ** (E / 2)) - Math.PI / 4);
  }
  const nu = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
  const X = nu * Math.cos(phi) * Math.cos(lam);
  const Y = nu * Math.cos(phi) * Math.sin(lam);
  const Z = nu * (1 - E2) * Math.sin(phi);
  const X2 = 570.8 + M * (X - RZ * Y + RY * Z);
  const Y2 = 85.7 + M * (RZ * X + Y - RX * Z);
  const Z2 = 462.8 + M * (-RY * X + RX * Y + Z);
  const p = Math.hypot(X2, Y2);
  let lat = Math.atan2(Z2, p * (1 - WE2));
  for (let i = 0; i < 6; i += 1) {
    const n = WA / Math.sqrt(1 - WE2 * Math.sin(lat) ** 2);
    lat = Math.atan2(Z2 + WE2 * n * Math.sin(lat), p);
  }
  return [Math.atan2(Y2, X2) / D, lat / D];
}

export function fromWgs(lon, lat) {
  if (![lon, lat].every(Number.isFinite) || lon < 10 || lon > 23 || lat < 47 || lat > 53) throw new Error('S-JTSK: bod mimo podporované území');
  let x = -600000;
  let y = -1100000;
  for (let i = 0; i < 10; i += 1) {
    const [l0, b0] = toWgs(x, y);
    const [l1, b1] = toWgs(x + 1, y);
    const [l2, b2] = toWgs(x, y + 1);
    const a = l1 - l0;
    const b = l2 - l0;
    const c = b1 - b0;
    const d = b2 - b0;
    const det = a * d - b * c;
    if (!Number.isFinite(det) || Math.abs(det) < 1e-16) throw new Error('S-JTSK: singulární transformace');
    const dx = (d * (lon - l0) - b * (lat - b0)) / det;
    const dy = (-c * (lon - l0) + a * (lat - b0)) / det;
    x += dx;
    y += dy;
    if (Math.abs(dx) + Math.abs(dy) < 1e-4) return [x, y];
  }
  throw new Error('S-JTSK: transformace nekonverguje');
}

export function jtskFrame(bbox) {
  const [w, s, e, n] = bbox;
  const points = [];
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    points.push(fromWgs(w + (e - w) * t, s), fromWgs(w + (e - w) * t, n));
    points.push(fromWgs(w, s + (n - s) * t), fromWgs(e, s + (n - s) * t));
  }
  const left = Math.min(...points.map((p) => p[0]));
  const right = Math.max(...points.map((p) => p[0]));
  const bottom = Math.min(...points.map((p) => p[1]));
  const top = Math.max(...points.map((p) => p[1]));
  return { left, right, bottom, top, width: right - left, height: top - bottom, project: (p) => {
    const [east, north] = fromWgs(...p);
    return [east - left, top - north];
  } };
}

export function projectDataset(data) {
  const target = jtskFrame(data.bbox);
  if (data.version === 3 && data.crs === 'EPSG:5514') {
    if (!Array.isArray(data.origin) || Math.hypot(data.origin[0] - target.left, data.origin[1] - target.top) > 0.001) throw new Error('Nesouhlasí počátek S-JTSK projektu');
    return data;
  }
  if (data.version !== 2 || data.crs) throw new Error('Nepodporovaný souřadnicový systém projektu');
  const [w, s, e, n] = data.bbox;
  const sy = 6371008.8 * Math.PI / 180;
  const sx = sy * Math.cos((s + n) * Math.PI / 360);
  const convert = ([x, y]) => target.project([w + x / sx, n - y / sy]);
  return {
    ...data, version: 3, crs: 'EPSG:5514', origin: [target.left, target.top],
    transformation: 'EPSG:1623; approximate 1 m; not surveying',
    raw: data.raw.map((f) => ({ ...f, coords: f.kind === 'point' ? convert(f.coords) : f.coords.map((line) => line.map(convert)) }))
  };
}

export function northAngle(lon, lat) {
  const a = fromWgs(lon, lat);
  const b = fromWgs(lon, lat + 0.0001);
  return Math.atan2(b[0] - a[0], b[1] - a[1]) / D;
}

export function rose(angle, size) {
  return `<circle r="${size * 1.6}" fill="white" fill-opacity="0.9" stroke="#666" stroke-width="${size / 40}"/>
  <path d="M 0 0 V ${-size}" fill="none" stroke="#2563eb" stroke-dasharray="${size / 8} ${size / 10}" stroke-width="${size / 30}"/>
  <text x="${size / 3}" y="${-size * .75}" font-size="${size / 3}" fill="#2563eb">Ns</text>
  <g transform="rotate(${angle})" stroke="#111" stroke-width="${size / 30}" fill="none">
    <path d="M 0 ${-size} V ${size} M ${-size} 0 H ${size}"/>
    <path d="M 0 ${-size} L ${-size / 7} ${-size / 2} H ${size / 7} Z" fill="#111"/>
    <g fill="#111" stroke="none" font-size="${size / 3}" text-anchor="middle">
      <text y="${-size * 1.15}">N</text>
      <text x="${size * 1.2}" y="${size / 9}">E</text>
      <text y="${size * 1.4}">S</text>
      <text x="${-size * 1.2}" y="${size / 9}">W</text>
    </g>
  </g>`;
}
