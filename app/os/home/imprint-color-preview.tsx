"use client";
/* eslint-disable @next/next/no-img-element -- Exact color-study exports. */
import {useEffect,useRef,useState} from "react";
import {COLOR_GROUPS,colorAreaWeight} from "./imprint-color-model.js";
type Asset={path:string;hash:string};
type Sample={id:string;label:string;outputs:Record<string,Asset>;coordinates:Asset&{width:number;height:number}};
type Report={ready:boolean;samples:Sample[];states:Record<string,Record<string,number>>};
const url=(asset:Asset)=>`/${asset.path}?v=${asset.hash}`;
async function checkedBytes(asset:Asset){
 const response=await fetch(url(asset));if(!response.ok)throw Error("Color data is unavailable.");
 const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest("SHA-256",bytes);
 if([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,"0")).join("")!==asset.hash)throw Error("Color data did not match its inspection.");
 return bytes;
}
function ColorControls({sample}:{sample:Sample}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const [scene,setScene]=useState<{pixels:Uint8ClampedArray;coordinates:Float32Array;width:number;height:number}|null>(null);
 const [error,setError]=useState(""),[group,setGroup]=useState("notes"),[strength,setStrength]=useState(.95),[coverage,setCoverage]=useState(1);
 useEffect(()=>{let active=true;
  void Promise.all([checkedBytes(sample.outputs.bone),checkedBytes(sample.coordinates)]).then(async([png,coords])=>{
   const bitmap=await createImageBitmap(new Blob([png],{type:"image/png"})),scratch=document.createElement("canvas");scratch.width=bitmap.width;scratch.height=bitmap.height;
   const context=scratch.getContext("2d");if(!context)throw Error("Canvas is unavailable.");context.drawImage(bitmap,0,0);bitmap.close();
   const coordinates=new Float32Array(coords);if(coordinates.length!==scratch.width*scratch.height*3)throw Error("Color coordinates are incomplete.");
   if(active)setScene({pixels:context.getImageData(0,0,scratch.width,scratch.height).data,coordinates,width:scratch.width,height:scratch.height});
  }).catch(caught=>{if(active)setError(caught.message);});return()=>{active=false;};
 },[sample]);
 useEffect(()=>{
  if(!scene||!canvas.current)return;const element=canvas.current; element.width=scene.width;element.height=scene.height;
  const pixels=new Uint8ClampedArray(scene.pixels);
  for(let i=0;i<scene.width*scene.height;i++)if(scene.coordinates[i*3]){
   const u=scene.coordinates[i*3+2],owner=Math.round(u*128),chosen=((owner*73+19)%128)/128<coverage;
   const amount=chosen?strength*colorAreaWeight(group,scene.coordinates[i*3+1],u):0;
   for(let c=0;c<3;c++)pixels[i*4+c]=Math.round(pixels[i*4+c]*(1-amount+amount*[227/241,107/239,55/232][c]));
  }
  element.getContext("2d")?.putImageData(new ImageData(pixels,scene.width,scene.height),0,0);
 },[scene,group,strength,coverage]);
 return <div className="imprint-personal-checks"><p>Adjust a sample area · {sample.label}</p>
  {error?<p role="alert">{error} The monochrome view above remains available.</p>:<>
   <label htmlFor="color-group">Bundle area</label><select id="color-group" value={group} onChange={event=>setGroup(event.target.value)}>{COLOR_GROUPS.map(value=><option key={value}>{value}</option>)}</select>
   <label htmlFor="color-strength">Orange strength</label><input id="color-strength" type="range" min="0" max="1" step=".05" value={strength} onChange={event=>setStrength(Number(event.target.value))}/>
   <label htmlFor="color-coverage">Colored strands within the area</label><input id="color-coverage" type="range" min="0" max="1" step=".05" value={coverage} onChange={event=>setCoverage(Number(event.target.value))}/>
   <button onClick={()=>{setStrength(0);setCoverage(1);}}>Reset to Bone</button>
   {!scene&&<p role="status">Loading color data…</p>}
   <canvas ref={canvas} className="imprint-loop-reference" role="img" aria-label="Adjustable abstract color area"/>
   <p>These controls are visual samples. Interactive edges use sampled phone coordinates; the gallery exports use the full render.</p>
  </>}
 </div>;
}
export default function ImprintColorPreview(){
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(false),[state,setState]=useState("mixed"),[selected,setSelected]=useState("sori");
 useEffect(()=>{const controller=new AbortController();fetch('/docs/design/personal-imprint-color-v1.json',{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setReport).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[]);
 const sample=report?.samples?.find(item=>item.id===selected);
 return <main className="imprint-study"><p>Personal Imprint · abstract color study</p><p role="status">{error?'Color inspection unavailable. Refresh to try again.':report?.ready?'Six accepted shapes · synthetic color · visual review pending':'Color study is not ready.'}</p>
 {report?.ready&&<><div className="imprint-personal-checks"><label htmlFor="color-state">Color example</label><select id="color-state" value={state} onChange={event=>setState(event.target.value)}>{Object.keys(report.states).map(key=><option key={key}>{key}</option>)}</select><p>Input, completion and older are illustrative strengths. No real activity or fade duration is assigned.</p></div>
 <p>In the proposed activity mapping, a task checked from Week colors Log/Week; checked from Routine it colors Habits/Tasks. Chapters color the starting area. Select those areas above to compare.</p>
 <div className="imprint-personal-grid imprint-loop-grid">{report.samples.map(item=><figure key={item.id}><figcaption>{item.label}</figcaption><img className="imprint-master-image" src={url(item.outputs[state])} alt={`${item.label} ${state} color study`}/></figure>)}</div>
 <div className="imprint-personal-checks"><label htmlFor="color-profile">Choose a fictional profile</label><select id="color-profile" value={selected} onChange={event=>setSelected(event.target.value)}>{report.samples.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
 {sample&&<ColorControls key={sample.id} sample={sample}/>}</>}
 <p><a href="?study=generator">Accepted monochrome forms</a></p></main>;
}
