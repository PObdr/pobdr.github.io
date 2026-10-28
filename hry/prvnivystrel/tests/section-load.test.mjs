import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSectionLoads, teamsOnSection} from '../js/section-load-model.js';

const edges = [
  {from: 5, to: 8, fromName: 'A', toName: 'B', label: 'A → B'},
  {from: 8, to: 5, fromName: 'B', toName: 'A', label: 'B → A'}
];
const passage = (teamId, from, to, options = {}) => ({
  teamId,
  teamName: 'Tým ' + teamId,
  edge: 0,
  initial: false,
  from,
  to,
  seconds: to - from,
  ...options
});
const analyze = samples => analyzeSectionLoads(samples, edges)[0];

test('three overlapping passages produce exact peak and team lookup', () => {
  const section = analyze([passage(1, 0, 30), passage(2, 10, 45), passage(3, 20, 50)]);
  assert.equal(section.peakCount, 3);
  assert.deepEqual(section.peakRanges, [{from: 20, to: 30}]);
  assert.equal(section.activeSeconds, 50);
  assert.equal(section.teamSeconds, 95);
  assert.equal(section.averageActiveCount, 1.9);
  assert.deepEqual(teamsOnSection(section, 25).map(t => t.id), [1, 2, 3]);
  assert.deepEqual(teamsOnSection(section, 30).map(t => t.id), [2, 3]);
});

test('simultaneous departure and arrival do not create a false peak', () => {
  const section = analyze([passage(1, 0, 10), passage(2, 10, 20)]);
  assert.equal(section.peakCount, 1);
  assert.deepEqual(teamsOnSection(section, 10), [{id: 2, name: 'Tým 2'}]);
  assert.deepEqual(teamsOnSection(section, 20), []);
  assert.deepEqual(section.peakRanges, [{from: 0, to: 20}]);
});

test('idle gaps are visible but excluded from the active-time average', () => {
  const section = analyze([passage(1, 0, 10), passage(2, 20, 30)]);
  assert.equal(section.activeSeconds, 20);
  assert.equal(section.averageActiveCount, 1);
  assert.deepEqual(section.timeline, [
    {from: 0, to: 10, count: 1},
    {from: 10, to: 20, count: 0},
    {from: 20, to: 30, count: 1}
  ]);
  assert.deepEqual(section.peakRanges, [{from: 0, to: 10}, {from: 20, to: 30}]);
});

test('empty sections have null duration statistics and no invented activity', () => {
  const section = analyze([]);
  assert.equal(section.passageCount, 0);
  assert.equal(section.teamCount, 0);
  assert.deepEqual(section.duration, {min: null, q1: null, median: null, q3: null, max: null});
  assert.equal(section.peakCount, 0);
  assert.equal(section.averageActiveCount, null);
  assert.deepEqual(section.timeline, []);
  assert.deepEqual(section.peakRanges, []);
  assert.deepEqual(teamsOnSection(section, 0), []);
  assert.deepEqual(analyzeSectionLoads([], []), []);
});

test('zero-duration passages affect statistics but never occupancy', () => {
  const section = analyze([passage(1, 10, 10)]);
  assert.equal(section.passageCount, 1);
  assert.equal(section.duration.median, 0);
  assert.equal(section.peakCount, 0);
  assert.equal(section.activeSeconds, 0);
  assert.deepEqual(teamsOnSection(section, 10), []);
});

test('quartiles use documented linear interpolation', () => {
  const section = analyze([10, 20, 30, 40].map((d, i) => passage(i, 0, d)));
  assert.deepEqual(section.duration, {min: 10, q1: 17.5, median: 25, q3: 32.5, max: 40});
  assert.equal(analyze([passage(1, 0, 7)]).duration.q1, 7);
  assert.equal(analyze([10, 20, 30].map((d, i) => passage(i, 0, d))).duration.median, 20);
});

