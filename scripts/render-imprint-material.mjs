// Canonical Step 5 entry point; personal variations share the exact material renderer.
import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {renderImprintMaterial} from "./lib/imprint-material-renderer.mjs";
const base="docs/design/personal-imprint-material-v1";
const hash=value=>createHash("sha256").update(value).digest("hex");
const settingsBytes=await readFile(`${base}.json`),settings=JSON.parse(settingsBytes),geometryBytes=await readFile(settings.geometry),geometryHash=hash(geometryBytes),inspection=JSON.parse(await readFile(settings.geometryInspection,"utf8"));
if(geometryHash!==settings.geometryHash||inspection.geometryHash!==geometryHash||!inspection.readyForStep5)throw Error("Material rendering requires the accepted Step 4 geometry/hash.");
const rendered=await renderImprintMaterial({geometry:JSON.parse(geometryBytes),settings,base,log:console.log}),geometryUnchanged=hash(await readFile(settings.geometry))===geometryHash;
const report={version:1,geometryHash,settingsHash:hash(settingsBytes),rendererHash:hash(await readFile("scripts/render-imprint-material.mjs")),rendererModuleHash:hash(await readFile("scripts/lib/imprint-material-renderer.mjs")),...rendered,geometryUnchanged,step4Gates:inspection.gates,gates:{acceptedGeometry:inspection.readyForStep5,geometryUnchanged,finite:rendered.material.nonfiniteShades===0,unclipped:rendered.material.clippedHighlights===0},visualReview:{status:"pending"},readyForDeveloperReview:false};
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
if(Object.values(report.gates).some(v=>!v))process.exitCode=1;
