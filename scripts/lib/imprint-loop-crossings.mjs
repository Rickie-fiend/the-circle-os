// Periodic geometric depth corrections; every route remains an end-free loop.
export function findLoopCrossings(geometry){
const {strands,steps}=geometry;
 const bins=new Map(),pairs=new Set(),records=[],allRecords=[];let crossings=0,nearCrossings=0,minCrossingDepth=Infinity;
 for(let s=0;s<strands.length;s++)for(let j=0;j<steps;j++){
  const a=strands[s].route[j],b=strands[s].route[j+1],segment={a,b,j,s,id:s*steps+j},seen=new Set();
  for(let y=Math.floor(Math.min(a[1],b[1])/8);y<=Math.floor(Math.max(a[1],b[1])/8);y++)for(let x=Math.floor(Math.min(a[0],b[0])/8);x<=Math.floor(Math.max(a[0],b[0])/8);x++){
   const key=y*129+x;if(!bins.has(key))bins.set(key,[]);
   for(const old of bins.get(key)){
    if(seen.has(old.id))continue;seen.add(old.id);const courseDistance=Math.min(Math.abs(j-old.j),steps-Math.abs(j-old.j));if(courseDistance<steps*.06)continue;
    const c=old.a,d=old.b,dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
    const u=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den,v=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/den;
    if(u<=1e-5||u>=.99999||v<=1e-5||v>=.99999)continue;
    const pair=`${old.id}:${segment.id}`;if(pairs.has(pair))continue;pairs.add(pair);crossings++;
    const gap=Math.abs(a[2]+u*(b[2]-a[2])-c[2]-v*(d[2]-c[2]));minCrossingDepth=Math.min(minCrossingDepth,gap);
    const record={s,j,u,other:old.s,otherJ:old.j,v,z:a[2]+u*(b[2]-a[2]),otherZ:c[2]+v*(d[2]-c[2]),gap};allRecords.push(record);if(gap<(strands[s].width+strands[old.s].width)/2+.15){nearCrossings++;records.push(record);}
   }
   bins.get(key).push(segment);
  }
 }

return {projectedCrossings:crossings,nearCrossings,minCrossingDepth:Number.isFinite(minCrossingDepth)?minCrossingDepth:null,records,allRecords};
}
export function underpassOffset(passes,t){return passes.reduce((sum,p)=>sum+(p.otherT!==undefined?p.depth*(Math.cos(Math.PI*2*(t-p.t))-Math.cos(Math.PI*2*(t-p.otherT))):p.depth*Math.exp((Math.cos(Math.PI*2*(t-p.t))-1)/(Math.PI*2*p.sigma)**2)),0);}
export function resolveLoopCrossings(geometry){
 const {strands,steps}=geometry,baseZ=strands.map(s=>s.route.map(p=>p[2]));for(const s of strands){s.underpasses=[];s.depthOffset=0;}
 let added=0,iteration=0;
 for(;iteration<12;iteration++){
  const self=findLoopCrossings(geometry).records.filter(c=>c.s===c.other);if(!self.length)break;
 for(const c of self){const behind=geometry.courseDepth[c.j]<geometry.courseDepth[c.otherJ],t=(behind?c.j+c.u:c.otherJ+c.v)/steps,otherT=(behind?c.otherJ+c.v:c.j+c.u)/steps,strand=strands[c.s],needed=Math.max(1,strand.width+1+(behind?c.z-c.otherZ:c.otherZ-c.z)),depth=needed/Math.max(.01,2*(1-Math.cos(Math.PI*2*(t-otherT))));strand.underpasses.push({t,otherT,depth});added++;}
  for(let s=0;s<strands.length;s++){for(let j=0;j<steps;j++)strands[s].route[j][2]=baseZ[s][j]-underpassOffset(strands[s].underpasses,j/steps);strands[s].route[steps]=strands[s].route[0].slice();}
 }
 // Choose the smallest constant depth adjustment outside all forbidden crossing
 // intervals. This preserves each loop's curvature and avoids chasing local dips
 // between neighbouring fibres. Self-crossings were handled periodically above.
 const all=findLoopCrossings(geometry).allRecords,groups=Array.from({length:strands.length},()=>[]);
 for(const c of all)if(c.s!==c.other)groups[Math.max(c.s,c.other)].push(c);
 for(let s=0;s<strands.length;s++){
  const intervals=groups[s].map(c=>{const current=c.s===s?c.z:c.otherZ,peer=c.s===s?c.other:c.s,other=c.s===s?c.otherZ:c.z,center=other+strands[peer].depthOffset-current,clearance=(strands[s].width+strands[peer].width)/2+.6;return[center-clearance,center+clearance];}).sort((a,b)=>a[0]-b[0]),merged=[];
  for(const interval of intervals){const last=merged.at(-1);if(last&&interval[0]<=last[1]+.05)last[1]=Math.max(last[1],interval[1]);else merged.push(interval.slice());}
  const blocked=merged.find(([a,b])=>a<=0&&b>=0);strands[s].depthOffset=blocked?(Math.abs(blocked[0])<Math.abs(blocked[1])?blocked[0]-.05:blocked[1]+.05):0;
  for(const p of strands[s].route)p[2]+=strands[s].depthOffset;
 }
 return {underpasses:added,iterations:iteration,depthOffsetRange:[Math.min(...strands.map(s=>s.depthOffset)),Math.max(...strands.map(s=>s.depthOffset))]};
}
