const formats=new Set(['edition-v1','positions-v1','dataset-v1']);
const fail=message=>{throw Error(message)};
const integer=n=>Number.isInteger(n)&&n>=0;
const filename=s=>typeof s==='string'&&s.length>0&&!/[\/\\:%]/.test(s)&&s!=='.'&&s!=='..'&&!/[?#]/.test(s);
const coord=(lat,lon)=>Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lon)&&Math.abs(lon)<=180;
export function editionsFrom(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.editions)||!data.editions.length)fail('Neplatný seznam ročníků.');
 const seen=new Set();for(const e of data.editions){
  if(!Number.isInteger(e.year)||e.year<1000||e.year>9999||seen.has(e.year)||!formats.has(e.format)||!filename(e.source)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||e.date.slice(0,4)!==String(e.year)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date||!Number.isInteger(e.offsetSeconds)||Math.abs(e.offsetSeconds)>86400)fail('Neplatná konfigurace ročníku.');
  for(const k of ['officialResults','stories','audit','histogramConfig'])if(e[k]!=null&&!filename(e[k]))fail('Neplatná cesta '+k);
  if(e.requireAllResults&&!e.officialResults)fail('Chybí zdroj oficiálních výsledků.');
  if(e.stationCount!=null&&(!integer(e.stationCount)||e.stationCount===0))fail('Neplatný počet stanovišť.');
  if(e.format==='dataset-v1'&&(!Array.isArray(e.eventStationIds)||!e.eventStationIds.length||new Set(e.eventStationIds).size!==e.eventStationIds.length||e.eventStationIds.some(id=>!integer(id))))fail('Chybí mapa kódů stanovišť.');
  seen.add(e.year);
 }return [...data.editions].sort((a,b)=>b.year-a.year);
}
export function selection(data,search=''){
 const editions=editionsFrom(data),params=new URLSearchParams(search),requested=params.get('year'),year=requested==null||requested===''?editions[0].year:/^\d{4}$/.test(requested)?Number(requested):NaN,edition=editions.find(e=>e.year===year),view=params.get('view')||'map';
 if(!edition)fail('Požadovaný ročník není dostupný.');if(!['map','histogram'].includes(view))fail('Neznámé zobrazení.');return {edition,view,editions};
}
export function decodeEdition(entry,source){
 if(!formats.has(entry.format))fail('Nepodporovaný formát dat.');if(source?.year!=null&&source.year!==entry.year)fail('Neshoda ročníku dat.');let stations,records;
 if(entry.format==='edition-v1'){
  if(source?.schemaVersion!==1||source.year!==entry.year||!Array.isArray(source.stations)||!Array.isArray(source.teams))fail('Neplatný normalizovaný dataset.');
  stations=source.stations.map(s=>({...s,zero:s.zero?{...s.zero}:null}));records=source.teams.map(t=>({...t,events:(t.events||[]).map(e=>({...e}))}));
 }else{
  const old=entry.format==='positions-v1';if(old&&(source.schema!==1||source.year!==entry.year))fail('Neshoda ročníku dat.');const ps=old?source.positions:source.dataset?.p,ts=old?source.teams:source.dataset?.t;
  if(!Array.isArray(ps)||!Array.isArray(ts))fail('Chybí stanoviště nebo týmy.');
  stations=ps.map(p=>({id:p[0],name:p[1],lat:p[2],lon:p[3],zero:p[4]==null?null:{lat:p[4],lon:p[5],name:old?p[1]:p[6]},nextId:p[old?6:7],photo:old?p[7]:null}));
  const ids=old?ps.map(p=>p[0]):entry.eventStationIds;if(!Array.isArray(ids))fail('Chybí mapa kódů.');
  records=ts.map(t=>{let time=0;const events=(t[old?5:4]?t[old?5:4].split('.'):[]).map(s=>{const m=/^([0-9a-z]+)([a-zA-Z])(!?)$/.exec(s);if(!m)fail('Neplatný kód události.');time+=parseInt(m[1],36);const id=ids[m[2].toLowerCase().charCodeAt(0)-97];if(id==null)fail('Neznámý kód stanoviště.');return {time,stationId:id,zero:m[2]===m[2].toUpperCase(),manual:Boolean(m[3])}});return {id:t[0],name:t[1],scheduledStart:t[2],initialStationId:old?t[3]:events.find(e=>e.zero)?.stationId??null,terminatedEarly:old?Boolean(t[4]):null,events}});
 }
 const byStation=new Map();for(const s of stations){if(!integer(s.id)||byStation.has(s.id)||typeof s.name!=='string'||!coord(s.lat,s.lon)||(s.zero&&!coord(s.zero.lat,s.zero.lon))||(s.photo!=null&&!filename(s.photo)))fail('Neplatné stanoviště.');byStation.set(s.id,s)}
 if(!stations.length||(entry.stationCount!=null&&entry.stationCount!==stations.length))fail('Nesouhlasí počet stanovišť.');
 const route=[],seen=new Set(),start=entry.routeStart??stations[0].id;let id=start;while(!seen.has(id)){const s=byStation.get(id);if(!s)fail('Neúplná trasa.');seen.add(id);route.push(id);id=s.nextId}if(id!==start||route.length!==stations.length)fail('Trasa netvoří jeden úplný okruh.');
 const teamIds=new Set(),teams=records.map((r,i)=>{
  if(!integer(r.id)||teamIds.has(r.id)||typeof r.name!=='string'||!Array.isArray(r.events)||(r.initialStationId!=null&&!byStation.has(r.initialStationId)))fail('Neplatný tým.');teamIds.add(r.id);
  const events=r.events.map(e=>{const s=byStation.get(e.stationId),p=e.zero?s?.zero:s;if(!s||!p||!integer(e.time))fail('Neplatné potvrzení stanoviště.');return {time:e.time,id:s.id,z:Boolean(e.zero),manual:Boolean(e.manual),lat:p.lat,lon:p.lon,kind:'stanoviště'}}).sort((a,b)=>a.time-b.time),unique=new Map(events.map(e=>[e.time,e])),normal=events.filter(e=>!e.z),startTime=events.find(e=>e.z)?.time??null;
  return {id:r.id,name:r.name,scheduledStart:r.scheduledStart??'',initialStationId:r.initialStationId??null,terminatedEarly:r.terminatedEarly??null,events,points:[...unique.values()],startTime,progress:new Set(normal.map(e=>e.id)).size,elapsed:startTime===null||!normal.length?null:normal.at(-1).time-startTime,color:`hsl(${i*137.508%360} 70% 38%)`,result:null};
 });
 if(source.counts?.teams!=null&&source.counts.teams!==teams.length)fail('Nesouhlasí počet týmů.');if(source.counts?.stations!=null&&source.counts.stations!==stations.length)fail('Nesouhlasí počet stanovišť.');if(source.counts?.successfulArrivals!=null&&source.counts.successfulArrivals!==teams.reduce((n,t)=>n+t.events.length,0))fail('Nesouhlasí počet příchodů.');
 return {edition:entry,stations:byStation,route,teams};
}
export function applyResults(model,data){
 if(data?.schemaVersion!==1||data.year!==model.edition.year||data.official!==true||!Array.isArray(data.rows))fail('Neplatné oficiální výsledky.');
 const ids=new Set(model.teams.map(t=>t.id)),results=new Map();for(const row of data.rows){if(!Array.isArray(row)||row.length!==5)fail('Neplatný řádek výsledků.');const [id,rank,seconds,time,name]=row,m=/^(\d+):([0-5]\d)(?::([0-5]\d))?$/.exec(String(time)),total=m?(m[3]==null?Number(m[1])*60+Number(m[2]):Number(m[1])*3600+Number(m[2])*60+Number(m[3])):NaN;if(!ids.has(id)||results.has(id)||!Number.isInteger(rank)||rank<1||!integer(seconds)||total!==seconds||typeof name!=='string')fail('Neshoda výsledků.');results.set(id,{rank,seconds,time,name})}
 if(model.edition.requireAllResults&&results.size!==ids.size)fail('Chybějí výsledky týmů.');for(const t of model.teams)t.result=results.get(t.id)??null;return results;
}
