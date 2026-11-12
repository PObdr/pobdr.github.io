export function isCrossing(attrs = {}) {
  return attrs.highway === 'crossing' ||
    (['footway', 'path', 'pedestrian'].includes(attrs.highway) &&
      (attrs.footway === 'crossing' || attrs.path === 'crossing'));
}

export function markedCrossing(attrs = {}) {
  if (!isCrossing(attrs) || attrs.foot === 'no' ||
      ['no', 'unmarked'].includes(attrs.crossing) || attrs['crossing:markings'] === 'no') {
    return false;
  }
  const markings = attrs['crossing:markings'];
  if (markings) {
    return /^(yes|zebra(?::[a-z_]+)*|ladder|lines)$/.test(markings);
  }
  return ['marked', 'uncontrolled', 'zebra'].includes(attrs.crossing) ||
    attrs.crossing_ref === 'zebra';
}

function metres(value) {
  const match = /^(\d+(?:[.,]\d+)?)\s*(?:m)?$/.exec(String(value ?? '').trim());
  return match ? Number(match[1].replace(',', '.')) : NaN;
}

function nearest(point, raw, predicate) {
  let best;
  for (const feature of raw) {
    if (feature.kind !== 'line' || !predicate(feature)) continue;
    for (const line of feature.coords) {
      for (let i = 1; i < line.length; i += 1) {
        const a = line[i - 1];
        const b = line[i];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy);
        if (length < 0.01) continue;
        const t = Math.max(0, Math.min(1,
          ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length ** 2));
        const distance = Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
        if (!best || distance < best.distance) {
          best = { distance, direction: [dx / length, dy / length], feature };
        }
      }
    }
  }
  return best;
}

export function crossingDrawing(feature, raw) {
  if (feature.source !== 'OSM' || !isCrossing(feature.attrs)) return null;
  if (!markedCrossing(feature.attrs)) return '';
  let lines = feature.kind === 'line' ? feature.coords : [];
  if (feature.kind === 'point') {
    const duplicate = nearest(feature.coords, raw,
      (other) => other.source === 'OSM' && markedCrossing(other.attrs));
    if (duplicate && duplicate.distance <= 2) return '';
    const road = nearest(feature.coords, raw, (other) =>
      other.source === 'OSM' && other.attrs?.highway &&
      !['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'crossing'].includes(other.attrs.highway));
    const length = metres(road?.feature.attrs.width);
    if (!road || road.distance > 2 || !Number.isFinite(length) || length < 2 || length > 40) {
      return '';
    }
    const normal = [-road.direction[1], road.direction[0]];
    lines = [[
      feature.coords.map((v, i) => v - normal[i] * length / 2),
      feature.coords.map((v, i) => v + normal[i] * length / 2)
    ]];
  }
  const suppliedWidth = metres(feature.attrs.width);
  const width = suppliedWidth >= 1 && suppliedWidth <= 12 ? suppliedWidth : 3;
  const polygons = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1];
      const b = line[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 0.1 || length > 100) continue;
      const u = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
      const n = [-u[1], u[0]];
      for (let start = 0; start < length; start += 1) {
        const end = Math.min(start + 0.5, length);
        const points = [[start, -width / 2], [end, -width / 2],
          [end, width / 2], [start, width / 2]].map(([x, y]) =>
          [a[0] + x * u[0] + y * n[0], a[1] + x * u[1] + y * n[1]]);
        polygons.push(`M ${points.map((p) => p.join(',')).join(' L ')} Z`);
      }
    }
  }
  if (!polygons.length) return '';
  return `<path d="${polygons.join(' ')}" fill="#ffffff" stroke="#64748b" stroke-width="0.08"><desc>Schematické značení přechodu OSM; není zaměření. Šířka pruhů a mezery jsou schematické, šířka přechodu je při chybějícím údaji 3 m.</desc></path>`;
}
