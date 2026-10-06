import {ClassroomView,ClassroomController} from './Classroom.js';
import {GameController} from './GameController.js';
import {edicts} from './data.js';
export class PresentationView extends ClassroomView{
render(model,canUndo){const s=model.state,previous=this.lastSnapshot;super.render(model,canUndo);this.lastSnapshot=model.snapshot();this.flipPromise=null;
if(s.phase==='setup'){this.setup(model);return;}
const newlyDrawn=previous&&previous.phase==='exploring'&&['exploring','seasonEnd'].includes(s.phase)&&s.revealedThisSeason.length===previous.revealedThisSeason.length+1&&s.currentCardId!==previous.currentCardId;
if(!newlyDrawn||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const original=this.root.querySelector('.focus-area>.card');if(!original||!original.animate)return;
const shell=document.createElement('div');shell.className='card flip-shell';const inner=document.createElement('div');inner.className='flip-inner';original.classList.add('flip-face','flip-front');const back=this.card({name:'Rub průzkumu',front:'./assets/cards/pruzkum-zadek.png'});back.classList.add('flip-face','flip-back');back.setAttribute('aria-hidden','true');inner.append(original,back);shell.append(inner);this.root.querySelector('.focus-area').prepend(shell);
const animation=inner.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:400,easing:'ease-in-out',fill:'forwards'});this.animating=true;this.flipPromise=animation.finished.catch(()=>{}).then(()=>{shell.replaceWith(original);original.classList.remove('flip-face','flip-front');this.animating=false;});
}
setup(model){this.root.replaceChildren();const top=document.createElement('section');top.className='top';const season=document.createElement('div');season.className='season';season.append(this.card({name:'Roční období',front:model.seasons[0].back}));top.append(season);['A','B','C','D'].forEach((slot,i)=>{const upper=document.createElement('div');upper.className='slot';upper.style.gridColumn=i+2;upper.style.gridRow=1;upper.append(this.card(edicts[slot]));const lower=document.createElement('div');lower.className='slot';lower.style.gridColumn=i+2;lower.style.gridRow=2;lower.append(this.card({name:`Bodovací skupina ${i+1}`,front:`./assets/cards/bodovani-zadek-${i+1}.png`}));top.append(upper,lower);});const bottom=document.createElement('section');bottom.className='setup-lower';bottom.append(this.card({name:'Balíček průzkumu',front:'./assets/cards/pruzkum-zadek.png'}));const text=document.createElement('p');text.className='setup-label';text.textContent='Příprava · spusťte hru.';bottom.append(text);this.root.append(top,bottom);document.querySelector('#undo').disabled=true;document.querySelector('#notice').textContent='Příprava nové hry';}
}
export class PresentationController extends ClassroomController{
render(){super.render();const promise=this.view.flipPromise;if(promise){this.stopTimer();const id=this.model.state.currentCardId;promise.then(()=>{if(this.model.state.currentCardId===id)this.render();});}}
async perform(restart=false){if(this.busy||this.view.animating)return;this.busy=true;try{const phase=this.model.state.phase;if(restart&&phase!=='setup'&&phase!=='finished'&&!await this.view.confirmRestart())return;this.stopTimer();if(!restart){GameController.prototype.perform.call(this,false);return;}this.model.restoreState({schemaVersion:1,phase:'setup'});this.history=[];this.view.message('');this.save();this.render();}catch(error){this.view.message(error.message);}finally{this.busy=false;}}
undo(){if(this.busy||this.view.animating)return;this.stopTimer();GameController.prototype.undo.call(this);}
}
