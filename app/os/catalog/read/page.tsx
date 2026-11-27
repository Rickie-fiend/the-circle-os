"use client";
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
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
import { chapterBlockReason, chapterFacts, chapterKind, countChaptersStartedInHour, DAILY_PROBE_BUDGET, HOURLY_CHAPTER_BUDGET } from '../../chapters/chapter-scheduler.js';
import { readChapterPublications } from '../../chapters/chapter-publication-store';
import { isBundledChapterVersion } from '../../chapters/registry';
import { useCircleState,ROUTINE_APP_VERSION } from '../../circle-os-shell';
import type { ChapterDefinition,ChapterRun } from '../../chapters/chapter-types';
import { TemplatePreview } from '../../admin/template-preview';
import { createChapterDraft } from '../../admin/chapter-authoring.js';
import { isChapterSyncPilot } from '../../chapters/chapter-sync-pilot';
import { ChapterSyncReview, chapterReviewHref } from '../../chapters/chapter-sync-review';
import { readChapterSync,savePublishedChapterProgress,syncPublishedChapters,watchChapterSync } from '../../chapters/chapter-sync-store';
import { writingAttribution } from '../../writing-model.js';
import { stampChapterFinish } from '../../home/imprint-local-activity';
import type { TemplateContent } from '../../admin/template-types';
type Edition={version:number;content:{kind:string;template?:TemplateContent;chapter?:ChapterDefinition;article?:ArticleDraft['article']}};

function PublishedChapter({ chapter, preview }: { chapter: ChapterDefinition; preview: boolean }) {
 const { state, saveChapterState } = useCircleState();
 const [initial] = useState(() => createChapterRun(chapter));
 const [previewRun, setPreviewRun] = useState(initial);
 const [pending, setPending] = useState<{ before: ChapterRun; next: ChapterRun; failed?: boolean }>();
 const [message, setMessage] = useState('');
 const [conflict, setConflict] = useState(false);
 const busy = useRef(false);
 const explore = useRef<HTMLAnchorElement>(null);
 const stored = state.chapters.runs[initial.runId];
 const current = pending?.before ?? stored ?? initial;

 useEffect(() => {
  const scope = getAccountScope();
  if (preview || scope.kind !== 'account' || !isChapterSyncPilot(window.location.hostname)) return;
  let active = true;
  const refresh = () => {
   void readChapterSync(scope).then(ledger => {
    if (active) setConflict(Boolean(ledger[initial.runId]?.competing));
   }).catch(() => {});
  };
  refresh();
  const unsubscribe = watchChapterSync(scope, refresh);
  return () => { active = false; unsubscribe(); };
 }, [initial.runId, preview]);

 async function save(next: ChapterRun) {
  if (busy.current || conflict || current.status === 'completed') return;
  busy.current = true;
  const scope = getAccountScope();
  const candidate = { ...next, catalogKind: chapterKind(chapter) };
  setPending({ before: current, next: candidate });
  setMessage('');
  try {
   const commit = async () => {
    assertAccountScope(scope);
    const latest = await loadCircleState(scope);
    const existing = latest.chapters.runs[candidate.runId];
    if (existing && JSON.stringify(existing) !== JSON.stringify(current) &&
        !(pending?.failed && existing.updatedAt === candidate.updatedAt && existing.currentPageId === candidate.currentPageId)) {
     throw Error('This Chapter changed in another tab. Reopen it to continue.');
    }
    if (!existing?.startedAt) {
     const now = new Date();
     const publications = (await readChapterPublications(scope).catch(() => []))
       .filter(({ chapter }) => !isBundledChapterVersion(chapter.id, chapter.version));
     assertAccountScope(scope);
     const spent = countChaptersStartedInHour(publications.map(publication => publication.chapter), latest.chapters.runs, now);
     if (spent.hour >= HOURLY_CHAPTER_BUDGET || (candidate.catalogKind === 'probe' && spent.probesToday >= DAILY_PROBE_BUDGET)) {
      throw Error('You’ve reached the Chapter limit. Try again later.');
     }
     if (chapterBlockReason(chapter, { now, facts: chapterFacts(latest, now) })) {
      throw Error('This Chapter is unavailable right now.');
     }
    }
    if (scope.kind === 'account' && isChapterSyncPilot(window.location.hostname)) {
     const ledger = await readChapterSync(scope);
     if (ledger[candidate.runId] || !existing?.startedAt) {
      const finished = candidate.completedAt;
      const run = candidate.status === 'completed' && finished
       ? stampChapterFinish(existing, candidate, finished, writingAttribution(finished, Intl.DateTimeFormat().resolvedOptions().timeZone)) ?? candidate
       : candidate;
      await savePublishedChapterProgress(scope, existing?.startedAt ? current : undefined, run);
      return;
     }
    }
    await saveChapterState(candidate, previous => storeChapterRun(mergeServerState(previous, latest), candidate, chapter.session));
   };
   if (navigator.locks) await navigator.locks.request(accountStorageKey(scope, 'circle-catalog-chapter'), { signal: scope.signal }, commit);
   else await commit();
   assertAccountScope(scope);
   setPending(undefined);
   if (candidate.status === 'completed') explore.current?.click();
  } catch (error) {
   if (!scope.signal.aborted) {
    setPending({ before: current, next: candidate, failed: true });
    setMessage(error instanceof Error ? error.message : 'Could not save Chapter progress. Try again.');
   }
  } finally {
   busy.current = false;
  }
 }

 return <>
  <Link ref={explore} href="/os/explore">Back to Explore</Link>
  {conflict && <>
   <p role="status">This Chapter changed on another device. Both copies are saved.</p>
   <a className="os-chapter-review-link" href={chapterReviewHref(chapter.id, chapter.version)}>Review answers</a>
  </>}
  {message && <p role="alert">{message}</p>}
  {pending?.failed && <button type="button" onClick={() => void save(pending.next)}>Try again</button>}
  <ChapterPlayer definition={chapter} run={preview ? previewRun : current} previewMode={preview}
   onRunChange={preview ? setPreviewRun : next => void save(next)}
   label={preview ? 'Published chapter preview' : 'Published chapter reading'} />
  {!preview && current.status === 'completed' && <p role="status">Chapter complete.</p>}
 </>;
}

