// Extract editable vector ridge paths from the approved artwork reference.
// This is a static tracing study, not an onboarding generator or hidden-thread
// reconstruction. No source raster is embedded in the resulting SVG.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const source = "docs/design/personal-imprint-thread-reference-v1.png";
const destination = "docs/design/personal-imprint-continuous-master-v2.svg";
const {data:gray,info} = await sharp(source).greyscale().blur(.65).raw().toBuffer({resolveWithObject:true});
const {data:rgb} = await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height} = info;
const strength = new Float32Array(width*height);
const normalX = new Float32Array(width*height), normalY = new Float32Array(width*height);
const offset = new Float32Array(width*height);
const at = (x,y) => gray[Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x))];
function sample(x,y) {
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  return at(ix,iy)*(1-fx)*(1-fy)+at(ix+1,iy)*fx*(1-fy)+at(ix,iy+1)*(1-fx)*fy+at(ix+1,iy+1)*fx*fy;
}
const seeds=[];
for(let y=3;y<height-3;y++)for(let x=3;x<width-3;x++){
  const p=y*width+x,c=gray[p];
  if(c<27)continue;
  const xx=at(x+1,y)-2*c+at(x-1,y),yy=at(x,y+1)-2*c+at(x,y-1);
  const xy=(at(x+1,y+1)-at(x-1,y+1)-at(x+1,y-1)+at(x-1,y-1))*.25;
  const eigen=(xx+yy-Math.hypot(xx-yy,2*xy))*.5;
  if(eigen> -1)continue;
  let nx=xy,ny=eigen-xx;
  if(Math.hypot(nx,ny)<.001){nx=xx<yy?1:0;ny=xx<yy?0:1;}
  const length=Math.hypot(nx,ny);nx/=length;ny/=length;
  const dx=(at(x+1,y)-at(x-1,y))*.5,dy=(at(x,y+1)-at(x,y-1))*.5;
  const shift=-(dx*nx+dy*ny)/eigen;
  if(Math.abs(shift)>.55)continue;
  const px=x+shift*nx,py=y+shift*ny;
  if(sample(px,py)<sample(px+nx,py+ny)||sample(px,py)<sample(px-nx,py-ny))continue;
  strength[p]=-eigen;normalX[p]=nx;normalY[p]=ny;offset[p]=shift;
  seeds.push(p);
}
seeds.sort((a,b)=>strength[b]-strength[a]);
const point=p=>[p%width+offset[p]*normalX[p],Math.floor(p/width)+offset[p]*normalY[p]];