test('initial passages and different edges never inflate normal occupancy', () => {
  const result = analyzeSectionLoads([
    passage(1, 0, 10),
    passage(2, 0, 10, {initial: true}),
    passage(3, 0, 10, {edge: 1})
  ], edges);
  assert.equal(result.length, 4);
  assert.deepEqual(result.map(s => s.peakCount), [1, 1, 1, 0]);
  assert.equal(result[1].label, 'Nulté místo → B');
  assert.equal(result[1].fromStationId, null);
  assert.equal(result[1].toStationId, 8);
});

test('overlapping records for one team count the team only once', () => {
  const section = analyze([passage(1, 0, 20), passage(1, 10, 30), passage(2, 15, 25)]);
  assert.equal(section.passageCount, 3);
  assert.equal(section.teamCount, 2);
  assert.equal(section.peakCount, 2);
  assert.equal(section.teamSeconds, 40);
  assert.equal(teamsOnSection(section, 18).length, 2);
  assert.equal(teamsOnSection(section, 22).length, 2);
});

test('input order is irrelevant and inputs are never mutated', () => {
  const samples = [passage(2, 10, 20), passage(1, 0, 30)];
  const before = JSON.stringify({samples, edges});
  for (const sample of samples) Object.freeze(sample);
  Object.freeze(samples);
  const result = analyzeSectionLoads(samples, edges);
  assert.deepEqual(result, analyzeSectionLoads([...samples].reverse(), edges));
  assert.equal(JSON.stringify({samples, edges}), before);
  assert.notEqual(result[0].passages[0], samples[1]);
});

test('incomplete or malformed passages are rejected, never extended to game end', () => {
  const invalid = [
    null,
    passage(1, 0, 10, {to: undefined}),
    passage(1, 0, 10, {from: NaN}),
    passage(1, 0, 10, {to: Infinity}),
    passage(1, -1, 10),
    passage(1, 20, 10),
    passage(1, 0, 10, {edge: 2}),
    passage(1, 0, 10, {edge: -1}),
    passage(1, 0, 10, {teamId: null}),
    passage(1, 0, 10, {teamName: null}),
    passage(1, 0, 10, {initial: undefined}),
    passage(1, 0, 10, {seconds: 11})
  ];
  for (const sample of invalid) assert.throws(() => analyze([sample]));
  assert.throws(() => analyzeSectionLoads(null, edges));
  assert.throws(() => analyzeSectionLoads([], [null]));
  assert.throws(() => teamsOnSection(analyze([]), NaN));
});

test('fractional seconds and queries outside activity are supported', () => {
  const section = analyze([passage(1, 0.5, 2.5)]);
  assert.equal(section.teamSeconds, 2);
  assert.equal(teamsOnSection(section, 0.5).length, 1);
  assert.deepEqual(teamsOnSection(section, 0), []);
  assert.deepEqual(teamsOnSection(section, 2.5), []);
  assert.deepEqual(teamsOnSection(section, -1), []);
});

test('sweep agrees with a deterministic brute-force oracle', () => {
  let seed = 12345;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let trial = 0; trial < 50; trial++) {
    const samples = Array.from({length: 20}, () => {
      const from = random() % 30;
      return passage(random() % 8, from, from + random() % 15);
    });
    const section = analyze(samples);
    let peak = 0, activeSeconds = 0, teamSeconds = 0;
    for (let time = 0; time < 45; time++) {
      const ids = [...new Set(samples
        .filter(s => s.from <= time && time < s.to).map(s => s.teamId))]
        .sort((a, b) => a - b);
      assert.deepEqual(teamsOnSection(section, time).map(t => t.id), ids);
      const segment = section.timeline.find(s => s.from <= time && time < s.to);
      assert.equal(segment?.count ?? 0, ids.length);
      peak = Math.max(peak, ids.length);
      if (ids.length) activeSeconds++;
      teamSeconds += ids.length;
    }
    assert.equal(section.peakCount, peak);
    assert.equal(section.activeSeconds, activeSeconds);
    assert.equal(section.teamSeconds, teamSeconds);
  }
});