export default function CatalogReader(){
 const {state,updateState,ready}=useCircleState();
 const openProtocol=()=>window.location.assign('/os/today#protocol');
 const openRoutine=()=>window.location.assign('/os/today#routine');
 const request=useCatalogRequest(),[loadedEdition,setEdition]=useState<{epoch:string;value:Edition;preview:boolean}|null>(null),[message,setMessage]=useState('Opening reading…');
 const scope=getAccountScope();
 const query = ready && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
 const reviewId = query?.get('id');
 const reviewVersion = Number(query?.get('version'));
 const reviewing = Boolean(reviewId && Number.isSafeInteger(reviewVersion) && reviewVersion > 0 &&
  query?.get('review') === '1' && query.get('preview') !== '1' && scope.kind === 'account' &&
  isChapterSyncPilot(window.location.hostname));
 const edition=loadedEdition?.epoch===getAccountScope().epoch?loadedEdition.value:null;
 const hydratedRuns = useRef(state.chapters.runs);
 useEffect(() => { hydratedRuns.current = state.chapters.runs; }, [state.chapters.runs]);
 useEffect(() => {
  if (!ready || reviewing) return;
  let active = true;
  const scope = getAccountScope();
  const epoch = scope.epoch;
  const query = new URLSearchParams(window.location.search);
  const id = query.get('id') ?? '';
  const preview = query.get('preview') === '1';
  async function open() {
   let runs = hydratedRuns.current;
   if (!preview && scope.kind === 'account' && isChapterSyncPilot(window.location.hostname)) {
    if (navigator.onLine) await syncPublishedChapters(scope, request, runs).catch(() => {});
    if (!active) return;
    runs = (await loadCircleState(scope)).chapters.runs;
   }
   const matching = query.get('resume') === '1' && !preview
    ? Object.values(runs).filter(run => run.chapterId === id && run.status === 'in-progress')
       .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    : undefined;
   const version = matching?.chapterVersion ?? query.get('version') ?? '';
   const response = await request(`/os/catalog?${new URLSearchParams({ id, version: String(version) })}`);
   if (!response.ok) throw Error('This version is unavailable. Sign in and try again.');
   const data = await response.json();
   if (active) setEdition({ epoch, value: data, preview });
  }
  void open().catch(error => { if (active) setMessage(String(error)); });
  return () => { active = false; };
 }, [ready, request, reviewing]);
 if(!ready)return <p role="status">Opening local records…</p>;
 const active=activeProtocolRun(state);
 if (reviewing && reviewId) return <main className="os-admin">
  <ChapterSyncReview key={`${scope.epoch}:${reviewId}@${reviewVersion}`} id={reviewId} version={reviewVersion} />
 </main>;
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
 return <ContentRequest.Provider value={request}><PublishedImages.Provider value={true}><main className="os-admin">
  {edition?.content.chapter ? <PublishedChapter key={`${scope.epoch}:${chapterRunId(edition.content.chapter)}`} chapter={edition.content.chapter} preview={Boolean(loadedEdition?.preview)} /> : <>
   <a href="/os/today">Back to Today</a>
   {!edition?<p role="status">{message}</p>:edition.content.template?<TemplatePreview key={scope.epoch} adoption={adoption} routineAdoption={routineAdoption} draft={{...createChapterDraft(),draftId:'template-reading',template:edition.content.template}}/>:edition.content.article?<ArticlePreview draft={{article:edition.content.article} as ArticleDraft}/>:<p>Content unavailable</p>}
  </>}
 </main></PublishedImages.Provider></ContentRequest.Provider>;
}
