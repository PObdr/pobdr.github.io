const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const unit = (v) => {
  const length = Math.hypot(...v);
  return length > 1e-8 ? v.map((x) => x / length) : null;
};
const canonical = (u) => u[0] < -1e-8 || (Math.abs(u[0]) <= 1e-8 && u[1] < 0) ? u.map((x) => -x) : u;

function center(feature) {
  const points = feature.coords.flat();
  return [0, 1].map((i) => (Math.min(...points.map((p) => p[i])) + Math.max(...points.map((p) => p[i]))) / 2);
}

function nearest(point, a, b) {
  const d = sub(b, a);
  const length2 = dot(d, d);
  const t = length2 > 0 ? Math.max(0, Math.min(1, dot(sub(point, a), d) / length2)) : 0;
  const q = a.map((v, i) => v + t * d[i]);
  return { point: q, distance: Math.hypot(...sub(q, point)), direction: unit(d) };
}

const roadCaches = new WeakMap();

function roadFrame(feature, raw) {
  if (!roadCaches.has(raw)) roadCaches.set(raw, new Map());
  const cache = roadCaches.get(raw);
  if (cache.has(feature.id)) return cache.get(feature.id);
  const c = center(feature);
  let best;
  for (const f of raw) {
    if (f.source !== 'OSM' || f.kind !== 'line' || !f.attrs?.highway ||
        ['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'crossing'].includes(f.attrs.highway)) continue;
    for (const line of f.coords) {
      for (let i = 1; i < line.length; i += 1) {
        const candidate = nearest(c, line[i - 1], line[i]);
        if (candidate.direction && candidate.distance <= 30 && (!best || candidate.distance < best.distance)) {
          best = { ...candidate, road: f };
        }
      }
    }
  }
  if (!best) {
    cache.set(feature.id, null);
    return null;
  }
  const u = canonical(best.direction);
  const n = [-u[1], u[0]];
  const result = { ...best, center: c, u, side: Math.sign(dot(sub(c, best.point), n)) };
  cache.set(feature.id, result);
  return result;
}

function near(a, b) {
  for (const [first, second] of [[a, b], [b, a]]) {
    for (const p of first.coords.flat()) {
      for (const ring of second.coords) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          if (nearest(p, ring[j], ring[i]).distance <= 1.5) return true;
        }
      }
    }
  }
  return false;
}

function sameStrip(a, b, raw) {
  const first = roadFrame(a, raw);
  const second = roadFrame(b, raw);
  if (!first || !second || first.side === 0 || first.side !== second.side ||
      dot(first.u, second.u) < 0.98) return false;
  const sameRoad = first.road.id === second.road.id ||
    (first.road.attrs.name && first.road.attrs.name === second.road.attrs.name);
  if (!sameRoad) return false;
  const zoneA = a.attrs?.ZPS_ID;
  const zoneB = b.attrs?.ZPS_ID;
  if (zoneA && zoneB && String(zoneA) !== String(zoneB)) return false;
  return near(a, b);
}

function bayAxis(feature) {
  const points = feature.coords.flat();
  let best;
  for (const ring of feature.coords) {
    for (let i = 1; i < ring.length; i += 1) {
      const u = unit(sub(ring[i], ring[i - 1]));
      if (!u) continue;
      const n = [-u[1], u[0]];
      const x = points.map((p) => dot(sub(p, points[0]), u));
      const y = points.map((p) => dot(sub(p, points[0]), n));
      const w = Math.max(...x) - Math.min(...x);
      const h = Math.max(...y) - Math.min(...y);
      if (!best || w * h < best.area) {
        best = { area: w * h, length: Math.max(w, h), width: Math.min(w, h), axis: w >= h ? u : n };
      }
    }
  }
  return best && best.length >= 3 && best.length <= 8 && best.width >= 1.5 &&
    best.width <= 4.5 && best.length / best.width >= 1.35 ? best.axis : null;
}

function schematicSlant(frame) {
  const oneway = String(frame.road.attrs.oneway || '').toLowerCase();
  if (!['yes', '1', 'true', '-1'].includes(oneway)) return 1;
  const travel = frame.direction.map((v) => v * (oneway === '-1' ? -1 : 1));
  // Head-in schematic bays point forward from the road into either roadside.
  // Measured single-bay geometry remains stronger evidence than this assumption.
  return frame.side * Math.sign(dot(travel, frame.u)) || 1;
}

