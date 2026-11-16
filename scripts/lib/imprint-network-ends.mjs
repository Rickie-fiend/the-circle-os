// A hidden endpoint is placed beneath an actual neighbouring foreground strand,
// not merely anywhere below the sculpture's supporting skin.
export function concealStrandEnds(strands,surfaceAt){
 const bins=new Map(),size=12;
 for(const strand of strands)for(let i=18;i<strand.route.length-18;i++){
  const p=strand.route[i],s=surfaceAt(p[0],p[1]);if(!s||p[2]<s.z+.2)continue;
  const key=`${Math.floor(p[0]/size)},${Math.floor(p[1]/size)}`;if(!bins.has(key))bins.set(key,[]);bins.get(key).push({id:strand.id,p,index:i});
 }
 const results=[];let failures=0,maxExtension=0;
 for(const strand of strands){if(strand.closed)continue;strand.ends=[];
  for(const side of ["start","end"]){const start=side==="start",anchorIndex=start?17:strand.route.length-18,a=strand.route[anchorIndex],before=strand.route[start?anchorIndex+1:anchorIndex-1],dx=a[0]-before[0],dy=a[1]-before[1],n=Math.hypot(dx,dy)||1,candidates=[];
   const bx=Math.floor(a[0]/size),by=Math.floor(a[1]/size);
   for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++)for(const c of bins.get(`${bx+ox},${by+oy}`)||[]){if(c.id===strand.id)continue;const distance=Math.hypot(a[0]-c.p[0],a[1]-c.p[1]);if(distance>.15&&distance<=16)candidates.push({...c,distance});}
   candidates.sort((a,b)=>a.distance-b.distance);let chosen,bridge;
   for(const c of candidates.slice(0,80)){const q=c.p,handle=Math.min(2,c.distance*.3),control=[a[0]+dx/n*handle,a[1]+dy/n*handle],points=[];let valid=true;
    for(let i=0;i<=40;i++){const t=i/40,s=1-t,x=s*s*s*a[0]+3*s*s*t*control[0]+3*s*t*t*q[0]+t*t*t*q[0],y=s*s*s*a[1]+3*s*s*t*control[1]+3*s*t*t*q[1]+t*t*t*q[1],support=surfaceAt(x,y);if(!support){valid=false;break;}points.push([x,y,support.z+.35]);}
    if(!valid)continue;const arc=new Float64Array(points.length);for(let i=points.length-2;i>=0;i--)arc[i]=arc[i+1]+Math.hypot(points[i][0]-points[i+1][0],points[i][1]-points[i+1][1]);
    // Descend beneath the foreground bundle before moving sideways to the
    // covering strand. A visible lateral hop would create a ladder-shaped join.
    const turnLength=Math.min(.7,arc[0]*.8);
    for(let i=0;i<points.length;i++){const t=Math.min(1,(arc[0]-arc[i])/turnLength),smooth=t*t*(3-2*t);points[i][2]-=16.35*smooth;}
    chosen=c;bridge=points;break;
   }
   if(!chosen){failures++;continue;}
   strand.route=start?[...bridge.toReversed().slice(0,-1),...strand.route.slice(anchorIndex)]:[...strand.route.slice(0,anchorIndex+1),...bridge.slice(1)];
   const p=start?strand.route[0]:strand.route.at(-1),s=surfaceAt(p[0],p[1]);const result={id:strand.id,side,coveringFold:s.fold,coveringTriangle:s.triangle,coveringStrand:chosen.id,coverPoint:chosen.p,clearance:s.z-p[2],extension:chosen.distance};results.push(result);strand.ends.push(result);maxExtension=Math.max(maxExtension,chosen.distance);
  }
 }
 return {endpoints:results,failures,maxExtension};
}
