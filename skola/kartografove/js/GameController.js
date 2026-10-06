const KEY='kartografove.mvc.demo.v1';
export class GameController {
  constructor(model,view){this.model=model;this.view=view;this.history=[];this.load();document.querySelector('#action').addEventListener('click',()=>this.perform());document.querySelector('#restart').addEventListener('click',()=>this.perform(true));document.querySelector('#undo').addEventListener('click',()=>this.undo());document.querySelector('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{view.message('Režim celé obrazovky není dostupný.');}});this.render();}
  load(){try{const raw=localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw);this.model.restoreState(value.state);this.history=Array.isArray(value.history)?value.history.slice(-100):[];}}catch{this.history=[];this.view.message('Uloženou hru nelze načíst; spusťte novou hru.');}}
  save(){try{localStorage.setItem(KEY,JSON.stringify({state:this.model.snapshot(),history:this.history}));}catch{this.view.message('Hra běží, ale stav se nepodařilo uložit.');}}
  render(){this.view.render(this.model,this.history.length>0);}
  perform(restart=false){
    const phase=this.model.state.phase;
    if(restart&&phase!=='setup'&&phase!=='finished'&&!window.confirm('Opravdu zahájit novou hru a opustit rozehranou partii?'))return;
    const before=this.model.snapshot();this.view.message('');
    try{if(restart||phase==='setup'||phase==='finished')this.model.startNewGame();else if(phase==='exploring')this.model.drawNextCard();else if(phase==='seasonEnd')this.model.beginScoring();else if(phase==='scoring')this.model.advanceSeason();this.history.push(before);this.history=this.history.slice(-100);this.save();this.render();}catch(error){this.model.restoreState(before);this.view.message(error.message);}
  }
  undo(){if(!this.history.length)return;try{this.model.restoreState(this.history[this.history.length-1]);this.history.pop();this.view.message('Vráceno o jeden krok.');this.save();this.render();}catch(error){this.view.message(error.message);}}
}
