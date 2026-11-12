// Orientation heuristic adapted from Profily ulic, Bára Soukupová (MIT).
// See PROJECTION-LICENSE.txt for the attribution and MIT notice.
const ROAD_EXCLUDED = new Set(['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'crossing']);
const EPS = 1e-8;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

export function parkingKind(feature) {
  if (feature.kind !== 'area') return null;
  const source = feature.source || '';
  if (source.startsWith('TSK ZTP')) return 'disabled';
  if (source === 'TSK zásobování') return 'loading';
  if (source === 'TSK speciální stání') return 'special';
  if (source === 'TSK úseky zákazu stání') return 'forbidden';
  if (source === 'TSK úseky stání') return 'regular';
  const a = feature.attrs || {};
  if (source !== 'OSM' || !['parking', 'parking_space'].includes(a.amenity)) return null;
  const total = Number(a.capacity);
  const disabled = Number(a['capacity:disabled']);
  return a.parking_space === 'disabled' ||
    (total > 0 && disabled >= total) ? 'disabled' : 'regular';
}

export function inside(point, rings) {
  let hit = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) &&
          point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) {
        hit = !hit;
      }
    }
  }
  return hit;
}

function clipped(a, b, rings, excluded = []) {
  const d = sub(b, a);
  const cuts = [0, 1];
  for (const ring of [...rings, ...excluded.flatMap((f) => f.coords)]) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const edge = sub(ring[i], ring[j]);
      const denominator = cross(d, edge);
      if (Math.abs(denominator) < EPS) continue;
      const delta = sub(ring[j], a);
      const t = cross(delta, edge) / denominator;
      const s = cross(delta, d) / denominator;
      if (t > EPS && t < 1 - EPS && s >= -EPS && s <= 1 + EPS) cuts.push(t);
    }
  }
  cuts.sort((x, y) => x - y);
  const result = [];
  for (let i = 1; i < cuts.length; i += 1) {
    const start = cuts[i - 1];
    const end = cuts[i];
    if (end - start < EPS) continue;
    const at = (t) => [a[0] + t * d[0], a[1] + t * d[1]];
    const middle = at((start + end) / 2);
    if (inside(middle, rings) && !excluded.some((f) => inside(middle, f.coords))) {
      result.push([at(start), at(end)]);
    }
  }
  return result;
}

function streetAxis(center, raw) {
  let best;
  for (const f of raw) {
    const a = f.attrs || {};
    if (f.source !== 'OSM' || f.kind !== 'line' || !a.highway || ROAD_EXCLUDED.has(a.highway)) continue;
    for (const line of f.coords) {
      for (let i = 1; i < line.length; i += 1) {
        const delta = sub(line[i], line[i - 1]);
        const length = Math.hypot(...delta);
        if (length < 0.1) continue;
        const t = Math.max(0, Math.min(1, dot(sub(center, line[i - 1]), delta) / length ** 2));
        const distance = Math.hypot(...sub(center,
          [line[i - 1][0] + t * delta[0], line[i - 1][1] + t * delta[1]]));
        if (distance <= 30 && (!best || distance < best.distance)) {
          best = { distance, u: delta.map((v) => v / length) };
        }
      }
    }
  }
  if (!best) return null;
  const u = best.u;
  return u[0] < 0 || (Math.abs(u[0]) < EPS && u[1] < 0) ? u.map((v) => -v) : u;
}

export function parkingOrientation(depth, length, count) {
  if (depth >= 4.9) return 'perpendicular';
  if (depth < 3) return 'parallel';
  if (count < 2) return depth >= 4 ? 'diagonal' : null;
  const perStall = length / count;
  if (depth >= 4) return perStall >= 3.4 ? 'diagonal' : 'perpendicular';
  return perStall >= 4.8 ? 'parallel' : perStall >= 3.4 ? 'diagonal' : 'perpendicular';
}

function signedArea(ring) {
  return ring.reduce((sum, p, i) => sum + cross(p, ring[(i + 1) % ring.length]), 0) / 2;
}

function wheelchair(center, radius) {
  const paths = [];
  const circle = (x, y, r) => {
    const points = Array.from({ length: 25 }, (_, i) => [
      center[0] + radius * (x + r * Math.cos(i * Math.PI / 12)),
      center[1] + radius * (y + r * Math.sin(i * Math.PI / 12))
    ]);
    paths.push(points);
  };
  circle(-0.15, 0.3, 0.6);
  circle(0.05, -0.9, 0.16);
  paths.push([[0.02, -0.65], [0.02, 0.05], [0.7, 0.05], [0.95, 0.75], [1.2, 0.65]]
    .map(([x, y]) => [center[0] + radius * x, center[1] + radius * y]));
  paths.push([[0.02, -0.35], [0.65, -0.35]]
    .map(([x, y]) => [center[0] + radius * x, center[1] + radius * y]));
  return paths;
}

