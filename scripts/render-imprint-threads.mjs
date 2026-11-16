import {readFile,writeFile} from "node:fs/promises";
import sharp from "sharp";
const base="docs/design/personal-imprint-threads-v1",spec=JSON.parse(await readFile(`${base}.json`,"utf8")),surface=JSON.parse(await readFile(spec.surface,"utf8")),courses=JSON.parse(await readFile(spec.courses,"utf8"));
const W=1024,H=1536,depth=new Float32Array(W*H).fill(-Infinity);
// Same triangle depth convention as the Step 3 renderer. Surfaces contribute
// depth only; visible pixels below come exclusively from individual strands.
for(const m of surface.meshes)for(const tri of m.triangles){const[a,b,c]=tri.map(i=>m.vertices[i]),area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-8)continue;for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){const p=x+.5,q=y+.5,wb=((p-a[0])*(c[1]-a[1])-(q-a[1])*(c[0]-a[0]))/area,wc=((b[0]-a[0])*(q-a[1])-(b[1]-a[1])*(p-a[0]))/area,wa=1-wb-wc;if(wa>=0&&wb>=0&&wc>=0)depth[y*W+x]=Math.max(depth[y*W+x],wa*a[2]+wb*b[2]+wc*c[2]);}}
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const strands=[],inspection=[];
for(let mi=0;mi<surface.meshes.length;mi++){
 const mesh=surface.meshes[mi],guide=courses.routes[mi].sections;
 const values=mesh.vertices.map(([x,y],index)=>{if(index%2)return 0;let nearest=Infinity;const samples=[];for(let i=0;i<guide.length-1;i++){const a=guide[i].center,b=guide[i+1].center,dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/n)),px=a[0]+dx*t,py=a[1]+dy*t,d=(x-px)**2+(y-py)**2;nearest=Math.min(nearest,d);samples.push([d,((x-px)*-dy+(y-py)*dx)/Math.sqrt(n)]);}let weight=0,value=0;for(const[d,v]of samples){const w=Math.exp(-(d-nearest)/1600);weight+=w;value+=v*w;}return value/weight;});
 const segments=new Map();let rangeMin=Infinity,rangeMax=-Infinity;
 for(let i=0;i<values.length;i+=2){rangeMin=Math.min(rangeMin,values[i]);rangeMax=Math.max(rangeMax,values[i]);}
 for(const tri of mesh.triangles){if(tri.some(i=>i%2))continue;const lo=Math.ceil(Math.min(...tri.map(i=>values[i]))/spec.spacing),hi=Math.floor(Math.max(...tri.map(i=>values[i]))/spec.spacing);for(let level=lo;level<=hi;level++){
  const h=level*spec.spacing+1e-5,points=[];
  for(let e=0;e<3;e++){const a=tri[e],b=tri[(e+1)%3],va=values[a],vb=values[b];if((va<=h&&vb>h)||(vb<=h&&va>h)){const t=(h-va)/(vb-va);points.push(mesh.vertices[a].map((v,k)=>v+t*(mesh.vertices[b][k]-v)));}}
  if(points.length===2){if(!segments.has(level))segments.set(level,[]);segments.get(level).push(points);}
 }}
 let components=0,omitted=0,closed=0;
 for(const[level,edges]of segments){const key=p=>p.map(v=>Math.round(v*1000)).join(","),nodes=new Map();for(let i=0;i<edges.length;i++)for(const p of edges[i]){const k=key(p);if(!nodes.has(k))nodes.set(k,[]);nodes.get(k).push(i);}const used=new Set();
  for(let seed=0;seed<edges.length;seed++){if(used.has(seed))continue;let start=edges[seed][0];
   // Locate a boundary endpoint before walking so a front contour is never split
   // merely because an arbitrary triangle was visited first.
   const pending=[seed],connected=new Set();while(pending.length){const i=pending.pop();if(connected.has(i))continue;connected.add(i);for(const p of edges[i])for(const j of nodes.get(key(p)))if(!connected.has(j))pending.push(j);}
   for(const i of connected)for(const p of edges[i])if(nodes.get(key(p)).length===1)start=p;
   const points=[start];let current=start;while(true){const next=nodes.get(key(current)).find(i=>!used.has(i));if(next===undefined)break;used.add(next);const edge=edges[next];current=key(edge[0])===key(current)?edge[1]:edge[0];points.push(current);}
   components++;let length=0;for(let i=1;i<points.length;i++)length+=distance(points[i-1],points[i]);if(length<spec.minimumLength){omitted++;continue;}
   const isClosed=distance(points[0],points.at(-1))<.01;
   if(isClosed){closed++;strands.push({id:`${mesh.id}:${level}:${components}`,bundle:mesh.id,level,front:points,route:points});continue;}
   // Trim a physical turn allowance, then round through depth onto the same
   // shell's back. It never connects to a different contour or crosses a void.
   let first=0,last=points.length-1,travel=0;while(first<last&&travel<8){travel+=distance(points[first],points[first+1]);first++;}travel=0;while(last>first&&travel<8){travel+=distance(points[last],points[last-1]);last--;}
   const front=points.slice(first,last+1).map(p=>[p[0],p[1],p[2]+.35]);if(front.length<3){omitted++;continue;}
   const thickness=mesh.vertices[0][2]-mesh.vertices[1][2],back=front.toReversed().map(p=>[p[0],p[1],p[2]-thickness-.7]);
   function turn(end){const a=end?front.at(-1):front[0],b=end?front.at(-2):front[1],dx=a[0]-b[0],dy=a[1]-b[1],n=Math.hypot(dx,dy)||1,r=(thickness+.7)/2;return Array.from({length:25},(_,j)=>{const t=j/24*Math.PI,theta=end?t:Math.PI-t;return[a[0]+dx/n*r*Math.sin(t),a[1]+dy/n*r*Math.sin(t),a[2]-r+r*Math.cos(theta)];});}
   strands.push({id:`${mesh.id}:${level}:${components}`,bundle:mesh.id,level,front,route:[...front,...turn(true).slice(1),...back.slice(1),...turn(false).slice(1)]});
  }
 }
 const pitch=[];for(const tri of mesh.triangles){if(tri.some(i=>i%2))continue;const[a,b,c]=tri.map(i=>mesh.vertices[i]),[va,vb,vc]=tri.map(i=>values[i]),area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(!area)continue;const gx=((vb-va)*(c[1]-a[1])-(vc-va)*(b[1]-a[1]))/area,gy=((b[0]-a[0])*(vc-va)-(c[0]-a[0])*(vb-va))/area,n=Math.hypot(gx,gy);if(n>1e-6)pitch.push(spec.spacing/n);}pitch.sort((a,b)=>a-b);
 inspection.push({bundle:mesh.id,fieldRange:[rangeMin,rangeMax],contourComponents:components,omittedShort:omitted,naturallyClosed:closed,projectedPitch:{p05:pitch[Math.floor(pitch.length*.05)],median:pitch[Math.floor(pitch.length*.5)],p95:pitch[Math.floor(pitch.length*.95)]}});
}
const rgba=new Uint8Array(W*H*4),diagnostic=new Uint8Array(W*H*4);for(let i=0;i<W*H;i++){rgba.set([25,24,19,255],i*4);diagnostic.set([25,24,19,255],i*4);}
let visible=0,hidden=0,unsupported=0,nonfinite=0,closureFailures=0;const selected=[],rejected=[],retained=[];
function supported(points){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.ceil(distance(a,b)*2);for(let k=0;k<=steps;k++){const t=k/(steps||1),x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t);if(x<0||x>=W||y<0||y>=H||!Number.isFinite(depth[y*W+x]))return false;}}return true;}
function draw(points,color,target,occlusion){const coverage=new Map();for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.ceil(distance(a,b)*3);for(let k=0;k<=steps;k++){const t=k/(steps||1),p=a.map((v,j)=>v+(b[j]-v)*t),x=Math.round(p[0]),y=Math.round(p[1]);if(x<0||y<0||x>=W||y>=H)continue;const index=y*W+x;if(occlusion&&p[2]<depth[index]-.8){hidden++;continue;}visible++;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const px=x+dx,py=y+dy;if(px<0||px>=W||py<0||py>=H)continue;const alpha=Math.max(0,Math.min(1,spec.stroke/2+.5-Math.hypot(px-p[0],py-p[1]))),id=py*W+px;coverage.set(id,Math.max(coverage.get(id)||0,alpha));}}}for(const[id,alpha]of coverage)for(let c=0;c<3;c++)target[id*4+c]=Math.round(target[id*4+c]*(1-alpha)+color[c]*alpha);}
for(let i=0;i<strands.length;i++){const s=strands[i];if(s.route.some(p=>p.some(n=>!Number.isFinite(n))))nonfinite++;if(distance(s.route[0],s.route.at(-1))>.01)closureFailures++;if(!supported(s.route)){rejected.push(s.id);unsupported++;continue;}retained.push(s);const shade=Math.round(125+75*(.5+.5*Math.sin(i*2.17)));draw(s.route,[shade,shade-1,shade-5],rgba,true);if(i%37===0){selected.push(s.id);draw(s.route,[241,239,232],diagnostic,false);}}
await sharp(rgba,{raw:{width:W,height:H,channels:4}}).png().toFile(`${base}-full.png`);
await sharp(diagnostic,{raw:{width:W,height:H,channels:4}}).png().toFile(`${base}-routes.png`);
for(const[id,left,top,width,height]of[["crown",520,80,420,410],["shoulder",245,330,310,270],["lower",300,1000,410,350]])await sharp(rgba,{raw:{width:W,height:H,channels:4}}).extract({left,top,width,height}).resize({width:820}).png().toFile(`${base}-${id}.png`);
const {data:gray}=await sharp(spec.reference).greyscale().raw().toBuffer({resolveWithObject:true});const peaks=[];for(let x=110;x<240;x++)if(gray[600*W+x]>gray[600*W+x-1]+2&&gray[600*W+x]>=gray[600*W+x+1]&&gray[600*W+x]>60)peaks.push(x);const gaps=peaks.slice(1).map((x,i)=>x-peaks[i]);
const report={generatedStrands:strands.length,retainedStrands:retained.length,rejectedUnsupported:rejected,inspection,nonfinite,closureFailures,visibleSamples:visible,occludedSamples:hidden,selectedDiagnosticStrands:selected,referenceSpacing:{row:600,xRange:[110,240],peaks,gaps},limitations:"Weighted flow scalar may still pinch/split. Whole unsupported strands rejected; short contours omitted. 4px surface boundary margin inherited. Boundary-conforming revision and visual fidelity remain incomplete."};
await writeFile(`${base}-geometry.json`,JSON.stringify({version:1,strands:retained}));await writeFile(`${base}-inspection.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report));if(nonfinite||closureFailures)process.exitCode=1;
