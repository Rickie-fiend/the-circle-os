import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {materialDomain,buildMaterialMesh,rasterDepth,createSurfaceQuery} from "./lib/imprint-network-geometry.mjs";
import {buildFlow} from "./lib/imprint-network-flow.mjs";
import {concealStrandEnds} from "./lib/imprint-network-ends.mjs";
import {resolveForegroundCrossings} from "./lib/imprint-network-crossings.mjs";
const base="docs/design/personal-imprint-flow-network-v4",spec=JSON.parse(await readFile(`${base}.json`,"utf8")),map=JSON.parse(await readFile(spec.structure,"utf8")),domain=materialDomain(map);
const hash=v=>createHash("sha256").update(typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest("hex");
console.log("Building continuous flow atlas and independent material surface…");
const flow=await buildFlow(spec,map,domain),{width:W,height:H}=flow;
const mesh=buildMaterialMesh(domain,flow.heightAt,4);
mesh.faceFolds=mesh.triangles.map(tri=>{const p=tri.map(i=>mesh.vertices[i]);return `N${flow.familyAt(p.reduce((s,v)=>s+v[0],0)/3,p.reduce((s,v)=>s+v[1],0)/3)+1}`;});
console.log(JSON.stringify({surfaceVertices:mesh.vertices.length,surfaceTriangles:mesh.triangles.length,wholeTrajectories:flow.curves.length}));
const depth=rasterDepth(mesh,W,H);
const surfaceAt=createSurfaceQuery(mesh,(x,y)=>`N${flow.familyAt(x,y)+1}`);
const strands=[],endpointReport=[];let unsupported=0,nonfinite=0,omittedShort=0;
for(const curve of flow.curves){let points=curve.points;
 if(!curve.closed&&points.length<24){omittedShort++;continue;}
 // Sample the subpixel depth turn densely. Visible paths reach their actual
 // geometric port; there is no 20px blank allowance before a hidden endpoint.
 if(!curve.closed){const first=points[0],second=points[1],last=points.at(-1),before=points.at(-2),start=Array.from({length:16},(_,i)=>first.map((v,k)=>v+(second[k]-v)*i/16)),end=Array.from({length:17},(_,i)=>before.map((v,k)=>v+(last[k]-v)*i/16));points=[...start,...points.slice(1,-1),...end.slice(1)];}
 const route=[];let valid=true;
 for(let i=0;i<points.length;i++){const[x,y]=points[i],surface=surfaceAt(x,y);if(!surface){valid=false;break;}const first=points[0],last=points.at(-1),endDistance=Math.min(Math.hypot(x-first[0],y-first[1]),Math.hypot(x-last[0],y-last[1])),t=Math.min(1,endDistance),smooth=t*t*(3-2*t),offset=curve.closed?.35:-16+16.35*smooth;route.push([x,y,surface.z+offset]);}
 if(!valid){unsupported++;continue;}
 const id=`${spec.families[curve.family].id}/${curve.id}`,ends=[];
 if(!curve.closed)for(const side of [0,route.length-1]){const p=route[side],support=surfaceAt(p[0],p[1]);const end={id,side:side===0?"start":"end",coveringFold:support.fold,coveringTriangle:support.triangle,clearance:support.z-p[2]};endpointReport.push(end);ends.push(end);}
 if(route.some(p=>p.some(n=>!Number.isFinite(n))))nonfinite++;
 strands.push({id,family:spec.families[curve.family].id,closed:curve.closed,route,ends});
}
const concealed=concealStrandEnds(strands,surfaceAt);endpointReport.length=0;endpointReport.push(...concealed.endpoints);
const localUnderpasses=resolveForegroundCrossings(strands,surfaceAt);
console.log(JSON.stringify({concealedEnds:endpointReport.length,failedConcealments:concealed.failures,maxLocalExtension:concealed.maxExtension}));
const rgba=new Uint8Array(W*H*4),diagnostic=new Uint8Array(W*H*4),surfaceImage=new Uint8Array(W*H*4),population=new Float32Array(W*H).fill(10000);
for(let i=0;i<W*H;i++){rgba.set([25,24,19,255],i*4);diagnostic.set([25,24,19,255],i*4);surfaceImage.set(Number.isFinite(depth[i])?[194,191,179,255]:[25,24,19,255],i*4);}
function draw(strand,target,showHidden=false){const coverage=new Map();for(let i=1;i<strand.route.length;i++){const a=strand.route[i-1],b=strand.route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let j=0;j<=steps;j++){const t=j/(steps||1),p=a.map((v,k)=>v+(b[k]-v)*t),surface=surfaceAt(p[0],p[1]);if(!surface)continue;const isVisible=p[2]>=surface.z-.05;if(!showHidden&&!isVisible)continue;const x=Math.floor(p[0]),y=Math.floor(p[1]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const px=x+dx,py=y+dy;if(px<0||px>=W||py<0||py>=H)continue;const d=Math.hypot(px+.5-p[0],py+.5-p[1]),alpha=Math.max(0,Math.min(1,spec.strandWidth/2+.5-d)),index=py*W+px;coverage.set(index,Math.max(coverage.get(index)||0,alpha));if(isVisible)population[index]=Math.min(population[index],d);}}}
 for(const[index,alpha]of coverage){const shade=showHidden?235:200;for(let c=0;c<3;c++){const value=c===2?shade-8:shade;target[index*4+c]=Math.round(target[index*4+c]*(1-alpha)+value*alpha);}}}
