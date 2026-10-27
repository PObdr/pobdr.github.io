import {loadYears,loadEdition} from './edition-loader.js';
import {selection,editionsFrom} from './edition-model.js';
import {modelCache,ViewCache} from './edition-session.js';
const $=id=>document.getElementById(id);
async function main(){const registry=await loadYears(),editions=editionsFrom(registry),cached=modelCache(loadEdition);let active=null;
 window.editionModel=year=>{const entry=editions.find(e=>e.year===year);if(!entry)return Promise.reject(Error('Neznámý ročník.'));return cached(entry)};
 const views=new ViewCache((year,view)=>{const frame=document.createElement('iframe'),url=new URL('edition-view.html',location.href);url.search=new URLSearchParams({year,view});frame.src=url.href;frame.title=(view==='map'?'Mapa':'Histogram')+' · '+year;frame.hidden=true;frame.addEventListener('load',()=>{if(frame.hidden)try{frame.contentWindow.editionPause?.()}catch{}});$('views').append(frame);return frame});
 for(const [i,e] of editions.entries()){const option=document.createElement('option');option.value=e.year;option.textContent=e.year+(i===0?' · nejnovější':' · archiv');$('year').append(option)}
 function navigate(search,push=false){try{const s=selection(registry,search);active={year:s.edition.year,view:s.view};$('year').value=active.year;document.title='První výstřel · '+active.year;$('heading').textContent='První výstřel · '+active.year;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===s.view));const url=new URL(location.href);url.searchParams.set('year',active.year);url.searchParams.set('view',active.view);history[push?'pushState':'replaceState'](null,'',url);$('status').textContent='';$('retry').hidden=true;const frame=views.show(active.year,active.view);requestAnimationFrame(()=>{try{frame.contentWindow.editionResume?.();frame.contentWindow.dispatchEvent(new Event('resize'))}catch{}})}catch(e){$('status').textContent=e.message}}
 window.editionReady=(year,view,error)=>{if(active?.year!==year||active?.view!==view)return;$('status').textContent=error?'Chyba: '+error:'';$('retry').hidden=!error};
 $('retry').onclick=()=>{if(views.active){$('status').textContent='Načítám…';views.active.contentWindow.location.reload()}};
 const go=view=>navigate('?'+new URLSearchParams({year:$('year').value,view}),true);$('year').onchange=()=>go(active?.view||'map');for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>go(b.dataset.view);window.addEventListener('popstate',()=>navigate(location.search));$('year').disabled=false;for(const b of document.querySelectorAll('[data-view]'))b.disabled=false;navigate(location.search);
}
main().catch(e=>{$('status').textContent='Chyba načítání ročníků: '+e.message;console.error(e)});
