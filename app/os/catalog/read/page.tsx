"use client";
import { useEffect,useState } from 'react';
import { flushSync } from 'react-dom';
import { startProtocolTemplate } from '../../protocol-template-adoption.js';
import { activeRoutineTemplate,addRoutineTemplate } from '../../routine-template-adoption.js';
import { activeProtocolRun,mergeServerState,setAppSessionIndex } from '../../circle-os-model.js';
import { loadCircleState,saveCircleState } from '../../circle-os-store';
import { getAccountScope,assertAccountScope,accountStorageKey } from '../../account-scope.js';
import { useCatalogRequest } from '../request';
import { ContentRequest,PublishedImages } from '../../admin/content-media';
import { ArticlePreview, type ArticleDraft } from '../../admin/article-editor';
import { ChapterPlayer } from '../../chapters/chapter-player';
import { createChapterRun,chapterRunId,storeChapterRun } from '../../chapters/chapter-model.js';
import { useCircleState,ROUTINE_APP_VERSION } from '../../circle-os-shell';
import type { ChapterDefinition,ChapterRun } from '../../chapters/chapter-types';
import { TemplatePreview } from '../../admin/template-preview';
import { createChapterDraft } from '../../admin/chapter-authoring.js';
import type { TemplateContent } from '../../admin/template-types';
type Edition={version:number;content:{kind:string;template?:TemplateContent;chapter?:ChapterDefinition;article?:ArticleDraft['article']}};
export default function CatalogReader(){
 const {state,updateState,ready}=useCircleState();
 const openProtocol=()=>window.location.assign('/os#protocol');
 const openRoutine=()=>window.location.assign('/os#routine');
 const request=useCatalogRequest(),[loadedEdition,setEdition]=useState<{epoch:string;value:Edition}|null>(null),[run,setRun]=useState<ChapterRun|null>(null),[message,setMessage]=useState('Opening reading…');
 const edition=loadedEdition?.epoch===getAccountScope().epoch?loadedEdition.value:null;
 useEffect(()=>{let active=true;const epoch=getAccountScope().epoch;const query=new URLSearchParams(window.location.search);void request(`/os/catalog?id=${encodeURIComponent(query.get('id')||'')}&version=${encodeURIComponent(query.get('version')||'')}`).then(async response=>{if(!response.ok)throw Error('This version is unavailable. Sign in and try again.');const data=await response.json();if(active){setEdition({epoch,value:data});if(data.content.chapter)setRun(createChapterRun(data.content.chapter));}}).catch(e=>{if(active)setMessage(String(e));});return()=>{active=false;};},[request]);
 if(!ready)return <p role="status">Opening local records…</p>;
 const existing=edition?.content.chapter?state.chapters.runs[chapterRunId(edition.content.chapter)]:undefined;
 const active=activeProtocolRun(state);
 const scope=getAccountScope();
 const sourceId=new URLSearchParams(typeof window==='undefined'?'':window.location.search).get('id')||'';
 const templateKind=edition?.content.template?.kind;
 const keyFor=(kind:string)=>accountStorageKey(scope,(kind==='protocol'?'circle-protocol-start:':'circle-routine-add:')+sourceId+'@'+edition?.version);
 let savedOperation='';try{if(edition&&scope.kind==='account')savedOperation=sessionStorage.getItem(keyFor(templateKind||''))||'';}catch{/* Adoption reports unavailable storage. */}
 async function adopt(kind:'routine'|'protocol',selection:number|boolean,answers:Record<string,unknown>){
  const scope=getAccountScope();if(scope.kind!=='account')throw Error('Sign in to add this template.');assertAccountScope(scope);
  if(loadedEdition?.epoch!==scope.epoch)throw Error('Your account changed. Open the template again.');
  const template=edition?.content.template;if(!template||!edition||template.kind!==kind)throw Error('This template version is unavailable.');
  const sourceId=new URLSearchParams(window.location.search).get('id')||'';
  const key=accountStorageKey(scope,(kind==='protocol'?'circle-protocol-start:':'circle-routine-add:')+sourceId+'@'+edition.version);
  const operationId=sessionStorage.getItem(key)||crypto.randomUUID();sessionStorage.setItem(key,operationId);
  if(!navigator.locks)throw Error('This browser cannot safely add a template. Open '+(kind==='protocol'?'Protocol':'Routine')+' to create one.');
  await navigator.locks.request(accountStorageKey(scope,'circle-template-adoption'),{signal:scope.signal},async()=>{
  assertAccountScope(scope);const stored=await loadCircleState(scope);assertAccountScope(scope);
  let saved:typeof state|undefined,problem:unknown;
  flushSync(()=>updateState(current=>{const latest=mergeServerState(current,stored);try{const input={template,sourceId,version:edition.version,operationId,answers};const result=kind==='protocol'?startProtocolTemplate(latest,{...input,days:selection as number}):addRoutineTemplate(latest,{...input,ongoing:selection as boolean});saved=setAppSessionIndex(result.state,'today-habit',ROUTINE_APP_VERSION,kind==='protocol'?1:0);return saved;}catch(error){problem=error;return latest;}}));
  if(problem)throw problem;if(!saved)throw Error('Could not save. Your preview is retained.');
  await saveCircleState(scope,saved);assertAccountScope(scope);sessionStorage.removeItem(key);(kind==='protocol'?openProtocol:openRoutine)();
  });
 }
 const adoption=templateKind==='protocol'?{blocked:Boolean(active&&active.sourceTemplate?.operationId!==savedOperation),open:openProtocol,start:(days:number,answers:Record<string,unknown>)=>adopt('protocol',days,answers)}:undefined;
 const routineGroup=templateKind==='routine'?activeRoutineTemplate(state,sourceId):undefined;
 const routineAdoption=templateKind==='routine'?{blocked:Boolean(routineGroup&&routineGroup.operationId!==savedOperation),open:openRoutine,add:(ongoing:boolean,answers:Record<string,unknown>)=>adopt('routine',ongoing,answers)}:undefined;
 return <ContentRequest.Provider value={request}><PublishedImages.Provider value={true}><main className="os-admin"><a href="/os">Back to Today</a>{!edition?<p role="status">{message}</p>:edition.content.template?<TemplatePreview key={scope.epoch} adoption={adoption} routineAdoption={routineAdoption} draft={{...createChapterDraft(),draftId:'template-reading',template:edition.content.template}}/>:edition.content.chapter&&run?<ChapterPlayer definition={edition.content.chapter} run={existing||run} previewMode={!existing} onRunChange={next=>{setRun(next);if(existing&&existing.status!=='completed')updateState(current=>storeChapterRun(current,next,edition.content.chapter!.session));}} label={existing?'Published chapter reading':'Published chapter preview'}/>:edition.content.article?<ArticlePreview draft={{article:edition.content.article} as ArticleDraft}/>:<p>Content unavailable</p>}</main></PublishedImages.Provider></ContentRequest.Provider>;
}