for(let i=0;i<strands.length;i++){draw(strands[i],rgba);if(i%43===0)draw(strands[i],diagnostic,true);}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x;if(x)population[p]=Math.min(population[p],population[p-1]+1);if(y)population[p]=Math.min(population[p],population[p-W]+1);if(x&&y)population[p]=Math.min(population[p],population[p-W-1]+Math.SQRT2);}
for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const p=y*W+x;if(x<W-1)population[p]=Math.min(population[p],population[p+1]+1);if(y<H-1)population[p]=Math.min(population[p],population[p+W]+1);if(x<W-1&&y<H-1)population[p]=Math.min(population[p],population[p+W+1]+Math.SQRT2);}
let expected=0,covered=0,interiorGaps=0,populated=0;const gaps=new Uint8Array(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const index=y*W+x;let color=[25,24,19,255];if(flow.mask[index]){expected++;if(surfaceAt(x+.5,y+.5)){covered++;if(population[index]<=spec.populationRadius){populated++;color=[118,137,116,255];}else color=[227,107,55,255];}else{interiorGaps++;color=[241,239,232,255];}}gaps.set(color,index*4);}
const geometry={version:4,sourceHash:hash(spec),surface:mesh,strands};
const geometryHash=hash(geometry);
await writeFile(`${base}-geometry.json`,JSON.stringify(geometry));
for(const[name,data]of[["full",rgba],["routes",diagnostic],["surface",surfaceImage],["coverage",gaps]])await sharp(data,{raw:{width:W,height:H,channels:4}}).png().toFile(`${base}-${name}.png`);
await sharp(rgba,{raw:{width:W,height:H,channels:4}}).resize({width:390}).png().toFile(`${base}-390.png`);
for(const[name,left,top,width,height]of[["crown",520,80,420,410],["shoulder",245,330,310,270],["lower",300,1000,410,350]])await sharp(rgba,{raw:{width:W,height:H,channels:4}}).extract({left,top,width,height}).resize({width:820}).png().toFile(`${base}-${name}.png`);
const report={version:4,sourceHash:hash(spec),geometryHash,renderHash:hash(await readFile(`${base}-full.png`)),surface:{vertices:mesh.vertices.length,triangles:mesh.triangles.length,expectedSamples:expected,supportedSamples:covered,coverage:covered/expected,missingSamples:interiorGaps,independentOfStrandCount:true},strands:{count:strands.length,unresolvedTrajectories:flow.rejected,omittedShort,unsupported,nonfinite,visiblePopulation:populated/expected,populationRadius:spec.populationRadius,explicitlyUnbranched:true},endpoints:{count:endpointReport.length,exposed:endpointReport.filter(e=>e.clearance<.5).length,namedFoldCheck:true,minimumClearance:Math.min(...endpointReport.map(e=>e.clearance))},gates:{coverage:covered/expected>=.99,interiorGaps:interiorGaps===0,support:unsupported===0,finite:nonfinite===0,endpoints:endpointReport.every(e=>e.clearance>=.5),population:populated/expected>=.99},visualReview:{status:"pending",geometryHash},readyForStep5:false};
report.construction={method:"shared boundary-conforming surface atlas; authored courses refined by reference ridge direction",localUnderpasses,concealmentFailures:concealed.failures,maxLocalExtension:concealed.maxExtension};
report.gates.endpoints=report.gates.endpoints&&concealed.failures===0&&endpointReport.length===2*strands.filter(s=>!s.closed).length;
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");await writeFile(`${base}-endpoints.json`,JSON.stringify(endpointReport));console.log(JSON.stringify(report));
if(Object.values(report.gates).some(v=>!v))process.exitCode=1;
