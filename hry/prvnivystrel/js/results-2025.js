export function applyOfficial2025(model,data){
 if(data.schemaVersion!==1||data.year!==2025||data.official!==true||!Array.isArray(data.rows)||data.rows.length!==model.teams.length)throw Error('Neplatné oficiální výsledky 2025.');
 const norm=s=>String(s).trim().replace(/\s+/g,' ').toLocaleLowerCase('cs'),teams=new Map(model.teams.map(t=>[t.id,t])),results=new Map(),ranks=new Set();
 for(const row of data.rows){if(!Array.isArray(row)||row.length!==5)throw Error('Neplatný řádek výsledků.');const [id,rank,seconds,time,name]=row,t=teams.get(id),m=/^(\d{2}):([0-5]\d):([0-5]\d)$/.exec(String(time));
  if(!t||results.has(id)||!Number.isInteger(rank)||rank<1||rank>model.teams.length||ranks.has(rank)||!Number.isInteger(seconds)||seconds<0||!m||+m[1]*3600 + +m[2]*60 + +m[3]!==seconds||norm(name)!==norm(t.name))throw Error('Neshoda oficiálních výsledků týmu '+id);
  ranks.add(rank);results.set(id,{rank,seconds,time});
 }
 for(const t of model.teams){const r=results.get(t.id);t.rank=r.rank;t.officialSeconds=r.seconds;t.officialTime=r.time}return model;
}
