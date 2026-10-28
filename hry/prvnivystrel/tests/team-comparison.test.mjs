import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSectionTimes} from '../js/team-comparison-model.js';

const edges = [
  {from: 5, to: 8, label: 'A → B', toName: 'B'},
  {from: 8, to: 9, label: 'B → C', toName: 'C'},
  {from: 9, to: 5, label: 'C → A', toName: 'A'}
];
const passage = (teamId, edge, seconds, from = 0, initial = false) => ({
  teamId, edge, seconds, from, to: from + seconds, initial
});
const samples = [
  passage(1, 0, 10), passage(2, 0, 20), passage(3, 0, 90),
  passage(1, 1, 50), passage(2, 1, 30), passage(3, 1, 40),
  passage(1, 2, 15), passage(3, 2, 25)
];
const compare = (teamIds, options = {}) => compareSectionTimes(samples, edges, {teamIds, ...options});

test('negative delta is a gain and positive delta is a loss', () => {
  const result = compare([1, 2]);
  assert.equal(result.rows[0].baselineSeconds, 20);
  assert.deepEqual(result.rows[0].cells.map(c => c.deltaSeconds), [-10, 0]);
  assert.deepEqual(result.rows[1].cells.map(c => c.deltaSeconds), [10, -10]);
  assert.equal(result.rows[0].baselineTeamCount, 3);
});

test('population median never changes with selected teams', () => {
  const first = compare([1]);
  const second = compare([1, 2, 3]);
  assert.deepEqual(first.rows.map(r => r.baselineSeconds), second.rows.map(r => r.baselineSeconds));
  assert.equal(first.rows[0].cells[0].deltaSeconds, second.rows[0].cells[0].deltaSeconds);
});

test('totals use only edges completed by every selected team', () => {
  const result = compare([1, 2]);
  assert.deepEqual(result.commonEdgeIndexes, [0, 1]);
  assert.equal(result.commonBaselineSeconds, 60);
  assert.deepEqual(result.totals.map(t => t.seconds), [60, 50]);
  assert.deepEqual(result.totals.map(t => t.deltaSeconds), [0, -10]);
  assert.equal(result.rows[2].cells[1].seconds, null);
  assert.equal(result.rows[2].cells[1].deltaSeconds, null);
});

test('reference comparison uses the same physical edge and preserves signs', () => {
  const result = compare([1, 2, 3], {referenceTeamId: 2});
  assert.deepEqual(result.rows[0].cells.map(c => c.deltaSeconds), [-10, 0, 70]);
  assert.deepEqual(result.rows[1].cells.map(c => c.deltaSeconds), [20, 0, 10]);
  assert.equal(result.rows[2].baselineSeconds, null);
  assert.ok(result.rows[2].cells.every(c => c.deltaSeconds === null));
  assert.deepEqual(result.commonEdgeIndexes, [0, 1]);
  assert.equal(result.totals[1].deltaSeconds, 0);
});

test('different start times do not shift route-edge comparisons', () => {
  const data = [passage(1, 0, 30, 100), passage(2, 1, 50, 0), passage(2, 0, 40, 500)];
  const result = compareSectionTimes(data, edges, {teamIds: [1, 2], referenceTeamId: 2});
  assert.equal(result.rows[0].cells[0].deltaSeconds, -10);
  assert.equal(result.rows[1].cells[0].seconds, null);
  assert.deepEqual(result.commonEdgeIndexes, [0]);
});

test('initial passages are separate from ordinary route edges', () => {
  const data = [passage(1, 0, 100), passage(2, 0, 200), passage(1, 0, 10, 0, true)];
  const normal = compareSectionTimes(data, edges, {teamIds: [1, 2]});
  const initial = compareSectionTimes(data, edges, {teamIds: [1, 2], initial: true});
  assert.equal(normal.rows[0].baselineSeconds, 150);
  assert.equal(initial.rows[0].baselineSeconds, 10);
  assert.equal(initial.rows[0].label, 'Nulté místo → B');
  assert.equal(initial.rows[0].fromStationId, null);
  assert.equal(initial.rows[0].cells[1].seconds, null);
});

