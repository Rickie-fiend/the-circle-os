import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const base="docs/design/personal-imprint-bundle-routes-v1";
const spec=JSON.parse(await readFile(`${base}.json`,"utf8"));
const map=JSON.parse(await readFile(spec.structure,"utf8"));
const ink="#191813",bone="#F1EFE8";
function sample(path,steps=100){const tokens=path.match(/[MCZ]|-?\d+(?:\.\d+)?/g);let i=0,p;const out=[];while(i<tokens.length){const cmd=tokens[i++];if(cmd==="M"){p=[+tokens[i++],+tokens[i++]];out.push(p);}else if(cmd==="C"){const a=p,b=[+tokens[i++],+tokens[i++]],c=[+tokens[i++],+tokens[i++]],d=[+tokens[i++],+tokens[i++]];for(let j=1;j<=steps;j++){const t=j/steps,s=1-t;out.push([s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]]);}p=d;}else if(cmd==="Z")out.push(out[0]);else throw Error("Invalid cubic path");}return out;}
function inside([x,y],p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
const outer=sample(map.silhouette.path),holes=map.voids.filter(v=>v.kind==="enclosed opening").map(v=>sample(v.path));
const material=p=>inside(p,outer)&&!holes.some(h=>inside(p,h));
function resample(points,count=200){const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return Array.from({length:count+1},(_,n)=>{const distance=n/count*distances.at(-1);let i=1;while(i<distances.length-1&&distances[i]<distance)i++;const t=(distance-distances[i-1])/(distances[i]-distances[i-1]);return points[i].map((v,k)=>points[i-1][k]+t*(v-points[i-1][k]));});}
function widthAt(stations,u){let i=1;while(i<stations.length-1&&stations[i][0]<u)i++;const [a,wa]=stations[i-1],[b,wb]=stations[i];const t=(u-a)/(b-a),s=t*t*(3-2*t);return wa+(wb-wa)*s;}
function curve(points){let d=`M ${points[0].join(" ")}`;for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];d+=` C ${b.map((v,k)=>v+(c[k]-a[k])/6).join(" ")} ${c.map((v,k)=>v-(e[k]-b[k])/6).join(" ")} ${c.join(" ")}`;}return d;}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const report=[];
const routes=spec.bundles.map(b=>{
  const territory=map.bundles.find(t=>t.id===b.id),polygon=sample(territory.path),center=resample(sample(territory.guide)),left=[],right=[];
  if(b.widths[0][0]!==0||b.widths.at(-1)[0]!==1||b.widths.some(([u,w],i)=>!Number.isFinite(u)||!Number.isFinite(w)||w<=0||(i&&u<=b.widths[i-1][0])))throw Error(`Invalid widths ${b.id}`);
  for(let i=0;i<center.length;i++){const a=center[Math.max(0,i-1)],c=center[Math.min(center.length-1,i+1)],n=Math.hypot(c[0]-a[0],c[1]-a[1]);const half=widthAt(b.widths,i/(center.length-1))/2,dx=-(c[1]-a[1])/n*half,dy=(c[0]-a[0])/n*half;left.push([center[i][0]+dx,center[i][1]+dy]);right.push([center[i][0]-dx,center[i][1]-dy]);}
  const l=curve(left),r=curve(right),boundary=l+" "+curve(right.toReversed()).replace(/^M/,"L")+" Z";
  let outsideMaterial=0,outsideTerritory=0,reversedCells=0,crossedSections=0;
  for(let i=0;i<center.length;i++)for(let k=0;k<=16;k++){const t=k/16,p=left[i].map((v,j)=>v*(1-t)+right[i][j]*t);if(!material(p))outsideMaterial++;if(!inside(p,polygon))outsideTerritory++;}
  for(const p of [...sample(l,8),...sample(r,8)]){if(!material(p))outsideMaterial++;if(!inside(p,polygon))outsideTerritory++;}
  for(let i=0;i<center.length-1;i++){if(cross(left[i],right[i],left[i+1])<=0||cross(right[i],right[i+1],left[i+1])<=0)reversedCells++;for(let j=i+2;j<center.length;j++)if(cross(left[i],right[i],left[j])*cross(left[i],right[i],right[j])<0&&cross(left[j],right[j],left[i])*cross(left[j],right[j],right[i])<0)crossedSections++;}
  report.push({id:b.id,sections:center.length,outsideMaterial,outsideTerritory,reversedCells,crossedSections});
  return {...territory,left,right,center,l,r,boundary};
});
const territories=map.bundles.map(b=>sample(b.path));let reserve=0,unowned=0;const assigned={};
for(let y=2;y<1536;y+=4)for(let x=2;x<1024;x+=4)if(material([x,y])&&!territories.some(p=>inside([x,y],p))){reserve++;const owners=spec.reserveOwnership.filter(r=>x>=r.bounds[0]&&x<r.bounds[2]&&y>=r.bounds[1]&&y<r.bounds[3]);if(owners.length!==1)unowned++;else assigned[owners[0].owner]=(assigned[owners[0].owner]||0)+1;}
const reference=await readFile(map.reference),font=await readFile("public/fonts/geist-latin.woff2");
const style=`<style>@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font.toString("base64")})}text{font-family:Geist,Arial,sans-serif}</style>`;
for(const mode of ["overlay","ribbons","sections"]){
  const shapes=routes.map(r=>`<g><path d="${r.boundary}" fill="${r.tone}" fill-opacity="${mode==="overlay"?.3:.7}"/><path d="${r.l}" fill="none" stroke="${bone}" stroke-width="2"/><path d="${r.r}" fill="none" stroke="${bone}" stroke-width="2"/>${mode==="sections"?r.left.filter((_,i)=>i%10===0).map((p,j)=>`<path d="M${p.join(" ")} L${r.right[j*10].join(" ")}" stroke="${bone}" stroke-width="1"/>`).join(""):""}<text x="${r.center[100][0]+12}" y="${r.center[100][1]}" fill="${bone}" font-size="22">${r.id}</text></g>`).join("");
  const text=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1554 1536" role="img" aria-label="Bundle routes ${mode}">${style}<rect width="1554" height="1536" fill="${ink}"/>${mode==="overlay"?`<image width="1024" height="1536" href="data:image/png;base64,${reference.toString("base64")}"/>`:""}<path d="${map.silhouette.path}" fill="none" stroke="#77746A" stroke-width="2"/>${map.voids.map(v=>`<path d="${v.path}" fill="none" stroke="#77746A" stroke-width="2"/>`).join("")}${shapes}<text x="1050" y="80" fill="${bone}" font-size="30">Bundle routes · ${mode}</text>${["Step 2 construction", "Paired rails / controlled full widths", "Cross-sections retain across-bundle position", "",...routes.map(r=>`${r.id}   ${r.name}`),"", "Open ports are not strand ends.", "Overlaps do not establish depth.", "Hidden continuations: step 3.", "U3 ownership does not extend rails.", "No clipping or nearest-end joins.", "Dense threads / lighting: steps 4–5."].map((line,i)=>`<text x="1050" y="${135+i*40}" fill="${bone}" font-size="18">${line}</text>`).join("")}</svg>`;
  await writeFile(`${base}-${mode}.svg`,text);await sharp(Buffer.from(text)).png().toFile(`${base}-${mode}.png`);
}
const result={routes:report,reserve:{samples:reserve,unowned,assigned},scope:"Sampled projected geometry inspection, not final appearance or analytic proof"};
await writeFile(`${base}-geometry.json`,JSON.stringify({version:1,source:`${base}.json`,meaning:"Paired projected rails and 201 ordered sections per bundle. No physical depth or hidden connections.",routes:routes.map(r=>({id:r.id,leftRail:r.l,rightRail:r.r,sections:r.center.map((p,i)=>({u:i/200,center:p,left:r.left[i],right:r.right[i]}))}))},null,2)+"\n");
await writeFile(`${base}-inspection.json`,JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result));
if(unowned||report.some(r=>r.outsideMaterial||r.outsideTerritory||r.reversedCells||r.crossedSections))process.exitCode=1;
