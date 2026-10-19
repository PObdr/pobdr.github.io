export const DEFAULT_TEAM_ORDER='name';
export const ORDER_OPTIONS=[['name','Název týmu (A–Z)'],['rank','Umístění'],['start','Start'],['scheduled','Plánovaný start'],['progress','Počet stanovišť']];
export function plannedSeconds(value){const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value||'');return m?+m[1]*3600+(+m[2])*60:null}
export function teamStats(team){const events=[...(team.events||[])].sort((a,b)=>a.time-b.time);return {start:events.find(e=>e.z)?.time??null,scheduled:plannedSeconds(team.start),progress:new Set(events.filter(e=>!e.z).map(e=>e.id)).size}}
export function readOfficialResults(data,teams){
 if(data.schemaVersion!==1||data.year!==2026||data.official!==true||!Array.isArray(data.rows))throw Error('Neplatná oficiální výsledková tabulka.');
 const known=new Set(teams.map(t=>t.id)),results=new Map();
 for(const row of data.rows){if(!Array.isArray(row)||row.length!==5)throw Error('Neplatný řádek výsledků.');const [teamId,rank,totalSeconds,time,name]=row;
  if(!known.has(teamId)||results.has(teamId)||!Number.isInteger(rank)||rank<1||!Number.isInteger(totalSeconds)||totalSeconds<0||typeof time!=='string'||!/^\d+:\d{2}(?::\d{2})?$/.test(time)||typeof name!=='string')throw Error('Neplatný nebo duplicitní výsledek týmu.');
  results.set(teamId,{teamId,rank,totalSeconds,time,name});
 }return results;
}
export async function loadOfficialResults(teams){const response=await fetch(new URL('../data/2026/official-results.json',import.meta.url),{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Výsledky nelze načíst ('+response.status+').');return readOfficialResults(await response.json(),teams)}
const collator=new Intl.Collator('cs',{numeric:true,sensitivity:'base'}),byName=(a,b)=>collator.compare(a.name,b.name)||a.id-b.id,number=(a,b)=>a==null?(b==null?0:1):b==null?-1:a-b;
// Copy published places; never infer them from progress, finish or duration.
export function makeRanks(teams,official=new Map()){const ranks=new Map();for(const t of teams){const rank=official.get(t.id)?.rank;if(Number.isInteger(rank))ranks.set(t.id,rank)}return ranks}
export function sortTeams(teams,key,stats=new Map(teams.map(t=>[t.id,teamStats(t)])),official=new Map()){
 return [...teams].sort((a,b)=>{const x=stats.get(a.id),y=stats.get(b.id);let result=0;
  if(key==='start')result=number(x.start,y.start);else if(key==='scheduled')result=number(x.scheduled,y.scheduled);else if(key==='rank')result=number(official.get(a.id)?.rank,official.get(b.id)?.rank);else if(key==='progress')result=y.progress-x.progress;else if(key==='duration')result=number(official.get(a.id)?.totalSeconds,official.get(b.id)?.totalSeconds);
  return result||byName(a,b);
 });
}
