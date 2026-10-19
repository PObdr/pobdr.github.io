import test from 'node:test';import assert from 'node:assert/strict';import {DEFAULT_TEAM_ORDER,ORDER_OPTIONS,sortTeams} from '../js/team-order.js';
test('Alphabetical sorting is the default',()=>assert.equal(DEFAULT_TEAM_ORDER,'name'));
test('Name is first and placement second',()=>assert.deepEqual(ORDER_OPTIONS.slice(0,2).map(x=>x[0]),['name','rank']));
test('Total-time sorting is absent from the menu',()=>assert.ok(!ORDER_OPTIONS.some(([key,label])=>key==='duration'||label.includes('Celkový čas'))));
test('Default ordering uses Czech team names',()=>{const teams=[{id:1,name:'Žába',events:[]},{id:2,name:'Áčko',events:[]},{id:3,name:'Četa',events:[]}];assert.deepEqual(sortTeams(teams,DEFAULT_TEAM_ORDER).map(t=>t.id),[2,3,1])});
