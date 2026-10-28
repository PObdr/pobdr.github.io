import {dist} from './utils.js';

export function near(active, radius) {
  const hits = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const d = dist(active[i].p, active[j].p);
      if (d <= radius) hits.push({a: active[i].t, b: active[j].t, d});
    }
  }

  return hits;
}

export function encounters(teams, radius) {
  const hits = [];

  for (let u = 0; u < teams.length; u++) {
    for (let v = u + 1; v < teams.length; v++) {
      const a = teams[u], b = teams[v];
      let i = 0, j = 0, last = null;

      while (i < a.points.length - 1 && j < b.points.length - 1) {
        const p = a.points[i], q = a.points[i + 1],
          r = b.points[j], s = b.points[j + 1],
          l = Math.max(p.time, r.time), h = Math.min(q.time, s.time);

        if (h > l) {
          const xy = (p, q, t) => {
            const f = (t - p.time) / (q.time - p.time);
            return [
              (p.lon + (q.lon - p.lon) * f) * 71350,
              (p.lat + (q.lat - p.lat) * f) * 111195
            ];
          },
            A = xy(p, q, l), B = xy(r, s, l),
            C = xy(p, q, h), D = xy(r, s, h),
            x = A[0] - B[0], y = A[1] - B[1],
            dx = C[0] - D[0] - x, dy = C[1] - D[1] - y,
            aa = dx * dx + dy * dy,
            bb = 2 * (x * dx + y * dy),
            cc = x * x + y * y - radius * radius,
            disc = bb * bb - 4 * aa * cc;
          let low = 0, high = 1, ok = false;

          if (aa < 1e-12) {
            ok = cc <= 0;
          } else if (disc >= 0) {
            low = Math.max(0, (-bb - Math.sqrt(disc)) / (2 * aa));
            high = Math.min(1, (-bb + Math.sqrt(disc)) / (2 * aa));
            ok = low <= high;
          }

          if (ok) {
            const start = l + low * (h - l), end = l + high * (h - l),
              f = aa ? Math.max(low, Math.min(high, -bb / (2 * aa))) : 0,
              d = Math.hypot(x + dx * f, y + dy * f),
              gap = Math.max(q.time - p.time, s.time - r.time);

            if (last && start <= last.end + 1) {
              last.end = end;
              last.d = Math.min(last.d, d);
              last.gap = Math.max(last.gap, gap);
            } else {
              last = {a: a.name, b: b.name, start, end, d, gap};
              hits.push(last);
            }
          }
        }

        if (q.time <= s.time) i++;
        else j++;
      }
    }
  }

  return hits.sort((a, b) => a.start - b.start);
}
