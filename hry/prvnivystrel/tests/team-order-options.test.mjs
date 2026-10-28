import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DEFAULT_TEAM_ORDER,ORDER_OPTIONS,sortTeams} from '../js/edition-team-order.js';
test('Alphabetical sorting is the default',()=>assert.equal(DEFAULT_TEAM_ORDER,'name'));
test('Name is first and placement second',()=>assert.deepEqual(ORDER_OPTIONS.slice(0,2).map(x=>x[0]),['name','rank']));
test('Total-time sorting is absent from the menu',()=>assert.ok(!ORDER_OPTIONS.some(([key,label])=>key==='duration'||label.includes('Celkový čas'))));
test('Default ordering uses Czech team names',()=>assert.deepEqual(sortTeams([{id:1,name:'Žába'},{id:2,name:'Áčko'},{id:3,name:'Četa'}]).map(t=>t.id),[2,3,1]));
test('Shared options match the actual map controls',()=>{const source=fs.readFileSync(new URL('../js/edition-map-view.js',import.meta.url),'utf8'),select=/<select id="order">([\s\S]*?)<\/select>/.exec(source);assert.ok(select);assert.deepEqual([...select[1].matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]),ORDER_OPTIONS.map(x=>x[0]))});
