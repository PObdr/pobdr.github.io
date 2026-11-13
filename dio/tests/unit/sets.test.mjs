import assert from 'node:assert/strict';
import { SETS, selectedSets, selectedFeatures, setOf } from '../../src/core/sets.js';
import { exportSets } from '../../src/export/set-export.js';

const feature = (id, category, source = 'OSM', attrs = {}) => ({
  id, category, source, attrs, kind: 'point', coords: [5, 5]
});
const raw = [
  feature('lamp', 'Lampy', 'THMP'),
  feature('number', 'Čísla lamp', 'THMP', { lamp_number: '202298' }),
  feature('tree', 'Stromy'),
  feature('building', 'Budovy OSM'),
  feature('hidden', 'Zakryté a podzemní / test')
];
assert.equal(new Set(SETS.map((s) => s.id)).size, 5);
assert.deepEqual(selectedSets(['equipment', 'equipment', 'bad']), ['base', 'equipment']);
assert.equal(setOf(feature('hedge', 'Živé ploty')), 'vegetation');
assert.equal(setOf(feature('wall', 'Opěrné zdi')), 'terrain');
assert.equal(setOf(feature('platform', 'Nástupiště')), 'transport');
assert.equal(setOf(feature('grass', 'Plochy / zeleň', 'IPR plochy', { CTVUK_KOD: 401 })), 'vegetation');
assert.deepEqual(selectedFeatures(raw, ['equipment']).map((f) => f.id), ['lamp', 'number', 'building']);
const data = { bbox: [14, 50, 14.001, 50.001], raw, date: '2026-11-12', errors: [], visibility: {}, decisions: {} };
const svg = exportSets(data, { sets: ['equipment'] });
assert.ok(svg.includes('inkscape:label="Vybavení ulice"'));
assert.ok(svg.includes('inkscape:label="Osvětlení"'));
assert.ok(svg.includes('inkscape:label="Čísla lamp"'));
assert.ok(!svg.includes('data-object="tree"'));
assert.ok(!svg.includes('data-object="hidden"'));
assert.ok(!svg.includes('Kontrola /'));
const extended = exportSets(data, { sets: SETS.map((s) => s.id), controls: true });
assert.ok(extended.includes('data-object="tree"'));
assert.ok(extended.includes('inkscape:label="Kontrola – původní zdroje" style="display:none"'));
assert.ok(!extended.includes('data-object="hidden"'));
const diagnostic = exportSets(data, { sets: ['base'], diagnostic: true });
assert.ok(diagnostic.includes('data-object="hidden"'));
console.log('Set selection and export assertions passed');
