import assert from 'node:assert/strict';
import { fromWgs, toWgs, jtskFrame, northAngle } from './jtsk.js';
import { mercator, createPreviewProjection, projectPath, gridAngleOnMap } from './preview-projection.js';
import { rose } from './rose.js';

const bbox = [14.42, 50.066, 14.425, 50.069];
const saved = [...bbox];
const grid = jtskFrame(bbox);
const p = createPreviewProjection(bbox);
assert.deepEqual(bbox, saved);
assert.equal(p.boundary.length, 32);
for (const point of p.boundary) {
  assert.ok(point[0] >= -0.001 && point[0] <= p.width + 0.001);
  assert.ok(point[1] >= -0.001 && point[1] <= p.height + 0.001);
}
const original = [100, 200];
const actual = p.point(original);
const absolute = mercator(...toWgs(grid.left + 100, grid.top - 200));
assert.ok(Math.hypot(actual[0] + p.left - absolute[0], p.top - actual[1] - absolute[1]) < 0.001);
assert.deepEqual(original, [100, 200]);
const d = projectPath('M 100,200 L 150,250 Z', p.point);
assert.ok(d.startsWith(`M ${actual.join(' ')}`));
assert.ok(d.endsWith(' Z'));
assert.throws(() => projectPath('M 0 0 H 10', p.point));
const matrix = p.matrix(100, 200);
assert.ok(matrix[0] * matrix[3] - matrix[1] * matrix[2] > 0);
const en = fromWgs(14.42, 50.07);
const a = mercator(...toWgs(...en));
const b = mercator(...toWgs(en[0], en[1] + 10));
const gridAngle = Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
assert.ok(Math.abs(gridAngle - gridAngleOnMap(14.42, 50.07)) < .00001);
assert.ok(Math.abs(gridAngle + northAngle(14.42, 50.07)) < .1);
const artwork = rose(0, 44, gridAngle);
assert.ok(artwork.includes('aria-label="S"'));
assert.ok(artwork.includes('aria-label="JTSK"'));
assert.ok(!artwork.includes('NaN'));
assert.throws(() => rose(Infinity, 44));
console.log('Preview projection, vertices, orientation and extracted rose passed');
