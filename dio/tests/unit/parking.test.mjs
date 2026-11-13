import assert from 'node:assert/strict';
import { parkingDrawing, parkingOrientation, parkingKind, inside } from '../../src/parking/parking.js';

const box = (id, x, y, w, h, source = 'TSK úseky stání', attrs = {}) => ({
  id, source, kind: 'area', attrs,
  coords: [[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]]
});
const road = {id:'road', source:'OSM', kind:'line', attrs:{highway:'residential'}, coords:[[[-20,-5],[100,-5]]]};
assert.equal(parkingOrientation(2.2,30,5),'parallel');
assert.equal(parkingOrientation(5,30,12),'perpendicular');
assert.equal(parkingOrientation(4.2,30,8),'diagonal');
assert.equal(parkingOrientation(3.5,30,0),null);
const strip = box('strip',0,0,30,2.2,'TSK úseky stání',{PS_ZPS:'5'});
const reserved = box('reserved',10,0,5,2.2,'TSK ZTP 6');
const original = JSON.stringify([strip,reserved,road]);
const regular = parkingDrawing(strip,[strip,reserved,road]);
assert.equal(JSON.parse(regular.description).orientation,'parallel');
assert.ok(regular.d.length>0);
assert.ok(regular.dashed);
const nums = regular.d.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi).map(Number);
for(let i=0;i<nums.length;i+=4) {
  assert.ok(!inside([(nums[i]+nums[i+2])/2,(nums[i+1]+nums[i+3])/2],reserved.coords));
}
const accessible = parkingDrawing(reserved,[strip,reserved,road]);
assert.equal(accessible.color,'#1d4ed8');
assert.ok(accessible.d.split('M ').length>20);
assert.equal(parkingKind(box('partial',0,0,30,5,'OSM',{amenity:'parking',capacity:'10','capacity:disabled':'2'})),'regular');
assert.equal(parkingKind(box('all',0,0,5,5,'OSM',{amenity:'parking',capacity:'2','capacity:disabled':'2'})),'disabled');
const osm = box('osm',1,0.1,28,2,'OSM',{amenity:'parking',capacity:'5'});
assert.equal(parkingDrawing(osm,[osm,strip,road]).d,'');
const noCount = parkingDrawing({...strip,attrs:{PS_ZPS:'0'}},[strip,road]);
assert.ok(noCount.d.length<regular.d.length+100);
const noAxis = JSON.parse(parkingDrawing(strip,[strip]).description);
assert.equal(noAxis.orientation,null);
assert.equal(JSON.stringify([strip,reserved,road]),original);
const concave=box('concave',0,0,10,5);
concave.coords=[[[0,0],[10,0],[10,2],[2,2],[2,5],[0,5],[0,0]]];
assert.ok(parkingDrawing(concave,[concave,road]).d.length>0);
console.log(JSON.stringify({status:'passed'}));
