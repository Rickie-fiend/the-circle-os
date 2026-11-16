import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createSoriGeometry} from './lib/imprint-sori-geometry.mjs';
import {inspectLoopGeometry} from './lib/imprint-loop-inspection.mjs';
import {renderImprintMaterial} from './lib/imprint-material-renderer.mjs';
const base='docs/design/personal-imprint-sori-v3',hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8'));
let geometry=createSoriGeometry(original),checked=inspectLoopGeometry(geometry);
if(!checked.gates.smoothTurns){geometry=createSoriGeometry(original,3072);checked=inspectLoopGeometry(geometry);}
const settings=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2.json','utf8'));
if(process.argv.includes('--inspect')){console.log(JSON.stringify(checked.inspection));process.exit();}
const rendered=await renderImprintMaterial({geometry,settings,base,log:console.log});
const mask=Buffer.alloc(256*384*4);for(let i=0;i<checked.mask.length;i++)mask.set(checked.mask[i]?[241,239,232,255]:[25,24,19,255],i*4);
await sharp(mask,{raw:{width:256,height:384,channels:4}}).png().toFile(base+'-silhouette.png');
await writeFile(base+'-selected-loops.json',JSON.stringify([0,47,127].map(i=>geometry.strands[i])));
const loops=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536"><rect width="1024" height="1536" fill="#191813"/>${[0,47,127].map((i,k)=>`<path d="${geometry.strands[i].route.map((p,j)=>`${j?'L':'M'}${p[0]} ${p[1]}`).join(' ')} Z" fill="none" stroke="${['#f1efe8','#aaa79e','#77746b'][k]}" stroke-width="2"/>`).join('')}</svg>`;
await writeFile(base+'-loops.svg',loops);
const overlaps=[[490,230],[470,530],[245,675],[650,640],[470,840],[580,1020],[420,1200]];
await sharp(base+'-full.png').composite([{input:Buffer.from(`<svg width="1024" height="1536">${overlaps.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="22" fill="#191813" stroke="#f1efe8"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#f1efe8" font-size="22">${i+1}</text>`).join('')}</svg>`)}]).png().toFile(base+'-overlaps.png');
await writeFile(base+'.json',JSON.stringify(geometry.recipe,null,2)+'\n');
const sourceHashes={};for(const p of ['scripts/lib/imprint-sori-geometry.mjs','scripts/lib/imprint-loop-geometry.mjs','scripts/lib/imprint-loop-crossings.mjs','scripts/lib/imprint-material-renderer.mjs','scripts/render-imprint-sori.mjs'])sourceHashes[p]=hash(await readFile(p));
await writeFile(base+'-inspection.json',JSON.stringify({status:'candidate',readyForReview:false,sourceHashes,overlaps:{count:overlaps.length,markers:overlaps,method:'Internal visual count of broad fold/overlap regions; developer review pending, not individual filament intersections.'},geometryHash:hash(geometry),recipe:geometry.recipe,steps:geometry.steps,inspection:checked.inspection,gates:checked.gates,...rendered},null,2)+'\n');
console.log(JSON.stringify(checked.inspection));
