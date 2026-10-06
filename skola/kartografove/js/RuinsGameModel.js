import {GameModel} from './GameModel.js';
export class RuinsGameModel extends GameModel{
prepareSeason(){super.prepareSeason();this.state.ruinsPending=false;this.state.currentRequiresRuins=false;}
drawNextCard(){const s=this.state;if(s.phase!=='exploring')throw new Error('Nyní nelze otočit kartu.');s.currentRequiresRuins=false;do{super.drawNextCard();const card=this.cards.get(s.currentCardId);if(card.effect==='ruins'){s.ruinsPending=true;if(s.phase!=='exploring')break;continue;}if(card.type==='exploration'&&s.ruinsPending){s.currentRequiresRuins=true;s.ruinsPending=false;}break;}while(s.explorationDeck.length);}
restoreState(value){super.restoreState(value);if(this.state.phase!=='setup'){this.state.ruinsPending=Boolean(this.state.ruinsPending);this.state.currentRequiresRuins=Boolean(this.state.currentRequiresRuins);}}
}
