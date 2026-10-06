export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export class GameModel {
  constructor(catalog,seasons,random=Math.random){this.catalog=catalog;this.seasons=seasons;this.random=random;this.cards=new Map([...catalog.scoring,...catalog.exploration,...catalog.ambush].map(c=>[c.id,c]));this.state={schemaVersion:1,phase:'setup'};}
  snapshot(){return structuredClone(this.state);}
  startNewGame(){
    const groups=[...new Set(this.catalog.scoring.map(c=>c.group))];
    if(groups.length!==4||this.catalog.exploration.length!==13||this.catalog.ambush.length!==8)throw new Error('Neplatný katalog karet.');
    const chosen=shuffle(groups.map(g=>shuffle(this.catalog.scoring.filter(c=>c.group===g),this.random)[0].id),this.random);
    this.state={schemaVersion:1,phase:'setup',seasonIndex:0,elapsedTime:0,scoringAssignments:Object.fromEntries(['A','B','C','D'].map((k,i)=>[k,chosen[i]])),ambushReserve:shuffle(this.catalog.ambush.map(c=>c.id),this.random),explorationDeck:[],revealedThisSeason:[],retiredAmbushes:[],currentCardId:null,pendingEffects:[]};
    this.prepareSeason();
  }
  prepareSeason(){
    const s=this.state;
    const remaining=s.explorationDeck.filter(id=>this.cards.get(id).type==='ambush');
    const next=s.ambushReserve.shift();
    s.explorationDeck=shuffle([...this.catalog.exploration.map(c=>c.id),...remaining,...(next?[next]:[])],this.random);
    s.elapsedTime=0;s.revealedThisSeason=[];s.currentCardId=null;s.pendingEffects=[];s.phase='exploring';
  }
  drawNextCard(){
    const s=this.state;if(s.phase!=='exploring')throw new Error('Nyní nelze otočit kartu.');
    if(!s.explorationDeck.length)throw new Error('Balíček je prázdný; zkontrolujte katalog.');
    const id=s.explorationDeck[0],card=this.cards.get(id);
    if(!Number.isFinite(card.time)||card.time<0)throw new Error('Karta nemá platnou časovou hodnotu.');
    s.explorationDeck.shift();s.currentCardId=id;s.revealedThisSeason.push(id);s.elapsedTime+=card.time;
    if(card.type==='ambush')s.retiredAmbushes.push(id);
    if(s.elapsedTime>=this.seasons[s.seasonIndex].limit)s.phase='seasonEnd';
  }
  beginScoring(){if(this.state.phase!=='seasonEnd')throw new Error('Období ještě neskončilo.');this.state.phase='scoring';}
  advanceSeason(){if(this.state.phase!=='scoring')throw new Error('Nejdříve proveďte bodování.');if(this.state.seasonIndex===this.seasons.length-1){this.state.phase='finished';return;}this.state.seasonIndex++;this.prepareSeason();}
  restoreState(value){
    const s=structuredClone(value);
    const phases=['setup','exploring','seasonEnd','scoring','finished'];
    if(s?.schemaVersion!==1||!phases.includes(s.phase))throw new Error('Neplatná uložená hra.');
    if(s.phase==='setup'){this.state={schemaVersion:1,phase:'setup'};return;}
    if(!Number.isInteger(s.seasonIndex)||s.seasonIndex<0||s.seasonIndex>=this.seasons.length||!Number.isFinite(s.elapsedTime)||s.elapsedTime<0)throw new Error('Neplatné období.');
    for(const key of ['ambushReserve','explorationDeck','revealedThisSeason','retiredAmbushes'])if(!Array.isArray(s[key])||s[key].some(id=>!this.cards.has(id)))throw new Error('Neplatný balíček.');
    for(const slot of ['A','B','C','D'])if(this.cards.get(s.scoringAssignments?.[slot])?.type!=='scoring')throw new Error('Neplatné bodování.');
    if(s.currentCardId!==null&&!this.cards.has(s.currentCardId))throw new Error('Neplatná aktuální karta.');
    this.state=s;
  }
}
