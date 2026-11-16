import {createSoriGeometry} from './imprint-sori-geometry.mjs';
import {sampleLoopStrand,loopFrame} from './imprint-loop-geometry.mjs';
import {resolveLoopCrossings,underpassOffset} from './imprint-loop-crossings.mjs';

const TAU=2*Math.PI;
export const soriReliefSettings=Object.freeze({method:'periodic-rounded-section-v1',amplitude:.8});
// Modulate the rounded section's thickness, tapering to zero at its side rails.
// Dividing the wave by 1.3 keeps the thickness multiplier above 0.2 everywhere.
// The field is periodic in both course and section, including their derivatives.
export function reliefHeight(t,u){
 const across=Math.cos(TAU*u),edge=Math.sin(TAU*u)**2;
 const swell=.72+.28*Math.sin(2*TAU*t+.4);
 return soriReliefSettings.amplitude*Math.sin(TAU*u)*edge*(swell*Math.cos(3*Math.PI*across+.4*Math.sin(TAU*t))+.3*Math.sin(3*TAU*t+.8*across))/1.3;
}
export function reliefAmount(geometry,t,u){const f=loopFrame(geometry.recipe,t);return reliefHeight(t,u)*f.width*f.thickness/70*geometry.fit.scale;}
export function createSoriReliefGeometry(original,steps=3072){
 const geometry=createSoriGeometry(original,steps);
 geometry.relief={...soriReliefSettings};
 geometry.foundation=geometry.strands.map(s=>({depthOffset:s.depthOffset,underpasses:structuredClone(s.underpasses)}));
 for(let j=0;j<=steps;j++){
  const direction=loopFrame(geometry.recipe,j/steps).binormal;
  const f=loopFrame(geometry.recipe,j/steps);
  for(const s of geometry.strands){const h=reliefHeight(j/steps,s.u)*f.width*f.thickness/70*geometry.fit.scale;for(let k=0;k<3;k++)s.route[j][k]+=direction[k]*h;}
 }
 geometry.reliefCrossingRepair=resolveLoopCrossings(geometry);
 // The invisible lighting guide follows the final actual fibre depths, including
 // crossing corrections. It contributes no visible pixels and clips no fibres.
 for(let j=0;j<steps;j++)for(let i=0;i<128;i++)geometry.surface.vertices[j*128+i]=geometry.strands[i].route[j].map((v,k)=>v-(k===2?.45:0));
 return geometry;
}
export function sampleSoriReliefStrand(geometry,strand,t){
 const foundation=geometry.foundation[geometry.strands.indexOf(strand)],p=sampleLoopStrand(geometry,{...strand,...foundation},t);
 const direction=loopFrame(geometry.recipe,t).binormal,h=reliefAmount(geometry,t,strand.u);
 for(let k=0;k<3;k++)p[k]+=direction[k]*h;
 p[2]+=strand.depthOffset-underpassOffset(strand.underpasses,t);
 return p;
}
