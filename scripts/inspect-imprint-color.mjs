import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import sharp from 'sharp';
import {createReliefGeometry} from './lib/imprint-relief-geometry.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex'),base='docs/design/personal-imprint-color-v1';
const report=JSON.parse(await readFile(base+'.json','utf8')),original=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8')),checks=[];
for(const sample of report.samples){
 const old=original.samples.find(s=>s.id===sample.id),geometry=createReliefGeometry(old.recipe,old.steps);
 const assets=await Promise.all(Object.values(sample.outputs).concat(sample.coordinates).map(async a=>hash(await readFile(a.path))===a.hash));
 const raws={};for(const mode of ['bone','input','completion','mixed','older'])raws[mode]=await sharp(await readFile(sample.outputs[mode].path)).ensureAlpha().raw().toBuffer();
 let opaque=true,olderQuieter=true,inputQuieter=true,border=true;
 const width=sample.coordinates.width,height=sample.coordinates.height;
 for(let i=0;i<width*height;i++){
  const x=i%width,y=Math.floor(i/width);
  for(const mode of Object.keys(raws)){
   if(raws[mode][i*4+3]!==255)opaque=false;
   if(x<2||y<2||x>=width-2||y>=height-2)for(let c=0;c<3;c++)if(raws[mode][i*4+c]!==raws.bone[i*4+c])border=false;
  }
  for(let c=0;c<3;c++){
   if(Math.abs(raws.older[i*4+c]-raws.bone[i*4+c])>Math.abs(raws.mixed[i*4+c]-raws.bone[i*4+c]))olderQuieter=false;
   if(Math.abs(raws.input[i*4+c]-raws.bone[i*4+c])>Math.abs(raws.completion[i*4+c]-raws.bone[i*4+c]))inputQuieter=false;
  }
 }
 const gates={geometry:hash(JSON.stringify(geometry))===sample.geometryHash&&sample.geometryHash===old.geometryHash,baseline:sample.baselineHash===old.renderHash&&sample.outputs.bone.hash===old.outputs['390'].hash,assets:assets.every(Boolean),opaque,olderQuieter,inputQuieter,border};
 checks.push({id:sample.id,gates});console.log(JSON.stringify(checks.at(-1)));
}
const sources=(await Promise.all(Object.entries(report.sources).map(async([path,expected])=>hash(await readFile(path))===expected))).every(Boolean);
report.independent={sources,checks,passed:sources&&checks.length===6&&checks.every(c=>Object.values(c.gates).every(Boolean))};
await writeFile(base+'.json',JSON.stringify(report,null,2)+'\n');if(!report.independent.passed)process.exitCode=1;
