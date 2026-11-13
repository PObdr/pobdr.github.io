import assert from 'node:assert/strict';
import { northUpSelection } from '../../src/geometry/north-up.js';

function corner(selection, x, y) {
  return selection.origin.map((value, i) =>
    value + x * selection.axisX[i] + y * selection.axisY[i]);
}

let cases = 0;
for (let degrees = -180; degrees <= 180; degrees += 1) {
  for (const bearing of [-15, 0, 8, 15]) {
    const angle = degrees * Math.PI / 180;
    const selection = {
      version: 1,
      crs: 'EPSG:5514',
      origin: [-743000, -1045000],
      axisX: [Math.cos(angle), Math.sin(angle)],
      axisY: [Math.sin(angle), -Math.cos(angle)],
      width: 100,
      height: 60
    };
    const saved = JSON.stringify(selection);
    const actual = northUpSelection(selection, bearing);
    const north = Math.atan2(actual.axisX[1], -actual.axisY[1]) +
      bearing * Math.PI / 180;
    assert.ok(Math.cos(north) >= -1e-12);
    if (Math.abs(Math.cos(north)) <= 1e-12) {
      assert.ok(Math.sin(north) > 0);
    }
    assert.equal(actual.width, selection.width);
    assert.equal(actual.height, selection.height);
    const corners = [[0, 0], [100, 0], [100, 60], [0, 60]];
    const old = corners.map(([x, y]) => corner(selection, x, y));
    for (const [x, y] of corners) {
      const p = corner(actual, x, y);
      assert.ok(old.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-8));
    }
    assert.equal(JSON.stringify(selection), saved);
    assert.equal(northUpSelection(actual, bearing), actual);
    const determinant = actual.axisX[0] * actual.axisY[1] -
      actual.axisX[1] * actual.axisY[0];
    assert.ok(Math.abs(determinant + 1) < 1e-12);
    cases += 1;
  }
}
assert.throws(() => northUpSelection({}, Infinity));
console.log(JSON.stringify({ cases, status: 'passed' }));
