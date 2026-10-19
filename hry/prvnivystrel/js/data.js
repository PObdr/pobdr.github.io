export async function load(){
 const get=async u=>{const r=await fetch(u,{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Načítání dat: ${r.status}`);return r};
 const [source,packed]=await Promise.all(['source','suspicious'].map(async n=>(await get(new URL('../data/2026/'+n+'.json',import.meta.url))).json()));
 let audit=packed;if(packed.encoding==='gzip-base64'){const bytes=Uint8Array.from(atob(packed.payload),c=>c.charCodeAt(0));audit=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json()}
 let raw=source.dataset;if(!raw){let text;try{text=await(await get(source.url)).text()}catch(error){const j=await(await get(`https://api.github.com/repos/PObdr/pobdr.github.io/contents/hry/prvnivystrel/index.html?ref=${source.archiveCommit}`)).json();text=new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\s/g,'')),c=>c.charCodeAt(0)))}const node=new DOMParser().parseFromString(text,'text/html').getElementById('dataset');if(!node)throw Error('Chybí archivní dataset.');raw=JSON.parse(node.textContent)}
 if(!Array.isArray(raw.p)||!Array.isArray(raw.t)||!Array.isArray(audit.rows)||audit.rows.length!==audit.counts.suspectEvents)throw Error('Neplatná struktura dat.');return {raw,audit};
}
export function prepare(raw,audit){
 const stations=new Map(raw.p.map(p=>[p[0],p])),key=(id,t,la,lo)=>[id,t,Math.round(la*1e5),Math.round(lo*1e5)].join(':'),blocked=new Set(audit.rows.map(r=>key(r[1],r[2],r[3]/1e5,r[4]/1e5)));
 const teams=raw.t.map((t,i)=>{let time=0;const events=t[4]?t[4].split('.').map(s=>{const ch=s.slice(-1),id=ch.toLowerCase().charCodeAt(0)-97+23,z=ch!==ch.toLowerCase(),p=stations.get(id);time+=parseInt(s.slice(0,-1),36);return {time,id,z,lat:p[z?4:2],lon:p[z?5:3]}}):[];
 const points=(t[5]||[]).filter(p=>p[3]!=='GPS'||!blocked.has(key(t[0],p[0],p[1],p[2]))).map(p=>({time:p[0],lat:p[1],lon:p[2],kind:p[3]}));for(const e of events)if(!points.some(p=>p.time===e.time))points.push({...e,kind:'stanoviště'});
 const unique=new Map();for(const p of points.sort((a,b)=>a.time-b.time))if(!unique.has(p.time)||p.kind==='GPS')unique.set(p.time,p);
 return {id:t[0],name:t[1],start:t[2],events,points:[...unique.values()],color:`hsl(${i*137.508%360} 70% 38%)`};});return {stations,teams};
}
