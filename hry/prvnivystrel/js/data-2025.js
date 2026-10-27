import {applyOfficial2025} from './results-2025.js';
export function decode2025(raw){
 if(raw.schema!==1||raw.year!==2025||raw.positions.length!==15||raw.teams.length!==84)throw Error('Neplatný dataset 2025.');
 const stations=new Map(raw.positions.map(p=>[p[0],p])),seen=new Set();let id=5;
 while(!seen.has(id)){const p=stations.get(id);if(!p)throw Error('Neúplná trasa.');seen.add(id);id=p[6]}
 if(id!==5||seen.size!==15)throw Error('Trasa není úplný okruh.');
 const teams=raw.teams.map((r,i)=>{let time=0;const events=(r[5]?r[5].split('.'):[]).map(s=>{const m=/^([0-9a-z]+)([a-oA-O])(!?)$/.exec(s);if(!m)throw Error('Neplatná událost.');time+=parseInt(m[1],36);const p=raw.positions[m[2].toLowerCase().charCodeAt(0)-97],z=m[2]===m[2].toUpperCase();if(!p||time>=86400||(z&&p[4]==null))throw Error('Neplatný čas nebo stanoviště.');return {time,id:p[0],z,manual:!!m[3],lat:p[z?4:2],lon:p[z?5:3],kind:'stanoviště'}});
 const start=events.find(e=>e.z)?.time??null,normal=events.filter(e=>!e.z),progress=new Set(normal.map(e=>e.id)).size,elapsed=start===null||!normal.length?null:normal.at(-1).time-start;
 return {id:r[0],name:r[1],scheduled:r[2],initial:r[3],terminated:r[4],events,points:events,progress,start,elapsed,color:`hsl(${i*137.508%360} 70% 38%)`}});
 if(new Set(teams.map(t=>t.id)).size!==teams.length||teams.flatMap(t=>t.events).length!==raw.counts.successfulArrivals)throw Error('Nesouhlasí počty.');
 const ranked=teams.filter(t=>t.elapsed!==null).sort((a,b)=>b.progress-a.progress||a.elapsed-b.elapsed||a.id-b.id);ranked.forEach((t,i)=>{const p=ranked[i-1];t.rank=p&&p.progress===t.progress&&p.elapsed===t.elapsed?p.rank:i+1});
 return {stations,teams};
}
export async function load2025(){const get=async name=>{const r=await fetch(new URL('../data/2025/'+name,import.meta.url),{cache:'no-cache'});if(!r.ok)throw Error(name+': '+r.status);return r.json()},[raw,official]=await Promise.all([get('source.json'),get('official-results.json')]);return applyOfficial2025(decode2025(raw),official)}