test('empty and missing data never become fabricated zero totals', () => {
  const result = compareSectionTimes([], edges, {teamIds: [1, 2]});
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[0].baselineSeconds, null);
  assert.equal(result.commonBaselineSeconds, null);
  assert.deepEqual(result.commonEdgeIndexes, []);
  assert.ok(result.totals.every(t => t.seconds === null && t.deltaSeconds === null));
  assert.ok(result.totals.every(t => t.bestGain === null && t.worstLoss === null));
  assert.deepEqual(compareSectionTimes([], [], {}).totals, []);
  assert.deepEqual(compare([]).commonEdgeIndexes, []);
});

test('valid zero-duration passages remain valid data', () => {
  const result = compareSectionTimes([passage(1, 0, 0), passage(2, 0, 10)], edges, {teamIds: [1, 2]});
  assert.equal(result.rows[0].baselineSeconds, 5);
  assert.equal(result.rows[0].cells[0].seconds, 0);
  assert.equal(result.rows[0].cells[0].deltaSeconds, -5);
  assert.equal(result.totals[0].seconds, 0);
});

test('repeated passages use team medians without overweighting that team', () => {
  const data = [passage(1, 0, 10), passage(1, 0, 20), passage(1, 0, 90), passage(2, 0, 100)];
  const result = compareSectionTimes(data, edges, {teamIds: [1, 2]});
  assert.equal(result.rows[0].cells[0].seconds, 20);
  assert.equal(result.rows[0].cells[0].passageCount, 3);
  assert.equal(result.rows[0].baselineSeconds, 60);
  assert.equal(result.rows[0].populationTeamCount, 2);
});

test('best gains and worst losses are genuine signed extrema', () => {
  const result = compare([1, 2]);
  assert.equal(result.totals[0].bestGain.edge, 0);
  assert.equal(result.totals[0].bestGain.deltaSeconds, -10);
  assert.equal(result.totals[0].worstLoss.edge, 1);
  assert.equal(result.totals[1].worstLoss, null);
  assert.equal(result.totals[0].comparableCount, 3);
  assert.equal(result.totals[1].comparableCount, 2);
});

test('ordering and frozen inputs do not affect results or mutate data', () => {
  const data = samples.map(s => Object.freeze({...s}));
  Object.freeze(data);
  const teamIds = Object.freeze([3, 1]);
  const before = JSON.stringify({data, teamIds, edges});
  const result = compareSectionTimes(data, edges, {teamIds});
  assert.deepEqual(result, compareSectionTimes([...data].reverse(), edges, {teamIds}));
  assert.deepEqual(result.rows[0].cells.map(c => c.teamId), [3, 1]);
  assert.equal(JSON.stringify({data, teamIds, edges}), before);
});

test('invalid selections, references and incomplete passages are rejected', () => {
  for (const teamIds of [[1, 1], [1, 2, 3, 4, 5], [-1], ['1'], null]) {
    assert.throws(() => compare(teamIds));
  }
  assert.throws(() => compare([1], {referenceTeamId: 2}));
  assert.throws(() => compare([1], {initial: 'yes'}));
  assert.throws(() => compareSectionTimes(null, edges));
  assert.throws(() => compareSectionTimes([], [null]));
  for (const bad of [
    null,
    {...samples[0], edge: 99},
    {...samples[0], teamId: null},
    {...samples[0], initial: null},
    {...samples[0], from: -1},
    {...samples[0], to: undefined},
    {...samples[0], to: Infinity},
    {...samples[0], from: 20, to: 10},
    {...samples[0], seconds: 999}
  ]) {
    assert.throws(() => compareSectionTimes([bad], edges, {teamIds: [1]}));
  }
});
