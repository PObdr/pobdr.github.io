import assert from 'node:assert/strict';
import { fromWgs, toWgs, northAngle } from './jtsk.js';
import {
  rectangleFromThree, selectionToEN, enToSelection, selectionBoundary,
  selectionBbox, selectionMatrix, selectionNorthAngles, validateSelection
} from './selection.js';

const origin = fromWgs(14.42, 50.07);
let count = 0;
for (let degree = -180; degree <= 180; degree += 5) {
  const angle = degree * Math.PI / 180;
  const u = [Math.cos(angle), Math.sin(angle)];
  const n = [u[1], -u[0]];
  const b = origin.map((v, i) => v + 100 * u[i]);
  for (const side of [-1, 1]) {
    const c = b.map((v, i) => v + side * 60 * n[i] + 33 * u[i]);
    const value = rectangleFromThree(origin, b, c);
    assert.ok(Math.abs(value.width - 100) < 1e-8);
    assert.ok(Math.abs(value.height - 60) < 1e-8);
    const corners = selectionBoundary(value);
    for (const [i, p] of corners.entries()) {
      const q = corners[(i + 1) % 4];
      const r = corners[(i + 2) % 4];
      const dot = (q[0] - p[0]) * (r[0] - q[0]) + (q[1] - p[1]) * (r[1] - q[1]);
      assert.ok(Math.abs(dot) < 1e-6);
    }
    const local = [27.5, 19.25];
    const absolute = selectionToEN(value, local);
    const restored = enToSelection(value, absolute);
    assert.ok(Math.hypot(...restored.map((v, i) => v - local[i])) < 1e-8);
    const m = selectionMatrix(value, origin);
    const oldLocal = [absolute[0] - origin[0], origin[1] - absolute[1]];
    const page = [m[0] * oldLocal[0] + m[2] * oldLocal[1] + m[4],
      m[1] * oldLocal[0] + m[3] * oldLocal[1] + m[5]];
    assert.ok(Math.hypot(...page.map((v, i) => v - local[i])) < 1e-8);
    assert.ok(Math.abs(m[0] * m[3] - m[1] * m[2] - 1) < 1e-10);
    const box = selectionBbox(value);
    for (const p of selectionBoundary(value, 32)) {
      const [lon, lat] = toWgs(...p);
      assert.ok(lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3]);
    }
    const center = toWgs(...selectionToEN(value, [50, 30]));
    const trueEN = fromWgs(center[0], center[1] + 0.0001);
    const centerEN = fromWgs(...center);
    const a = enToSelection(value, centerEN);
    const z = enToSelection(value, trueEN);
    const observed = Math.atan2(z[0] - a[0], -(z[1] - a[1])) * 180 / Math.PI;
    const angles = selectionNorthAngles(value, northAngle(...center));
    const delta = ((observed - angles.true + 540) % 360) - 180;
    assert.ok(Math.abs(delta) < 1e-6);
    assert.deepEqual(validateSelection(JSON.parse(JSON.stringify(value))), value);
    count += 1;
  }
}
assert.throws(() => rectangleFromThree(origin, origin, origin));
assert.throws(() => rectangleFromThree(origin, [origin[0] + 4, origin[1]], [origin[0], origin[1] - 60]));
assert.throws(() => rectangleFromThree(origin, [origin[0] + 100, origin[1]], [origin[0], origin[1]]));
const valid = rectangleFromThree(origin, [origin[0] + 550, origin[1]], [origin[0], origin[1] - 550]);
assert.equal(valid.width, 550);
assert.equal(valid.height, 550);
assert.throws(() => validateSelection({ ...valid, axisY: [0, 1] }));
console.log(JSON.stringify({ orientationsAndSides: count, status: 'passed' }));
