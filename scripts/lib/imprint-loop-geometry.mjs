import {validateLoopImprintRecipe} from "../../app/os/home/imprint-loop-recipe.js";
import {resolveLoopCrossings,underpassOffset} from "./imprint-loop-crossings.mjs";
export const loopUnit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
export const loopCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const TAU=Math.PI*2;
function spline(recipe,t){
 const knots=recipe.controls,n=knots.length,p=((t+recipe.phase)%1+1)%1*n,i=Math.floor(p),s=p-i,points=[knots[(i+n-1)%n],knots[i%n],knots[(i+1)%n],knots[(i+2)%n]];
 const w=[(-s+2*s*s-s**3)/2,(2-5*s*s+3*s**3)/2,(s+4*s*s-3*s**3)/2,(-s*s+s**3)/2],d=[(-1+4*s-3*s*s)/2,(-10*s+9*s*s)/2,(1+8*s-9*s*s)/2,(-2*s+3*s*s)/2],dd=[2-3*s,-5+9*s,4-9*s,-1+3*s];
 const sum=weights=>[0,1,2,3,4].map(k=>points.reduce((v,p,j)=>v+p[k]*weights[j],0));
 return {p:sum(w),d:sum(d).map(v=>v*n),dd:sum(dd).map(v=>v*n*n)};
}
const spectra=new WeakMap();
const transportedFrames=new WeakMap();
const courseSamples=new WeakMap();
function curve(recipe,t){
 let spectrum=spectra.get(recipe);
 if(!spectrum){
  const samples=Array.from({length:512},(_,i)=>spline(recipe,i/512).p);
  spectrum=Array.from({length:25},(_,k)=>{
   const a=[0,0,0,0,0],b=a.slice(),gain=(k?2:1)/512*Math.exp(-((k/13)**4));
   for(let i=0;i<512;i++){const angle=TAU*k*i/512;for(let j=0;j<5;j++){a[j]+=samples[i][j]*Math.cos(angle)*gain;b[j]+=samples[i][j]*Math.sin(angle)*gain;}}
   return {a,b};
  });spectra.set(recipe,spectrum);
 }
 const p=[0,0,0,0,0],d=p.slice(),dd=p.slice();
 for(let k=0;k<spectrum.length;k++){const {a,b}=spectrum[k],omega=TAU*k,c=Math.cos(omega*t),s=Math.sin(omega*t);for(let j=0;j<5;j++){p[j]+=a[j]*c+b[j]*s;d[j]+=omega*(-a[j]*s+b[j]*c);dd[j]-=omega*omega*(a[j]*c+b[j]*s);}}
 return {p,d,dd};
}
function frameNormal(recipe,t,tangent){
 let spectrum=transportedFrames.get(recipe);
 if(!spectrum){
  const count=2048,tangents=Array.from({length:count+1},(_,i)=>{const d=curve(recipe,i/count).d;d[2]*=2.1;return loopUnit(d.slice(0,3));});
  const axis=[0,1,2].sort((a,b)=>Math.abs(tangents[0][a])-Math.abs(tangents[0][b]))[0],reference=[0,0,0];reference[axis]=1;
  const normals=[loopUnit(loopCross(reference,tangents[0]))];
  for(let i=1;i<=count;i++){
   const v=loopCross(tangents[i-1],tangents[i]),c=tangents[i-1].reduce((n,x,k)=>n+x*tangents[i][k],0),n=normals[i-1],a=loopCross(v,n),b=loopCross(v,a),next=n.map((x,k)=>x+a[k]+b[k]/Math.max(1e-8,1+c)),along=next.reduce((sum,x,k)=>sum+x*tangents[i][k],0);
   normals.push(loopUnit(next.map((x,k)=>x-along*tangents[i][k])));
  }
  const first=normals[0],last=normals[count],angle=Math.atan2(tangents[0].reduce((s,x,k)=>s+x*loopCross(last,first)[k],0),last.reduce((s,x,k)=>s+x*first[k],0));
  const corrected=normals.slice(0,count).map((n,i)=>{const a=angle*i/count,cross=loopCross(tangents[i],n);return n.map((x,k)=>x*Math.cos(a)+cross[k]*Math.sin(a));});
  spectrum=corrected;
  transportedFrames.set(recipe,spectrum);
 }
 const p=((t%1+1)%1)*spectrum.length,i=Math.floor(p),s=p-i,weights=[(1-s)**3/6,(3*s**3-6*s*s+4)/6,(-3*s**3+3*s*s+3*s+1)/6,s**3/6],n=[0,0,0];
 for(let k=0;k<4;k++){const normal=spectrum[(i+k-1+spectrum.length)%spectrum.length];for(let j=0;j<3;j++)n[j]+=normal[j]*weights[k];}
 const along=n.reduce((sum,x,k)=>sum+x*tangent[k],0);return loopUnit(n.map((x,k)=>x-along*tangent[k]));
}
export function loopFrame(recipe,t){
 const {p,d,dd}=curve(recipe,t);p[2]*=2.1;d[2]*=2.1;dd[2]*=2.1;
 const tangent=loopUnit(d.slice(0,3)),side=frameNormal(recipe,t,tangent),up=loopUnit(loopCross(tangent,side)),roll=p[4]+.35*Math.sin(TAU*t*2+recipe.grain)+.2*Math.sin(TAU*t*3+recipe.grain);
 const normal=side.map((v,k)=>v*Math.cos(roll)+up[k]*Math.sin(roll)),binormal=side.map((v,k)=>-v*Math.sin(roll)+up[k]*Math.cos(roll));
 const curvature=Math.hypot(...loopCross(d.slice(0,3),dd.slice(0,3)))/Math.max(1e-9,Math.hypot(...d.slice(0,3))**3);
 let course=courseSamples.get(recipe);if(!course){course=Array.from({length:512},(_,i)=>{const v=curve(recipe,i/512).p;return[v[0],v[1],v[2]*2.1];});courseSamples.set(recipe,course);}
 let proximity=0;const low=Math.sin(Math.PI*.015)**2,high=Math.sin(Math.PI*.04)**2;
 for(let i=0;i<course.length;i++){const separation=Math.sin(Math.PI*(t-i/course.length))**2,q=Math.max(0,Math.min(1,(separation-low)/(high-low))),weight=q*q*(3-2*q);if(!weight)continue;const distance=Math.hypot(p[0]-course[i][0],p[1]-course[i][1],p[2]-course[i][2]);proximity+=weight/Math.max(1,distance)**12;}
 const clearance=1.0*Math.max(1e-60,proximity)**(-1/12),width=(p[3]**-8+(curvature/.65)**8+clearance**-8)**(-1/8);
 return {center:p.slice(0,3),normal,binormal,width,thickness:recipe.thickness};
}
export function loopPosition(recipe,t,u){
 const f=loopFrame(recipe,t),angle=TAU*u+.025*Math.sin(TAU*t*2+TAU*u),a=(Math.cos(angle)+.07*Math.cos(3*angle))*f.width,b=Math.sin(angle)*f.width*f.thickness/70;
 return f.center.map((v,k)=>v+f.normal[k]*a+f.binormal[k]*b);
}
export function createLoopGeometry(recipe,{steps=1536}={}){
 validateLoopImprintRecipe(recipe);
 const N=recipe.filamentCount,vertices=[],triangles=[],rows=[],courseDepth=[];
 for(let j=0;j<steps;j++){
  const f=loopFrame(recipe,j/steps),row=[];courseDepth.push(f.center[2]);
  for(let i=0;i<N;i++){const angle=TAU*i/N+.025*Math.sin(TAU*j/steps*2+TAU*i/N),a=(Math.cos(angle)+.07*Math.cos(3*angle))*f.width,b=Math.sin(angle)*f.width*f.thickness/70;row.push(vertices.length);vertices.push(f.center.map((v,k)=>v+f.normal[k]*a+f.binormal[k]*b));}
  rows.push(row);
 }
 const bounds=vertices.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]),scale=Math.min(900/(bounds[2]-bounds[0]),1352/(bounds[3]-bounds[1])),center=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2];
 const fit=p=>[512+(p[0]-center[0])*scale,768+(p[1]-center[1])*scale,p[2]*scale];
 for(let i=0;i<vertices.length;i++)vertices[i]=fit(vertices[i]);
 for(let j=0;j<steps;j++)for(let i=0;i<N;i++){const a=rows[j][i],b=rows[(j+1)%steps][i],c=rows[(j+1)%steps][(i+1)%N],d=rows[j][(i+1)%N];triangles.push([a,b,c],[a,c,d]);}
 const strands=Array.from({length:N},(_,i)=>{const route=rows.map(row=>vertices[row[i]].map((v,k)=>v+(k===2?.45:0)));route.push(route[0].slice());return{id:`loop-${i}`,closed:true,u:i/N,width:1.05+.8*(.5+.5*Math.sin(i*2.399+recipe.grain)),reflectance:.55+.45*(.5+.5*Math.sin(i*1.797+recipe.grain)),route,ends:[]};});
 const geometry={kind:"closed-loop",version:2,recipe,surface:{id:"closed-folded-bundle",vertices,triangles},strands,fit:{scale,center},steps,courseDepth:courseDepth.map(z=>z*scale)};
 geometry.crossingRepair=resolveLoopCrossings(geometry);return geometry;
}
export function sampleLoopStrand(geometry,strand,t){const raw=loopPosition(geometry.recipe,t,strand.u),{scale,center}=geometry.fit;return[512+(raw[0]-center[0])*scale,768+(raw[1]-center[1])*scale,raw[2]*scale+.45+(strand.depthOffset??0)-underpassOffset(strand.underpasses??[],t)];}
