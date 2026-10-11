export const state={data:null,scopeId:'0',selected:new Set(),busy:false};
export function initialCode(){const code=new URLSearchParams(location.hash.slice(1)).get('obec');return /^\d{6}$/.test(code||'')?code:'';}
export function saveLocation(code){history.replaceState(null,'','#'+new URLSearchParams({obec:code}));}
export function setData(data){if(state.data?.code!==data.code)state.selected.clear();state.data=data;if(!data.scopes.some(s=>s.id===state.scopeId))state.scopeId=data.scopes[0].id;const scope=data.scopes.find(s=>s.id===state.scopeId),ids=new Set(scope.parties.map(p=>p.id));state.selected=new Set([...state.selected].filter(id=>ids.has(id)));}
