// Local geometric underpasses. Original samples are retained, so named endpoint
// coverers remain stable. No crossing is hidden through colour or opacity.
export function resolveForegroundCrossings(strands,surfaceAt){
 let total=0;
 for(let pass=0;pass<4;pass++){
  const bins=new Map(),insertions=new Map();let serial=0,found=0;
  for(let si=0;si<strands.length;si++){const strand=strands[si];for(let i=1;i<strand.route.length;i++){
   const a=strand.route[i-1],b=strand.route[i],skin=surfaceAt((a[0]+b[0])/2,(a[1]+b[1])/2);if(!skin||(a[2]+b[2])/2<skin.z+.15)continue;
   const seg={a,b,si,index:i,id:serial++},checked=new Set();
   for(let y=Math.floor(Math.min(a[1],b[1])/4);y<=Math.floor(Math.max(a[1],b[1])/4);y++)for(let x=Math.floor(Math.min(a[0],b[0])/4);x<=Math.floor(Math.max(a[0],b[0])/4);x++){
    const key=y*257+x;if(!bins.has(key))bins.set(key,[]);
    for(const old of bins.get(key)){if(checked.has(old.id)||old.si===si&&Math.abs(old.index-i)<=3)continue;checked.add(old.id);const c=old.a,d=old.b,dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const u=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den,v=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/den;if(u<=1e-5||u>=.99999||v<=1e-5||v>=.99999||Math.abs(a[2]+u*(b[2]-a[2])-c[2]-v*(d[2]-c[2]))>=.1)continue;
     if(!insertions.has(si))insertions.set(si,new Map());const bySegment=insertions.get(si);if(!bySegment.has(i))bySegment.set(i,[]);bySegment.get(i).push(u);found++;
    }bins.get(key).push(seg);
   }
  }}
  if(!found)break;
  for(const[si,segments]of insertions){const old=strands[si].route,route=[old[0]];for(let i=1;i<old.length;i++){const peaks=segments.get(i);if(peaks){const a=old[i-1],b=old[i],times=new Set();for(const u of peaks){const radius=Math.min(.25,u*.5,(1-u)*.5);for(let k=-4;k<=4;k++)times.add(u+radius*k/4);}for(const t of [...times].sort((a,b)=>a-b)){const p=a.map((v,k)=>v+t*(b[k]-v));let dip=0;for(const u of peaks){const radius=Math.min(.25,u*.5,(1-u)*.5),q=Math.abs(t-u)/radius;if(q<1)dip=Math.max(dip,1.6*Math.cos(q*Math.PI/2)**2);}p[2]-=dip;route.push(p);}}route.push(old[i]);}strands[si].route=route;}
  total+=found;
 }return total;
}
