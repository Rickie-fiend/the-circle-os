import {validatePersonalImprintRecipe} from "../../app/os/home/imprint-personal-recipe.js";
import {createSurfaceQuery,inside} from "./imprint-network-geometry.mjs";

export function personalImprintWarp(recipe) {
  validatePersonalImprintRecipe(recipe);
  const p=recipe.parameters;
  return ([x,y,z])=>{
    const t=y/1536,angle=2*Math.PI*t+p.phase;
    const result=[512+(x-512)*(1+p.width+p.balance*Math.sin(angle))+p.bend*Math.sin(angle)+p.lean*(y-768),768+(y-768)*(1+p.height)+p.spacing*Math.sin(2*Math.PI*t)];
    if(z!==undefined)result.push(z*(1+p.depth));
    return result;
  };
}

// Boundaries get the same scanline events as the base tessellation. Subdividing
// an existing straight edge does not invent or infer material from the mesh.
function subdivideBoundaries(boundaries) {
  const events=[...new Set(boundaries.flatMap(polygon=>polygon.map(p=>p[1])))].sort((a,b)=>a-b);
  const lowerBound=value=>{let a=0,b=events.length;while(a<b){const mid=(a+b)>>>1;if(events[mid]<=value)a=mid+1;else b=mid;}return a;};
  return boundaries.map(polygon=>{
    const result=[polygon[0]];
    for(let i=1;i<polygon.length;i++){
      const a=polygon[i-1],b=polygon[i],dy=b[1]-a[1],ys=[];
      if(Math.abs(dy)>1e-10)for(let j=lowerBound(Math.min(a[1],b[1]));j<events.length&&events[j]<Math.max(a[1],b[1])-1e-9;j++)ys.push(events[j]);
      if(dy<0)ys.reverse();
      for(const y of ys)result.push([a[0]+(b[0]-a[0])*(y-a[1])/dy,y]);
      result.push(b);
    }
    return result;
  });
}

export function deformPersonalImprint(base,baseDomain,recipe,baseSurfaceAt=createSurfaceQuery(base.surface)) {
  const warp=personalImprintWarp(recipe),surface={...base.surface,vertices:base.surface.vertices.map(warp)};
  const mapPoint=point=>{
    const skin=baseSurfaceAt(point[0],point[1]);if(!skin)throw Error("A base route point has no supporting surface.");
    const tri=base.surface.triangles[skin.triangle],a=base.surface.vertices[tri[0]],b=base.surface.vertices[tri[1]],c=base.surface.vertices[tri[2]],area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const u=((point[0]-a[0])*(c[1]-a[1])-(point[1]-a[1])*(c[0]-a[0]))/area,v=((b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]))/area,weights=[1-u-v,u,v];
    // Use the supporting triangle's shared map, preserving exact peer points
    // and the original front/buried clearance relative to the transformed skin.
    return [0,1,2].map(k=>tri.reduce((sum,index,j)=>sum+surface.vertices[index][k]*weights[j],0)+(k===2?point[2]-skin.z:0));
  };
  const strands=base.strands.map(strand=>({...strand,route:strand.route.map(mapPoint),ends:strand.ends.map(end=>({...end,coverPoint:mapPoint(end.coverPoint)}))}));
  const boundaries=subdivideBoundaries(baseDomain.boundaries).map(polygon=>polygon.map(warp));
  const domain={boundaries,contains:p=>inside(p,boundaries[0])&&!boundaries.slice(1).some(polygon=>inside(p,polygon))};
  const geometry={...base,surface,strands},bounds=surface.vertices.reduce((b,p)=>({left:Math.min(b.left,p[0]),right:Math.max(b.right,p[0]),top:Math.min(b.top,p[1]),bottom:Math.max(b.bottom,p[1])}),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
  const p=recipe.parameters,minHorizontalScale=1+p.width-Math.abs(p.balance),minVerticalScale=1+p.height-Math.abs(p.spacing)*2*Math.PI/1536;
  return {geometry,domain,bounds,minJacobianBound:minHorizontalScale*minVerticalScale};
}
