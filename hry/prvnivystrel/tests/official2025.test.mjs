import assert from 'node:assert/strict';import fs from 'node:fs';import {decodeEdition,applyResults} from '../js/edition-model.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../data/'+name,import.meta.url))),entry=read('years.json').editions.find(e=>e.year===2025),model=decodeEdition(entry,read('2025/source.json')),data=read('2025/official-results.json'),anchors=()=>JSON.stringify(model.teams.map(t=>[t.startTime,t.elapsed,t.points,t.events])),before=anchors();
applyResults(model,data);assert.equal(data.rows.length,84);
for(const [id,rank,seconds,time] of data.rows){const t=model.teams.find(t=>t.id===id);assert.equal(t.result.rank,rank);assert.equal(t.result.seconds,seconds);assert.equal(t.result.time,time);if(t.events.length)assert.equal(t.elapsed,seconds)}
for(const [id,rank] of [[35,82],[64,83],[118,84]]){const t=model.teams.find(t=>t.id===id);assert.equal(t.result.rank,rank);assert.equal(t.result.time,'00:00:00');assert.equal(t.startTime,null);assert.equal(t.elapsed,null);assert.equal(t.points.length,0)}
assert.equal(anchors(),before);
for(const mutate of [d=>d.rows.pop(),d=>d.rows[1][0]=d.rows[0][0],d=>d.rows[0][2]++,d=>d.year=2026]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>applyResults(model,bad))}
