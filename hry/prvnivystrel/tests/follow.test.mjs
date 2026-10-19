import test from 'node:test';import assert from 'node:assert/strict';import {TeamFollow} from '../js/follow.js';
const point=(id,lat)=>({t:{id},p:{lat,lon:14}});
test('Selecting centers immediately and follows later positions',()=>{const seen=[],f=new TeamFollow(p=>seen.push(p.lat));f.select(1,{lat:50,lon:14});f.update([point(1,51)]);f.update([point(1,52)]);assert.deepEqual(seen,[50,51,52])});
test('Automatic recentering does not cancel follow state',()=>{const f=new TeamFollow(()=>{});f.select(1);f.update([point(1,51)]);assert.equal(f.teamId,1)});
test('Stop prevents later updates',()=>{let calls=0;const f=new TeamFollow(()=>calls++);f.select(1);f.stop();f.update([point(1,51)]);assert.equal(calls,0)});
test('Another team replaces the followed team',()=>{let lat;const f=new TeamFollow(p=>lat=p.lat);f.select(1);f.select(2);f.update([point(1,51),point(2,52)]);assert.equal(lat,52)});
test('Unknown position does not fabricate a center or forget selection',()=>{let calls=0;const f=new TeamFollow(()=>calls++);f.select(1);f.update([]);assert.equal(calls,0);assert.equal(f.teamId,1)});
test('Hiding followed team stops follow',()=>{const f=new TeamFollow(()=>{});f.select(1);f.retain(new Set([2]));assert.equal(f.teamId,null)});
test('Changing other selected teams keeps follow',()=>{const f=new TeamFollow(()=>{});f.select(1);f.retain(new Set([1,2]));assert.equal(f.teamId,1)});