function evidence(feature, raw, kindOf) {
  const frame = roadFrame(feature, raw);
  if (!frame) return null;
  const orientation = feature.attrs?.orientation;
  if (['parallel', 'perpendicular', 'diagonal'].includes(orientation)) {
    return { orientation, slant: orientation === 'diagonal' ? schematicSlant(frame) : 0, rank: 2, id: feature.id, source: 'explicit-orientation' };
  }
  if (kindOf(feature) === 'regular' && feature.source === 'TSK úseky stání' && feature.coords.length === 1) {
    const ring = feature.coords[0];
    const projected = ring.map((p) => dot(sub(p, ring[0]), frame.u));
    const length = Math.max(...projected) - Math.min(...projected);
    const area = Math.abs(ring.reduce((sum, p, i) => {
      const a = sub(p, ring[0]);
      const b = sub(ring[(i + 1) % ring.length], ring[0]);
      return sum + a[0] * b[1] - a[1] * b[0];
    }, 0)) / 2;
    const depth = area / (length || 1);
    const count = Number(feature.attrs?.PS_ZPS);
    const per = length / count;
    const type = depth >= 4.9 ? 'perpendicular' : depth < 3 ? 'parallel' :
      count < 2 ? (depth >= 4 ? 'diagonal' : null) :
      depth >= 4 ? (per >= 3.4 ? 'diagonal' : 'perpendicular') :
      per >= 4.8 ? 'parallel' : per >= 3.4 ? 'diagonal' : 'perpendicular';
    return type ? { orientation: type, slant: type === 'diagonal' ? schematicSlant(frame) : 0,
      rank: 0, id: feature.id, source: 'inferred-from-TSK-geometry-and-count' } : null;
  }

  // Only a single reserved bay may reveal a vehicle axis; never use a two-bay block.
  const single = Number(feature.attrs?.POCINVST || feature.attrs?.capacity) === 1 ||
    (feature.source.startsWith('TSK ZTP 5') && !feature.attrs?.POCINVST);
  if (kindOf(feature) !== 'disabled' || !single) return null;
  const axis = bayAxis(feature);
  if (!axis) return null;
  const normal = [-frame.u[1], frame.u[0]];
  const across = dot(axis, normal);
  const along = dot(axis, frame.u);
  const angle = Math.atan2(Math.abs(across), Math.abs(along)) * 180 / Math.PI;
  const type = angle < 20 ? 'parallel' : angle > 75 ? 'perpendicular' : 'diagonal';
  return { orientation: type, slant: type === 'diagonal' ? along / across : 0,
    rank: 1, id: feature.id, source: 'single-reserved-bay-geometry' };
}

export function parkingFrame(feature, raw, kindOf) {
  const frame = roadFrame(feature, raw);
  if (!frame) return null;
  const members = [feature];
  const candidates = raw.filter((f) => f.id !== feature.id && ['regular', 'disabled'].includes(kindOf(f)));
  for (let i = 0; i < members.length; i += 1) {
    for (let j = candidates.length - 1; j >= 0; j -= 1) {
      if (sameStrip(members[i], candidates[j], raw)) members.push(...candidates.splice(j, 1));
    }
  }
  const hints = members.map((f) => evidence(f, raw, kindOf)).filter(Boolean);
  const rank = Math.max(0, ...hints.map((h) => h.rank));
  const strongest = hints.filter((h) => h.rank === rank);
  const first = strongest[0];
  const conflict = strongest.some((h) => h.orientation !== first.orientation ||
    (h.orientation === 'diagonal' && Math.abs(h.slant - first.slant) > 0.4));
  let hint = conflict ? null : first;
  if (hint?.source === 'explicit-orientation' && hint.orientation === 'diagonal') {
    const geometry = hints.filter((h) => h.source === 'single-reserved-bay-geometry' &&
      h.orientation === 'diagonal');
    if (geometry.length && geometry.every((h) => Math.abs(h.slant - geometry[0].slant) <= 0.4)) {
      hint = { ...hint, slant: geometry[0].slant, slantSource: geometry[0].source };
    }
  }
  const n = [-frame.u[1], frame.u[0]];
  const toRoad = unit(sub(frame.point, frame.center));
  let travel;
  let travelSource;
  const oneway = String(frame.road.attrs.oneway || '').toLowerCase();
  if (['yes', '1', 'true', '-1'].includes(oneway)) {
    travel = frame.direction.map((v) => v * (oneway === '-1' ? -1 : 1));
    travelSource = 'OSM oneway';
  } else if (['', 'no', '0', 'false'].includes(oneway)) {
    // Right-hand traffic assumption, not a surveyed direction of an individual parked car.
    const right = [-frame.direction[1], frame.direction[0]];
    const sign = dot(sub(frame.center, frame.point), right) >= 0 ? 1 : -1;
    travel = frame.direction.map((v) => v * sign);
    travelSource = 'assumed-right-hand-traffic';
  }
  const orientation = hint?.orientation || null;
  const slant = hint?.slant || 0;
  let vehicle = orientation === 'parallel' ? frame.u : unit([
    n[0] + frame.u[0] * slant, n[1] + frame.u[1] * slant
  ]);
  if (vehicle && toRoad && dot(vehicle, toRoad) < 0) vehicle = vehicle.map((v) => -v);
  return { ...frame, toRoad, travel, travelSource, orientation, slant, vehicle,
    orientationSource: hint?.source, slantSource: hint?.slantSource || hint?.source,
    anchorId: hint?.id, conflict };
}

export function iconBasis(frame, orientation, slant = 0) {
  if (!frame) return null;
  let down;
  if (orientation === 'parallel') {
    if (!frame.travel) return null;
    down = frame.travel.map((v) => -v);
  } else if (orientation === 'perpendicular' || orientation === 'diagonal') {
    if (!frame.toRoad) return null;
    const n = [-frame.u[1], frame.u[0]];
    down = unit([n[0] + frame.u[0] * slant, n[1] + frame.u[1] * slant]);
    if (dot(down, frame.toRoad) < 0) down = down.map((v) => -v);
  } else return null;
  return { x: [down[1], -down[0]], y: down };
}
