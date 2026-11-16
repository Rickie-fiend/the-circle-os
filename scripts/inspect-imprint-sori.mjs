import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {pathToFileURL} from 'node:url';
import {createSoriGeometry} from './lib/imprint-sori-geometry.mjs';
import {inspectLoopGeometry} from './lib/imprint-loop-inspection.mjs';
export function holes(mask,W=256,H=384){
 const seen=new Set(),found=[];let minX=W,maxX=0,minY=H,maxY=0;
 for(let i=0;i<mask.length;i++)if(mask[i]){minX=Math.min(minX,i%W);maxX=Math.max(maxX,i%W);minY=Math.min(minY,Math.floor(i/W));maxY=Math.max(maxY,Math.floor(i/W));}
 for(let i=0;i<mask.length;i++)if(!mask[i]&&!seen.has(i)){const queue=[i];seen.add(i);let edge=false,x0=W,x1=0,y0=H,y1=0;for(let j=0;j<queue.length;j++){const p=queue[j],x=p%W,y=Math.floor(p/W);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(!x||!y||x===W-1||y===H-1)edge=true;for(const q of [x?p-1:-1,x<W-1?p+1:-1,y?p-W:-1,y<H-1?p+W:-1])if(q>=0&&!mask[q]&&!seen.has(q)){seen.add(q);queue.push(q);}}if(!edge&&queue.length>=63)found.push({area:queue.length*16,bounds:[x0*4,y0*4,x1*4,y1*4],widthRatio:(x1-x0+1)/(maxX-minX+1),heightRatio:(y1-y0+1)/(maxY-minY+1)});}
 return found;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const base='docs/design/personal-imprint-sori-v3',original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8')),report=JSON.parse(await readFile(base+'-inspection.json','utf8')),geometry=createSoriGeometry(original,report.steps),checked=inspectLoopGeometry(geometry);
const map=JSON.parse(await readFile('docs/design/personal-imprint-structure-v1.json','utf8')),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="384" viewBox="0 0 1024 1536"><path d="${map.silhouette.path} ${map.voids[0].path}" fill="white" fill-rule="evenodd"/></svg>`,raw=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer(),reference=holes(Uint8Array.from({length:256*384},(_,i)=>raw[i*4+3]>127?1:0))[0],openings=holes(checked.mask);
report.independent={geometryReproduced:createHash('sha256').update(JSON.stringify(geometry)).digest('hex')===report.geometryHash,reference,openings,gates:checked.gates,openingScale:openings.every(h=>h.widthRatio<=reference.widthRatio&&h.heightRatio<=reference.heightRatio)};
const hash=v=>createHash('sha256').update(v).digest('hex');
report.independent.sourcesCurrent=(await Promise.all(Object.entries(report.sourceHashes).map(async([p,h])=>hash(await readFile(p))===h))).every(Boolean);
report.independent.assetsCurrent=(await Promise.all(Object.values(report.outputs).map(async a=>hash(await readFile(a.path))===a.hash))).every(Boolean);
const pixels=await sharp(base+'-full.png').ensureAlpha().raw().toBuffer();let clipped=0,transparent=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]!==255)transparent++;for(let j=0;j<3;j++)if(pixels[i+j]===255)clipped++;}
report.independent.pixels={clipped,transparent};
report.readyForReview=report.independent.geometryReproduced&&report.independent.sourcesCurrent&&report.independent.assetsCurrent&&report.independent.openingScale&&Object.values(checked.gates).every(Boolean)&&report.overlaps.count<=10&&clipped===0&&transparent===0;
report.status=report.readyForReview?'review-with-limitations':'needs-work';
report.limits=['Overlap markers are an internal visual review, not an automated proof of every visible overlap.','Reference opening uses the preserved authored boundary, an approximation of the pictured rim.','Finite projected crossing checks are not a full physical collision proof.','Final visual acceptance remains pending.'];
await writeFile(base+'-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.independent));
}
