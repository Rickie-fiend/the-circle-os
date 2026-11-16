import {readFile,writeFile} from "node:fs/promises";
import sharp from "sharp";
const base="docs/design/personal-imprint-depth-v1";
const spec=JSON.parse(await readFile(`${base}.json`,"utf8")),map=JSON.parse(await readFile(spec.structure,"utf8")),courses=JSON.parse(await readFile(spec.courses,"utf8")),ownership=JSON.parse(await readFile(spec.ownership,"utf8"));
function sample(path){const t=path.match(/[MCZ]|-?\d+(?:\.\d+)?/g),p=[];let i=0,a;while(i<t.length){const c=t[i++];if(c==="M"){a=[+t[i++],+t[i++]];p.push(a);}else if(c==="C"){const b=[+t[i++],+t[i++]],c=[+t[i++],+t[i++]],d=[+t[i++],+t[i++]];for(let j=1;j<=64;j++){const u=j/64,v=1-u;p.push([v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]]);}a=d;}else if(c==="Z")p.push(p[0]);else throw Error("Invalid boundary");}return p;}
function inside([x,y],p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
const outer=sample(map.silhouette.path),holes=map.voids.filter(v=>v.kind==="enclosed opening").map(v=>sample(v.path)),territories=map.bundles.map(b=>sample(b.path));
const material=p=>inside(p,outer)&&!holes.some(h=>inside(p,h));
function owners(p){if(!material(p))return [];const out=territories.flatMap((t,i)=>inside(p,t)?[i]:[]);if(out.length)return out;return ownership.reserveOwnership.filter(r=>p[0]>=r.bounds[0]&&p[0]<r.bounds[2]&&p[1]>=r.bounds[1]&&p[1]<r.bounds[3]).map(r=>spec.bundles.findIndex(b=>b.id===r.owner));}
function interpolate(stations,u){let i=1;while(i<stations.length-1&&stations[i][0]<u)i++;const[a,x]=stations[i-1],[b,y]=stations[i],t=(u-a)/(b-a),s=t*t*(3-2*t);return x+(y-x)*s;}
function frame(index,x,y){const sections=courses.routes[index].sections,b=spec.bundles[index];let best=Infinity;const distances=sections.map(s=>{const d=(x-s.center[0])**2+(y-s.center[1])**2;best=Math.min(best,d);return d;});let weight=0,depth=0,u=0,distance=0;for(let i=0;i<sections.length;i++){const w=Math.exp(-(distances[i]-best)/2500);weight+=w;depth+=w*interpolate(b.depth,sections[i].u);u+=w*sections[i].u;distance+=w*distances[i];}const recess=index===0?20*Math.exp(-((x-656)**2+(y-262)**2)/5000):index===3?20*Math.exp(-((x-502)**2+(y-1044)**2)/5000):0;return {z:depth/weight+b.rise*Math.exp(-distance/weight/(b.radius*b.radius))-recess,u:u/weight};}
const step=spec.grid,cols=1024/step+1,rows=1536/step+1,membership=new Uint8Array(cols*rows);
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)for(const i of owners([x*step,y*step]))membership[y*cols+x]|=1<<i;
const original=membership.slice();
for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(original[y*cols+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)membership[y*cols+x]|=original[(y+dy)*cols+x+dx];
const meshes=spec.bundles.map((b,i)=>({id:b.id,vertices:[],triangles:[],returns:[],cache:new Map(),boundary:new Map()}));
const point=(mesh,index,x,y)=>{const key=y*cols+x;if(mesh.cache.has(key))return mesh.cache.get(key);const z=frame(index,x*step,y*step).z,n=mesh.vertices.length;mesh.vertices.push([x*step,y*step,z],[x*step,y*step,z-spec.bundles[index].thickness]);mesh.cache.set(key,n);return n;};
let expected=0,covered=0,uncovered=0;
const eligible=new Uint8Array((cols-1)*(rows-1));
for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++)if(material([(x+.5)*step,(y+.5)*step]))eligible[y*(cols-1)+x]=membership[y*cols+x]&membership[y*cols+x+1]&membership[(y+1)*cols+x]&membership[(y+1)*cols+x+1];
// Two cells touching only at a corner cannot share one shell vertex. Remove
// the later cell from that bundle instead of exporting a four-wall pinch edge.
for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)for(let i=0;i<6;i++){
  const bit=1<<i,a=(y-1)*(cols-1)+x-1,b=a+1,c=y*(cols-1)+x-1,d=c+1;
  if((eligible[a]&bit)&&(eligible[d]&bit)&&!(eligible[b]&bit)&&!(eligible[c]&bit))eligible[d]&=~bit;
  if((eligible[b]&bit)&&(eligible[c]&bit)&&!(eligible[a]&bit)&&!(eligible[d]&bit))eligible[c]&=~bit;
}
for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++){
  const center=[(x+.5)*step,(y+.5)*step];if(material(center))expected++;
  let any=false;
  for(let i=0;i<meshes.length;i++){
    const mask=1<<i,ids=[y*cols+x,y*cols+x+1,(y+1)*cols+x+1,(y+1)*cols+x];
    if(!(eligible[y*(cols-1)+x]&mask))continue;
    // Every triangle vertex and cell center belongs to the actual surface region.
    // Geometry is omitted at an unresolved boundary, never painted out later.
    const m=meshes[i],a=point(m,i,x,y),b=point(m,i,x+1,y),c=point(m,i,x+1,y+1),d=point(m,i,x,y+1);
    m.triangles.push([a,b,c],[a,c,d],[c+1,b+1,a+1],[d+1,c+1,a+1]);
    for(const [p,q] of [[a,b],[b,c],[c,d],[d,a]]){const key=[p,q].sort((a,b)=>a-b).join(":");if(m.boundary.has(key))m.boundary.delete(key);else m.boundary.set(key,[p,q]);}
    any=true;
  }
  if(any)covered++;else if(material(center))uncovered++;
}
for(let i=0;i<meshes.length;i++){const m=meshes[i];for(const [a,b] of m.boundary.values())m.triangles.push([a,a+1,b+1],[a,b+1,b]);const sections=courses.routes[i].sections,thickness=spec.bundles[i].thickness;m.returns=sections.toReversed().map(s=>{const {z}=frame(i,...s.center);return [...s.center,z-thickness];});
  const front=sections.map(s=>[...s.center,frame(i,...s.center).z]);
  function turn(end){const a=end?front.at(-1):front[0],b=end?front.at(-2):front[1],dx=a[0]-b[0],dy=a[1]-b[1],n=Math.hypot(dx,dy),r=thickness/2;return Array.from({length:25},(_,j)=>{const t=j/24*Math.PI,theta=end?t:Math.PI-t;return [a[0]+dx/n*r*Math.sin(t),a[1]+dy/n*r*Math.sin(t),a[2]-r+r*Math.cos(theta)];});}
  m.continuation=[...front,...turn(true).slice(1),...m.returns.slice(1),...turn(false).slice(1)];
  if(m.continuation.some(p=>!material(p.slice(0,2))||p.some(v=>!Number.isFinite(v))))throw Error(`Invalid continuation ${m.id}`);
}
const W=768,H=1152;
function render(mode){const rgba=new Uint8Array(W*H*4),depth=new Float32Array(W*H).fill(-Infinity);for(let i=0;i<W*H;i++){rgba.set([25,24,19,255],i*4);}const angle=mode==="oblique"?.38:0;
  const project=([x,y,z])=>[(512+(x-512)*Math.cos(angle)+(z-180)*Math.sin(angle))*.75,y*.75,z*Math.cos(angle)-(x-512)*Math.sin(angle)];
  for(let mi=0;mi<meshes.length;mi++){const m=meshes[mi],vertices=m.vertices.map(project);for(const tri of m.triangles){const[a,b,c]=tri.map(n=>vertices[n]),area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-8)continue;
    const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal)||1;
    const light=.24+.76*Math.abs((normal[0]*-.35+normal[1]*-.45+normal[2]*.82)/length),color=mode==="depth"?map.bundles[mi].tone.match(/\w\w/g).map(s=>parseInt(s,16)):[241,239,232].map(v=>Math.round(v*light));
    for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
      const p=x+.5,q=y+.5,wb=((p-a[0])*(c[1]-a[1])-(q-a[1])*(c[0]-a[0]))/area,wc=((b[0]-a[0])*(q-a[1])-(b[1]-a[1])*(p-a[0]))/area,wa=1-wb-wc;if(wa<0||wb<0||wc<0)continue;const z=wa*a[2]+wb*b[2]+wc*c[2],index=y*W+x;if(z>depth[index]){depth[index]=z;rgba.set([...color,255],index*4);}
    }
  }}return sharp(rgba,{raw:{width:W,height:H,channels:4}}).png().toFile(`${base}-${mode}.png`);
}
for(const mode of ["front","oblique","depth"]){
  await render(mode);
  const font=await readFile("public/fonts/geist-latin.woff2");
  const lines=[`Step 3 · ${mode}`,"Authored shell construction", "",...spec.bundles.map((b,i)=>`${b.id}  ${map.bundles[i].name}`),"",...spec.junctions.map(j=>`${j.id}: ${j.front} in front of ${j.back}`),"", "Depth varies along each course.", "Back surfaces carry return routes.", "U1/U2 remain material recesses.", "No painted occlusion masks.", "4px conservative boundary grid.", "Final thread turns: Step 4."];
  const overlay=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="1152"><style>@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font.toString("base64")})}text{font-family:Geist,Arial,sans-serif}</style><rect width="360" height="1152" fill="#191813"/>${lines.map((line,i)=>`<text x="20" y="${55+i*40}" fill="#F1EFE8" font-size="18">${line}</text>`).join("")}</svg>`;
  const rendered=await readFile(`${base}-${mode}.png`);
  await sharp(rendered).extend({right:360,background:"#191813"}).composite([{input:Buffer.from(overlay),left:W,top:0}]).png().toFile(`${base}-${mode}.png`);
}
const shellInspection=meshes.map(m=>{const edges=new Map();let degenerate=0;for(const t of m.triangles){const[a,b,c]=t.map(n=>m.vertices[n]);if(Math.hypot((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-8)degenerate++;for(const[p,q]of[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]){const k=[p,q].sort((a,b)=>a-b).join(":");edges.set(k,(edges.get(k)||0)+1);}}return {id:m.id,degenerate,nonManifoldEdges:[...edges.values()].filter(n=>n!==2).length};});
const overlapInspection=spec.junctions.map(j=>{const f=spec.bundles.findIndex(b=>b.id===j.front),b=spec.bundles.findIndex(b=>b.id===j.back);let samples=0,minGap=Infinity;for(let y=0;y<rows;y+=4)for(let x=0;x<cols;x+=4){const bits=membership[y*cols+x];if((bits&(1<<f))&&(bits&(1<<b))){samples++;minGap=Math.min(minGap,frame(f,x*step,y*step).z-spec.bundles[f].thickness-frame(b,x*step,y*step).z);}}return {id:j.id,samples,minGap:Number.isFinite(minGap)?minGap:null};});
const report={grid:step,expectedCells:expected,coveredCells:covered,uncoveredCells:uncovered,coveragePercent:100*covered/expected,shellInspection,overlapInspection,meshes:meshes.map(m=>({id:m.id,vertices:m.vertices.length,triangles:m.triangles.length,returnPoints:m.returns.length})),junctions:spec.junctions,limits:"Conservative boundary cells omitted. Coverage is sampled, not exact silhouette identity. Shell backs/return courses are explicit; final strand turns remain Step 4."};
await writeFile(`${base}-geometry.json`,JSON.stringify({version:1,meshes:meshes.map(({id,vertices,triangles,returns,continuation})=>({id,vertices,triangles,returns,continuation}))}));
await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report));
if(shellInspection.some(m=>m.degenerate||m.nonManifoldEdges)||overlapInspection.some(j=>!j.samples||j.minGap<=0))process.exitCode=1;
