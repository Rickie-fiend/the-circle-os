import {rasterDepth} from "./imprint-network-geometry.mjs";
import {sampleLoopStrand} from "./imprint-loop-geometry.mjs";
import {findLoopCrossings} from "./imprint-loop-crossings.mjs";
export function inspectLoopGeometry(geometry,{sampleStrand=sampleLoopStrand}={}){
 const {recipe,steps,strands,surface}=geometry,W=256,H=384,depth=rasterDepth(surface,W,H,.25),mask=Uint8Array.from(depth,v=>Number.isFinite(v)?1:0),visited=new Uint8Array(mask.length),queue=new Int32Array(mask.length),components=[],holes=[];
 for(let start=0;start<mask.length;start++)if(!visited[start]){
  const material=mask[start];let head=0,tail=1,touchesEdge=false;queue[0]=start;visited[start]=1;
  while(head<tail){const p=queue[head++],x=p%W,y=Math.floor(p/W);if(!x||!y||x===W-1||y===H-1)touchesEdge=true;for(const q of [x?p-1:-1,x<W-1?p+1:-1,y?p-W:-1,y<H-1?p+W:-1])if(q>=0&&!visited[q]&&mask[q]===material){visited[q]=1;queue[tail++]=q;}}
  if(material)components.push(tail);else if(!touchesEdge)holes.push(tail);
 }
 let nonfinite=0,closureFailures=0,peakTurn=0,minStep=Infinity,outside=0,maxSeamPosition=0,maxSeamTangent=0,maxSeamCurvature=0;
 const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
 const derivative=(t,u,order)=>{const h=1e-4,a=sampleStrand(geometry,strands[Math.round(u*strands.length)],t-h),b=sampleStrand(geometry,strands[Math.round(u*strands.length)],t),c=sampleStrand(geometry,strands[Math.round(u*strands.length)],t+h);return a.map((v,k)=>order===1?(c[k]-v)/(2*h):(c[k]-2*b[k]+v)/(h*h));};
 for(const strand of strands){
  if(!strand.closed||strand.ends.length||distance(strand.route[0],strand.route.at(-1))>1e-7)closureFailures++;
  maxSeamPosition=Math.max(maxSeamPosition,distance(sampleStrand(geometry,strand,0),sampleStrand(geometry,strand,1)));maxSeamTangent=Math.max(maxSeamTangent,distance(derivative(0,strand.u,1),derivative(1,strand.u,1)));maxSeamCurvature=Math.max(maxSeamCurvature,distance(derivative(0,strand.u,2),derivative(1,strand.u,2)));
  for(let j=0;j<steps;j++){
   const p=strand.route[j],before=strand.route[(j-1+steps)%steps],after=strand.route[j+1];if(p.some(v=>!Number.isFinite(v)))nonfinite++;
   if(p[0]<24||p[0]>1000||p[1]<24||p[1]>1512)outside++;
   const a=p.map((v,k)=>v-before[k]),b=after.map((v,k)=>v-p[k]),la=Math.hypot(...a),lb=Math.hypot(...b);minStep=Math.min(minStep,la,lb);
   peakTurn=Math.max(peakTurn,Math.acos(Math.max(-1,Math.min(1,a.reduce((s,v,k)=>s+v*b[k],0)/(la*lb||1)))));
  }
 }
 let mirroredIntersection=0,mirroredUnion=0,area=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=mask[y*W+x],b=mask[y*W+W-1-x];if(a)area++;if(a&&b)mirroredIntersection++;if(a||b)mirroredUnion++;}
 const crossingCheck=findLoopCrossings(geometry);
 const majorHoles=holes.filter(n=>n>=63),majorComponents=components.filter(n=>n>=16),mirroredIoU=mirroredIntersection/(mirroredUnion||1);
 const inspection={strands:strands.length,ends:strands.reduce((n,s)=>n+s.ends.length,0),closureFailures,maxSeamPosition,maxSeamTangent,maxSeamCurvature,peakTurnDegrees:peakTurn*180/Math.PI,minStep,nonfinite,outside,majorHoles:majorHoles.length,holeAreasSourcePixels:majorHoles.map(n=>n*16),minorHoles:holes.length-majorHoles.length,connectedComponents:majorComponents.length,materialArea:area*16,mirroredIoU,projectedCrossings:crossingCheck.projectedCrossings,nearCrossings:crossingCheck.nearCrossings,minCrossingDepth:crossingCheck.minCrossingDepth};
 const gates={closed:closureFailures===0&&maxSeamPosition<1e-7,tangentContinuous:maxSeamTangent<1e-4,curvatureContinuous:maxSeamCurvature<.01,finite:nonfinite===0,insideFrame:outside===0,smoothTurns:peakTurn<Math.PI/6&&minStep>1e-6,connected:majorComponents.length===1,openingLimit:majorHoles.length<=3,asymmetric:mirroredIoU<.92,depthSeparation:crossingCheck.nearCrossings===0};
 return {inspection,gates,mask};
}
