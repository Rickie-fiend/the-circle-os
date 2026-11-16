import {normalizePersonalImprintInput} from "./imprint-personal-recipe.js";

// Complete courses through front AND rear folds; no endpoints are spliced later.
const COURSES = {
  sweep: [[660,160,50,120,.1],[830,230,10,130,.1],[820,470,60,140,.15],[620,580,130,150,-.4],[430,720,220,170,.3],[330,900,260,140,.5],[480,1060,180,170,.2],[700,1100,80,150,.3],[760,1250,0,140,.1],[540,1350,20,160,0],[300,1240,80,150,-.2],[300,1040,140,140,.3],[470,900,340,170,.6],[640,760,300,160,.5],[600,600,200,150,.4],[360,500,120,150,-.3],[210,620,0,120,.2],[220,800,20,140,.3],[370,850,70,140,.4],[490,700,120,150,-.3],[480,480,220,140,-.2],[580,310,100,120,.5],[550,190,20,100,.5]],
  return: [[400,180,20,145,.1],[650,140,30,120,.4],[800,300,20,130,-.2],[670,470,160,180,-.4],[440,520,220,180,.4],[240,430,60,150,-.5],[170,670,20,150,.1],[350,830,80,165,.3],[650,860,190,170,-.2],[830,1040,20,130,.6],[670,1280,10,150,.1],[400,1290,100,150,-.4],[300,1110,170,165,.6],[470,930,230,170,.1],[600,680,130,170,-.2],[470,480,70,150,.2],[260,300,0,130,-.1]],
  curl: [[320,280,0,105,0],[550,160,0,140,.3],[780,280,20,150,-.2],[810,500,80,150,.5],[630,630,200,190,-.3],[360,620,260,180,.3],[210,780,40,160,-.2],[260,1020,0,140,.2],[470,1180,0,170,.2],[720,1100,30,155,.2],[820,890,80,155,.1],[690,740,240,160,.6],[440,820,290,180,-.5],[400,1050,170,110,.3],[250,1110,20,110,.2],[150,940,40,140,.1],[240,670,100,140,.3],[460,430,200,150,-.3],[490,240,80,100,.3]],
};
export async function createLoopImprintRecipe(input) {
  const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(normalizePersonalImprintInput(input)))));
  let state=new DataView(bytes.buffer).getUint32(4,false);
  const random=()=>{state+=0x6D2B79F5;let n=Math.imul(state^state>>>15,state|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};
  const family=Object.keys(COURSES)[bytes[0]%3],scaleX=.78+random()*.4,scaleY=.8+random()*.34,balance=random()*2-1,foldPhase=random()*Math.PI*2,foldBias=(random()-.5)*180,foldLift=(random()-.5)*180;
  const controls=COURSES[family].map(([x,y,z,w,roll],i)=>Object.freeze([
    512+(x-512)*scaleX+(random()-.5)*64+balance*30*Math.sin(i*.8)+foldBias*Math.sin(i/COURSES[family].length*Math.PI*2+foldPhase),
    768+(y-768)*scaleY+(random()-.5)*48+foldLift*Math.cos(i/COURSES[family].length*Math.PI*4+foldPhase),
    z+(random()-.5)*30,
    w*(.88+random()*.32),roll+(random()-.5)*.28,
  ].map(v=>Number(v.toFixed(6)))));
  return Object.freeze({kind:"closed-loop",version:2,method:"periodic-folded-bundle-v1",family,controls:Object.freeze(controls),filamentCount:128,thickness:30+random()*12,phase:.037+random()*.012,grain:random()*Math.PI*2});
}
export function validateLoopImprintRecipe(recipe) {
  if(recipe?.kind!=="closed-loop"||recipe.version!==2||recipe.method!=="periodic-folded-bundle-v1"||!Object.hasOwn(COURSES,recipe.family))throw Error("This loop recipe needs its original supported construction version.");
  if(Object.keys(recipe).sort().join()!=="controls,family,filamentCount,grain,kind,method,phase,thickness,version"||recipe.filamentCount!==128||!Array.isArray(recipe.controls)||recipe.controls.length!==COURSES[recipe.family].length||recipe.controls.some(p=>!Array.isArray(p)||p.length!==5||p.some(v=>!Number.isFinite(v))||p[3]<30||p[3]>300||Math.abs(p[4])>1.5)||!Number.isFinite(recipe.thickness)||recipe.thickness<20||recipe.thickness>55||!Number.isFinite(recipe.phase)||recipe.phase<0||recipe.phase>=1||!Number.isFinite(recipe.grain)||recipe.grain<0||recipe.grain>Math.PI*2)throw Error("The loop recipe contains invalid shape controls.");
  return recipe;
}
export async function retainLoopImprintRecipe(existing,input){return existing==null?createLoopImprintRecipe(input):validateLoopImprintRecipe(existing);}
