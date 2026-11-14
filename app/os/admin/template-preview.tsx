"use client";
import { useRef, useState } from 'react';
import { CreativeButton } from '../button-engine';
import { ChapterPlayer } from '../chapters/chapter-player';
import { advanceChapterRun, createChapterRun } from '../chapters/chapter-model.js';
import { PageLayout } from '../app-session';
import { RoutineSwipeCue } from '../routine-controls';
import { ProtocolPage, type ProtocolItemView } from '../protocol-page';
import { ContentFigure } from './content-media';
import { PROTOCOL_DURATIONS } from '../circle-os-model.js';
import { CheckboxFace } from '../checkbox-face';
import { RoutineBody, RoutineItemCopy, RoutinePreviewPage } from '../routine-presentation';
import { resolveTemplate, routineTemplateCue, templateChapter } from './template-model.js';
import type { TemplateDraft } from './template-types';

type Adoption={blocked:boolean;open:()=>void;start:(days:number,answers:Record<string,unknown>)=>Promise<void>};
type RoutineAdoption={blocked:boolean;open:()=>void;add:(ongoing:boolean,answers:Record<string,unknown>)=>Promise<void>};
export function TemplatePreview({ draft,adoption,routineAdoption }: { draft: TemplateDraft;adoption?:Adoption;routineAdoption?:RoutineAdoption }) {
  return <div className="os-template-session"><TemplateSession key={JSON.stringify(draft.template)} draft={draft} adoption={adoption} routineAdoption={routineAdoption} /></div>;
}
function TemplateSession({draft,adoption,routineAdoption}:{draft:TemplateDraft;adoption?:Adoption;routineAdoption?:RoutineAdoption}) {
  const starting=useRef(false);
  const [startBusy,setStartBusy]=useState(false),[startError,setStartError]=useState('');
  const definition = templateChapter(draft);
  const [run, setRun] = useState(() => createChapterRun(definition));
  const [ongoing, setOngoing] = useState(false);
  const [duration, setDuration] = useState(7);
  const [phasePreview,setPhasePreview] = useState(false);
  const answers = Object.fromEntries(run.answers.map(answer => [answer.answerKey, answer.value]));
  async function start(){if(!adoption||starting.current)return;starting.current=true;setStartBusy(true);setStartError('');try{await adoption.start(duration,answers);}catch(error){setStartError(error instanceof Error?error.message:'Could not save. Your preview is retained.');}finally{starting.current=false;setStartBusy(false);}}
  async function add(){if(!routineAdoption||starting.current)return;starting.current=true;setStartBusy(true);setStartError('');try{await routineAdoption.add(ongoing,answers);}catch(error){setStartError(error instanceof Error?error.message:'Could not save. Your preview is retained.');}finally{starting.current=false;setStartBusy(false);}}
  const addAction=<div className="os-template-start">{startError&&<p role="alert">{startError}</p>}<CreativeButton keepMountedOnSuccess className="os-protocol-begin" sizing="content" styleId="default" type="button" disabled={!routineAdoption||startBusy} onClick={routineAdoption?.blocked?routineAdoption.open:()=>void add()}>{routineAdoption?.blocked?'Open Routine':startBusy?'Adding…':'Add to Routine'}</CreativeButton></div>;
  const startAction=<div className="os-template-start">{startError&&<p role="alert">{startError}</p>}<CreativeButton keepMountedOnSuccess className="os-protocol-begin" sizing="content" styleId="default" type="button" disabled={!adoption||startBusy} onClick={adoption?.blocked?adoption.open:()=>void start()}>{adoption?.blocked?'Open Protocol':startBusy?'Starting…':'Start'}</CreativeButton></div>;
  const result = resolveTemplate(draft.template, answers);
  const body = <section className="os-template-result" aria-label="Template result">
    {result.errors.length ? <ul aria-label="Preview needs answers">{[...new Set(result.errors)].map(error=><li key={error}>{error}</li>)}</ul> : <>
      {draft.template.kind === 'routine' ? <div><label className="os-template-ongoing"><input type="checkbox" checked={ongoing} onChange={event=>setOngoing(event.target.checked)} /><span>Keep going until I stop</span></label></div> : <div role="group" aria-label="Phase duration">{PROTOCOL_DURATIONS.map(days=><button type="button" key={days} aria-pressed={days===duration} onClick={()=>setDuration(days)}>{days} days</button>)}</div>}
      <RoutineBody>{(draft.template.kind==='routine'?['habit','task']:['non-negotiable','negotiable']).map(kind=>result.items.some(item=>item.kind===kind)&&<section key={kind}><h2 className="os-record-label">{{habit:'Habits',task:'Tasks','non-negotiable':'Non-negotiable',negotiable:'Negotiable'}[kind]}</h2>{result.items.filter(item=>item.kind===kind).map(item=><div className="os-template-result-row" key={item.id}><RoutineItemCopy action={item.action} cue={routineTemplateCue(item)} identity={item.identity}/><CheckboxFace/></div>)}</section>)}</RoutineBody>
    </>}
  </section>;
  const isResult=(id:string)=>id==='template-result'||draft.template.pages.find(p=>p.id===id)?.purpose==='preview';
  const backToQuestions=()=>{setPhasePreview(false);const index=definition.pages.findIndex(p=>p.id===run.currentPageId);setRun(current=>({...current,currentPageId:definition.pages[Math.max(0,index-1)].id}));};
  const terms:ProtocolItemView[]=result.items.map(item=>({id:item.id,text:item.action,kind:item.kind as ProtocolItemView['kind'],completed:false}));
  const coverFooter=routineAdoption?.blocked?<RoutineSwipeCue label="Routine" onClick={routineAdoption.open}/>:<RoutineSwipeCue label="Begin" onClick={()=>setRun(current=>advanceChapterRun(definition,current,{page:definition.pages[0]}))}/>;
  const protocolPreview=<section aria-label="Template result">{result.errors.length?<PageLayout headerLeft={<button type="button" onClick={backToQuestions}>Back</button>}><ul>{result.errors.map(error=><li key={error}>{error}</li>)}</ul></PageLayout>:<ProtocolPage previewMode previewAction={startAction} protocol={{run:{id:'template-preview',name:draft.template.title,days:duration,status:phasePreview?'active':'draft'},day:1,isDraft:!phasePreview,isOver:false,keptAll:false,sealed:false,nonNegotiable:terms.filter(t=>t.kind==='non-negotiable'),negotiable:terms.filter(t=>t.kind==='negotiable')}} phaseRecords={[]} canBegin={terms.some(t=>t.kind==='non-negotiable')} editingItemId={null} onStart={()=>{}} onBack={()=>setPhasePreview(false)} onRename={()=>{}} onSetDays={setDuration} onAddItem={()=>{}} onChangeItem={()=>{}} onFinishItemEdit={()=>{}} onBegin={()=>setPhasePreview(true)} onToggleItem={()=>{}} onArchiveRecord={()=>{}} onSealToday={()=>{}} onEndRun={()=>{}} onDiscardDraft={backToQuestions}/>}</section>;
  return <ChapterPlayer className="os-routine-open" definition={definition} run={run} onRunChange={setRun} label="Template preview" previewMode renderPage={page=>page.type==='cover'?<PageLayout className="os-template-cover" variant="cover" placement="content-flow" theme="dark" footer={coverFooter}><div className="os-template-cover-copy"><h2>{definition.title}</h2>{draft.template.cover&&<ContentFigure image={draft.template.cover}/ >}{draft.template.description&&<p>{draft.template.description}</p>}</div></PageLayout>:draft.template.kind==='protocol'&&isResult(page.id)?protocolPreview:draft.template.kind==='routine'&&isResult(page.id)?<RoutinePreviewPage footer={page.id==='template-result'&&!result.errors.length?addAction:undefined} onBack={()=>{const index=definition.pages.findIndex(p=>p.id===page.id);const id=definition.pages[Math.max(0,index-1)].id;setRun(current=>({...current,currentPageId:id}));}}>{body}</RoutinePreviewPage>:null} renderPageBody={page => draft.template.kind!=='routine'&&isResult(page.id) ? body : null} />;
}
