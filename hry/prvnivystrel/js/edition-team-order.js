export const DEFAULT_TEAM_ORDER='name';
export const ORDER_OPTIONS=Object.freeze([['name','Název'],['rank','Oficiální pořadí'],['start','Start'],['scheduled','Plánovaný start'],['progress','Počet stanovišť']].map(row=>Object.freeze(row)));
export function plannedSeconds(value){const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value??'');return m?Number(m[1])*3600+Number(m[2])*60:null}
export function sortTeams(teams,key=DEFAULT_TEAM_ORDER){return [...teams].sort((a,b)=>{
 let difference=0;
 if(key==='rank')difference=(a.result?.rank??Infinity)-(b.result?.rank??Infinity);
 else if(key==='start')difference=(a.startTime??Infinity)-(b.startTime??Infinity);
 else if(key==='scheduled')difference=(plannedSeconds(a.scheduledStart)??Infinity)-(plannedSeconds(b.scheduledStart)??Infinity);
 else if(key==='progress')difference=b.progress-a.progress;
 return difference||a.name.localeCompare(b.name,'cs');
})}
