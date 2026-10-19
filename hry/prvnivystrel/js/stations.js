export function stripSharedEnding(value){return String(value??'').split(/Gratulujeme\s*[-–—]\s*prošli jste celou trasu!/i,1)[0].trimEnd()}
export async function loadStories(url=new URL('../data/2026/stations.json',import.meta.url)){
 const response=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Příběhy nelze načíst ('+response.status+').');
 const data=await response.json();if(data.year!==2026||!Array.isArray(data.stations))throw Error('Neplatná data příběhů.');
 const byId=new Map();for(const s of data.stations){if(!Number.isInteger(s.id)||byId.has(s.id))throw Error('Neplatné ID příběhu.');if(typeof s.photo!=='string'||/[\/]/.test(s.photo)||!/[.](jpg|jpeg|png|webp)$/i.test(s.photo))throw Error('Neplatný název fotografie.');byId.set(s.id,{...s,end:stripSharedEnding(s.end)})}return byId;
}
export function storySections(story,zero){return (zero?[['intro','Úvodní text']]:[['progress','Navazující text'],['end','Závěrečný text']]).filter(([key])=>Boolean(key==='end'?stripSharedEnding(story[key]):story[key]))}
export function nextDestination(stations,id,zero){const p=stations.get(id);return p?(zero?p:stations.get(p[7]))||null:null}
const element=(tag,text,className)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el};
export class StationDetails{
 constructor(stations){this.stations=stations;this.request=0;this.cache=null;
  if(!document.querySelector('link[data-station-styles]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../stations.css?v=2',import.meta.url).href;link.dataset.stationStyles='1';document.head.append(link)}
  this.dialog=element('dialog',null,'station-dialog');this.dialog.setAttribute('aria-labelledby','station-heading');this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.close()});this.dialog.addEventListener('cancel',()=>{this.request++});document.body.append(this.dialog);
 }
 close(){this.request++;this.dialog.close()}
 async open(id,zero=false){const p=this.stations.get(id);if(!p)return;const request=++this.request,box=element('article',null,'station-card'),header=element('header',null,'station-header'),title=element('h2',zero?'Nulté místo · '+p[1]:p[1]);title.id='station-heading';const close=element('button','Zavřít ×');close.type='button';close.addEventListener('click',()=>this.close());header.append(title,close);box.append(header);
  if(zero)box.append(element('p',p[6]||'Popis nultého místa není uveden.','station-zero'));
  const coords=zero?[p[4],p[5]]:[p[2],p[3]];if(coords.every(Number.isFinite))box.append(element('p',coords.map(v=>v.toFixed(6)).join(', '),'station-coordinates'));
  const next=nextDestination(this.stations,id,zero),route=element('div',null,'station-next');route.append(element('span',zero?'Kam dál z nultého místa: ':'Kam dál při pokračování: '));
  if(next){const button=element('button',next[1]);button.type='button';button.addEventListener('click',()=>this.open(next[0],false));route.append(button)}else route.append(element('span','Další stanoviště není uvedeno.'));box.append(route);
  const content=element('section','Načítám příběh a fotografii…','station-content');box.append(content);this.dialog.replaceChildren(box);if(!this.dialog.open)this.dialog.showModal();
  try{if(!this.cache)this.cache=loadStories().catch(error=>{this.cache=null;throw error});const stories=await this.cache;if(request!==this.request)return;const s=stories.get(id);content.replaceChildren();if(!s){content.append(element('p','Pro toto stanoviště není příběh k dispozici.'));return}
   if(s.title)content.append(element('h3',s.title));
   const photo=element('figure',null,'station-photo'),url=new URL('../data/2026/foto/'+encodeURIComponent(s.photo),import.meta.url).href,link=element('a'),img=element('img'),caption=element('figcaption',zero?'Fotografie cílového stanoviště, kam se mělo z nultého místa vyrazit. Kliknutím otevřeš plnou velikost.':'Kliknutím na fotografii otevřeš plnou velikost.');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Otevřít fotografii stanoviště '+s.name+' v plné velikosti');img.alt='Fotografie stanoviště '+s.name;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{link.hidden=true;caption.textContent='Fotografii se nepodařilo načíst.'});img.src=url;link.append(img);photo.append(link,caption);content.append(photo);
   let first=true;for(const [key,label] of storySections(s,zero)){const details=element('details'),summary=element('summary',label),text=element('p',key==='end'?stripSharedEnding(s[key]):s[key],'station-story');details.open=first;first=false;details.append(summary,text);content.append(details)}
  }catch(error){if(request===this.request)content.replaceChildren(element('p',error.message,'station-error'))}
 }
}
