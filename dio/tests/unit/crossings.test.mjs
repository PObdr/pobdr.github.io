import assert from 'node:assert/strict';
import { markedCrossing, crossingDrawing } from '../../src/crossings/crossings.js';
import { classify, visibleByDefault } from '../../src/core/model.js';

const point = (attrs) => ({
  id: 'point', source: 'OSM', kind: 'point', coords: [10, 10],
  attrs: { highway: 'crossing', ...attrs }
});
const line = (attrs = {}) => ({
  id: 'line', source: 'OSM', kind: 'line', coords: [[[10, 5], [10, 15]]],
  attrs: { highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra', ...attrs }
});
for (const attrs of [{}, {crossing:'unmarked'}, {crossing:'traffic_signals'},
  {crossing:'no'}, {'crossing:markings':'no',crossing:'marked'}]) {
  assert.equal(markedCrossing(point(attrs).attrs),false);
  assert.equal(crossingDrawing(point(attrs),[]),'');
}
for (const attrs of [{crossing:'marked'}, {crossing:'uncontrolled'},
  {'crossing:markings':'zebra'}, {'crossing:markings':'yes'}, {crossing_ref:'zebra'}]) {
  assert.equal(markedCrossing(point(attrs).attrs),true);
}
assert.equal(crossingDrawing(point({crossing:'marked'}),[]),'');
assert.equal(crossingDrawing(point({crossing:'marked'}),[line()]),'');
const drawing = crossingDrawing(line(),[]);
assert.ok(drawing.includes('<path'));
assert.ok(drawing.includes(' Z'));
assert.ok(!drawing.includes('<circle'));
assert.equal(crossingDrawing(line({'crossing:markings':'no'}),[]),'');
const road = {id:'road',source:'OSM',kind:'line',coords:[[[0,10],[20,10]]],attrs:{highway:'residential',width:'6 m'}};
assert.ok(crossingDrawing(point({crossing:'marked'}),[road]).includes('<path'));
assert.equal(crossingDrawing(point({crossing:'marked'}),[{...road,attrs:{highway:'residential'}}]),'');
assert.equal(crossingDrawing(road,[]),null);
assert.equal(markedCrossing({...point({crossing:'marked'}).attrs,foot:'no'}),false);
for (const kind of ['residential', 'footway', 'crossing', 'service']) {
  assert.equal(visibleByDefault(`Komunikace OSM / ${kind}`), false);
}
assert.equal(visibleByDefault('Přechody OSM – doložené značení'), true);
assert.equal(classify('OSM', point({crossing:'marked'}).attrs, 'point'),
  'Přechody OSM – doložené značení');
assert.equal(classify('OSM', point({crossing:'unmarked'}).attrs, 'point'),
  'Komunikace OSM / crossing');
console.log(JSON.stringify({status:'passed'}));
