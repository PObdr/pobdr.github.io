export const ORDER_OPTIONS=[['name','Název týmu (A–Z)'],['start','Zaznamenaný start'],['scheduled','Plánovaný start'],['rank','Umístění (orientační)'],['progress','Počet stanovišť'],['duration','Čas do cíle']];
export function plannedSeconds(value){const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value||'');return m?+m[1]*3600+(+m[2])*60:null}
export function teamStats(team){const events=[...(team.events||[])].sort((a,b)=>a.time-b.time),start=events.find(e=>e.z)?.time??null,seen=new Set();let finish=null;
 for(const e of events)if(!e.z){seen.add(e.id);if(seen.size>=12&&finish===null)finish=e.time}
 return {start,scheduled:plannedSeconds(team.start),progress:seen.size,finish,duration:finish!==null&&start!==null&&finish>=start?finish-start:null};
}
const collator=new Intl.Collator('cs',{numeric:true,sensitivity:'base'});
const byName=(a,b)=>collator.compare(a.name,b.name)||a.id-b.id;
const number=(a,b)=>a==null?(b==null?0:1):b==null?-1:a-b;
export function makeRanks(teams,stats=new Map(teams.map(t=>[t.id,teamStats(t)]))){const ranked=teams.filter(t=>stats.get(t.id).duration!==null).sort((a,b)=>number(stats.get(a.id).duration,stats.get(b.id).duration)||byName(a,b)),ranks=new Map();let previous=null,rank=0;
 ranked.forEach((t,i)=>{const duration=stats.get(t.id).duration;if(duration!==previous)rank=i+1;ranks.set(t.id,rank);previous=duration});return ranks;
}
export function sortTeams(teams,key,stats=new Map(teams.map(t=>[t.id,teamStats(t)])),ranks=makeRanks(teams,stats)){
 return [...teams].sort((a,b)=>{const x=stats.get(a.id),y=stats.get(b.id);let result=0;
  if(key==='start')result=number(x.start,y.start);else if(key==='scheduled')result=number(x.scheduled,y.scheduled);else if(key==='rank')result=number(ranks.get(a.id),ranks.get(b.id))||y.progress-x.progress;else if(key==='progress')result=y.progress-x.progress;else if(key==='duration')result=number(x.duration,y.duration);
  return result||byName(a,b);
 });
}
