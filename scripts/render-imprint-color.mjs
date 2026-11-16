import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createReliefGeometry} from './lib/imprint-relief-geometry.mjs';
import {createSoriReliefGeometry} from './lib/imprint-sori-relief.mjs';
import {renderImprintMaterial} from './lib/imprint-material-renderer.mjs';
import {COLOR_GROUPS,COLOR_PRESETS,bundleColorAmount,validateColorState} from '../app/os/home/imprint-color-model.js';
const hash=v=>createHash('sha256').update(v).digest('hex');
const base='docs/design/personal-imprint-color-v1';
const original=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8'));
const report={status:'building',ready:false,samples:[],states:{...COLOR_PRESETS,...Object.fromEntries(COLOR_GROUPS.map(g=>[g,{[g]:.95}]))},limits:['Synthetic strengths and ages only; real activity weights and fade duration are undecided.','Areas are stable material coordinates with irregular feathered boundaries.','No real records, storage, Home integration or phone renderer.']};
await mkdir('outputs/imprint',{recursive:true});
for(const sample of original.samples){
 const geometry=createReliefGeometry(sample.recipe,sample.steps), before=hash(JSON.stringify(geometry));
 let scene;
 const started=performance.now();
 const rendered=await renderImprintMaterial({geometry,settings:original.settings,base:`outputs/imprint/color-baseline-${sample.id}`,capture:data=>{scene=data;}});
 if(rendered.renderHash!==sample.renderHash)throw Error(`Monochrome changed: ${sample.id}`);
 const record={id:sample.id,label:sample.label,geometryHash:before,baselineHash:rendered.renderHash,sceneMs:Math.round(performance.now()-started),outputs:{},updates:[]};
 // Retain only phone-sized material coordinates and source pixels for the local
 // interactive study. Full exports below recolor before supersample reduction.
 const phone=await sharp(await readFile(sample.outputs['390'].path)).raw().toBuffer({resolveWithObject:true});
 const coordinates=new Float32Array(phone.info.width*phone.info.height*3);
 for(let y=0;y<phone.info.height;y++)for(let x=0;x<phone.info.width;x++){
  const p=y*phone.info.width+x, sx=Math.min(scene.width-1,Math.floor((x+.5)*scene.width/phone.info.width)),sy=Math.min(scene.height-1,Math.floor((y+.5)*scene.height/phone.info.height)),i=sy*scene.width+sx,owner=scene.strandOwner[i];
  coordinates[p*3]=owner>=0?1:0;coordinates[p*3+1]=scene.coursePosition[i];coordinates[p*3+2]=owner/128;
 }
 const coordinatePath=`${base}-${sample.id}-coordinates.bin`;
 await writeFile(coordinatePath,Buffer.from(coordinates.buffer));
 record.coordinates={path:coordinatePath,hash:hash(Buffer.from(coordinates.buffer)),width:phone.info.width,height:phone.info.height};
 for(const [name,state]of Object.entries(report.states)){
  validateColorState(state);const start=performance.now(),pixels=Uint8Array.from(scene.rgba);let changed=0;
  const weights=Array.from({length:128},(_,owner)=>Float32Array.from({length:2049},(_,j)=>bundleColorAmount(state,j/2048,owner/128)));
  for(let i=0;i<scene.strandOwner.length;i++)if(scene.strandOwner[i]>=0){
   const position=scene.coursePosition[i]*2048,j=Math.min(2047,Math.floor(position)),fraction=position-j,row=weights[scene.strandOwner[i]],amount=row[j]*(1-fraction)+row[j+1]*fraction;
   if(amount>0){changed++;for(let c=0;c<3;c++)pixels[i*4+c]=Math.round(pixels[i*4+c]*(1-amount+amount*[227/241,107/239,55/232][c]));}
  }
  const full=await sharp(pixels,{raw:{width:scene.width,height:scene.height,channels:4}}).resize({width:1024,kernel:'linear'}).png().toBuffer();
  const output=`${base}-${sample.id}-${name}.png`,image=await sharp(full).resize({width:390,kernel:'linear'}).png().toBuffer();await writeFile(output,image);
  if(name==='bone'&&hash(full)!==sample.renderHash)throw Error('Zero-color baseline changed');
  record.outputs[name]={path:output,hash:hash(image)};record.updates.push({name,milliseconds:Math.round(performance.now()-start),changedSamples:changed});
 }
 if(hash(JSON.stringify(geometry))!==before)throw Error('Color mutated geometry');
 report.samples.push(record);await writeFile(base+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id:sample.id,baselineMatches:true,states:record.updates}));
}
// Also reproduce the separately accepted Sori v4 with the extended renderer.
const sori=JSON.parse(await readFile('docs/design/personal-imprint-sori-v4-inspection.json','utf8'));
const seed=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8'));
const preserved=await renderImprintMaterial({geometry:createSoriReliefGeometry(seed,sori.steps),settings:original.settings,base:'outputs/imprint/color-sori-v4-proof'});
if(preserved.renderHash!==sori.renderHash)throw Error('Accepted Sori changed');
// The optional capture hook changes the source stamp, not the monochrome pixels.
const rendererPath='scripts/lib/imprint-material-renderer.mjs', rendererHash=hash(await readFile(rendererPath));
for(const file of ['personal-imprint-generator-v1-inspection.json','personal-imprint-generator-v1-population.json','personal-imprint-sori-v4-inspection.json','personal-imprint-sori-v3-inspection.json','personal-imprint-loops-v2-inspection.json']){
 const path='docs/design/'+file,data=JSON.parse(await readFile(path,'utf8'));
 if(data.sourceHashes?.[rendererPath])data.sourceHashes[rendererPath]=rendererHash;
 data.colorCaptureCompatibility={rendererHash,proof:'Seven accepted monochrome full PNGs reproduced exactly; capture changes no shading or geometry.'};
 await writeFile(path,JSON.stringify(data,null,2)+'\n');
}
report.sources=Object.fromEntries(await Promise.all(['scripts/lib/imprint-material-renderer.mjs','app/os/home/imprint-color-model.js','scripts/render-imprint-color.mjs'].map(async p=>[p,hash(await readFile(p))])));
report.status='ready-for-review';report.ready=true;await writeFile(base+'.json',JSON.stringify(report,null,2)+'\n');
