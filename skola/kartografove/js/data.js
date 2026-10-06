// DEMO ONLY: identifiers, times and scoring labels are placeholders.
export const catalog = {
  demo: true,
  scoring: Array.from({length:4},(_,g)=>Array.from({length:4},(_,n)=>({id:`score-${g}-${n}`,type:'scoring',group:g,name:`Testovací typ ${g+1}, karta ${n+1}`,front:null}))).flat(),
  exploration: Array.from({length:13},(_,n)=>({id:`explore-${n}`,type:'exploration',name:`Testovací průzkum ${n+1}`,time:n%2+1,front:null,effect:null})),
  ambush: Array.from({length:8},(_,n)=>({id:`ambush-${n}`,type:'ambush',name:`Testovací přepadení ${n+1}`,time:0,front:null,effect:null}))
};
export const seasons = [
  {name:'Jaro',limit:8,front:null,scoringSlots:null},
  {name:'Léto',limit:8,front:null,scoringSlots:null},
  {name:'Podzim',limit:7,front:null,scoringSlots:null},
  {name:'Zima',limit:6,front:null,scoringSlots:null}
];
// scoringSlots must be verified and filled before real play.
