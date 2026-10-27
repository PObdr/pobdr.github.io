import {esc,fold} from './utils.js';
export const $=id=>document.getElementById(id);
export const matches=(t,q)=>fold(t.name).includes(fold(q.trim()))||String(t.id).includes(q.trim().replace(/^#/,''));
export function csv(name,rows){const cell=v=>'"'+String(/^[=+@-]/.test(String(v))?"'"+v:v).replace(/"/g,'""')+'"',url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
