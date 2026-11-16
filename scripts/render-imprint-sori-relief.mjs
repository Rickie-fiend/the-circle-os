import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createSoriReliefGeometry,sampleSoriReliefStrand} from './lib/imprint-sori-relief.mjs';
import {inspectLoopGeometry} from './lib/imprint-loop-inspection.mjs';
import {renderImprintMaterial} from './lib/imprint-material-renderer.mjs';
import {rasterDepth} from './lib/imprint-network-geometry.mjs';

const base='docs/design/personal-imprint-sori-v4',hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8'));
let geometry=createSoriReliefGeometry(original),checked=inspectLoopGeometry(geometry,{sampleStrand:sampleSoriReliefStrand});
if(!checked.gates.smoothTurns){geometry=createSoriReliefGeometry(original,6144);checked=inspectLoopGeometry(geometry,{sampleStrand:sampleSoriReliefStrand});}
if(process.argv.includes('--inspect')){console.log(JSON.stringify({inspection:checked.inspection,gates:checked.gates}));process.exit();}
const settings=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2.json','utf8'));
const rendered=await renderImprintMaterial({geometry,settings,base,log:console.log});
const selected=[0,47,127].map(i=>geometry.strands[i]);
await writeFile(base+'-selected-loops.json',JSON.stringify(selected));
const trace=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1536" fill="#191813"/>${selected.map((s,i)=>`<path d="${s.route.map((p,j)=>`${j?'L':'M'}${p[0]} ${p[1]}`).join(' ')} Z" fill="none" stroke="${['#f1efe8','#aaa79e','#77746b'][i]}" stroke-width="2"/>`).join('')}</svg>`;
await writeFile(base+'-loops.svg',trace);
const projection=rasterDepth(geometry.surface,1024,1536),finite=Array.from(projection).filter(Number.isFinite),lo=finite.reduce((a,b)=>Math.min(a,b),Infinity),hi=finite.reduce((a,b)=>Math.max(a,b),-Infinity),depth=Buffer.alloc(1024*1536*4);
for(let i=0;i<projection.length;i++){const value=Number.isFinite(projection[i])?Math.round(45+190*(projection[i]-lo)/(hi-lo)):25;depth.set([value,value,value,255],i*4);}
await sharp(depth,{raw:{width:1024,height:1536,channels:4}}).png().toFile(base+'-depth.png');
const angled=structuredClone(geometry),angle=Math.PI/12,midZ=(lo+hi)/2;
const rotate=p=>[512+(p[0]-512)*Math.cos(angle)+(p[2]-midZ)*Math.sin(angle),p[1],-(p[0]-512)*Math.sin(angle)+(p[2]-midZ)*Math.cos(angle)];
angled.surface.vertices=angled.surface.vertices.map(rotate);for(const s of angled.strands)s.route=s.route.map(rotate);
const bounds=angled.surface.vertices.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]),scale=Math.min(900/(bounds[2]-bounds[0]),1352/(bounds[3]-bounds[1]));
const fit=p=>[512+(p[0]-(bounds[0]+bounds[2])/2)*scale,768+(p[1]-(bounds[1]+bounds[3])/2)*scale,p[2]*scale];
angled.surface.vertices=angled.surface.vertices.map(fit);for(const s of angled.strands)s.route=s.route.map(fit);
await renderImprintMaterial({geometry:angled,settings,base:base+'-angled',log:console.log});
const overlaps=JSON.parse(await readFile('docs/design/personal-imprint-sori-v3-inspection.json','utf8')).overlaps;
await sharp(base+'-full.png').composite([{input:Buffer.from(`<svg width="1024" height="1536">${overlaps.markers.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="22" fill="#191813" stroke="#f1efe8"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#f1efe8" font-size="22">${i+1}</text>`).join('')}</svg>`)}]).png().toFile(base+'-overlaps.png');
for(const [name,suffix]of [['selected','selected-loops.json'],['loops','loops.svg'],['depth','depth.png'],['angled','angled-full.png'],['overlaps','overlaps.png']]){const path=base+'-'+suffix;rendered.outputs[name]={path,hash:hash(await readFile(path))};}
const sourceHashes={};for(const p of ['scripts/lib/imprint-sori-relief.mjs','scripts/lib/imprint-sori-geometry.mjs','scripts/lib/imprint-loop-geometry.mjs','scripts/lib/imprint-loop-crossings.mjs','scripts/lib/imprint-loop-inspection.mjs','scripts/lib/imprint-material-renderer.mjs','scripts/render-imprint-sori-relief.mjs','docs/design/personal-imprint-loops-v2.json'])sourceHashes[p]=hash(await readFile(p));
await writeFile(base+'.json',JSON.stringify({recipe:geometry.recipe,relief:geometry.relief},null,2)+'\n');
await writeFile(base+'-inspection.json',JSON.stringify({status:'candidate',readyForReview:false,steps:geometry.steps,sourceHashes,geometryHash:hash(geometry),relief:geometry.relief,overlaps,inspection:checked.inspection,gates:checked.gates,...rendered},null,2)+'\n');
console.log(JSON.stringify({inspection:checked.inspection,gates:checked.gates}));
