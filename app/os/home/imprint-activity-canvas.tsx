"use client";

import {useEffect,useRef,useState} from 'react';
import {COLOR_GROUPS} from './imprint-color-model.js';
import {activityPulse,PULSE_MS,type ActivityGrowth} from './imprint-activity-model.js';
import {contributionPaint,ORANGE_SHADE_EXPONENT,type Anchors} from './imprint-growth-model.js';
import './imprint.css';

type Asset={path:string;hash:string};
export type Sample={id:string;label:string;outputs:Record<string,Asset>;coordinates:Asset};
type Scene={pixels:Uint8ClampedArray;coordinates:Float32Array;width:number;height:number};
export type Pulse={group:string;serial:number};
let reviewScene: Promise<Scene> | undefined;

async function checked(asset:Asset){
 const response=await fetch(`/${asset.path}?v=${asset.hash}`);
 if(!response.ok)throw Error('Artwork data is unavailable.');
 const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
 if([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')!==asset.hash)throw Error('Artwork data did not match its inspection.');
 return bytes;
}

export function ActivityCanvas({sample,anchors,growth,pulse,pulses,retainScene=false}:{sample:Sample;anchors:Anchors;growth:ActivityGrowth;pulse?:Pulse|null;pulses?:Pulse[];retainScene?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),timers=useRef<Record<string,{start:number;initial:number}>>({});
 const [scene,setScene]=useState<Scene|null>(null),[error,setError]=useState('');
 const reduced=useRef(false),lastSerial=useRef<Record<string,number>>({});
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{reduced.current=media.matches;if(media.matches)timers.current={};};
  update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{let active=true;
  const loadScene = () => Promise.all([checked(sample.outputs.bone),checked(sample.coordinates)]).then(async([png,bytes])=>{
   const bitmap=await createImageBitmap(new Blob([png],{type:'image/png'})),scratch=document.createElement('canvas');
   scratch.width=bitmap.width;scratch.height=bitmap.height;const context=scratch.getContext('2d');
   if(!context)throw Error('Canvas is unavailable.');context.drawImage(bitmap,0,0);bitmap.close();
   const coordinates=new Float32Array(bytes);if(coordinates.length!==scratch.width*scratch.height*3)throw Error('Artwork coordinates are incomplete.');
   return {pixels:context.getImageData(0,0,scratch.width,scratch.height).data,coordinates,width:scratch.width,height:scratch.height};
  });
  const loaded = retainScene ? (reviewScene ??= loadScene()) : loadScene();
  void loaded.then(value=>{if(active)setScene(value);}).catch(caught=>{
   if(reviewScene===loaded)reviewScene=undefined;
   if(active)setError(caught.message);
  });
  return()=>{active=false;};
 },[sample,retainScene]);
 useEffect(()=>{
  if(!scene||!canvas.current)return;
  if(!pulse&&!pulses?.length)timers.current={};
  const element=canvas.current;element.width=scene.width;element.height=scene.height;
  const context=element.getContext('2d');if(!context)return;
  const total=scene.width*scene.height,fields=COLOR_GROUPS.map(group=>{
   const weights=new Float32Array(total),amounts=new Float32Array(total);
   if(growth[group].days)for(let p=0;p<total;p++)if(scene.coordinates[p*3]){
    const paint=contributionPaint(anchors,{[group]:growth[group]},scene.coordinates[p*3+1],scene.coordinates[p*3+2]);
    weights[p]=paint.weight;amounts[p]=paint.weight*paint.brightness;
   }
   return {group,weights,amounts};
  });
  for(const event of pulses ?? (pulse ? [pulse] : [])){
   if(lastSerial.current[event.group]===event.serial)continue;
   lastSerial.current[event.group]=event.serial;
   if(!reduced.current&&growth[event.group]?.days){const now=performance.now(),old=timers.current[event.group];timers.current[event.group]={start:now,initial:old?activityPulse(now-old.start,old.initial):0};}
  }
  let frame=0,stopped=false;
  const tones=Float64Array.from({length:256},(_,v)=>Math.min(1,v/241)**ORANGE_SHADE_EXPONENT);
  const draw=(now:number)=>{
   if(stopped)return;
   const levels:Record<string,number>={};
   for(const [group,timer]of Object.entries(timers.current)){
    if(reduced.current||now-timer.start>=PULSE_MS)delete timers.current[group];
    else levels[group]=activityPulse(now-timer.start,timer.initial);
   }
   const pixels=new Uint8ClampedArray(scene.pixels);
   for(let p=0;p<total;p++)if(scene.coordinates[p*3]){
    let weight=0,amount=0;
    for(const field of fields){
     const w=field.weights[p],a=field.amounts[p],level=levels[field.group]??0;
     // Home must still show feedback when all of a group's Orange is already fresh.
     const freshHighlight=pulses && w-a < 1e-6 ? w*.12 : 0;
     weight=Math.max(weight,w);amount=Math.max(amount,a+(w-a+freshHighlight)*level);
    }
    if(weight)for(let c=0;c<3;c++)pixels[p*4+c]=Math.round(scene.pixels[p*4+c]*(1-weight)+[227,107,55][c]*tones[scene.pixels[p*4]]*amount);
   }
   context.putImageData(new ImageData(pixels,scene.width,scene.height),0,0);
   element.dataset.pulsing=String(Object.keys(levels).length>0);
   element.dataset.ready='true';
   if(Object.keys(levels).length)frame=requestAnimationFrame(draw);
  };
  draw(performance.now());return()=>{stopped=true;cancelAnimationFrame(frame);};
 },[scene,anchors,growth,pulse,pulses]);
 return <>{error?<p role="alert">{error}</p>:<>{!scene&&<p role="status">Loading artwork…</p>}<canvas ref={canvas} className="imprint-loop-reference" role="img" aria-label="Activity colors on the accepted shape"/></>}</>;
}
