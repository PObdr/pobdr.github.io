import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decode2025} from '../js/data-2025.js';
import {orderedEdges,collectSamples} from '../js/histogram-model.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/2025/source.json',import.meta.url))),{teams,stations}=decode2025(raw),events=teams.flatMap(t=>t.events);
assert.equal(stations.size,15);assert.equal(teams.length,84);assert.equal(events.length,1176);assert.equal(events.filter(e=>e.z).length,81);assert.equal(events.filter(e=>e.manual).length,39);assert.equal(teams.filter(t=>t.progress===15).length,46);assert.equal(teams.filter(t=>!t.events.length).length,3);
for(const t of teams){let prev=null;for(const e of t.events){assert.ok(Number.isFinite(e.lat)&&Number.isFinite(e.lon));if(prev){assert.ok(e.time>=prev.time);assert.equal(e.id,prev.z?prev.id:stations.get(prev.id)[6])}else assert.ok(e.z);prev=e}if(t.events.length){assert.equal(t.events[0].id,t.initial);assert.equal(t.elapsed,t.events.at(-1).time-t.start)}if(t.progress===15)assert.equal(stations.get(t.events.at(-1).id)[6],t.initial)}
for(const [id,n] of [[5,1],[8,2],[9,3],...Array.from({length:12},(_,i)=>[i+10,i+4])])assert.equal(stations.get(id)[7],n+'-final.jpeg');
const compatible=new Map([...stations].map(([id,p])=>[id,[id,p[1],p[2],p[3],p[4],p[5],'',p[6]]])),edges=orderedEdges(compatible,5),samples=collectSamples(teams,edges);
assert.equal(edges.length,15);assert.equal(samples.length,1095);assert.equal(samples.filter(s=>s.initial).length,81);
const ranked=teams.filter(t=>t.rank).sort((a,b)=>a.rank-b.rank);for(let i=1;i<ranked.length;i++)assert.ok(ranked[i-1].progress>ranked[i].progress||ranked[i-1].progress===ranked[i].progress&&ranked[i-1].elapsed<=ranked[i].elapsed);
const broken=structuredClone(raw);broken.positions[0][6]=21;assert.throws(()=>decode2025(broken));
