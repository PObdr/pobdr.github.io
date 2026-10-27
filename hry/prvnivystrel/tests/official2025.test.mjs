import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decode2025} from '../js/data-2025.js';
import {applyOfficial2025} from '../js/results-2025.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../data/2025/'+name,import.meta.url))),model=decode2025(read('source.json')),data=read('official-results.json'),before=JSON.stringify(model.teams.map(t=>[t.start,t.elapsed,t.points,t.events]));
applyOfficial2025(model,data);assert.equal(data.rows.length,84);
for(const [id,rank,seconds,time] of data.rows){const t=model.teams.find(t=>t.id===id);assert.equal(t.rank,rank);assert.equal(t.officialSeconds,seconds);assert.equal(t.officialTime,time);if(t.events.length)assert.equal(t.elapsed,seconds)}
for(const [id,rank] of [[35,82],[64,83],[118,84]]){const t=model.teams.find(t=>t.id===id);assert.equal(t.rank,rank);assert.equal(t.officialTime,'00:00:00');assert.equal(t.start,null);assert.equal(t.elapsed,null);assert.equal(t.points.length,0)}
assert.equal(JSON.stringify(model.teams.map(t=>[t.start,t.elapsed,t.points,t.events])),before);
for(const mutate of [d=>d.rows.pop(),d=>d.rows[1][0]=d.rows[0][0],d=>d.rows[0][2]++,d=>d.year=2026]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>applyOfficial2025(model,bad))}
