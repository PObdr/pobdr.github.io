import {catalog,seasons,edicts} from './data.js';
import {preload} from './Enhancements.js';
import {ClassroomModel} from './Classroom.js';
import {FinalPresentationView,FinalPresentationController} from './FinalPresentation.js';
import {installInteractions} from './Interactions.js';
for(const href of ['./css/enhancements.css','./css/classroom.css','./css/presentation.css','./css/notices.css','./css/fonts.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
const resources=document.createElement('nav');resources.className='resources';resources.setAttribute('aria-label','Podklady pro učitele');for(const [label,href] of [['Mapy k tisku ↗','./assets/mapy.pdf'],['Pravidla ↗','./assets/pravidla.pdf']]){const a=document.createElement('a');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener noreferrer';resources.append(a);}document.querySelector('aside').insertBefore(resources,document.querySelector('#restart'));
const buttons=[...document.querySelectorAll('aside button')];buttons.forEach(b=>b.disabled=true);
window.kartografoveImages=await preload(catalog,seasons,edicts);
const controller=new FinalPresentationController(new ClassroomModel(catalog,seasons),new FinalPresentationView());
installInteractions(controller);
buttons.filter(b=>b.id!=='undo').forEach(b=>b.disabled=false);
