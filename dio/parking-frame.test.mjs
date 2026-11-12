import assert from 'node:assert/strict';
import { parkingFrame, iconBasis } from './parking-frame.js';
import { parkingKind, parkingDrawing } from './parking.js';

const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const box = (id, x, y, w, h, source, attrs = {}) => ({
  id, source, kind: 'area', attrs: { ZPS_ID: 'row', ...attrs },
  coords: [[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]]
});
const road = (oneway = 'no') => ({
  id: 'road', source: 'OSM', kind: 'line', attrs: {highway:'residential',oneway},
  coords: [[[-50,0],[100,0]]]
});
const strip = box('strip',0,2,30,5,'TSK úseky stání',{PS_ZPS:'12'});
const bay = (id, x, angle, count = '1') => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const points = [[-2.5,-1.1],[2.5,-1.1],[2.5,1.1],[-2.5,1.1],[-2.5,-1.1]];
  return {id,source:'TSK ZTP 6',kind:'area',attrs:{ZPS_ID:'row',POCINVST:count},
    coords:[points.map(([a,b])=>[x+a*c-b*s,4.5+a*s+b*c])]};
};
const disabled = bay('ztp',10,Math.PI/4);
const raw = [strip,disabled,road()];
const saved = JSON.stringify(raw);
const group = parkingFrame(strip,raw,parkingKind);
const reserved = parkingFrame(disabled,raw,parkingKind);
assert.equal(group.orientation,'diagonal');
assert.equal(group.anchorId,'ztp');
assert.ok(Math.abs(group.slant-reserved.slant)<1e-10);
const symbol = iconBasis(reserved,reserved.orientation,reserved.slant);
assert.ok(dot(symbol.y,reserved.toRoad)>0);
assert.ok(Math.abs(dot(symbol.y,reserved.vehicle))>0.99999);
assert.equal(JSON.parse(parkingDrawing(disabled,raw).description).iconDrawn,true);
assert.equal(JSON.stringify(raw),saved);

const opposite = box('opposite',0,-7,30,5,'TSK úseky stání',{PS_ZPS:'12'});
assert.equal(parkingFrame(opposite,[...raw,opposite],parkingKind).orientation,'perpendicular');
const distant = box('distant',60,2,20,5,'TSK úseky stání',{PS_ZPS:'8'});
assert.equal(parkingFrame(distant,[...raw,distant],parkingKind).orientation,'perpendicular');
const two = bay('two',10,Math.PI/4,'2');
assert.equal(parkingFrame(strip,[strip,two,road()],parkingKind).orientation,'perpendicular');
const conflict = bay('conflict',20,-Math.PI/4);
assert.equal(parkingFrame(strip,[...raw,conflict],parkingKind).conflict,true);
assert.equal(parkingFrame(strip,[...raw,conflict],parkingKind).orientation,null);

for (const oneway of ['yes','-1','no']) {
  const parallel = box('parallel',0,2,30,2.2,'TSK úseky stání',{PS_ZPS:'5'});
  const p = box('single',10,2,6,2.2,'TSK ZTP 6',{POCINVST:'1'});
  const frame = parkingFrame(p,[parallel,p,road(oneway)],parkingKind);
  assert.equal(frame.orientation,'parallel');
  const basis = iconBasis(frame,'parallel');
  assert.ok(dot(basis.y,frame.travel)<-0.99999);
  assert.equal(Math.sign(frame.travel[0]),oneway==='-1'?-1:1);
}
const perpendicularBay = bay('perp',10,Math.PI/2);
const perpendicularFrame = parkingFrame(perpendicularBay,[strip,perpendicularBay,road()],parkingKind);
assert.equal(perpendicularFrame.orientation,'perpendicular');
assert.ok(dot(iconBasis(perpendicularFrame,'perpendicular').y,perpendicularFrame.toRoad)>0);

for (const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]) {
  const rotate = ([x,y]) => [100000+Math.cos(angle)*x-Math.sin(angle)*y,
    -100000+Math.sin(angle)*x+Math.cos(angle)*y];
  const rotated = raw.map(f=>({...f,coords:f.coords.map(line=>line.map(rotate))}));
  const frame = parkingFrame(rotated[1],rotated,parkingKind);
  assert.equal(frame.orientation,'diagonal');
  const basis = iconBasis(frame,frame.orientation,frame.slant);
  assert.ok(dot(basis.y,frame.toRoad)>0);
  const flipped = basis.y.map(v=>-v);
  assert.ok(dot(flipped,frame.toRoad.map(v=>-v))>0);
}
console.log(JSON.stringify({status:'passed'}));
