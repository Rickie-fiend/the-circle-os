// Construction diagrams only. Does not modify the reference or artwork masters.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base="docs/design/personal-imprint-structure-v1";
const map=JSON.parse(await readFile(`${base}.json`,"utf8"));
const [,,width,height]=map.viewBox;
const escape=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
const ink="#191813",bone="#F1EFE8";

// Sample the authored cubic boundaries for source-level geometry inspection.
function sample(path) {
  const tokens=path.match(/[MCZ]|-?\d+(?:\.\d+)?/g);
  const points=[];let cursor=0,current;
  while(cursor<tokens.length){
    const command=tokens[cursor++];
    if(command==="M"){current=[Number(tokens[cursor++]),Number(tokens[cursor++])];points.push(current);}
    else if(command==="C"){
      if(!current)throw Error("Curve without a start");
      const a=current,b=[Number(tokens[cursor++]),Number(tokens[cursor++])],c=[Number(tokens[cursor++]),Number(tokens[cursor++])],d=[Number(tokens[cursor++]),Number(tokens[cursor++])];
      for(let i=1;i<=32;i++){const t=i/32,s=1-t;points.push([s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]]);}
      current=d;
    }else if(command==="Z")points.push(points[0]);
    else throw Error(`Unsupported command ${command}`);
  }
  if(points.some(p=>p.some(n=>!Number.isFinite(n))||p[0]<0||p[0]>width||p[1]<0||p[1]>height))throw Error("Boundary outside reference");
  return points;
}
function inside(point,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [x,y]=point,[ax,ay]=polygon[i],[bx,by]=polygon[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
}return result;}
const outer=sample(map.silhouette.path),holes=map.voids.filter(v=>v.kind==="enclosed opening").map(v=>sample(v.path));
const material=p=>inside(p,outer)&&!holes.some(h=>inside(p,h));
function selfCrosses(polygon){
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let i=0;i<polygon.length-1;i++)for(let j=i+2;j<polygon.length-1;j++){
    if(i===0&&j===polygon.length-2)continue;
    const a=polygon[i],b=polygon[i+1],c=polygon[j],d=polygon[j+1];
    if(cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8)return true;
  }
  return false;
}
const all=[map.silhouette,...map.voids,...map.bundles,...map.folds,...map.uncertain];
if(new Set(all.map(r=>r.id)).size!==all.length)throw Error("Duplicate region ID");
for(const region of all)sample(region.path);
for(const region of [map.silhouette,...map.voids,...map.bundles,...map.uncertain]){
  if(!region.path.endsWith("Z"))throw Error(`Open area ${region.id}`);
  if(selfCrosses(sample(region.path)))throw Error(`Self-crossing area ${region.id}`);
}
for(const v of map.voids){
  const points=sample(v.path);
  if(v.kind==="enclosed opening"&&points.some(p=>!inside(p,outer)))throw Error(`Hole outside envelope ${v.id}`);
  if(v.kind==="exterior connected gap"&&points.some(p=>inside(p,outer)))throw Error(`Exterior gap enters envelope ${v.id}`);
}
for(const f of map.folds)if(f.bundles.some(id=>!map.bundles.some(b=>b.id===id)))throw Error(`Unknown fold bundle ${f.id}`);
const territories=map.bundles.map(b=>sample(b.path));
let materialSamples=0,unassignedSamples=0;
for(let y=2;y<height;y+=4)for(let x=2;x<width;x+=4)if(material([x,y])){
  materialSamples++;if(!territories.some(p=>inside([x,y],p)))unassignedSamples++;
}
const guideInspection=map.bundles.map(bundle=>{
  const points=sample(bundle.guide),territory=sample(bundle.path);
  return {id:bundle.id,samples:points.length,outsideMaterial:points.filter(p=>!material(p)).length,outsideBundle:points.filter(p=>!inside(p,territory)).length};
});
const areaPath=[map.silhouette.path,...map.voids.filter(v=>v.kind==="enclosed opening").map(v=>v.path)].join(" ");
const defs=`<defs><clipPath id="material"><path d="${areaPath}" clip-rule="evenodd"/></clipPath><marker id="flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${bone}"/></marker></defs>`;
const label=(r,fill=bone)=>`<g><circle cx="${r.anchor[0]}" cy="${r.anchor[1]}" r="20" fill="${ink}" stroke="${fill}" stroke-width="2"/><text x="${r.anchor[0]}" y="${r.anchor[1]+6}" text-anchor="middle" fill="${fill}" font-size="18" font-weight="600">${r.id}</text></g>`;
const ref=await readFile(map.reference);
const font=await readFile("public/fonts/geist-latin.woff2");
const fontStyle=`<style>@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font.toString("base64")}) format('woff2');font-weight:100 900}</style>`;
const {width:rw,height:rh}=await sharp(ref).metadata();
if(rw!==width||rh!==height)throw Error("Map/reference dimensions disagree");
const legend=(title)=>`<rect x="1024" width="530" height="1536" fill="${ink}"/><text x="1060" y="65" font-size="28" fill="${bone}">${title}</text><text x="1060" y="100" font-size="17" fill="${bone}">Construction map · step 1 · not final art</text>${[
  "BOUNDARIES", "S1   Outer envelope",...map.voids.map(v=>`${v.id}   ${v.name}`),"", "BUNDLE TERRITORIES",...map.bundles.map(b=>`${b.id}   ${b.name}`),"", "FOLD JUNCTIONS · provisional",...map.folds.map(f=>`${f.id}   ${f.name}`),"", "UNCERTAIN · do not infer holes",...map.uncertain.map(u=>`${u.id}   ${u.name}`),"U3   Unassigned rim / transitions", "", "Solid lines: visible boundaries", "Arrows: visible flow only", "Dashed lines: uncertain / fold guides", "Territory overlaps do not decide depth.", `Grey reserve: ${(100*unassignedSamples/materialSamples).toFixed(1)}% of material (sampled).`, "No hidden strand connections inferred."
].map((line,i)=>`<text x="1060" y="${155+i*36}" font-size="19" fill="${bone}">${escape(line)}</text>`).join("")}`;
function svg(mode){
  const silhouette=mode==="silhouette";
  const reference=mode==="overlay"?`<image width="1024" height="1536" href="data:image/png;base64,${ref.toString("base64")}"/>`:"";
  const regions=silhouette?"":`<g clip-path="url(#material)">${map.bundles.map(b=>`<path id="${b.id}" d="${b.path}" fill="${b.tone}" fill-opacity="${mode==="overlay"?.12:.47}" stroke="${b.tone}" stroke-width="2"/>`).join("")}</g>`;
  const guides=silhouette?"":map.bundles.map(b=>`<path d="${b.guide}" fill="none" stroke="${bone}" stroke-width="3" marker-end="url(#flow)"/>`).join("");
  const voids=silhouette?"":map.voids.map(v=>`<path d="${v.path}" fill="none" stroke="${bone}" stroke-width="2" stroke-dasharray="${v.kind==="enclosed opening"?"none":"5 7"}"/>`).join("");
  const folds=silhouette?"":map.folds.map(f=>{const p=sample(f.path)[Math.floor(sample(f.path).length/2)];return `<path d="${f.path}" fill="none" stroke="#E36B37" stroke-width="3" stroke-dasharray="8 6"/>${label({...f,anchor:p},"#E36B37")}`;}).join("");
  const uncertain=silhouette?"":map.uncertain.map(u=>`<path d="${u.path}" fill="none" stroke="${bone}" stroke-width="2" stroke-dasharray="4 7"/>${label(u)}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1554 1536" role="img" aria-labelledby="title desc" font-family="Geist, Arial, sans-serif"><title id="title">Personal Imprint structure — ${mode}</title><desc id="desc">Authored boundaries in reference coordinates. Shaded recesses remain uncertain material. Colours identify construction territories only.</desc>${defs}<rect width="1554" height="1536" fill="${ink}"/>${reference}${mode==="overlay"?"":`<path d="${areaPath}" fill="${silhouette?bone:"#403E35"}" fill-rule="evenodd"/>`}${regions}<path d="${map.silhouette.path}" fill="none" stroke="${bone}" stroke-width="2"/>${voids}${guides}${folds}${uncertain}${silhouette?"":[...map.bundles,...map.voids].map(r=>label(r,r.tone||bone)).join("")}${legend(silhouette?"Filled / empty":mode==="overlay"?"Reference + structure":"Structure only")}</svg>\n`;
}
for(const mode of ["overlay","structure","silhouette"]){
  const text=svg(mode),destination=mode==="structure"?base:`${base}-${mode}`;
  const portable=text.replace("<defs>",`${fontStyle}<defs>`);
  await writeFile(`${destination}.svg`,portable);
  await sharp(Buffer.from(portable)).png().toFile(`${destination}.png`);
}
await mkdir("outputs/imprint",{recursive:true});
await sharp(`${base}-overlay.png`).extract({left:240,top:300,width:360,height:300}).resize({width:1080}).png().toFile("outputs/imprint/structure-v1-shoulder-detail.png");
await sharp(`${base}-overlay.png`).extract({left:300,top:770,width:440,height:480}).resize({width:880}).png().toFile("outputs/imprint/structure-v1-lower-detail.png");
const report={source:map.reference,areas:all.length,bundles:map.bundles.length,boundarySampling:"32 samples per cubic; proper segment crossing inspection",guideInspection,coverage:{gridSpacing:4,materialSamples,unassignedSamples,unassignedPercent:100*unassignedSamples/materialSamples},views:["overlay","structure","silhouette"]};
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
if(guideInspection.some(g=>g.outsideMaterial||g.outsideBundle))process.exitCode=1;
