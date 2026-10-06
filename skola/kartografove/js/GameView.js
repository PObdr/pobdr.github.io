export class GameView {
  constructor(){this.root=document.querySelector('#app');this.action=document.querySelector('#action');}
  card(card){const node=document.createElement('div');node.className='card';if(card.front){const image=document.createElement('img');image.src=card.front;image.alt=card.name;image.addEventListener('error',()=>{image.remove();},{once:true});node.append(image);}const label=document.createElement('span');label.textContent=card.name;node.append(label);if(Number.isFinite(card.time)){const time=document.createElement('span');time.className='muted';time.textContent=`Časová hodnota: ${card.time}`;node.append(time);}return node;}
  render(model,canUndo){
    this.root.replaceChildren();const s=model.state;
    const labels={setup:'Nová hra',exploring:'Další karta',seasonEnd:'Přejít k bodování',scoring:s.seasonIndex===3?'Ukončit hru':'Zahájit další období',finished:'Nová hra'};
    this.action.textContent=labels[s.phase];document.querySelector('#undo').disabled=!canUndo;
    if(s.phase==='setup'){const p=document.createElement('p');p.textContent='Spusťte testovací hru. Skutečné skeny, hodnoty a zvláštní pravidla budou doplněny.';this.root.append(p);return;}
    const season=model.seasons[s.seasonIndex],top=document.createElement('section');top.className='top';
    const seasonPanel=document.createElement('section');seasonPanel.className='panel season';seasonPanel.append(this.card({name:season.name,front:season.front}));const progress=document.createElement('div');progress.className='progress';progress.textContent=`${s.elapsedTime} / ${season.limit}`;seasonPanel.append(progress);top.append(seasonPanel);
    for(const slot of ['A','B','C','D']){const panel=document.createElement('section');panel.className='panel';if(season.scoringSlots?.includes(slot))panel.classList.add('active');const h=document.createElement('h2');h.textContent=`Výnos ${slot}`;panel.append(h,this.card(model.cards.get(s.scoringAssignments[slot])));top.append(panel);}
    this.root.append(top);const center=document.createElement('section');center.className='current';
    if(s.phase==='scoring'){center.append(this.card({name:season.scoringSlots?`Bodování: ${season.scoringSlots.join(' + ')}`:'Bodování — dvojice výnosů zatím není ověřena'}));}
    else if(s.phase==='finished'){center.append(this.card({name:'Konec hry — dokončete součet bodů na papíře.'}));}
    else if(s.currentCardId){center.append(this.card(model.cards.get(s.currentCardId)));}
    else{center.append(this.card({name:'Připraveno k otočení první karty'}));}
    this.root.append(center);const history=document.createElement('p');history.className='history';history.textContent=`Zbývá karet: ${s.explorationDeck.length} · Odkryto: ${s.revealedThisSeason.map(id=>model.cards.get(id).name).join(' → ')||'—'}`;this.root.append(history);
  }
  message(text){document.querySelector('#message').textContent=text;}
}
