import test from 'node:test';import assert from 'node:assert/strict';import {storySections,nextDestination} from '../js/stations.js';
const story={intro:'Úvod',progress:'Průběh',end:'Závěr'},stations=new Map([[23,[23,'Skluzavka',50,14,50.1,14.1,'Nulté místo',24]],[24,[24,'Hradby Petřín',50.2,14.2,null,null,null,34]],[34,[34,'Čertovka',50.3,14.3,null,null,null,23]]]);
test('Zero location shows only intro',()=>assert.deepEqual(storySections(story,true),[['intro','Úvodní text']]));
test('Normal station shows progress and ending, never intro',()=>assert.deepEqual(storySections(story,false),[['progress','Navazující text'],['end','Závěrečný text']]));
test('Missing story variants are hidden',()=>{assert.deepEqual(storySections({progress:'Hůrka'},false),[['progress','Navazující text']]);assert.deepEqual(storySections({progress:'Hůrka'},true),[])});
test('Zero location points to its own target station',()=>assert.equal(nextDestination(stations,23,true)[0],23));
test('Normal station follows next_position_id, not numeric order',()=>{assert.equal(nextDestination(stations,23,false)[0],24);assert.equal(nextDestination(stations,24,false)[0],34)});
test('Ring direction is preserved',()=>assert.equal(nextDestination(stations,34,false)[0],23));
test('Missing successor is handled without invented destination',()=>{assert.equal(nextDestination(new Map([[23,stations.get(23)]]),23,false),null);assert.equal(nextDestination(stations,999,false),null)});
