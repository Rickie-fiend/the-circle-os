// Independent checks of the exported material artifacts, not a test suite.
import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {materialDomain,scanlineIntervals} from "./lib/imprint-network-geometry.mjs";

const base="docs/design/personal-imprint-material-v1",hash=value=>createHash("sha256").update(value).digest("hex");
const settingsBytes=await readFile(`${base}.json`),settings=JSON.parse(settingsBytes),report=JSON.parse(await readFile(`${base}-inspection.json`,"utf8"));
const step4=JSON.parse(await readFile(settings.geometryInspection,"utf8"));
const files=await Promise.all(Object.entries(report.outputs).map(async([name,output])=>({name,...output,bytes:await readFile(output.path)})));
const outputChecks=[];
for(const file of files){const metadata=await sharp(file.bytes).metadata(),expected=file.name==="390"?[390,585]:["crown","shoulder","lower"].includes(file.name)?[820,undefined]:[settings.width,settings.height];outputChecks.push({name:file.name,hash:hash(file.bytes),hashMatches:hash(file.bytes)===file.hash,width:metadata.width,height:metadata.height,dimensionsMatch:metadata.width===expected[0]&&(!expected[1]||metadata.height===expected[1])});}
const full=files.find(f=>f.name==="full"),phone=files.find(f=>f.name==="390"),{data,info}=await sharp(full.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const geometrySpec=JSON.parse(await readFile("docs/design/personal-imprint-flow-network-v4.json","utf8")),map=JSON.parse(await readFile(geometrySpec.structure,"utf8")),domain=materialDomain(map);
let outsideMaterialPixels=0,changedMaterialPixels=0,clippedPixels=0,opaquePixels=0,minChannel=255,maxChannel=0;
const background=settings.palette.background;
// The 3x render is reduced with an antialias filter. Allow its 2px edge halo,
// while checking every deeper void/background pixel remains the exact Ink.
for(let y=0;y<info.height;y++){
 const intervals=scanlineIntervals(domain.boundaries,y+.5),nearby=[-2,-1,0,1,2].flatMap(d=>scanlineIntervals(domain.boundaries,y+.5+d));
 for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*4,changed=background.some((v,k)=>Math.abs(data[i+k]-v)>1),inside=intervals.some(([a,b])=>x+.5>=a&&x+.5<b),near=nearby.some(([a,b])=>x+.5>=a-2&&x+.5<=b+2);
  if(changed&&inside)changedMaterialPixels++;if(changed&&!near)outsideMaterialPixels++;
  if(data[i+3]===255)opaquePixels++;
  for(let c=0;c<3;c++){minChannel=Math.min(minChannel,data[i+c]);maxChannel=Math.max(maxChannel,data[i+c]);if(data[i+c]===255)clippedPixels++;}
 }
}
const geometryHash=hash(await readFile(settings.geometry)),rendererHash=hash(await readFile("scripts/render-imprint-material.mjs")),rendererModuleHash=hash(await readFile("scripts/lib/imprint-material-renderer.mjs"));
const expectedPhone=await sharp(full.bytes).resize({width:390,kernel:settings.resamplingKernel}).png().toBuffer();
let review;try{review=JSON.parse(await readFile(`${base}-visual-review.json`,"utf8"));}catch{review={status:"pending"};}
const reviewMatches=review.geometryHash===geometryHash&&review.renderHash===hash(full.bytes)&&review.settingsHash===hash(settingsBytes)&&review.rendererHash===rendererHash&&review.rendererModuleHash===rendererModuleHash;
report.independentInspection={outputChecks,geometryHash,rendererHash,rendererModuleHash,inspectorHash:hash(await readFile("scripts/inspect-imprint-material.mjs")),outsideMaterialPixels,changedMaterialPixels,clippedPixels,opaquePixels,minChannel,maxChannel,phoneMatchesFull:hash(expectedPhone)===hash(phone.bytes)};
report.gates={...report.gates,acceptedGeometry:step4.readyForStep5&&Object.values(step4.gates).every(Boolean),geometryUnchanged:geometryHash===settings.geometryHash&&geometryHash===report.geometryHash&&geometryHash===step4.geometryHash,currentSettings:hash(settingsBytes)===report.settingsHash,currentRenderer:rendererHash===report.rendererHash&&rendererModuleHash===report.rendererModuleHash,outputHashes:outputChecks.every(c=>c.hashMatches)&&hash(full.bytes)===report.renderHash,dimensions:outputChecks.every(c=>c.dimensionsMatch),preservedVoids:outsideMaterialPixels===0,unclipped:clippedPixels===0&&report.material.clippedHighlights===0,opaque:opaquePixels===info.width*info.height,phoneMatchesFull:hash(expectedPhone)===hash(phone.bytes),allStrandsRepresented:report.strands.represented===report.strands.count};
report.visualReview=reviewMatches?review:{status:"pending"};
report.materialChecksPass=Object.values(report.gates).every(Boolean);
report.readyForDeveloperReview=report.materialChecksPass&&reviewMatches&&["pass","review-with-limitations"].includes(review.status);
report.finalArtworkAccepted=false;
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({gates:report.gates,independentInspection:report.independentInspection,visualReview:report.visualReview,readyForDeveloperReview:report.readyForDeveloperReview}));
if(!report.materialChecksPass)process.exitCode=1;
