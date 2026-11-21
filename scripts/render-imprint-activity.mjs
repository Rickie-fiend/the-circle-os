import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {activitySample,studyNow} from '../app/os/home/imprint-activity-samples.js';
import {activityGrowthState,changeActivitySource} from '../app/os/home/imprint-activity-model.js';
import {contributionPaint,ORANGE_SHADE_EXPONENT,colorFadeAt} from '../app/os/home/imprint-growth-model.js';
import {createReliefGeometry} from './lib/imprint-relief-geometry.mjs';
import {renderImprintMaterial} from './lib/imprint-material-renderer.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const originals=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8'));
const growth=JSON.parse(await readFile('docs/design/personal-imprint-growth-v1.json','utf8'));
const original=originals.samples.find(item=>item.id==='sori'),anchors=growth.samples.find(item=>item.id==='sori').anchors;
const geometry=createReliefGeometry(original.recipe,original.steps);
let scene;
const render=await renderImprintMaterial({geometry,settings:originals.settings,base:'outputs/imprint/activity-proof',capture:value=>{scene=value;},log:console.log});
if(render.renderHash!==original.renderHash)throw Error('Accepted monochrome changed.');
const state=activitySample(),now=studyNow(),cutoff=colorFadeAt(now),owner='sample-one';
const states={mixed:activityGrowthState(state,owner,now),faded:activityGrowthState(state,owner,cutoff),quiet:activityGrowthState(state,owner,new Date(+cutoff+30*86400000)),trash:activityGrowthState(changeActivitySource(state,owner,'today-note','trash'),owner,now)};
const restored=activityGrowthState(changeActivitySource(changeActivitySource(state,owner,'today-note','trash'),owner,'today-note','restore'),owner,now);
if(JSON.stringify(restored)!==JSON.stringify(states.mixed))throw Error('Restore changed age or spread.');
const report={ready:false,sample:'sori',fullBaselineHash:render.renderHash,states,outputs:{},limits:['Synthetic data only; growth curve and numeric Orange levels remain illustrative.','Interactive phone samples approximate fine edges; these images use full-resolution visible material before reduction.']};
const tones=Float64Array.from({length:256},(_,i)=>Math.min(1,i/241)**ORANGE_SHADE_EXPONENT);
for(const [name,levels]of Object.entries(states)){
 const pixels=Uint8Array.from(scene.rgba);
 const rows=Array.from({length:128},(_,owner)=>{
  const weights=new Float32Array(2049),amounts=new Float32Array(2049);
  for(let j=0;j<=2048;j++){const p=contributionPaint(anchors,levels,j/2048,owner/128);weights[j]=p.weight;amounts[j]=p.weight*p.brightness;}
  return {weights,amounts};
 });
 for(let p=0;p<scene.strandOwner.length;p++)if(scene.strandOwner[p]>=0){
  const row=rows[scene.strandOwner[p]],position=scene.coursePosition[p]*2048,j=Math.min(2047,Math.floor(position)),f=position-j;
  const weight=row.weights[j]*(1-f)+row.weights[j+1]*f,amount=row.amounts[j]*(1-f)+row.amounts[j+1]*f;
  for(let c=0;c<3;c++)pixels[p*4+c]=Math.round(scene.rgba[p*4+c]*(1-weight)+[227,107,55][c]*tones[scene.rgba[p*4]]*amount);
 }
 const full=await sharp(pixels,{raw:{width:scene.width,height:scene.height,channels:4}}).resize({width:1024,kernel:'linear'}).png().toBuffer();
 const image=await sharp(full).resize({width:390,kernel:'linear'}).png().toBuffer(),path=`docs/design/personal-imprint-activity-v1-${name}.png`;
 await writeFile(path,image);report.outputs[name]={path,hash:hash(image)};console.log(name,report.outputs[name].hash);
}
if(report.outputs.faded.hash!==report.outputs.quiet.hash)throw Error('Inactivity changed the faded image.');
report.ready=true;await writeFile('docs/design/personal-imprint-activity-v1.json',JSON.stringify(report,null,2)+'\n');
