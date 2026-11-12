import { applyCrossingMask, projectCrossingMasks, sidewalkAreas } from './crossing-mask.js';

const NS = 'http://www.w3.org/2000/svg';
const assert = (value, message) => { if (!value) throw new Error(message); };
const rectangle = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const area = (id, rings, code = 702) => ({
  id, source:'IPR plochy', kind:'area', attrs:{CTVUK_KOD:code}, coords:rings
});
const data = [
  area('left',[rectangle(0,0,20,60),rectangle(8,25,4,10)]),
  area('right',[rectangle(80,0,20,60)]),
  area('island',[rectangle(48,25,4,10)]),
  area('overlap-a',[rectangle(15,0,10,60)]),
  area('overlap-b',[rectangle(20,0,10,60)]),
  area('road',[rectangle(0,0,100,60)],701)
];
const parse = () => new DOMParser().parseFromString(
  `<svg xmlns="${NS}" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="white"/><g id="crossing"><path data-crossing="true" d="M 0,20 L 100,20 L 100,40 L 0,40 Z" fill="black"/></g><path id="other" d="M 1,1 L 7,1 L 7,7 L 1,7 Z" fill="blue"/></svg>`,
  'image/svg+xml'
);
async function pixels(doc) {
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'}));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 60;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(image,0,0,100,60);
    return (x,y) => [...ctx.getImageData(x,y,1,1).data].slice(0,3);
  } finally { URL.revokeObjectURL(url); }
}
const black = (rgb) => rgb.every(v=>v<10);
const white = (rgb) => rgb.every(v=>v>245);

export async function runTests() {
  const saved=JSON.stringify(data);
  assert(sidewalkAreas(data).length===5,'only IPR sidewalk polygons');
  const doc=parse();
  applyCrossingMask(doc,data,{width:100,height:60});
  assert(!doc.querySelector('#other').hasAttribute('mask'),'ordinary drawing unchanged');
  const p=await pixels(doc);
  assert(white(p(5,30)),'left sidewalk');
  assert(white(p(90,30)),'right sidewalk');
  assert(black(p(35,30)),'roadway retained');
  assert(black(p(10,30)),'hole retained');
  assert(white(p(50,30)),'island');
  assert(white(p(22,30)),'overlapping sidewalks are a union');
  assert(p(3,3)[2]>245 && p(3,3)[0]<10,'other geometry remains blue');
  const rotated=parse();
  applyCrossingMask(rotated,data,{width:100,height:60});
  rotated.querySelector('#crossing').setAttribute('transform','matrix(-1 0 0 -1 100 60)');
  const r=await pixels(rotated);
  assert(black(r(90,30)),'rotated mask hole');
  assert(white(r(95,30)),'rotated sidewalk');
  assert(black(r(65,30)),'rotated roadway');
  const project=(d,point)=>d.replace(/(-?[0-9.]+),(-?[0-9.]+)/g,(_,x,y)=>point([Number(x),Number(y)]).join(','));
  const shifted=parse();
  applyCrossingMask(shifted,data,{width:100,height:60});
  projectCrossingMasks(shifted.documentElement,{width:220,height:120,point:([x,y])=>[2*x+10,2*y]},project);
  const mask=shifted.querySelector('mask');
  assert(mask.getAttribute('width')==='220','preview mask width');
  assert(mask.getAttribute('data-crossing-mask')==='EPSG:3857','preview CRS');
  assert(mask.querySelector('[data-source-id="left"]').getAttribute('d').startsWith('M 10,0'),'sidewalk vertices projected');
  let rejected = false;
  try {
    projectCrossingMasks(shifted.documentElement, { point: p => p }, project);
  } catch {
    rejected = true;
  }
  assert(rejected,'double projection rejected');
  const absent=parse();
  applyCrossingMask(absent,[],{width:100,height:60});
  assert(!absent.querySelector('mask'),'no guessed boundary');
  assert(JSON.stringify(data)===saved,'source data unchanged');
  return {status:'passed', checks:19, environment:'Chromium pixel and DOM tests'};
}
