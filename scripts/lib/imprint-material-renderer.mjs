// Shared material renderer; preserves the original Step 5 shader and output settings.
import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {rasterDepth,createSurfaceQuery} from "./imprint-network-geometry.mjs";
const hash=value=>createHash("sha256").update(value).digest("hex");
export async function renderImprintMaterial({geometry,settings,base,log=()=>{},capture}){
const {width:W,height:H,supersampling:S,palette,fibre,light,shadow}=settings;
const SW=W*S,SH=H*S,total=SW*SH;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const unit=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length);};
const dot=(a,b)=>a.reduce((s,n,k)=>s+n*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const linear=value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
const srgb=value=>255*(value<=.0031308?value*12.92:1.055*value**(1/2.4)-.055);
const fibreColor=palette.fibre.map(linear),supportColor=palette.support.map(linear);
const L=unit(light.direction),half=unit([L[0],L[1],L[2]+1]),depthScale=settings.surface.depthScale;
log("Loading unchanged surface and computing geometry-based light…");
const depth=rasterDepth(geometry.surface,W,H),fragmentDepth=rasterDepth(geometry.surface,SW,SH,S),surfaceAt=createSurfaceQuery(geometry.surface);
const normals=new Float32Array(W*H*3),illumination=new Float32Array(W*H),visibility=new Float32Array(W*H).fill(1);
const depthAt=(x,y)=>x<0||x>=W||y<0||y>=H?-Infinity:depth[Math.floor(y)*W+Math.floor(x)];
function derivative(x,y,dx,dy,z){const a=depthAt(x-dx,y-dy),b=depthAt(x+dx,y+dy),r=Math.hypot(dx,dy);return Number.isFinite(a)&&Number.isFinite(b)?(b-a)/(2*r):Number.isFinite(b)?(b-z)/r:Number.isFinite(a)?(z-a)/r:0;}
let shadowed=0,materialPixels=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const index=y*W+x,z=depth[index];if(!Number.isFinite(z))continue;materialPixels++;
 const r=settings.surface.normalRadius,n=unit([-derivative(x,y,r,0,z)*depthScale,-derivative(x,y,0,r,z)*depthScale,1]);normals.set(n,index*3);
 // A broad source: a heightfield horizon softens by the light's angular size.
 // Only nearer material can cast a shadow; holes contain no shadow receivers.
 let horizon=-Infinity;
 const xy=Math.hypot(L[0],L[1]),lightSlope=L[2]/xy;
 for(let step=1;step<=shadow.steps;step++){
  const d=shadow.maxDistance*(step/shadow.steps)**1.6,other=depthAt(x+L[0]/xy*d,y+L[1]/xy*d);
  if(Number.isFinite(other))horizon=Math.max(horizon,((other-z)*depthScale-shadow.bias)/d);
 }
 const blocked=clamp((horizon-lightSlope+light.angularRadius)/(2*light.angularRadius));
 visibility[index]=1-shadow.strength*blocked;if(blocked>.01)shadowed++;
 illumination[index]=settings.surface.ambient+settings.surface.diffuse*Math.max(0,dot(n,L))*visibility[index];
}
const rgba=new Uint8Array(total*4),zBuffer=new Float32Array(total).fill(-Infinity),strandOwner=new Int32Array(total).fill(-1),strandShade=new Float32Array(total),strandAlpha=new Float32Array(total);
const coursePosition=capture?new Float32Array(total):null;
for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){
 const index=y*SW+x,p=Math.floor(y/S)*W+Math.floor(x/S);
 const tone=illumination[p];
 for(let c=0;c<3;c++)rgba[index*4+c]=Number.isFinite(depth[p])&&settings.surface.visible!==false?Math.round(srgb(supportColor[c]*tone)):palette.background[c];
 rgba[index*4+3]=255;
}
let visibleSegments=0,hiddenSegments=0,nonfiniteShades=0;
// Sweep circular rings along each unchanged 3D route. Shared rings and a depth
// buffer avoid per-segment bright caps. Ends are already buried by Step 4.
function drawTriangle(a,b,c,owner){
 const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-10)return;
 for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])*S));y<=Math.min(SH-1,Math.ceil(Math.max(a[1],b[1],c[1])*S));y++)
 for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])*S));x<=Math.min(SW-1,Math.ceil(Math.max(a[0],b[0],c[0])*S));x++){
  const px=(x+.5)/S,py=(y+.5)/S,u=((px-a[0])*(c[1]-a[1])-(py-a[1])*(c[0]-a[0]))/area,v=((b[0]-a[0])*(py-a[1])-(b[1]-a[1])*(px-a[0]))/area;
  if(u<0||v<0||u+v>1)continue;
  const w=1-u-v,index=y*SW+x,z=w*a[2]+u*b[2]+v*c[2];
  if(settings.surface.occlude!==false&&(!Number.isFinite(fragmentDepth[index])||z<fragmentDepth[index])||z<=zBuffer[index])continue;
  const fn=unit([3,4,5].map(k=>w*a[k]+u*b[k]+v*c[k])),pixel=Math.floor(py)*W+Math.floor(px),n=normals.subarray(pixel*3,pixel*3+3);
  const diffuse=Math.max(0,dot(fn,L)),macro=.3+.7*Math.max(0,dot(n,L)),specular=fibre.specular*Math.max(0,dot(fn,half))**fibre.roughnessExponent;
  const indirect=settings.surface.occlude===false&&Number.isFinite(fragmentDepth[index])?Math.exp(-Math.max(0,fragmentDepth[index]-z)/45):1;
  const shade=(fibre.ambient+(fibre.diffuse*diffuse*macro+specular)*visibility[pixel])*(geometry.strands[owner].reflectance??1)*indirect;
  if(!Number.isFinite(shade))nonfiniteShades++;
  zBuffer[index]=z;strandOwner[index]=owner;strandShade[index]=shade;strandAlpha[index]=1;
  if(coursePosition)coursePosition[index]=w*a[6]+u*b[6]+v*c[6];
 }
}
for(let strandIndex=0;strandIndex<geometry.strands.length;strandIndex++){
 const strand=geometry.strands[strandIndex],rings=[],radius=(strand.width??fibre.width)/2;
 for(let i=0;i<strand.route.length;i++){
  const p=strand.route[i],period=strand.route.length-1,before=strand.route[strand.closed?(i-1+period)%period:Math.max(0,i-1)],after=strand.route[strand.closed?(i+1)%period:Math.min(strand.route.length-1,i+1)],tangent=unit(after.map((v,k)=>(v-before[k])*(k===2?depthScale:1))),side=unit(cross(tangent,[0,0,1])),up=unit(cross(side,tangent));
  rings.push(Array.from({length:fibre.radialSegments},(_,j)=>{const angle=2*Math.PI*j/fibre.radialSegments,n=side.map((v,k)=>v*Math.cos(angle)+up[k]*Math.sin(angle));return [p[0]+n[0]*radius,p[1]+n[1]*radius,p[2]+n[2]*radius/depthScale,...n,i/period];}));
 }
 for(let i=1;i<strand.route.length;i++){
  const a=strand.route[i-1],b=strand.route[i];
  const midpoint=a.map((v,k)=>(v+b[k])/2),surface=settings.surface.occlude===false?null:surfaceAt(midpoint[0],midpoint[1]);
  if(settings.surface.occlude!==false&&(!surface||Math.max(a[2],b[2])+radius/depthScale<surface.z-.05)){hiddenSegments++;continue;}visibleSegments++;
  for(let j=0;j<fibre.radialSegments;j++){
   const k=(j+1)%fibre.radialSegments;
   drawTriangle(rings[i-1][j],rings[i][j],rings[i][k],strandIndex);
   drawTriangle(rings[i-1][j],rings[i][k],rings[i-1][k],strandIndex);
  }
 }
 if(strandIndex%300===0)log(`Shaded ${strandIndex}/${geometry.strands.length} strands`);
}
let fibreSamples=0,clippedHighlights=0,contactShadowSamples=0,minShade=Infinity,maxShade=-Infinity;
const represented=new Set();
for(let i=0;i<total;i++)if(strandOwner[i]>=0){
 fibreSamples++;represented.add(strandOwner[i]);
 const x=i%SW,y=Math.floor(i/SW),xy=Math.hypot(L[0],L[1]);let contact=0;
 // Short rays against other generated fibres, independent of the broad skin
 // horizon. The owning fibre cannot shadow itself at its raster joints.
 for(const distance of shadow.fibreContactDistances){const sx=Math.round(x+L[0]/xy*distance*S),sy=Math.round(y+L[1]/xy*distance*S);if(sx<0||sy<0||sx>=SW||sy>=SH)continue;const peer=sy*SW+sx;if(strandOwner[peer]<0||strandOwner[peer]===strandOwner[i])continue;const excess=(zBuffer[peer]-zBuffer[i])*depthScale-distance*L[2]/xy;contact=Math.max(contact,clamp((excess+.3)/.6)*strandAlpha[peer]);}
 if(contact>.01)contactShadowSamples++;
 const shade=strandShade[i]*(1-shadow.fibreContactStrength*contact),alpha=strandAlpha[i];minShade=Math.min(minShade,shade);maxShade=Math.max(maxShade,shade);
 for(let c=0;c<3;c++){const value=srgb(fibreColor[c]*shade);if(value>255)clippedHighlights++;rgba[i*4+c]=Math.round(rgba[i*4+c]*(1-alpha)+clamp(value,0,255)*alpha);}
}
const raw={raw:{width:SW,height:SH,channels:4}},kernel=settings.resamplingKernel,full=await sharp(rgba,raw).resize({width:W,kernel}).png().toBuffer();
if(capture)await capture({rgba,coursePosition,strandOwner,width:SW,height:SH,supersampling:S});
await writeFile(`${base}-full.png`,full);
await sharp(full).resize({width:390,kernel}).png().toFile(`${base}-390.png`);
for(const[name,left,top,width,height]of[["crown",520,80,420,410],["shoulder",245,330,310,270],["lower",300,1000,410,350]])await sharp(rgba,raw).extract({left:left*S,top:top*S,width:width*S,height:height*S}).resize({width:820,kernel}).png().toFile(`${base}-${name}.png`);
const shadowImage=new Uint8Array(W*H*4);
for(let i=0;i<W*H;i++){const shade=Number.isFinite(depth[i])?Math.round(visibility[i]*220):25;shadowImage.set([shade,shade,shade,255],i*4);}
await sharp(shadowImage,{raw:{width:W,height:H,channels:4}}).png().toFile(`${base}-shadows.png`);
const outputs={};for(const name of ["full","390","crown","shoulder","lower","shadows"])outputs[name]={path:`${base}-${name}.png`,hash:hash(await readFile(`${base}-${name}.png`))};

return {outputs,renderHash:hash(full),strands:{count:geometry.strands.length,represented:represented.size,visibleSegments,hiddenSegments},material:{materialPixels,shadowedPixels:shadowed,contactShadowSamples,shadowSource:"surface depth horizon and short rays against other generated fibres",colorSpace:"linear light, sRGB output",fibreSamples,nonfiniteShades,clippedHighlights,minShade,maxShade,supersampling:S}};
}
