import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import sharp from 'sharp';
import {COLOR_GROUPS} from '../app/os/home/imprint-color-model.js';
import {fictionalUse,usageState,growthPaint,growthWeight,FRESH_ORANGE,FADED_ORANGE,ORANGE_SHADE_EXPONENT} from '../app/os/home/imprint-growth-model.js';
import {createReliefGeometry} from './lib/imprint-relief-geometry.mjs';
import {renderImprintMaterial} from './lib/imprint-material-renderer.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),base='docs/design/personal-imprint-growth-v1';
const source=JSON.parse(await readFile('docs/design/personal-imprint-color-v1.json','utf8')),events=fictionalUse();
const originals=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8'));
const states=Object.fromEntries([['day-1',1],['week-2',14],['month-1',30],['month-3',90],['next-day-06-faded-once',91],['two-days-later-unchanged',92],['after-one-month-without-use',120]].map(([name,day])=>[name,usageState(events,day)]));
for(const group of COLOR_GROUPS)states[group]=Object.fromEntries(COLOR_GROUPS.map(g=>[g,{days:g===group?90:0,spread:g===group?1:0,brightness:g===group?FRESH_ORANGE:0}]));
states['same-areas-fresh']=Object.fromEntries(COLOR_GROUPS.map(g=>[g,{days:90,spread:1,brightness:FRESH_ORANGE}]));
states['same-areas-faded']=Object.fromEntries(COLOR_GROUPS.map(g=>[g,{days:90,spread:1,brightness:FADED_ORANGE}]));
const report={ready:false,events,states,fadeRule:'Wait 24 elapsed hours after application, then fade once at the first local 06:00 at or after that time. No further dimming.',samples:[],limits:['Fictional use-days at 06:00; growth and bright/faded levels remain illustrative.','Group-level latest-application preview; per-contribution evidence handling is not implemented.','Color uses sampled phone material coordinates, preserving accepted image geometry.','Anchors are calibrated once on visible material per form; no daily relocation.']};
report.limits[2]='Growth color exports use full-resolution visible material coordinates before antialias reduction; anchor calibration uses phone samples.';
report.colorTrial={fresh:FRESH_ORANGE,faded:FADED_ORANGE,shadeExponent:ORANGE_SHADE_EXPONENT,palette:[227,107,55]};
for(const sample of source.samples){
 const png=await readFile(sample.outputs.bone.path),bytes=await readFile(sample.coordinates.path);
 if(hash(png)!==sample.outputs.bone.hash||hash(bytes)!==sample.coordinates.hash)throw Error('Source mismatch');
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true}),coords=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const anchors={},targets=[[.4,.2],[.7,.34],[.28,.45],[.68,.59],[.32,.73],[.6,.85]];
 for(let g=0;g<6;g++){
  let best=-1,score=Infinity;
  for(let p=0;p<info.width*info.height;p++)if(coords[p*3]&&data[p*4]>65){
   const t=coords[p*3+1],u=coords[p*3+2];
   if(Object.values(anchors).some(a=>Math.hypot((t-a.t)-Math.round(t-a.t),((u-a.u)-Math.round(u-a.u))*.4)<.085))continue;
   const x=p%info.width/info.width,y=Math.floor(p/info.width)/info.height,d=(x-targets[g][0])**2+(y-targets[g][1])**2;
   if(d<score){score=d;best=p;}
  }
  if(best<0)throw Error('No visible anchor');anchors[COLOR_GROUPS[g]]={t:coords[best*3+1],u:coords[best*3+2],scale:1};
 }
 const visibility={};
 for(const group of COLOR_GROUPS){
  let count=0;
  for(let attempt=0;attempt<8;attempt++){
   count=0;for(let p=0;p<info.width*info.height;p++)if(coords[p*3]&&data[p*4]>45&&growthWeight(anchors[group],coords[p*3+1],coords[p*3+2],1)>.4)count++;
   if(count>=550)break;anchors[group].scale*=1.15;
  }
  visibility[group]=count;if(count<550)throw Error(`Front visibility failed ${sample.id}/${group}`);
 }
 const outputs={},coverage={};
 const original=originals.samples.find(s=>s.id===sample.id),geometry=createReliefGeometry(original.recipe,original.steps);
 let scene;const render=await renderImprintMaterial({geometry,settings:originals.settings,base:`outputs/imprint/orange-proof-${sample.id}`,capture:value=>{scene=value;}});
 if(render.renderHash!==original.renderHash)throw Error('Accepted monochrome changed');
 const tones=Float64Array.from({length:256},(_,i)=>Math.min(1,i/241)**ORANGE_SHADE_EXPONENT);
 for(const [name,state]of Object.entries(states)){
  const pixels=Uint8Array.from(scene.rgba);let affected=0;
  const rows=Array.from({length:128},(_,owner)=>{const weights=new Float32Array(2049),amounts=new Float32Array(2049);for(let j=0;j<=2048;j++){const p=growthPaint(anchors,state,j/2048,owner/128);weights[j]=p.weight;amounts[j]=p.weight*p.brightness;}return {weights,amounts};});
  for(let p=0;p<scene.strandOwner.length;p++)if(scene.strandOwner[p]>=0){
   const row=rows[scene.strandOwner[p]],position=scene.coursePosition[p]*2048,j=Math.min(2047,Math.floor(position)),f=position-j;
   const weight=row.weights[j]*(1-f)+row.weights[j+1]*f,amount=row.amounts[j]*(1-f)+row.amounts[j+1]*f;
   if(amount>.01)affected++;
   for(let c=0;c<3;c++)pixels[p*4+c]=Math.round(scene.rgba[p*4+c]*(1-weight)+[227,107,55][c]*tones[scene.rgba[p*4]]*amount);
  }
  const full=await sharp(pixels,{raw:{width:scene.width,height:scene.height,channels:4}}).resize({width:1024,kernel:'linear'}).png().toBuffer();
  const image=await sharp(full).resize({width:390,kernel:'linear'}).png().toBuffer(),path=`${base}-${sample.id}-${name}.png`;await writeFile(path,image);outputs[name]={path,hash:hash(image)};coverage[name]=affected;
 }
 if(outputs['next-day-06-faded-once'].hash!==outputs['two-days-later-unchanged'].hash||outputs['next-day-06-faded-once'].hash!==outputs['after-one-month-without-use'].hash)throw Error('Color continued fading after its first cutoff');
 report.samples.push({id:sample.id,label:sample.label,anchors,visibility,outputs,coverage,coverageUnits:'supersample pixels',baselineHash:sample.outputs.bone.hash,fullBaselineHash:render.renderHash});console.log(JSON.stringify({id:sample.id,visibility,baselineMatches:true,states:Object.keys(outputs).length}));
}
report.ready=true;await writeFile(base+'.json',JSON.stringify(report,null,2)+'\n');
