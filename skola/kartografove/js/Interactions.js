export function installInteractions(controller){
const style=document.createElement('style');
style.textContent=`
aside .credits-help{align-self:flex-end;flex:none;width:28px;min-height:28px;padding:0;border:1px solid #657060;border-radius:50%;background:transparent;color:#a6ad99;font-size:16px;opacity:.55}
aside .credits-help:hover,aside .credits-help:focus-visible{opacity:1}
aside .resources .rules-help-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
aside .resources .rules-help-row>.credits-help{align-self:center;flex:0 0 28px}
.credits-dialog{max-width:560px;padding:24px;color:#dfcba5;background:#222d23;border:1px solid #75816a;border-radius:12px}
.credits-dialog::backdrop{background:#0008}
.credits-dialog p{line-height:1.5}
.draw-panel>.card[role=button]{cursor:pointer}
.draw-panel>.card[role=button]:focus-visible{outline:2px solid #dfcba5;outline-offset:-3px}
.game-end-banner{position:absolute;inset:25% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:10;color:#dfcba5;background:#222d23ee;border-radius:16px;padding:24px;box-sizing:border-box}
.game-end-banner h2{font-size:clamp(30px,4vw,60px);margin:0 0 16px}
.game-end-banner p{font-size:clamp(18px,2vw,28px);margin:0}
`;
document.head.append(style);

const help=document.createElement('button');
help.type='button';
help.className='credits-help';
help.textContent='?';
help.setAttribute('aria-label','O projektu a autorství');
help.title='O projektu a autorství';

const resources=document.querySelector('aside .resources');
const rules=resources?.querySelector('a[href="./assets/pravidla.pdf"]');
if(rules){
const row=document.createElement('div');
row.className='rules-help-row';
rules.replaceWith(row);
row.append(rules,help);
}else{
document.querySelector('aside').append(help);
}

help.addEventListener('click',()=>{
const dialog=document.createElement('dialog');
dialog.className='credits-dialog';
dialog.setAttribute('aria-labelledby','credits-title');

const heading=document.createElement('h2');
heading.id='credits-title';
heading.textContent='O projektu a autorství';
dialog.append(heading);

for(const text of [
'Tato neoficiální výuková adaptace deskové hry Kartografové je určena výhradně pro nekomerční použití ve výuce.',
'Původní hra a použité herní materiály: © 2019 REXhry; © 2019 Thunderworks Games LLC.',
'Autoři písma Whisky: Manuel Corradine & Sergio Ramz.'
]){
const p=document.createElement('p');
p.textContent=text;
dialog.append(p);
}

const close=document.createElement('button');
close.type='button';
close.textContent='Zavřít';
close.autofocus=true;
close.addEventListener('click',()=>dialog.close());
dialog.append(close);
dialog.addEventListener('close',()=>{
dialog.remove();
help.focus();
},{once:true});
document.body.append(dialog);
dialog.showModal();
});

const root=controller.view.root;
const originalRender=controller.view.render.bind(controller.view);
controller.view.render=(model,canUndo)=>{
originalRender(model,canUndo);

if(model.state.phase==='exploring'){
const pile=root.querySelector('.draw-panel>.card');
if(pile){
pile.tabIndex=0;
pile.setAttribute('role','button');
pile.setAttribute('aria-label','Otočit další průzkumnou kartu');
}
}

if(model.state.phase==='finished'){
root.style.position='relative';
const banner=document.createElement('section');
banner.className='game-end-banner';
banner.setAttribute('role','status');
const h=document.createElement('h2');
h.textContent='Konec hry';
const p=document.createElement('p');
p.textContent='Bodování zimy je dokončeno. Sečtěte výsledky všech období.';
banner.append(h,p);
root.append(banner);
}
};

const canDraw=()=>controller.model.state.phase==='exploring'
&&!controller.busy
&&!controller.view.animating
&&!document.querySelector('dialog[open]');

root.addEventListener('click',e=>{
if(e.target.closest('.draw-panel')&&canDraw())controller.perform();
});

root.addEventListener('keydown',e=>{
if((e.key==='Enter'||e.key===' ')&&e.target.closest('.draw-panel>.card')){
e.preventDefault();
if(!e.repeat&&canDraw())controller.perform();
}
});

controller.render();
}
