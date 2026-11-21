"use client";
/* eslint-disable @next/next/no-img-element -- Isolated inspected artwork. */
import {useEffect,useMemo,useRef,useState} from 'react';
import {COLOR_GROUPS} from './imprint-color-model.js';
import {acceptActivity,activityGrowthState,changeActivitySource} from './imprint-activity-model.js';
import {activitySample,sampleAction,studyNow} from './imprint-activity-samples.js';
import type {Anchors} from './imprint-growth-model.js';
import {ActivityCanvas,type Pulse,type Sample} from './imprint-activity-canvas';

export default function ImprintActivityPreview(){
 const [data,setData]=useState<{samples:Sample[];anchors:Record<string,Anchors>}|null>(null),[error,setError]=useState('');
 const [state,setState]=useState(activitySample),[now,setNow]=useState(studyNow),[owner,setOwner]=useState('sample-one'),[selected,setSelected]=useState('sori');
 const [kind,setKind]=useState('note-saved'),[origin,setOrigin]=useState('routine'),[pulse,setPulse]=useState<Pulse|null>(null),[message,setMessage]=useState('Synthetic activity loaded without a pulse.');
 const [source,setSource]=useState('today-note'),sequence=useRef(0),last=useRef<ReturnType<typeof sampleAction>|null>(null);
 useEffect(()=>{let active=true;
  void Promise.all(['/docs/design/personal-imprint-color-v1.json','/docs/design/personal-imprint-growth-v1.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Activity artwork is unavailable.');const value=await r.json();if(!value.ready||!value.samples?.length)throw Error('Activity artwork is incomplete.');return value;})).then(([color,growth])=>{
   if(!color.samples.every((sample:Sample)=>growth.samples.some((item:{id:string;anchors:Anchors})=>item.id===sample.id&&item.anchors)))throw Error('Activity anchors are incomplete.');
   if(active)setData({samples:color.samples,anchors:Object.fromEntries(growth.samples.map((item:{id:string;anchors:Anchors})=>[item.id,item.anchors]))});
  }).catch(caught=>{if(active)setError(caught.message);});return()=>{active=false;};
 },[]);
 const growth=useMemo(()=>activityGrowthState(state,owner,now),[state,owner,now]);
 const sources=state.sources.filter(item=>item.owner===owner),sample=data?.samples.find(item=>item.id===selected);
 const apply=(action:ReturnType<typeof sampleAction>)=>{
  const result=acceptActivity(state,action);setState(result.state);last.current=action;
  if(result.pulse){const group=result.state.sources.at(-1)!.group;setPulse({group,serial:++sequence.current});setSource(action.source);setMessage('Accepted. This action brightens its area; this day grows only once.');}
  else setMessage('No new contribution or pulse.');
 };
 const stop=()=>setPulse(null);
 const change=(action:string)=>{stop();setState(changeActivitySource(state,owner,source,action));setMessage(action==='restore'?'Restored at its original age, without a pulse.':`${action} applied without a pulse.`);};
 return <main className="imprint-study"><p>Personal Imprint · activity study</p><p>Fictional records only. Each area grows once per used Circle day. New growth keeps its own age.</p>
 {error?<p role="alert">{error}</p>:!data?<p role="status">Loading activity study…</p>:<>
 <div className="imprint-personal-checks">
 <label htmlFor="activity-owner">Fictional person</label><select id="activity-owner" value={owner} onChange={e=>{stop();setOwner(e.target.value);setSource('today-note');last.current=null;}}><option value="sample-one">Person one · mixed ages</option><option value="sample-two">Person two · one Note</option></select>
 <label htmlFor="activity-shape">Accepted shape</label><select id="activity-shape" value={selected} onChange={e=>{stop();setSelected(e.target.value);}}>{data.samples.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select>
 {sample&&<ActivityCanvas key={`${owner}-${selected}`} sample={sample} anchors={data.anchors[selected]} growth={growth} pulse={pulse}/>}
 <p>The interactive view uses the existing phone coordinate samples. Its fine edges are approximate. The full-resolution reference below preserves the accepted material rendering.</p>
 <p data-testid="activity-clock">Local study time: {new Date(now).toLocaleString()}</p>
 <div className="imprint-study-controls"><button onClick={()=>{stop();setNow(new Date(2026,10,19,5,59,59,999).toISOString());}}>Just before cutoff</button><button onClick={()=>{stop();setNow(new Date(2026,10,19,6).toISOString());}}>At cutoff</button><button onClick={()=>{stop();setNow(new Date(2026,11,19,6).toISOString());}}>One quiet month later</button><button onClick={()=>{stop();setNow(studyNow());}}>Return to study time</button></div>
 <label htmlFor="activity-kind">Action</label><select id="activity-kind" value={kind} onChange={e=>setKind(e.target.value)}>{[['note-saved','Save a new Note'],['thought-sent','Send a Thought'],['chapter-finished','Finish a Chapter'],['habit-completed','Complete a habit'],['task-completed','Complete a task'],['log-ended','Saved Log block ends'],['protocol-sealed','Complete a daily seal']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
 {kind==='task-completed'&&<><label htmlFor="activity-origin">Complete task from</label><select id="activity-origin" value={origin} onChange={e=>setOrigin(e.target.value)}><option value="routine">Routine</option><option value="week">Week</option><option value="unknown">Unknown historical origin</option></select></>}
 <div className="imprint-study-controls"><button onClick={()=>apply(sampleAction(kind,`new-${++sequence.current}`,now,owner,{origin}))}>Accept action</button><button onClick={()=>apply(sampleAction(kind,`failed-${++sequence.current}`,now,owner,{accepted:false,origin}))}>Fail action</button><button onClick={()=>{if(last.current)apply(last.current);}}>Retry last action</button><button onClick={()=>apply(sampleAction('note-saved',source,now,owner,{firstSave:false,correction:true}))}>Edit saved Note</button><button onClick={()=>apply(sampleAction('log-ended',`future-${++sequence.current}`,now,owner,{endAt:new Date(Date.parse(now)+3600000).toISOString()}))}>Save future Log block</button></div>
 <label htmlFor="activity-source">Saved source</label><select id="activity-source" value={source} onChange={e=>setSource(e.target.value)}>{sources.map(item=><option key={item.source} value={item.source}>{item.source} · {item.status}</option>)}</select>
 <div className="imprint-study-controls">{[['trash','Move to Trash'],['restore','Restore source'],['undo','Undo source'],['clear','Clear source'],['delete','Delete source'],['archive','Archive definition']].map(([action,label])=><button key={action} onClick={()=>change(action)}>{label}</button>)}<button onClick={()=>{stop();setState(JSON.parse(JSON.stringify(state)));setMessage('Synthetic records reconciled without replaying a pulse.');}}>Reload synthetic records</button></div>
 <p role="status" data-testid="activity-message">{message}</p>
 <ul aria-label="Activity totals">{COLOR_GROUPS.map(group=><li key={group} data-group={group}>{group}: {growth[group].days} used days · {growth[group].layers.filter(layer=>layer.brightness===1).length} fresh</li>)}</ul>
 <p>Archive retains completed evidence. Trash, clearing and Undo remove the source from this view; Restore recovers its original day and age. Delete is terminal in this synthetic model. Real writing lifecycle and storage are separate.</p>
 </div>
 <figure className="imprint-personal-checks"><figcaption>Full-resolution mixed-age reference · Sori</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-activity-v1-mixed.png" alt="Old Orange areas with fresh Note growth"/></figure>
 </>}
 <p><a href="?study=growth">Earlier growth comparison</a></p></main>;
}
