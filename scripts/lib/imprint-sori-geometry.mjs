import {createLoopGeometry} from './imprint-loop-geometry.mjs';
// Authored Sori-only course. Each return crosses the central body at a different depth.
export function soriRecipe(original){
 const points=[[420,220,30],[630,250,60],[680,420,190],[460,570,320],[230,400,70],[260,630,40],[470,760,240],[770,620,80],[790,910,30],[550,1000,300],[300,850,80],[360,1030,30],[450,1180,60],[600,1110,200],[540,880,360],[370,640,180],[540,410,80]];
 return {...original,controls:points.map((p,i)=>[p[0],p[1],p[2]*1.4,original.controls[i][3]*1.5,original.controls[i][4]])};
}
export function createSoriGeometry(original,steps=1536){return createLoopGeometry(soriRecipe(original),{steps});}
