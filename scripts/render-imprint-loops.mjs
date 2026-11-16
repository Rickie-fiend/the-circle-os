import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {createLoopImprintRecipe} from "../app/os/home/imprint-loop-recipe.js";
import {loopImprintSamples} from "../app/os/home/imprint-loop-samples.js";
import {createLoopGeometry} from "./lib/imprint-loop-geometry.mjs";
import {renderImprintMaterial} from "./lib/imprint-material-renderer.mjs";
import {inspectLoopGeometry} from "./lib/imprint-loop-inspection.mjs";
const draft=process.argv.includes("--draft"),one=process.argv.includes("--one"),base=draft?"outputs/imprint/loop-draft":"docs/design/personal-imprint-loops-v2",hash=v=>createHash("sha256").update(typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest("hex");
await mkdir("outputs/imprint",{recursive:true});
const settings=JSON.parse(await readFile("docs/design/personal-imprint-loops-v2.json","utf8"));settings.supersampling=draft?2:3;
const samples=loopImprintSamples,sourceHashes={};
for(const path of ["app/os/home/imprint-personal-recipe.js","app/os/home/imprint-loop-recipe.js","app/os/home/imprint-loop-samples.js","scripts/lib/imprint-loop-geometry.mjs","scripts/lib/imprint-loop-crossings.mjs","scripts/lib/imprint-loop-inspection.mjs","scripts/lib/imprint-material-renderer.mjs","scripts/render-imprint-loops.mjs","docs/design/personal-imprint-loops-v2.json"])sourceHashes[path]=hash(await readFile(path));
const manifest={version:2,status:"rendering",settings,sourceHashes,samples:[],readyForReview:false};
await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");
for(const sample of samples.slice(0,one?1:6)){
 const recipe=await createLoopImprintRecipe(sample.input),outputBase=`${base}-${sample.id}`;
 let geometry=createLoopGeometry(recipe,{steps:draft?1024:1536}),check=inspectLoopGeometry(geometry);
 while(!draft&&!check.gates.smoothTurns&&geometry.steps<6144){geometry=createLoopGeometry(recipe,{steps:geometry.steps*2});check=inspectLoopGeometry(geometry);}
 console.log(`Rendering ${sample.label} / ${recipe.family}…`);
 const rendered=await renderImprintMaterial({geometry,settings,base:outputBase,log:console.log});
 const record={id:sample.id,label:sample.label,input:sample.input,recipe,recipeHash:hash(recipe),geometryHash:hash(geometry),steps:geometry.steps,crossingRepair:geometry.crossingRepair,inspection:check.inspection,gates:check.gates,...rendered};
 const silhouette=new Uint8Array(256*384*4);for(let i=0;i<check.mask.length;i++)silhouette.set(check.mask[i]?[241,239,232,255]:[25,24,19,255],i*4);
 await sharp(silhouette,{raw:{width:256,height:384,channels:4}}).png().toFile(`${outputBase}-silhouette.png`);
 await writeFile(`${outputBase}-recipe.json`,JSON.stringify(recipe,null,2)+"\n");
 const selected=[0,Math.floor(recipe.filamentCount*.37),recipe.filamentCount-1].map(i=>geometry.strands[i]);
 await writeFile(`${outputBase}-selected-loops.json`,JSON.stringify(selected));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536"><rect width="1024" height="1536" fill="#191813"/>${selected.map((s,i)=>`<path d="${s.route.map((p,j)=>`${j?'L':'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join(' ')}Z" fill="none" stroke="${['#f1efe8','#9a978e','#68665c'][i]}" stroke-width="1.8"/>`).join('')}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(`${outputBase}-loops.png`);
 for(const[name,suffix]of[["loops","loops.png"],["silhouette","silhouette.png"],["selected","selected-loops.json"]])record.outputs[name]={path:`${outputBase}-${suffix}`,hash:hash(await readFile(`${outputBase}-${suffix}`))};
 record.status=Object.values(record.gates).every(Boolean)&&record.material.nonfiniteShades===0&&record.material.clippedHighlights===0?"rendered":"rejected";
 manifest.samples.push(record);await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");console.log(JSON.stringify({id:sample.id,family:recipe.family,hash:record.renderHash,represented:rendered.strands.represented,inspection:check.inspection,gates:check.gates}));
}
manifest.status=manifest.samples.every(s=>s.status==="rendered")?"rendered":"rejected";await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");
if(manifest.status==="rejected")process.exitCode=1;
