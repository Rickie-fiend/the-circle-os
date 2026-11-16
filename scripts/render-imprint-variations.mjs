import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createPersonalImprintRecipe,retainPersonalImprintRecipe} from "../app/os/home/imprint-personal-recipe.js";
import {personalImprintSamples,reorderSampleInput,correctedSampleInput} from "../app/os/home/imprint-personal-samples.js";
import {materialDomain,createSurfaceQuery} from "./lib/imprint-network-geometry.mjs";
import {deformPersonalImprint} from "./lib/imprint-personal-geometry.mjs";
import {inspectImprintGeometry} from "./lib/imprint-geometry-inspection.mjs";
import {renderImprintMaterial} from "./lib/imprint-material-renderer.mjs";

const base="docs/design/personal-imprint-personal-v1",hash=v=>createHash("sha256").update(typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest("hex");
const baseBytes=await readFile("docs/design/personal-imprint-flow-network-v4-geometry.json"),baseGeometry=JSON.parse(baseBytes),baseGeometryHash=hash(baseBytes);
const settingsBytes=await readFile("docs/design/personal-imprint-material-v1.json"),settings=JSON.parse(settingsBytes),baseReport=JSON.parse(await readFile(settings.geometryInspection,"utf8"));
if(baseGeometryHash!==settings.geometryHash||!baseReport.readyForStep5)throw Error("The inspected base geometry is required.");
const spec=JSON.parse(await readFile("docs/design/personal-imprint-flow-network-v4.json","utf8")),domain=materialDomain(JSON.parse(await readFile(spec.structure,"utf8"))),surfaceAt=createSurfaceQuery(baseGeometry.surface);
const codePaths=["app/os/home/imprint-personal-recipe.js","app/os/home/imprint-personal-samples.js","scripts/lib/imprint-personal-geometry.mjs","scripts/lib/imprint-geometry-inspection.mjs","scripts/lib/imprint-material-renderer.mjs","scripts/render-imprint-variations.mjs"],sourceHashes={};
for(const path of codePaths)sourceHashes[path]=hash(await readFile(path));
const manifest={version:1,status:"building",baseGeometryHash,materialSettingsHash:hash(settingsBytes),sourceHashes,baseline:{path:"docs/design/personal-imprint-material-v1-full.png",hash:hash(await readFile("docs/design/personal-imprint-material-v1-full.png"))},samples:[],readyForReview:false,limitations:["Working visual baseline retains cut-looking entries and less layered volume than the reference.","Fixed topology and bounded deformations only; no answer-to-fold semantics or uniqueness guarantee.","Synthetic inputs and in-memory retention only; no account storage or production Home integration."]};
await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");
for(const sample of personalImprintSamples){
 console.log(`Building ${sample.label}…`);
 const recipe=await createPersonalImprintRecipe(sample.input),recipeHash=hash(recipe),outputBase=`${base}-${sample.id}`;
 const {geometry,domain:variantDomain,bounds,minJacobianBound}=deformPersonalImprint(baseGeometry,domain,recipe,surfaceAt),inspection=inspectImprintGeometry(geometry,variantDomain);
 const geometryHash=hash(geometry),gates={...inspection.gates,topology:geometry.strands.length===baseGeometry.strands.length&&geometry.surface.triangles.length===baseGeometry.surface.triangles.length&&variantDomain.boundaries.length===domain.boundaries.length,invertible:minJacobianBound>0,comfortableBounds:bounds.left>=24&&bounds.right<=1000&&bounds.top>=24&&bounds.bottom<=1512};
 const checks={repeatSame:hash(await createPersonalImprintRecipe(sample.input))===recipeHash,orderSame:hash(await createPersonalImprintRecipe(reorderSampleInput(sample.input)))===recipeHash,correctionRetained:(await retainPersonalImprintRecipe(recipe,correctedSampleInput(sample.input)))===recipe,freshCorrectionDifferent:hash(await createPersonalImprintRecipe(correctedSampleInput(sample.input)))!==recipeHash,feelingExcluded:hash(await createPersonalImprintRecipe({...sample.input,feeling:0,answers:{...sample.input.answers,feeling:10}}))===recipeHash};
 const record={id:sample.id,label:sample.label,description:sample.description,recipe,recipeHash,geometryHash,bounds,minJacobianBound,geometryInspection:inspection.inspection,gates,checks,status:"rejected"};
 await writeFile(`${outputBase}-recipe.json`,JSON.stringify(recipe,null,2)+"\n");
 if(Object.values(gates).every(Boolean)&&Object.values(checks).every(Boolean)){
  const rendered=await renderImprintMaterial({geometry,settings,base:outputBase,log:message=>console.log(`${sample.label}: ${message}`)});
  Object.assign(record,rendered);record.status="rendered";
  record.gates.finiteShading=rendered.material.nonfiniteShades===0;record.gates.unclippedShading=rendered.material.clippedHighlights===0;record.gates.allStrandsRepresented=rendered.strands.represented===rendered.strands.count;
 }
 await writeFile(`${outputBase}-inspection.json`,JSON.stringify(record,null,2)+"\n");
 manifest.samples.push(record);console.log(JSON.stringify({sample:sample.id,status:record.status,gates,checks,inspection:inspection.inspection}));
}
manifest.status=manifest.samples.every(s=>s.status==="rendered"&&Object.values(s.gates).every(Boolean)&&Object.values(s.checks).every(Boolean))?"rendered":"rejected";
manifest.baseUnchanged=hash(await readFile("docs/design/personal-imprint-flow-network-v4-geometry.json"))===baseGeometryHash;
await writeFile(`${base}-inspection.json`,JSON.stringify(manifest,null,2)+"\n");
if(manifest.status!=="rendered"||!manifest.baseUnchanged)process.exitCode=1;
