// Independent inspection of the exact current geometry and rendered image.
import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {materialDomain} from "./lib/imprint-network-geometry.mjs";
import {inspectImprintGeometry} from "./lib/imprint-geometry-inspection.mjs";
const base="docs/design/personal-imprint-flow-network-v4",hash=data=>createHash("sha256").update(data).digest("hex");
const spec=JSON.parse(await readFile(`${base}.json`,"utf8")),report=JSON.parse(await readFile(`${base}-inspection.json`,"utf8")),raw=await readFile(`${base}-geometry.json`,"utf8"),geometry=JSON.parse(raw),endpoints=JSON.parse(await readFile(`${base}-endpoints.json`,"utf8")),map=JSON.parse(await readFile(spec.structure,"utf8")),domain=materialDomain(map);
if(hash(raw)!==report.geometryHash||hash(await readFile(`${base}-full.png`))!==report.renderHash||hash(JSON.stringify(spec))!==report.sourceHash)throw Error("Stale geometry/render/source report");
const result=inspectImprintGeometry(geometry,domain,{surfaceThickness:spec.surfaceThickness,endpoints});
let review;try{review=JSON.parse(await readFile(`${base}-visual-review.json`,"utf8"));}catch{review={status:"pending"};}
const currentReview=review.geometryHash===report.geometryHash&&review.renderHash===report.renderHash;
report.independentInspection={geometryHash:report.geometryHash,...result.inspection};
report.gates={...report.gates,...result.gates,visual:currentReview&&review.status==="pass"};
report.visualReview=currentReview?review:{status:"pending",geometryHash:report.geometryHash,renderHash:report.renderHash};
report.readyForStep5=Object.values(report.gates).every(Boolean);
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({independentInspection:report.independentInspection,gates:report.gates,readyForStep5:report.readyForStep5}));if(!report.readyForStep5)process.exitCode=1;
