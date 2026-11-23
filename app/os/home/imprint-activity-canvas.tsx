"use client";

import {useEffect,useRef,useState} from 'react';
import {COLOR_GROUPS} from './imprint-color-model.js';
import {activityPulse,PULSE_MS,type ActivityGrowth} from './imprint-activity-model.js';
import {contributionPaint,ORANGE_SHADE_EXPONENT,type Anchors} from './imprint-growth-model.js';
import {checkedArtwork,decodeArtwork,type ArtworkAsset} from './imprint-artwork';
import './imprint.css';

type Asset=ArtworkAsset;
export type Sample={id:string;label:string;outputs:Record<string,Asset>;coordinates:Asset};
type Scene={pixels:Uint8ClampedArray;coordinates:Float32Array;width:number;height:number};
export type Pulse={group:string;serial:number};
type HomePulse=Pulse & {previous:ActivityGrowth[string]};
const HOME_RISE_MS=500;
let reviewScene: Promise<Scene> | undefined;

export function ActivityCanvas({sample,anchors,growth,pulse,pulses,retainScene=false}:{sample:Sample;anchors:Anchors;growth:ActivityGrowth;pulse?:Pulse|null;pulses?:HomePulse[];retainScene?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),timers=useRef<Record<string,{start:number|null;initial:number}>>({});
 const [scene,setScene]=useState<Scene|null>(null),[error,setError]=useState('');
 const reduced=useRef(false),lastSerial=useRef<Record<string,number>>({});
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{reduced.current=media.matches;if(media.matches)timers.current={};};
  update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{let active=true;
  const loadScene = () => Promise.all([checkedArtwork(sample.outputs.bone),checkedArtwork(sample.coordinates)]).then(async([png,bytes])=>{
   const {data:pixels,width,height}=await decodeArtwork(png,'image/png');
   const coordinates=new Float32Array(bytes);if(coordinates.length!==width*height*3)throw Error('Artwork coordinates are incomplete.');
   return {pixels,coordinates,width,height};
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
  const riseMs=pulses ? HOME_RISE_MS : undefined;
  for(const event of pulses ?? (pulse ? [pulse] : [])){
   if(lastSerial.current[event.group]===event.serial||!growth[event.group]?.days)continue;
   lastSerial.current[event.group]=event.serial;
   if(reduced.current)continue;
   const now=performance.now(),old=timers.current[event.group];
   timers.current[event.group]={
    start:pulses&&!old?null:now,
    initial:old?.start!=null?activityPulse(now-old.start,old.initial,riseMs):0,
   };
  }
  const total=scene.width*scene.height;
  const paintField=(group:string,area:ActivityGrowth[string])=>{
   const weights=new Float32Array(total),amounts=new Float32Array(total);
   if(area.days)for(let p=0;p<total;p++)if(scene.coordinates[p*3]){
    const paint=contributionPaint(anchors,{[group]:area},scene.coordinates[p*3+1],scene.coordinates[p*3+2]);
    weights[p]=paint.weight;amounts[p]=paint.weight*paint.brightness;
   }
   return {weights,amounts};
  };
  const fields=COLOR_GROUPS.map(group=>{
   const previous=pulses?.find(event=>event.group===group)?.previous;
   return {group,...paintField(group,growth[group]),
    previous:timers.current[group]&&previous&&previous.days!==growth[group].days?paintField(group,previous):null};
  });
  const routeLayer=element.closest('.os-route-layer');
  const routeIsOpening=()=>document.documentElement.dataset.osRouteTransition==='native' ||
   routeLayer?.getAnimations().some(animation=>animation.playState==='running');
  let frame=0,stopped=false;
  const tones=Float64Array.from({length:256},(_,v)=>Math.min(1,v/241)**ORANGE_SHADE_EXPONENT);
  const draw=(now:number)=>{
   if(stopped)return;
   const levels:Record<string,number>={};
   let pulsing=false;
   for(const [group,timer]of Object.entries(timers.current)){
    if(reduced.current||!growth[group]?.days||(timer.start!==null&&now-timer.start>=PULSE_MS)){
     delete timers.current[group];continue;
    }
    if(timer.start===null&&!routeIsOpening())timer.start=now;
    if(timer.start===null)levels[group]=0;
    else {
     levels[group]=activityPulse(now-timer.start,timer.initial,riseMs);
     pulsing=true;
    }
   }
   const paintLayers=fields.map(field=>{
    const level=levels[field.group]??0;
    const start=timers.current[field.group]?.start;
    const reveal=field.previous&&(start===null||(start!==undefined&&now-start<HOME_RISE_MS))?level:1;
    return { ...field, level, reveal };
   });
   const pixels=new Uint8ClampedArray(scene.pixels);
   for(let p=0;p<total;p++)if(scene.coordinates[p*3]){
    let weight=0,amount=0;
    for(const {weights,amounts,previous,level,reveal} of paintLayers){
     const w=reveal===1?weights[p]:weights[p]*reveal+(previous?.weights[p]??0)*(1-reveal);
     const a=reveal===1?amounts[p]:amounts[p]*reveal+(previous?.amounts[p]??0)*(1-reveal);
     const freshHighlight=pulses ? a*.24 : 0;
     weight=Math.max(weight,w);amount=Math.max(amount,a+(w-a+freshHighlight)*level);
    }
    if(weight)for(let c=0;c<3;c++)pixels[p*4+c]=Math.round(scene.pixels[p*4+c]*(1-weight)+[227,107,55][c]*tones[scene.pixels[p*4]]*amount);
   }
   context.putImageData(new ImageData(pixels,scene.width,scene.height),0,0);
   element.dataset.pulsing=String(pulsing);
   element.dataset.ready='true';
   if(Object.keys(levels).length)frame=requestAnimationFrame(draw);
  };
  draw(performance.now());return()=>{stopped=true;cancelAnimationFrame(frame);};
 },[scene,anchors,growth,pulse,pulses]);
 return <>{error?<p role="alert">{error}</p>:<>{!scene&&<p role="status">Loading artwork…</p>}<canvas ref={canvas} className="imprint-loop-reference" role="img" aria-label="Activity colors on the accepted shape"/></>}</>;
}
