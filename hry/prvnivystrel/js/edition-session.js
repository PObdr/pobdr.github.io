export function modelCache(load){const cache=new Map();return entry=>{if(!cache.has(entry.year)){const p=Promise.resolve().then(()=>load(entry)).catch(e=>{if(cache.get(entry.year)===p)cache.delete(entry.year);throw e});cache.set(entry.year,p)}return cache.get(entry.year)}}
export class ViewCache{
 constructor(create){this.create=create;this.frames=new Map();this.active=null}
 show(year,view){const key=year+':'+view;let frame=this.frames.get(key);if(!frame){frame=this.create(year,view);this.frames.set(key,frame)}for(const other of this.frames.values())if(other!==frame){if(!other.hidden)try{other.contentWindow?.editionPause?.()}catch{}other.hidden=true}frame.hidden=false;this.active=frame;return frame}
}
