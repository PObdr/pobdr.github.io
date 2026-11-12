import assert from 'node:assert/strict';
import { streetNameLabels } from './street-names.js';

const road = (id, name, coords, attrs = {}) => ({
  id, source: 'OSM', kind: 'line', attrs: { highway: 'residential', name, ...attrs },
  coords: [coords]
});
const raw = [
  road('1', 'Albertov', [[-100, 30], [300, 30]]),
  road('2', 'Albertov', [[20, 70], [180, 70]]),
  road('3', 'Na Slupi', [[30, 100], [170, 100]]),
  road('4', '<U & mostu>', [[20, 150], [180, 150]]),
  road('5', 'Mimo', [[-100, -20], [300, -20]]),
  road('6', 'Příliš krátká ulice', [[10, 10], [11, 10]]),
  { ...road('7', 'Neulice', [[20, 120], [180, 120]]), source: 'IPR linie' },
  road('8', 'Původní', [[20, 180], [180, 180]], { 'name:cs': 'Český název' })
];
const saved = JSON.stringify(raw);
const identity = [1, 0, 0, 1, 0, 0];
const labels = streetNameLabels(raw, 200, 200, identity, 2);
assert.equal(labels.filter((p) => p.name === 'Albertov').length, 1);
assert.ok(labels.some((p) => p.name === 'Na Slupi'));
assert.ok(labels.some((p) => p.name === '<U & mostu>'));
assert.ok(labels.some((p) => p.name === 'Český název'));
assert.ok(!labels.some((p) => ['Mimo', 'Neulice', 'Původní', 'Příliš krátká ulice'].includes(p.name)));
for (const matrix of [identity, [-1, 0, 0, -1, 200, 200], [0, 1, -1, 0, 200, 0]]) {
  const result = streetNameLabels(raw, 200, 200, matrix, 2);
  assert.ok(result.length >= 3);
  for (const label of result) {
    assert.ok(label.angle > -90 && label.angle <= 90);
    assert.ok(label.bounds[0] >= 0 && label.bounds[1] >= 0);
    assert.ok(label.bounds[2] <= 200 && label.bounds[3] <= 200);
  }
}
const collision = streetNameLabels([
  road('9', 'A', [[20, 40], [180, 40]]),
  road('10', 'B', [[20, 40], [180, 40]])
], 200, 200, identity, 2);
assert.equal(collision.length, 1);
assert.equal(JSON.stringify(raw), saved);
console.log(JSON.stringify({ status: 'passed', labels: labels.length, rotations: 3 }));
