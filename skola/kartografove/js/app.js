import {catalog,seasons,edicts} from './data.js';
import {RuinsGameModel} from './RuinsGameModel.js';
import {EnhancedView,EnhancedController,preload} from './Enhancements.js';
const link=document.createElement('link');link.rel='stylesheet';link.href='./css/enhancements.css';document.head.append(link);
const buttons=[...document.querySelectorAll('aside button')];buttons.forEach(b=>b.disabled=true);
const images=await preload(catalog,seasons,edicts);
const view=new EnhancedView();
new EnhancedController(new RuinsGameModel(catalog,seasons),view);
buttons.filter(b=>b.id!=='undo').forEach(b=>b.disabled=false);
// Keep decoded image objects alive for the duration of the session.
window.kartografoveImages=images;