// Remove pixel stair steps and retain a fine geometric tolerance at source size.
function simplify(points,tolerance=.3){
  if(points.length<3)return points;
  const keep=new Set([0,points.length-1]);
  const stack=[[0,points.length-1]];
  while(stack.length){
    const [first,last]=stack.pop(),a=points[first],b=points[last],dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy;
    let best=tolerance,index=-1;
    for(let i=first+1;i<last;i++){
      const t=n?Math.max(0,Math.min(1,((points[i][0]-a[0])*dx+(points[i][1]-a[1])*dy)/n)):0;
      const d=Math.hypot(points[i][0]-a[0]-t*dx,points[i][1]-a[1]-t*dy);
      if(d>best){best=d;index=i;}
    }
    if(index>=0){keep.add(index);stack.push([first,index],[index,last]);}
  }
  return [...keep].sort((a,b)=>a-b).map(index=>points[index]);
}
const round=n=>Math.round(n*100)/100;
// Use the measured strand directions as a flow field. Each resulting strand is
// integrated continuously to a silhouette boundary or back to its own start;
// it is not assembled from disconnected raster trace fragments.
function blurField(input,radius=5,sigma=2.2){
  const weights=Array.from({length:radius*2+1},(_,i)=>Math.exp(-((i-radius)**2)/(2*sigma*sigma)));
  const sum=weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++)weights[i]/=sum;
  const temp=new Float32Array(input.length),output=new Float32Array(input.length);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let k=-radius;k<=radius;k++)temp[y*width+x]+=input[y*width+Math.max(0,Math.min(width-1,x+k))]*weights[k+radius];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let k=-radius;k<=radius;k++)output[y*width+x]+=temp[Math.max(0,Math.min(height-1,y+k))*width+x]*weights[k+radius];
  return output;
}
const rawX=new Float32Array(width*height),rawY=new Float32Array(width*height);
for(const p of seeds){const tx=-normalY[p],ty=normalX[p],weight=Math.sqrt(strength[p]);rawX[p]=(tx*tx-ty*ty)*weight;rawY[p]=2*tx*ty*weight;}
const flowX=blurField(rawX),flowY=blurField(rawY),occupied=new Uint8Array(width*height);
function fieldSample(field,x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,p=iy*width+ix;
  return field[p]*(1-fx)*(1-fy)+field[p+1]*fx*(1-fy)+field[p+width]*(1-fx)*fy+field[p+width+1]*fx*fy;
}
function integrate(start,sign){
  let [x,y]=start;
  const angle=.5*Math.atan2(fieldSample(flowY,x,y),fieldSample(flowX,x,y));
  let tx=Math.cos(angle)*sign,ty=Math.sin(angle)*sign;
  const initial=[tx,ty],result=[];
  let closed=false,termination="limit";
  for(let step=0;step<3600;step++){
    if(x<4||y<4||x>=width-4||y>=height-4||sample(x,y)<24){termination="boundary";break;}
    const cx=fieldSample(flowX,x,y),cy=fieldSample(flowY,x,y),angle=.5*Math.atan2(cy,cx);
    let vx=Math.cos(angle),vy=Math.sin(angle);if(vx*tx+vy*ty<0){vx=-vx;vy=-vy;}
    const n=Math.hypot(tx*.55+vx*.45,ty*.55+vy*.45);tx=(tx*.55+vx*.45)/n;ty=(ty*.55+vy*.45)/n;
    const next=[x+tx*1.4,y+ty*1.4];
    if(sample(...next)<24){termination="boundary";break;}
    [x,y]=next;result.push(next);
    if(step>140&&Math.hypot(x-start[0],y-start[1])<3&&tx*initial[0]+ty*initial[1]>.9){result.push(start);closed=true;termination="closed";break;}
  }
  return {points:result,closed,termination};
}
const guides=[];
for(const seed of seeds){
  if(occupied[seed])continue;
  const start=point(seed),forward=integrate(start,1),backward=forward.closed?{points:[],termination:"closed"}:integrate(start,-1);
  if(forward.termination==="limit"||backward.termination==="limit")continue;
  const points=[...backward.points.reverse(),start,...forward.points];
  if(points.length<150)continue;
  let shade=0;
  for(const [x,y] of points){
    const ix=Math.round(x),iy=Math.round(y);
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(ix+dx>=0&&iy+dy>=0&&ix+dx<width&&iy+dy<height)occupied[(iy+dy)*width+ix+dx]=1;
    shade+=sample(x,y)/239;
  }
  guides.push({points,length:points.length*1.4,width:1.1,shade:shade/points.length});
  if(guides.length>=600)break;
}
function tone(x,y){
  const ix=Math.max(0,Math.min(width-1,Math.round(x))),iy=Math.max(0,Math.min(height-1,Math.round(y))),p=(iy*width+ix)*3;
  return Math.max(.07,Math.min(1,(rgb[p]*.2126+rgb[p+1]*.7152+rgb[p+2]*.0722)/239));
}
// Connect full trajectories into authored circuits. Nearby endpoints are paired
// across different trajectories; no isolated hairpin return is added to a tip.
// Connections are explicit cubic geometry, not masks or detached lighting strokes.
function circuits(input) {
  let active=input;
  let pairs;
  for(let pass=0;pass<input.length;pass++) {
    const ends=active.flatMap((g,i)=>[0,1].map(side=>({i,side,p:side?g.points.at(-1):g.points[0]})));
    const candidates=[];
    for(let a=0;a<ends.length;a++)for(let b=a+1;b<ends.length;b++){
      if(ends[a].i===ends[b].i)continue;
      const distance=Math.hypot(ends[a].p[0]-ends[b].p[0],ends[a].p[1]-ends[b].p[1]);
      if(distance<70)candidates.push({a,b,distance});
    }
    candidates.sort((a,b)=>a.distance-b.distance);pairs=new Map();
    for(const {a,b} of candidates)if(!pairs.has(a)&&!pairs.has(b)){pairs.set(a,b);pairs.set(b,a);}
    const retained=active.filter((_,i)=>pairs.has(i*2)&&pairs.has(i*2+1));
    if(retained.length===active.length)break;
    active=retained;
  }
  const visited=new Set(),result=[];
  for(let i=0;i<active.length;i++){
    if(visited.has(i))continue;
    let entry=i*2;const first=entry,route=[];
    do {
      const index=Math.floor(entry/2),reverse=entry%2===1;
      visited.add(index);
      const points=sampleGuide(simplify(active[index].points,.25),4);
      if(reverse)points.reverse();
      route.push(...points);
      const next=pairs.get(entry^1),nextGuide=active[Math.floor(next/2)].points;
      const target=next%2?nextGuide.at(-1):nextGuide[0];
      const inner=next%2?nextGuide.at(-2):nextGuide[1];
      const a=points.at(-1),before=points.at(-2),distance=Math.hypot(target[0]-a[0],target[1]-a[1]);
      const unit=(x,y)=>{const n=Math.hypot(x,y)||1;return [x/n,y/n];};
      const u=unit(a[0]-before[0],a[1]-before[1]),v=unit(inner[0]-target[0],inner[1]-target[1]);
      const handle=Math.min(20,distance*.4),b=[a[0]+u[0]*handle,a[1]+u[1]*handle],c=[target[0]-v[0]*handle,target[1]-v[1]*handle];
      for(let step=1;step<12;step++){const t=step/12,s=1-t;route.push([s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*target[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*target[1]]);}
      entry=next;
    }while(entry!==first);
    result.push({points:route,shade:route.reduce((sum,p)=>sum+tone(...p),0)/route.length});
  }
  return result;
}
const closedRoutes=circuits(guides);
const definitions=[],lines=[];
closedRoutes.sort((a,b)=>a.shade-b.shade).forEach((path,index)=>{
  const points=path.points;
  let d=`M${round(points[0][0])} ${round(points[0][1])}`;
  for(let i=0;i<points.length;i++){
    const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],e=points[(i+2)%points.length];
    const first=[b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6];
    const second=[c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6];
    d+=`C${round(first[0])} ${round(first[1])} ${round(second[0])} ${round(second[1])} ${round(c[0])} ${round(c[1])}`;
  }
  // Lighting belongs to the whole path. There are no separately capped stroke
  // pieces, no repeated moves, and no dash or opacity masks inside a strand.
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const horizontal=Math.max(...xs)-Math.min(...xs)>Math.max(...ys)-Math.min(...ys);
  const axis=horizontal?0:1,values=horizontal?xs:ys,min=Math.min(...values),max=Math.max(...values);
  const bins=Array.from({length:24},()=>[]);
  for(const p of points)bins[Math.min(23,Math.floor((p[axis]-min)/(max-min||1)*24))].push(tone(...p));
  let previous=path.shade;
  const stops=bins.map((bin,i)=>{if(bin.length)previous=bin.reduce((sum,n)=>sum+n,0)/bin.length;const light=Math.max(.075,Math.min(.96,Math.pow(previous,.8)*1.2));return `<stop offset="${round(i/23)}" stop-color="rgb(${[241,239,232].map(value=>Math.round(25+(value-25)*light)).join(" ")})"/>`;});
  const id=`light-${index}`;
  definitions.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${horizontal?round(min):0}" y1="${horizontal?0:round(min)}" x2="${horizontal?round(max):0}" y2="${horizontal?0:round(max)}">${stops.join("")}</linearGradient>`);
  lines.push(`<path id="thread-${index}" d="${d}Z" stroke="url(#${id})" stroke-width="${round(.72+(index%5)*.045)}"/>`);
});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description"><title id="title">Personal Imprint — closed-route study v2</title><desc id="description">${closedRoutes.length} continuous closed strand circuits with explicit cubic connections between reference-guided trajectories. Connections are design approximations. Visual fidelity remains unresolved; hidden physical topology is not reconstructed.</desc><defs>${definitions.join("\n")}</defs><g fill="none" stroke-linecap="round" stroke-linejoin="round">${lines.join("\n")}</g></svg>\n`;
await writeFile(destination,svg);
// Check that the exported asset really contains independent vector paths.
const exported=await readFile(destination,"utf8");
if(exported.includes("<image")||exported.includes("base64"))throw Error("Unexpected raster content");
const paths=[...exported.matchAll(/<path[^>]* d="([^"]+)"/g)].map(match=>match[1]);
if(paths.length!==closedRoutes.length||paths.some(d=>(d.match(/M/g)||[]).length!==1||!d.endsWith("Z")))throw Error("Incomplete route export");
await sharp(Buffer.from(svg)).resize({width:684}).flatten({background:"#191813"}).png().toFile("docs/design/personal-imprint-continuous-master-preview-v2.png");
await sharp(Buffer.from(svg)).resize({width:390}).flatten({background:"#191813"}).png().toFile("outputs/imprint/closed-route-v2-390.png");
await sharp(Buffer.from(svg)).extract({left:400,top:170,width:400,height:400}).resize({width:800}).flatten({background:"#191813"}).png().toFile("outputs/imprint/closed-route-v2-fold-detail.png");
console.log(JSON.stringify({source,destination,width,height,ridgePixels:seeds.length,trajectories:guides.length,paths:closedRoutes.length,svgBytes:Buffer.byteLength(svg),moveCommands:(svg.match(/\bd="M/g)||[]).length}));

function sampleGuide(points,spacing=5){
  const result=[points[0]];let remaining=spacing;
  for(let i=1;i<points.length;i++){
    let a=points[i-1];const b=points[i];let length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    while(length>=remaining){const t=remaining/length;a=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];result.push(a);length=Math.hypot(b[0]-a[0],b[1]-a[1]);remaining=spacing;}
    remaining-=length;
  }
  if(Math.hypot(...result.at(-1).map((v,i)=>v-points.at(-1)[i]))>.1)result.push(points.at(-1));
  return result;
}
