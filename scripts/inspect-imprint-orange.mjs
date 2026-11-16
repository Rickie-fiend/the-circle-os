import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import sharp from 'sharp';
const hash=v=>createHash('sha256').update(v).digest('hex'),base='docs/design/personal-imprint-growth-v1';
const report=JSON.parse(await readFile(base+'.json','utf8')),original=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8')),checks=[];
for(const sample of report.samples){
 const old=original.samples.find(s=>s.id===sample.id);
 const assets=await Promise.all(Object.values(sample.outputs).map(async a=>hash(await readFile(a.path))===a.hash));
 const fresh=await sharp(await readFile(sample.outputs['same-areas-fresh'].path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const faded=await sharp(await readFile(sample.outputs['same-areas-faded'].path)).ensureAlpha().raw().toBuffer();
 let visibleFresh=0,visibleFaded=0,redDifference=0,opaque=true,ordered=true,clearBorder=true;
 for(let p=0;p<fresh.info.width*fresh.info.height;p++){
  const i=p*4,f=fresh.data,d=faded,x=p%fresh.info.width,y=Math.floor(p/fresh.info.width);
  if(f[i]>80&&f[i]>1.4*f[i+1])visibleFresh++;
  if(d[i]>60&&d[i]>1.4*d[i+1]){visibleFaded++;redDifference+=f[i]-d[i];}
  if(f[i+3]!==255||d[i+3]!==255)opaque=false;
  for(let c=0;c<3;c++){if(f[i+c]<d[i+c])ordered=false;if((x<2||y<2||x>=fresh.info.width-2||y>=fresh.info.height-2)&&f[i+c]!==[25,24,19][c])clearBorder=false;}
 }
 const meanRedDifference=redDifference/(visibleFaded||1);
 const gates={assets:assets.length===15&&assets.every(Boolean),baseline:sample.baselineHash===old.outputs['390'].hash&&sample.fullBaselineHash===old.renderHash,visibleFaded:visibleFaded>500,distinct:meanRedDifference>10,ordered,opaque,clearBorder,singleFade:sample.outputs['next-day-06-faded-once'].hash===sample.outputs['two-days-later-unchanged'].hash&&sample.outputs['next-day-06-faded-once'].hash===sample.outputs['after-one-month-without-use'].hash};
 checks.push({id:sample.id,visibleFresh,visibleFaded,meanRedDifference,gates});console.log(JSON.stringify(checks.at(-1)));
}
report.orangeInspection={checks,passed:checks.length===6&&checks.every(c=>Object.values(c.gates).every(Boolean)),limits:'Pixel thresholds are internal diagnostics; at-a-glance appearance requires developer review.'};
await writeFile(base+'.json',JSON.stringify(report,null,2)+'\n');if(!report.orangeInspection.passed)process.exitCode=1;
