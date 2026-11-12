// Orientation heuristic adapted from Profily ulic, Bára Soukupová (MIT).
// See PROJECTION-LICENSE.txt for the attribution and MIT notice.
import { parkingFrame, iconBasis } from './parking-frame.js';

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

export function parkingOrientation(depth, length, count) {
  if (depth >= 4.9) return 'perpendicular';
  if (depth < 3) return 'parallel';
  if (count < 2) return depth >= 4 ? 'diagonal' : null;
  const perStall = length / count;
  if (depth >= 4) return perStall >= 3.4 ? 'diagonal' : 'perpendicular';
  return perStall >= 4.8 ? 'parallel' : perStall >= 3.4 ? 'diagonal' : 'perpendicular';
}

export function parkingSideDividers(rings, axis, count) {
  if (rings.length !== 1 || !Number.isInteger(count) || count < 2 || count > 200) return null;
  const points = [];
  const distance = (a, b) => Math.hypot(...sub(a, b));
  for (const p of rings[0]) {
    if (!points.length || distance(p, points[points.length - 1]) > 0.02) points.push(p);
  }
  if (points.length > 1 && distance(points[0], points[points.length - 1]) <= 0.02) points.pop();
  let changed = true;
  while (changed && points.length > 4) {
    changed = false;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[(i + points.length - 1) % points.length];
      const b = points[i];
      const c = points[(i + 1) % points.length];
      const edge = sub(c, a);
      const t = dot(sub(b, a), edge) / dot(edge, edge);
      if (t > 0 && t < 1 && Math.abs(cross(sub(b, a), edge)) / Math.hypot(...edge) <= 0.02) {
        points.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  if (points.length !== 4) return null;
  const turns = points.map((p, i) => cross(sub(points[(i + 1) % 4], p),
    sub(points[(i + 2) % 4], points[(i + 1) % 4])));
  if (!turns.every((v) => v > EPS) && !turns.every((v) => v < -EPS)) return null;
  const normal = [-axis[1], axis[0]];
  const candidates = [];
  for (let i = 0; i < 2; i += 1) {
    const edges = [[points[i], points[(i + 1) % 4]],
      [points[(i + 2) % 4], points[(i + 3) % 4]]]
      .map(([a, b]) => dot(sub(b, a), axis) >= 0 ? [a, b] : [b, a]);
    const lengths = edges.map(([a, b]) => distance(a, b));
    if (!edges.every(([a, b], j) => dot(sub(b, a), axis) / lengths[j] >= 0.95)) continue;
    const sides = [sub(edges[1][0], edges[0][0]), sub(edges[1][1], edges[0][1])];
    if (Math.min(...lengths) < 2 * Math.max(...sides.map((d) => Math.hypot(...d)))) continue;
    const across = sides.map((d) => dot(d, normal));
    const slants = sides.map((d, j) => dot(d, axis) / across[j]);
    if (across.some((v) => Math.abs(v) < 1) || across[0] * across[1] <= 0 ||
        slants.some((v) => Math.abs(v) < 0.15 || Math.abs(v) > 2) || slants[0] * slants[1] <= 0 ||
        dot(sides[0], sides[1]) / (Math.hypot(...sides[0]) * Math.hypot(...sides[1])) < Math.cos(Math.PI / 9) ||
        lengths.some((n) => n / count < 1.8 || n / count > 12)) continue;
    const at = ([a, b], t) => a.map((v, j) => v + t * (b[j] - v));
    const segments = Array.from({ length: count - 1 }, (_, j) =>
      edges.map((edge) => at(edge, (j + 1) / count)));
    candidates.push({ segments, slants });
  }
  return candidates.length === 1 ? candidates[0] : null;
}

function wheelchair(center, radius, basis) {
  const paths = [];
  const project = ([x, y]) => [
    center[0] + radius * (x * basis.x[0] + y * basis.y[0]),
    center[1] + radius * (x * basis.x[1] + y * basis.y[1])
  ];
  const circle = (x, y, r) => {
    paths.push(Array.from({ length: 25 }, (_, i) => project([
      x + r * Math.cos(i * Math.PI / 12), y + r * Math.sin(i * Math.PI / 12)
    ])));
  };
  circle(-0.15, 0.3, 0.6);
  circle(0.05, -0.9, 0.16);
  paths.push([[0.02, -0.65], [0.02, 0.05], [0.7, 0.05], [0.95, 0.75], [1.2, 0.65]].map(project));
  paths.push([[0.02, -0.35], [0.65, -0.35]].map(project));
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
  const frame = parkingFrame(feature, raw, parkingKind);
  const axis = frame?.u;
  const orientation = frame?.orientation || null;
  const slant = orientation === 'diagonal' ? frame.slant : 0;
  const attrs = feature.attrs || {};
  const count = Number(feature.source.startsWith('TSK') ? attrs.PS_ZPS : attrs.capacity);
  let sideDivision = null;
  if (axis && orientation && kind === 'regular' && rings.length === 1) {
    const normal = [-axis[1], axis[0]];
    const local = points.map((p) => [dot(sub(p, center), axis), dot(sub(p, center), normal)]);
    const left = Math.min(...local.map((p) => p[0]));
    const right = Math.max(...local.map((p) => p[0]));
    const bottom = Math.min(...local.map((p) => p[1]));
    const top = Math.max(...local.map((p) => p[1]));
    const length = right - left;
    const spacing = length / count;
    if (Number.isInteger(count) && count >= 2 && count <= 200 &&
        spacing >= 1.8 && spacing <= 12 && length > EPS) {
      const position = (x, y) => [center[0] + axis[0] * x + normal[0] * y,
        center[1] + axis[1] * x + normal[1] * y];
      if (orientation === 'diagonal' && frame.slantSource !== 'single-reserved-bay-geometry') {
        sideDivision = parkingSideDividers(rings, axis, count);
      }
      if (sideDivision) {
        for (const [a, b] of sideDivision.segments) segments.push(...clipped(a, b, rings, excluded));
      } else {
        for (let i = 1; i < count; i += 1) {
          const x = left + spacing * i;
          segments.push(...clipped(position(x + slant * bottom, bottom - 1e-6),
            position(x + slant * top, top + 1e-6), rings, excluded));
        }
      }
    }
  }
  const basis = iconBasis(frame, orientation, slant);
  let iconDrawn = false;
  if (kind === 'disabled' && basis) {
    const candidates = [];
    for (let y = 1; y < 10; y += 1) {
      for (let x = 1; x < 10; x += 1) {
        candidates.push([xmin + (xmax - xmin) * x / 10, ymin + (ymax - ymin) * y / 10]);
      }
    }
    candidates.sort((a, b) => Math.hypot(...sub(a, center)) - Math.hypot(...sub(b, center)));
    for (const candidate of candidates) {
      const radius = Math.min(0.8, (xmax - xmin) / 6, (ymax - ymin) / 6);
      const icon = wheelchair(candidate, radius, basis);
      if (icon.flat().every((p) => inside(p, rings) && !excluded.some((f) => inside(p, f.coords)))) {
        segments.push(...icon.flatMap((line) => line.slice(1).map((p, i) => [line[i], p])));
        iconDrawn = true;
        break;
      }
    }
  }
  return {
    d: segments.map(([a, b]) => `M ${a.join(',')} L ${b.join(',')}`).join(' '),
    color: kind === 'disabled' ? '#1d4ed8' : kind === 'forbidden' ? '#b45309' : '#475569',
    dashed: kind === 'regular' && Boolean(orientation),
    description: JSON.stringify({
      kind, orientation, slant: sideDivision ? null : slant,
      sideSlants: sideDivision?.slants,
      divisionSource: sideDivision ? 'strip-side-edges' : frame?.slantSource || 'unknown',
      orientationSource: frame?.orientationSource || 'unknown',
      anchorId: frame?.anchorId, conflict: frame?.conflict || false,
      iconDrawn, iconBasis: iconDrawn ? basis : null,
      travelSource: orientation === 'parallel' ? frame?.travelSource : undefined,
      sourceCount: Number.isFinite(count) ? count : null,
      warning: 'Schematic parking division, not surveyed markings. Shared-strip orientation; uncertain icons omitted.'
    })
  };
}
