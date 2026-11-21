import {COLOR_GROUPS} from './imprint-color-model.js';
const wrap=v=>v-Math.round(v);
const smooth=v=>{const q=Math.max(0,Math.min(1,v));return q*q*q*(q*(q*6-15)+10);};
// Visual trial values. Fade timing is settled; this pair remains visual review.
export const FRESH_ORANGE=1;
export const FADED_ORANGE=.60;
export const ORANGE_SHADE_EXPONENT=.35;
// Growth and brightness levels remain illustrative. Fade timing is confirmed:
// wait 24 elapsed hours, then change once at the first local 06:00 cutoff.
export function colorFadeAt(appliedAt){
 if(appliedAt==null)throw new Error('A valid color application time is required.');
 const applied=new Date(appliedAt);
 if(!Number.isFinite(applied.getTime()))throw new Error('A valid color application time is required.');
 const eligible=new Date(applied.getTime()+24*60*60*1000),cutoff=new Date(eligible);
 cutoff.setHours(6,0,0,0);
 if(cutoff.getTime()<eligible.getTime())cutoff.setDate(cutoff.getDate()+1);
 return cutoff;
}
export function colorBrightnessAt(appliedAt,now){
 if(now==null)throw new Error('A valid observation time is required.');
 const current=new Date(now);
 if(!Number.isFinite(current.getTime()))throw new Error('A valid observation time is required.');
 const cutoff=colorFadeAt(appliedAt);
 if(current.getTime()<new Date(appliedAt).getTime())return 0;
 return current.getTime()<cutoff.getTime()?FRESH_ORANGE:FADED_ORANGE;
}
// Fictional use-days occur at 06:00 unless an explicit application time is given.
const studyTime=day=>new Date(2026,0,day,6,0,0,0);
export function usageState(events,day){
 const now=studyTime(day);
 return Object.fromEntries(COLOR_GROUPS.map(group=>{
  const used=events.filter(e=>e.group===group&&e.day<=day&&new Date(e.at??studyTime(e.day)).getTime()<=now.getTime());
  const days=[...new Set(used.map(e=>e.day))],count=days.length;
  const latest=count?Math.max(...used.map(e=>new Date(e.at??studyTime(e.day)).getTime())):null;
  return [group,{days:count,spread:count?1-Math.exp(-count/22):0,brightness:count?colorBrightnessAt(latest,now):0}];
 }));
}
export function growthWeight(anchor,t,u,spread){
 if(!spread)return 0;
 const dt=wrap(t-anchor.t-.02*Math.sin(2*Math.PI*(u-anchor.u))-.009*Math.sin(6*Math.PI*u));
 const du=wrap(u-anchor.u-.05*Math.sin(6*Math.PI*(t-anchor.t)));
 const width=(.04+.15*spread)*anchor.scale*(.88+.12*Math.sin(4*Math.PI*u+1.1));
 return smooth(1-Math.abs(dt)/width)*smooth(1-Math.abs(du)/(.14+.28*spread));
}
export function growthPaint(anchors,state,t,u){
 let weight=0,amount=0;
 for(const group of COLOR_GROUPS){
  const level=state[group]?.brightness||0;
  const candidate=level?growthWeight(anchors[group],t,u,state[group].spread):0;
  weight=Math.max(weight,candidate);amount=Math.max(amount,candidate*level);
 }
 return {weight,brightness:weight?amount/weight:0};
}
export function growthAmount(anchors,state,t,u){const p=growthPaint(anchors,state,t,u);return p.weight*p.brightness;}
// Nested differences preserve the feathered footprint and each day's own age.
export function contributionPaint(anchors,state,t,u,pulse={}){
 let weight=0,amount=0;
 for(const group of COLOR_GROUPS){
  let previous=0,groupAmount=0;
  const layers=state[group]?.layers??[];
  for(let i=0;i<layers.length;i++){
   const layer=layers[i];
   if(layers[i+1]?.brightness===layer.brightness)continue;
   const next=growthWeight(anchors[group],t,u,layer.spread);
   groupAmount+=Math.max(0,next-previous)*layer.brightness;previous=next;
  }
  groupAmount+=(previous-groupAmount)*(pulse[group]??0);
  weight=Math.max(weight,previous);amount=Math.max(amount,groupAmount);
 }
 return {weight,brightness:weight?amount/weight:0};
}
export function paintOrangePixel(bone,weight,brightness){
 if(!weight||!brightness)return [...bone];
 // Lift existing strand illumination monotonically; gaps/occlusion are never
 // painted by this function. Area feathering and time fade are separate factors.
 const illumination=(Math.max(0,Math.min(1,bone[0]/241)))**ORANGE_SHADE_EXPONENT;
 return bone.map((value,c)=>Math.round(value*(1-weight)+[227,107,55][c]*illumination*brightness*weight));
}
export function fictionalUse(){
 const periods=[9,2,5,1,2,4],events=[];
 for(let day=1;day<=90;day++)COLOR_GROUPS.forEach((group,i)=>{if(day===1||day%periods[i]===0)events.push({group,day});});
 return events;
}
