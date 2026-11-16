// Independent mesh, route and covering-strand inspection shared by base/variants.
import {scanlineIntervals,createSurfaceQuery} from "./imprint-network-geometry.mjs";
export function inspectImprintGeometry(geometry,domain,{surfaceThickness=24,height=1536,endpoints=geometry.strands.flatMap(strand=>strand.ends)}={}){
const mesh=geometry.surface,surfaceAt=createSurfaceQuery(mesh),yIntervals=new Map();let outsideVertices=0,nonfinite=0,invalidTriangles=0,unsupported=0,exposed=0,namedFoldFailures=0,coveringStrandFailures=0,coverageExpected=0,coverageFound=0;
for(const p of mesh.vertices){if(p.some(n=>!Number.isFinite(n))){nonfinite++;continue;}const key=p[1].toFixed(8);if(!yIntervals.has(key))yIntervals.set(key,scanlineIntervals(domain.boundaries,p[1]+1e-8));if(!yIntervals.get(key).some(([a,b])=>p[0]>=a-1e-4&&p[0]<=b+1e-4)){const before=scanlineIntervals(domain.boundaries,p[1]-1e-8);if(!before.some(([a,b])=>p[0]>=a-1e-4&&p[0]<=b+1e-4))outsideVertices++;}}
for(const tri of mesh.triangles){if(tri.some(i=>!Number.isInteger(i)||i<0||i>=mesh.vertices.length)){invalidTriangles++;continue;}const[a,b,c]=tri.map(i=>mesh.vertices[i]);if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])< -1e-8)invalidTriangles++;}
const ids=new Set(),strandById=new Map();for(const strand of geometry.strands){if(ids.has(strand.id))throw Error("Duplicate strand identity");ids.add(strand.id);strandById.set(strand.id,strand);for(const p of strand.route){if(p.some(n=>!Number.isFinite(n))){nonfinite++;continue;}const s=surfaceAt(p[0],p[1]);if(!s||p[2]>s.z+.36||p[2]<s.z-surfaceThickness-.01)unsupported++;}}
// Same-depth foreground crossings are not a legitimate hidden continuation.
const segmentBins=new Map(),crossings=new Set();let segmentId=0;
for(const strand of geometry.strands)for(let i=1;i<strand.route.length;i++){
 const a=strand.route[i-1],b=strand.route[i],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],skin=surfaceAt(...mid);if(!skin||(a[2]+b[2])/2<skin.z+.15)continue;
 const segment={a,b,strand:strand.id,index:i,id:segmentId++},checked=new Set();
 for(let y=Math.floor(Math.min(a[1],b[1])/4);y<=Math.floor(Math.max(a[1],b[1])/4);y++)for(let x=Math.floor(Math.min(a[0],b[0])/4);x<=Math.floor(Math.max(a[0],b[0])/4);x++){
  const key=y*257+x;if(!segmentBins.has(key))segmentBins.set(key,[]);
  for(const old of segmentBins.get(key)){if(checked.has(old.id)||old.strand===strand.id&&Math.abs(old.index-i)<=3)continue;checked.add(old.id);const c=old.a,d=old.b,dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const u=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den,v=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/den;if(u>1e-5&&u<.99999&&v>1e-5&&v<.99999&&Math.abs(a[2]+u*(b[2]-a[2])-c[2]-v*(d[2]-c[2]))<.1)crossings.add(`${old.id}:${segment.id}`);}
  segmentBins.get(key).push(segment);
 }
}
for(const end of endpoints){const strand=strandById.get(end.id),p=end.side==="start"?strand?.route[0]:strand?.route.at(-1);if(!p){namedFoldFailures++;continue;}const tri=mesh.triangles[end.coveringTriangle];if(!tri){namedFoldFailures++;continue;}const[a,b,c]=tri.map(i=>mesh.vertices[i]),area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),u=((p[0]-a[0])*(c[1]-a[1])-(p[1]-a[1])*(c[0]-a[0]))/area,v=((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/area,coverZ=(1-u-v)*a[2]+u*b[2]+v*c[2];if(u< -1e-6||v< -1e-6||u+v>1.000001||mesh.faceFolds?.[end.coveringTriangle]!==end.coveringFold)namedFoldFailures++;if(coverZ-p[2]<.5)exposed++;
 const peer=strandById.get(end.coveringStrand),q=end.coverPoint,peerSurface=q&&surfaceAt(q[0],q[1]);if(!peer||peer.id===strand.id||!q||Math.hypot(p[0]-q[0],p[1]-q[1])>1e-5||q[2]-p[2]<.5||!peer.route.some(v=>Math.hypot(...v.map((n,i)=>n-q[i]))<1e-5)||!peerSurface||q[2]<peerSurface.z+.2)coveringStrandFailures++;
}
for(let y=2;y<height;y+=4)for(const[a,b]of scanlineIntervals(domain.boundaries,y))for(let x=Math.ceil((a-2)/4)*4+2;x<b;x+=4){if(x<a)continue;coverageExpected++;if(surfaceAt(x,y))coverageFound++;}

const inspection={outsideVertices,nonfinite,invalidTriangles,unsupportedRoutePoints:unsupported,foregroundCrossings:crossings.size,checkedEndpoints:endpoints.length,exposedEndpoints:exposed,namedFoldFailures,coveringStrandFailures,materialSamples:coverageExpected,supportedSamples:coverageFound,coverage:coverageFound/coverageExpected,uniqueStrandIds:ids.size};
const gates={coverage:coverageExpected>0&&coverageFound/coverageExpected>=.99,interiorGaps:coverageFound===coverageExpected,support:unsupported===0&&outsideVertices===0&&invalidTriangles===0,finite:nonfinite===0,foregroundCrossings:crossings.size===0,endpoints:exposed===0&&namedFoldFailures===0&&coveringStrandFailures===0&&endpoints.length===geometry.strands.filter(s=>!s.closed).length*2};
return {inspection,gates,geometryAccepted:Object.values(gates).every(Boolean)};
}