export function parkingDrawing(feature, raw) {
  const kind = parkingKind(feature);
  if (!kind) return null;
  const rings = feature.coords;
  const points = rings.flat();
  if (!points.length) return null;
  const xmin = Math.min(...points.map((p) => p[0]));
  const xmax = Math.max(...points.map((p) => p[0]));
  const ymin = Math.min(...points.map((p) => p[1]));
  const ymax = Math.max(...points.map((p) => p[1]));
  const center = [(xmin + xmax) / 2, (ymin + ymax) / 2];
  const protectedAreas = raw.filter((f) => f.id !== feature.id &&
    ['disabled', 'special', 'loading', 'forbidden'].includes(parkingKind(f)));
  const excluded = kind === 'regular' ? [...protectedAreas] : [];
  // Suppress only overlapping OSM linework, not the uncovered remainder of a lot.
  if (feature.source === 'OSM') {
    excluded.push(...raw.filter((f) => f.source === 'TSK úseky stání' && parkingKind(f) &&
      kind === 'regular'));
    if (kind === 'disabled') {
      excluded.push(...protectedAreas.filter((f) => f.source.startsWith('TSK ZTP')));
    }
  }
  const segments = [];
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      // Keep source boundaries; remove portions covered by higher-priority data.
      const a = ring[j];
      const b = ring[i];
      const delta = sub(b, a);
      const length = Math.hypot(...delta);
      if (length < EPS) continue;
      const n = [-delta[1] / length * 1e-6, delta[0] / length * 1e-6];
      const inward = inside([(a[0] + b[0]) / 2 + n[0], (a[1] + b[1]) / 2 + n[1]], rings) ? 1 : -1;
      const shifted = [a, b].map((p) => [p[0] + inward * n[0], p[1] + inward * n[1]]);
      segments.push(...clipped(...shifted, rings, excluded));
    }
  }
  const axis = streetAxis(center, raw);
  const attrs = feature.attrs || {};
  let orientation = ['parallel', 'perpendicular', 'diagonal'].includes(attrs.orientation) ? attrs.orientation : null;
  let inferred = false;
  const count = Number(feature.source.startsWith('TSK') ? attrs.PS_ZPS : attrs.capacity);
  if (axis && kind === 'regular' && rings.length === 1) {
    const normal = [-axis[1], axis[0]];
    const local = points.map((p) => [dot(sub(p, center), axis), dot(sub(p, center), normal)]);
    const left = Math.min(...local.map((p) => p[0]));
    const right = Math.max(...local.map((p) => p[0]));
    const bottom = Math.min(...local.map((p) => p[1]));
    const top = Math.max(...local.map((p) => p[1]));
    const length = right - left;
    const depth = Math.abs(signedArea(rings[0])) / (length || 1);
    if (!orientation && feature.source === 'TSK úseky stání') {
      orientation = parkingOrientation(depth, length, count);
      inferred = Boolean(orientation);
    }
    // A source count is required: never invent a count from a default stall width.
    const spacing = length / count;
    if (orientation && Number.isInteger(count) && count >= 2 && count <= 200 &&
        spacing >= 1.8 && spacing <= 12 && length > EPS) {
      const position = (x, y) => [center[0] + axis[0] * x + normal[0] * y,
        center[1] + axis[1] * x + normal[1] * y];
      const slant = orientation === 'diagonal' ? 1 : 0;
      for (let i = 1; i < count; i += 1) {
        const x = left + spacing * i;
        segments.push(...clipped(position(x + slant * bottom, bottom - 1e-6),
          position(x + slant * top, top + 1e-6), rings, excluded));
      }
    }
  }
  if (kind === 'disabled') {
    const candidates = [];
    for (let y = 1; y < 10; y += 1) {
      for (let x = 1; x < 10; x += 1) {
        candidates.push([xmin + (xmax - xmin) * x / 10, ymin + (ymax - ymin) * y / 10]);
      }
    }
    candidates.sort((a, b) => Math.hypot(...sub(a, center)) - Math.hypot(...sub(b, center)));
    for (const candidate of candidates) {
      const radius = Math.min(0.8, (xmax - xmin) / 6, (ymax - ymin) / 6);
      const icon = wheelchair(candidate, radius);
      if (icon.flat().every((p) => inside(p, rings) && !excluded.some((f) => inside(p, f.coords)))) {
        segments.push(...icon.flatMap((line) => line.slice(1).map((p, i) => [line[i], p])));
        break;
      }
    }
  }
  return {
    d: segments.map(([a, b]) => `M ${a.join(',')} L ${b.join(',')}`).join(' '),
    color: kind === 'disabled' ? '#1d4ed8' : kind === 'forbidden' ? '#b45309' : '#475569',
    dashed: kind === 'regular' && Boolean(orientation),
    description: JSON.stringify({
      kind, orientation, orientationSource: inferred ? 'inferred-from-TSK-geometry-and-count' : orientation ? 'OSM orientation' : 'unknown',
      sourceCount: Number.isFinite(count) ? count : null,
      warning: 'Schematic parking division, not surveyed markings; diagonal angle/handedness approximate. Source outlines retained.'
    })
  };
}
