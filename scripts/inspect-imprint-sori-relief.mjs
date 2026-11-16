import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createSoriGeometry} from './lib/imprint-sori-geometry.mjs';
import {createSoriReliefGeometry,sampleSoriReliefStrand,reliefAmount} from './lib/imprint-sori-relief.mjs';
import {inspectLoopGeometry} from './lib/imprint-loop-inspection.mjs';
import {holes} from './inspect-imprint-sori.mjs';
import {rasterDepth} from './lib/imprint-network-geometry.mjs';

const base='docs/design/personal-imprint-sori-v4',hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const report=JSON.parse(await readFile(base+'-inspection.json','utf8')),original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8'));
const geometry=createSoriReliefGeometry(original,report.steps),foundation=createSoriGeometry(original,report.steps),checked=inspectLoopGeometry(geometry,{sampleStrand:sampleSoriReliefStrand}),before=inspectLoopGeometry(foundation);
const reference=JSON.parse(await readFile('docs/design/personal-imprint-sori-v3-inspection.json','utf8')).independent.reference,openings=holes(checked.mask);
const range=values=>Math.max(...values)-Math.min(...values),transverse=[.08,.21,.43,.67,.86].map(t=>({t,range:range(Array.from({length:65},(_,i)=>reliefAmount(geometry,t,i/128)))})),longitudinal=[.12,.24,.36].map(u=>({u,range:range(Array.from({length:128},(_,i)=>reliefAmount(geometry,i/128,u)))}));
let xyChanges=0,maxSampleError=0,depthChanges=0;
for(let i=0;i<128;i++)for(let j=0;j<=geometry.steps;j++){
 const p=geometry.strands[i].route[j],b=foundation.strands[i].route[j];if(p[0]!==b[0]||p[1]!==b[1])xyChanges++;if(Math.abs(p[2]-b[2])>.01)depthChanges++;
 if(j%128===0){const expected=sampleSoriReliefStrand(geometry,geometry.strands[i],j/geometry.steps);maxSampleError=Math.max(maxSampleError,Math.hypot(...expected.map((v,k)=>v-p[k])));}
}
const sourceChecks=await Promise.all(Object.entries(report.sourceHashes).map(async([path,expected])=>({path,pass:hash(await readFile(path))===expected})));
const assets=await Promise.all(Object.entries(report.outputs).map(async([name,a])=>({name,pass:hash(await readFile(a.path))===a.hash})));
const selected=JSON.parse(await readFile(report.outputs.selected.path,'utf8')),selectedMatch=selected.every(s=>hash(s)===hash(geometry.strands.find(p=>p.id===s.id)));
const full=await readFile(report.outputs.full.path),{data,info}=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true});let clipped=0,nonopaque=0;for(let i=0;i<data.length;i+=4){if(data[i+3]!==255)nonopaque++;for(let j=0;j<3;j++)if(data[i+j]===255)clipped++;}
const phoneMatches=hash(await sharp(full).resize({width:390,kernel:'linear'}).png().toBuffer())===report.outputs['390'].hash;
const depth=rasterDepth(geometry.surface,1024,1536),nearX=new Uint8Array(depth.length),near=new Uint8Array(depth.length);let outsidePixels=0;
for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<1024&&Number.isFinite(depth[y*1024+x+dx])){nearX[y*1024+x]=1;break;}
for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)for(let dy=-2;dy<=2;dy++)if(y+dy>=0&&y+dy<1536&&nearX[(y+dy)*1024+x]){near[y*1024+x]=1;break;}
for(let i=0;i<depth.length;i++)if(!near[i]&&[25,24,19].some((v,k)=>Math.abs(data[i*4+k]-v)>1))outsidePixels++;
const gates={...checked.gates,geometryReproduced:hash(geometry)===report.geometryHash,sourcesCurrent:sourceChecks.every(s=>s.pass),assetsCurrent:assets.every(s=>s.pass),selectedMatch,openingSize:openings.every(h=>h.widthRatio<=reference.widthRatio&&h.heightRatio<=reference.heightRatio),courseUnchanged:hash(geometry.recipe)===hash(foundation.recipe),actualSamples:maxSampleError<1e-6,transverseRelief:transverse.every(s=>s.range>20),longitudinalRelief:longitudinal.every(s=>s.range>20),depthChanged:depthChanges>128,dimensions:info.width===1024&&info.height===1536,unclipped:clipped===0,opaque:nonopaque===0,phoneMatches,allStrands:report.strands.represented===128,overlapLimit:report.overlaps.count<=10};
gates.preservedVoids=outsidePixels===0;
report.independent={inspectorHash:hash(await readFile('scripts/inspect-imprint-sori-relief.mjs')),inspection:checked.inspection,reference,openings,transverse,longitudinal,xyChanges,depthChanges,maxSampleError,sourceChecks,assets,pixels:{clipped,nonopaque,phoneMatches,outsidePixels},gates};
report.readyForReview=Object.values(gates).every(Boolean);report.status=report.readyForReview?'review-with-limitations':'needs-work';
report.checksPass=report.readyForReview;
let review;try{review=JSON.parse(await readFile(base+'-visual-review.json','utf8'));}catch{review={status:'pending'};}
const reviewed=review.status==='review-with-limitations'&&review.geometryHash===report.geometryHash&&review.renderHash===report.renderHash;
report.visualReview=reviewed?review:{status:'pending'};report.readyForReview=report.checksPass&&reviewed;
report.limitations=['The transverse/longitudinal ranges measure the geometric relief field, not an aesthetic score.','Seven broad overlap regions are visually marked; final interpretation remains developer review.','Finite projected crossing checks are not a complete physical collision proof.','Guide shadows approximate illumination; the reference appearance is not certified.'];
await writeFile(base+'-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ready:report.readyForReview,gates,inspection:checked.inspection,transverse,longitudinal,maxSampleError}));if(!report.readyForReview)process.exitCode=1;
