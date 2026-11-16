import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {createLoopImprintRecipe,retainLoopImprintRecipe} from "../app/os/home/imprint-loop-recipe.js";
import {loopImprintSamples} from "../app/os/home/imprint-loop-samples.js";
import {reorderSampleInput,correctedSampleInput} from "../app/os/home/imprint-personal-samples.js";
import {createLoopGeometry} from "./lib/imprint-loop-geometry.mjs";
import {inspectLoopGeometry} from "./lib/imprint-loop-inspection.mjs";
import {rasterDepth} from "./lib/imprint-network-geometry.mjs";

const base="docs/design/personal-imprint-loops-v2",hash=value=>createHash("sha256").update(typeof value==="string"||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest("hex"),report=JSON.parse(await readFile(`${base}-inspection.json`,"utf8"));
const sources=await Promise.all(Object.entries(report.sourceHashes).map(async([path,expected])=>({path,expected,actual:hash(await readFile(path))})));
const globalGates={sourcesCurrent:sources.every(s=>s.expected===s.actual),settingsCurrent:hash(report.settings)===hash(JSON.parse(await readFile(`${base}.json`,"utf8"))),sixExamples:report.samples.length===6&&new Set(report.samples.map(s=>s.id)).size===6,threeFamilies:new Set(report.samples.map(s=>s.recipe.family)).size===3,onlyFibresVisible:report.settings.surface.visible===false&&report.settings.surface.occlude===false};
const masks=[],summaries=[];
for(const sample of report.samples){
 const fixture=loopImprintSamples.find(s=>s.id===sample.id);if(!fixture)throw Error("Unknown fictional profile.");
 const recipe=JSON.parse(await readFile(`${base}-${sample.id}-recipe.json`,"utf8")),geometry=createLoopGeometry(recipe,{steps:sample.steps}),checked=inspectLoopGeometry(geometry);masks.push({id:sample.id,mask:checked.mask});
 const checks={sameInput:hash(await createLoopImprintRecipe(fixture.input))===sample.recipeHash,repeated:hash(await createLoopImprintRecipe(fixture.input))===sample.recipeHash,reordered:hash(await createLoopImprintRecipe(reorderSampleInput(fixture.input)))===sample.recipeHash,retained:(await retainLoopImprintRecipe(recipe,correctedSampleInput(fixture.input)))===recipe,feelingExcluded:hash(await createLoopImprintRecipe({...fixture.input,feeling:0,answers:{...fixture.input.answers,feeling:10}}))===sample.recipeHash};
 const assets=[];for(const[name,output]of Object.entries(sample.outputs)){const bytes=await readFile(output.path);assets.push({name,hashMatches:hash(bytes)===output.hash});}
 const selected=JSON.parse(await readFile(sample.outputs.selected.path,"utf8")),selectedMatch=selected.length===3&&selected.every(s=>hash(s)===hash(geometry.strands.find(p=>p.id===s.id)));
 const full=await readFile(sample.outputs.full.path),phone=await readFile(sample.outputs["390"].path),{data,info}=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true}),depth=rasterDepth(geometry.surface,1024,1536),nearX=new Uint8Array(depth.length),near=new Uint8Array(depth.length);
 for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)for(let dx=-2;dx<=2;dx++){if(x+dx>=0&&x+dx<1024&&Number.isFinite(depth[y*1024+x+dx])){nearX[y*1024+x]=1;break;}}
 for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)for(let dy=-2;dy<=2;dy++){if(y+dy>=0&&y+dy<1536&&nearX[(y+dy)*1024+x]){near[y*1024+x]=1;break;}}
 let outside=0,clipped=0,nonOpaque=0,min=255,max=0;
 for(let i=0;i<depth.length;i++){const changed=report.settings.palette.background.some((value,c)=>Math.abs(data[i*4+c]-value)>1);if(changed&&!near[i])outside++;if(data[i*4+3]!==255)nonOpaque++;for(let c=0;c<3;c++){const value=data[i*4+c];min=Math.min(min,value);max=Math.max(max,value);if(value===255)clipped++;}}
 const phoneMatches=hash(await sharp(full).resize({width:390,kernel:report.settings.resamplingKernel}).png().toBuffer())===hash(phone);
 const gates={...checked.gates,recipeCurrent:hash(recipe)===sample.recipeHash&&hash(sample.recipe)===sample.recipeHash,geometryReproduced:hash(geometry)===sample.geometryHash,behaviour:Object.values(checks).every(Boolean),published:sample.status==="rendered"&&Object.values(sample.gates).every(Boolean),assetHashes:assets.length===9&&assets.every(a=>a.hashMatches)&&hash(full)===sample.renderHash,selectedLoopsMatch:selectedMatch,dimensions:info.width===1024&&info.height===1536,preservedVoids:outside===0,opaque:nonOpaque===0,unclipped:clipped===0&&sample.material.clippedHighlights===0,finiteShading:sample.material.nonfiniteShades===0,allStrandsRepresented:sample.strands.represented===128,phoneMatches};
 sample.independentInspection={geometry:checked.inspection,checks,assets,pixels:{outside,clipped,nonOpaque,min,max,phoneMatches},gates};
 summaries.push({id:sample.id,steps:sample.steps,gates,geometry:checked.inspection,pixels:sample.independentInspection.pixels});console.log(JSON.stringify(summaries.at(-1)));
}
const pairwise=[];for(let i=0;i<masks.length;i++)for(let j=i+1;j<masks.length;j++){let intersection=0,union=0;for(let p=0;p<masks[i].mask.length;p++){const a=masks[i].mask[p],b=masks[j].mask[p];if(a&&b)intersection++;if(a||b)union++;}pairwise.push({a:masks[i].id,b:masks[j].id,silhouetteIoU:intersection/(union||1)});}
globalGates.distinctGeometries=new Set(report.samples.map(s=>s.geometryHash)).size===6;
report.independentInspection={inspectorHash:hash(await readFile("scripts/inspect-imprint-loops.mjs")),sources,gates:globalGates,pairwiseSilhouettes:pairwise,limitations:["Finite sampling verifies these six examples; this is not a proof for every possible future recipe.","Depth checks cover non-neighbouring course segments at proper projected strand intersections. They are not a full solid-body collision proof.","Main openings are measured on a 256×384 projection of the bundle guide. Areas below 1,008 source pixels are separately reported as small interstices."]};
report.checksPass=Object.values(globalGates).every(Boolean)&&summaries.every(s=>Object.values(s.gates).every(Boolean));
let review;try{review=JSON.parse(await readFile(`${base}-visual-review.json`,"utf8"));}catch{review={status:"pending"};}
const reviewMatches=review.samples?.length===6&&new Set(review.samples.map(s=>s.id)).size===6&&review.samples.every(s=>report.samples.some(r=>r.id===s.id&&r.recipeHash===s.recipeHash&&r.geometryHash===s.geometryHash&&r.renderHash===s.renderHash));
report.visualReview=reviewMatches?review:{status:"pending"};report.readyForReview=report.checksPass&&reviewMatches&&review.status==="review-with-limitations";
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({globalGates,checksPass:report.checksPass,readyForReview:report.readyForReview,pairwise}));if(!report.checksPass)process.exitCode=1;
