import {catalog,seasons,edicts} from './data.js';
import {preload} from './Enhancements.js';
import {ClassroomModel,ClassroomView,ClassroomController} from './Classroom.js';
for(const href of ['./css/enhancements.css','./css/classroom.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
const buttons=[...document.querySelectorAll('aside button')];buttons.forEach(b=>b.disabled=true);
window.kartografoveImages=await preload(catalog,seasons,edicts);
new ClassroomController(new ClassroomModel(catalog,seasons),new ClassroomView());
buttons.filter(b=>b.id!=='undo').forEach(b=>b.disabled=false);
