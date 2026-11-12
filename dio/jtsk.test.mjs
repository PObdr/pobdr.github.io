import assert from 'node:assert/strict';
import { fromWgs, toWgs, jtskFrame, projectDataset, northAngle } from './jtsk.js';

const xy = [-743520.94, -1042472.46];
const ll = toWgs(...xy);
const back = fromWgs(...ll);
assert.ok(Math.hypot(back[0] - xy[0], back[1] - xy[1]) < 0.001);
assert.throws(() => fromWgs(0, 0));
const bbox = [14.42, 50.066, 14.425, 50.069];
const f = jtskFrame(bbox);
for (const lon of [bbox[0], bbox[2]]) {
  for (const lat of [bbox[1], bbox[3]]) {
    const p = f.project([lon, lat]);
    assert.ok(p[0] >= -0.001 && p[0] <= f.width + 0.001);
    assert.ok(p[1] >= -0.001 && p[1] <= f.height + 0.001);
  }
}
const old = { version: 2, bbox, raw: [{ id: 'point', kind: 'point', coords: [0, 0] }] };
const converted = projectDataset(old);
assert.equal(converted.crs, 'EPSG:5514');
assert.equal(converted.version, 3);
assert.deepEqual(converted.raw[0].coords, f.project([bbox[0], bbox[3]]));
assert.equal(projectDataset(converted), converted);
assert.equal(old.version, 2);
assert.throws(() => projectDataset({ ...converted, origin: [0, 0] }));
assert.ok(Number.isFinite(northAngle(14.42, 50.07)));

for (const [lon, lat, e, n] of [[14.42, 50.07, -743163.4106532986, -1044924.9785218363], [16.61, 49.2, -597958.394949633, -1160228.013873718], [12.4, 50.0, -887401.4163907798, -1030955.4194619773]]) {
  const actual = fromWgs(lon, lat);
  assert.ok(Math.hypot(actual[0] - e, actual[1] - n) < 0.005);
}

console.log('JTSK round-trip, PROJ references, frame, migration and orientation passed');
