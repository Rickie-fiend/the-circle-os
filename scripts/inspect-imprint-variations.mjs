import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {createPersonalImprintRecipe,retainPersonalImprintRecipe} from "../app/os/home/imprint-personal-recipe.js";
import {personalImprintSamples,reorderSampleInput,correctedSampleInput} from "../app/os/home/imprint-personal-samples.js";
import {materialDomain,scanlineIntervals,createSurfaceQuery} from "./lib/imprint-network-geometry.mjs";
import {deformPersonalImprint} from "./lib/imprint-personal-geometry.mjs";
import {inspectImprintGeometry} from "./lib/imprint-geometry-inspection.mjs";

const base="docs/design/personal-imprint-personal-v1",hash=v=>createHash("sha256").update(typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest("hex");
const manifest=JSON.parse(await readFile(`${base}-inspection.json`,"utf8")),baseBytes=await readFile("docs/design/personal-imprint-flow-network-v4-geometry.json"),baseGeometry=JSON.parse(baseBytes),settingsBytes=await readFile("docs/design/personal-imprint-material-v1.json"),settings=JSON.parse(settingsBytes);
const spec=JSON.parse(await readFile("docs/design/personal-imprint-flow-network-v4.json","utf8")),domain=materialDomain(JSON.parse(await readFile(spec.structure,"utf8"))),surfaceAt=createSurfaceQuery(baseGeometry.surface);
const sourceChecks=await Promise.all(Object.entries(manifest.sourceHashes).map(async([path,expected])=>({path,current:hash(await readFile(path)),expected})));
const globalGates={baseUnchanged:hash(baseBytes)===manifest.baseGeometryHash&&hash(baseBytes)===settings.geometryHash,settingsCurrent:hash(settingsBytes)===manifest.materialSettingsHash,sourcesCurrent:sourceChecks.every(s=>s.current===s.expected),baselineImageUnchanged:hash(await readFile(manifest.baseline.path))===manifest.baseline.hash,threeSamples:manifest.samples.length===3&&new Set(manifest.samples.map(s=>s.id)).size===3};
const all=[];
for(const record of manifest.samples){
 const fixture=personalImprintSamples.find(s=>s.id===record.id);if(!fixture)throw Error("Unknown synthetic profile.");
 const recipe=JSON.parse(await readFile(`${base}-${record.id}-recipe.json`,"utf8")),recipeHash=hash(recipe),{geometry,domain:target,bounds,minJacobianBound}=deformPersonalImprint(baseGeometry,domain,recipe,surfaceAt),geometryCheck=inspectImprintGeometry(geometry,target);
 const checks={reproducible:hash(await createPersonalImprintRecipe(fixture.input))===recipeHash&&hash(await createPersonalImprintRecipe(fixture.input))===recipeHash,reordered:hash(await createPersonalImprintRecipe(reorderSampleInput(fixture.input)))===recipeHash,retained:(await retainPersonalImprintRecipe(recipe,correctedSampleInput(fixture.input)))===recipe};
 const outputs=[];
 if(record.status==="rendered")for(const[name,output]of Object.entries(record.outputs)){
  const bytes=await readFile(output.path),metadata=await sharp(bytes).metadata();outputs.push({name,hashMatches:hash(bytes)===output.hash,dimensions:[metadata.width,metadata.height]});
 }
 let image=null;
 if(record.status==="rendered"){
  const full=await readFile(record.outputs.full.path),phone=await readFile(record.outputs["390"].path),{data,info}=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let voidViolations=0,clippedChannels=0,nonOpaque=0,minChannel=255,maxChannel=0;
  for(let y=0;y<info.height;y++){
   const near=[-2,-1,0,1,2].flatMap(d=>scanlineIntervals(target.boundaries,y+.5+d));
   for(let x=0;x<info.width;x++){
    const i=(y*info.width+x)*4,changed=settings.palette.background.some((v,c)=>Math.abs(data[i+c]-v)>1);
    if(changed&&!near.some(([a,b])=>x+.5>=a-2&&x+.5<=b+2))voidViolations++;
    if(data[i+3]!==255)nonOpaque++;
    for(let c=0;c<3;c++){if(data[i+c]===255)clippedChannels++;minChannel=Math.min(minChannel,data[i+c]);maxChannel=Math.max(maxChannel,data[i+c]);}
   }
  }
  image={voidViolations,clippedChannels,nonOpaque,minChannel,maxChannel,phoneMatchesFull:hash(await sharp(full).resize({width:390,kernel:settings.resamplingKernel}).png().toBuffer())===hash(phone)};
 }
 const gates={...geometryCheck.gates,recipeCurrent:hash(await createPersonalImprintRecipe(fixture.input))===recipeHash&&recipeHash===record.recipeHash&&hash(record.recipe)===recipeHash,geometryReproduced:hash(geometry)===record.geometryHash,behaviour:Object.values(checks).every(Boolean),invertible:minJacobianBound>0,comfortableBounds:bounds.left>=24&&bounds.right<=1000&&bounds.top>=24&&bounds.bottom<=1512,topology:geometry.strands.length===1281&&geometryCheck.inspection.checkedEndpoints===2562&&target.boundaries.length===2,rendered:record.status==="rendered",rendererChecks:Object.values(record.gates).every(Boolean),outputHashes:outputs.length===6&&outputs.every(o=>o.hashMatches),dimensions:outputs.length===6&&outputs.every(o=>o.name==="390"?o.dimensions[0]===390&&o.dimensions[1]===585:["crown","shoulder","lower"].includes(o.name)?o.dimensions[0]===820:o.dimensions[0]===1024&&o.dimensions[1]===1536),preservedVoids:image?.voidViolations===0,unclipped:image?.clippedChannels===0,opaque:image?.nonOpaque===0,phoneMatchesFull:image?.phoneMatchesFull===true};
 record.independentInspection={geometry:geometryCheck.inspection,checks,outputs,image,gates};
 all.push({id:record.id,gates,geometry:geometryCheck.inspection,image});
}
const fingerprints=manifest.samples.map(s=>s.recipeHash+":"+s.geometryHash);globalGates.distinctSamples=new Set(fingerprints).size===3;
manifest.independentInspection={inspectorHash:hash(await readFile("scripts/inspect-imprint-variations.mjs")),sourceChecks,gates:globalGates};
manifest.checksPass=Object.values(globalGates).every(Boolean)&&all.every(s=>Object.values(s.gates).every(Boolean));
let visual;try{visual=JSON.parse(await readFile(`${base}-visual-review.json`,"utf8"));}catch{visual={status:"pending"};}
const visualMatches=visual.baseGeometryHash===manifest.baseGeometryHash&&visual.samples?.every(v=>manifest.samples.some(s=>s.id===v.id&&s.geometryHash===v.geometryHash&&s.recipeHash===v.recipeHash&&s.renderHash===v.renderHash))&&visual.samples?.length===manifest.samples.length&&new Set(visual.samples.map(s=>s.id)).size===manifest.samples.length;
manifest.visualReview=visualMatches?visual:{status:"pending"};
manifest.readyForReview=manifest.checksPass&&visualMatches&&visual.status==="review-with-limitations";
await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify({globalGates,samples:all,checksPass:manifest.checksPass,readyForReview:manifest.readyForReview}));
if(!manifest.checksPass)process.exitCode=1;
