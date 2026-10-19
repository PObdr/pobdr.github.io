async function inflate(packed){
 const bytes=Uint8Array.from(atob(packed),c=>c.charCodeAt(0));
 return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
}
export async function attachGps(raw,gps){
 if(gps.encoding!=='gzip-varint-delta-v1'||gps.precision!==100000||gps.origin?.[0]!==50||gps.origin?.[1]!==14||!Array.isArray(gps.teamIds))throw Error('Neplatný formát GPS.');
 const bytes=await inflate(gps.payload);let cursor=0,total=0;
 const read=()=>{let n=0,m=1;for(let i=0;i<5;i++){if(cursor>=bytes.length)throw Error('Neúplná GPS data.');const b=bytes[cursor++];n+=(b&127)*m;if(b<128)return n;m*=128}throw Error('Poškozené GPS číslo.')};
 const signed=()=>{const n=read();return n%2?-(n+1)/2:n/2};
 const byId=new Map(raw.t.map(t=>[t[0],t])),seen=new Set();
 for(const id of gps.teamIds){const team=byId.get(id);if(!team||seen.has(id))throw Error('Neshoda týmů v GPS datech.');seen.add(id);const count=read();if(count>100000)throw Error('Neplatný počet GPS bodů.');let time=0,lat=0,lon=0;team[5]=[];
  for(let i=0;i<count;i++){time+=signed();lat+=signed();lon+=signed();const a=50+lat/100000,b=14+lon/100000;if(time<0||time>=86400||a<=49.9||a>=50.25||b<=14.1||b>=14.8)throw Error('GPS bod mimo povolený rozsah.');team[5].push([time,a,b,'GPS']);total++}
 }
 if(cursor!==bytes.length||total!==gps.pointCount||seen.size!==raw.t.length)throw Error('GPS data nejsou kompletní.');return raw;
}
export async function load(){
 const base=new URL('../data/2026/',import.meta.url);
 const get=async name=>{const r=await fetch(new URL(name,base),{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Načítání ${name}: ${r.status}`);return r.json()};
 const [source,packed]=await Promise.all([get('source.json'),get('suspicious.json')]);
 let audit=packed;if(packed.encoding==='gzip-base64')audit=JSON.parse(new TextDecoder().decode(await inflate(packed.payload)));
 const raw=source.dataset;
 if(!Array.isArray(raw?.p)||!Array.isArray(raw?.t)||!Array.isArray(audit.rows)||audit.rows.length!==audit.counts.suspectEvents)throw Error('Neplatná struktura místních dat.');
 if(source.gpsFile){if(source.gpsFile!=='gps.json')throw Error('Neplatná cesta GPS souboru.');await attachGps(raw,await get(source.gpsFile))}
 if(source.counts&&(raw.p.length!==source.counts.stations||raw.t.length!==source.counts.teams))throw Error('Nesouhlasí počty místních dat.');
 return {raw,audit};
}
export function prepare(raw,audit){
 const stations=new Map(raw.p.map(p=>[p[0],p]));
 const teams=raw.t.map((t,i)=>{let time=0;
  const events=t[4]?t[4].split('.').map(s=>{const ch=s.slice(-1),id=ch.toLowerCase().charCodeAt(0)-97+23,z=ch!==ch.toLowerCase(),p=stations.get(id);if(!p)throw Error('Neznámé stanoviště.');time+=parseInt(s.slice(0,-1),36);return {time,id,z,lat:p[z?4:2],lon:p[z?5:3]}}):[];
  // Movement and encounters share only confirmed station anchors. GPS stays in raw data.
  const unique=new Map();for(const e of events)if(Number.isFinite(e.lat)&&Number.isFinite(e.lon))unique.set(e.time,{...e,kind:'stanoviště'});
  return {id:t[0],name:t[1],start:t[2],events,points:[...unique.values()].sort((a,b)=>a.time-b.time),color:`hsl(${i*137.508%360} 70% 38%)`};
 });return {stations,teams,model:'confirmed-stations'};
}
