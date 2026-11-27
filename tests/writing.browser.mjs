import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import imprintVariants from "../app/os/home/imprint-art-variants.json" with { type: "json" };

// Exercise the exact minified styles served by Next as well as editable CSS.
const useProductionCSS=process.env.CIRCLE_PRODUCTION_CSS==="1";
const hostedImprintReview = process.env.CIRCLE_TEST_HOSTED_IMPRINT === "1";
const imprintAccount = hostedImprintReview ? true : "imprint";
const imprintAssets = new Map(imprintVariants.flatMap(({bone,coordinates}) => [bone,coordinates]).map(asset => [`/${asset.path}`,asset]));
const productionStylePaths=useProductionCSS?[...new Set([...readFileSync(".next/server/app/os.html","utf8").matchAll(/href="(\/_next\/static\/[^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>m[1]))]:[];
if(useProductionCSS)assert.ok(productionStylePaths.length,"build Next before production-CSS checks");
const productionStyles=productionStylePaths.map(path=>readFileSync(`.next${path.slice("/_next".length)}`,"utf8")).join("\n");

// Actual product components/CSS/stores with a test-only router and synthetic
// account boundary. This is not a hosted Supabase sign-in certification.
const harness = `
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import {PathnameContext} from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import {CircleStateProvider,OSFrame,TodayExperience,useCircleState} from "/app/os/circle-os-shell.tsx";
import Mirror from "/app/os/mirror/page.tsx";
import Home from "/app/os/home/page.tsx";
import Explore from "/app/os/explore/page.tsx";
import {ChapterEditor} from "/app/os/admin/chapter-editor.tsx";
import {ChapterPlayer} from "/app/os/chapters/chapter-player.tsx";
import * as scopes from "/app/os/account-scope.js";
import * as circle from "/app/os/circle-os-model.js";
import * as logHistory from "/app/os/log-history.js";
import * as circleStore from "/app/os/circle-os-store.ts";
import * as writingStore from "/app/os/writing-store.ts";
import * as writingModel from "/app/os/writing-model.js";
import {openDevelopmentTestSession} from "/app/os/auth/development-test-session.js";
import * as chapterPublications from "/app/os/chapters/chapter-publication-store.ts";
import {useWriting} from "/app/os/writing-provider.tsx";
import {createChapterRun,chapterRunId} from "/app/os/chapters/chapter-model.js";
import {dayOpenRunId,writePinnedChapter,readPinnedDoor} from "/app/os/day-door.js";
import {publishedChapters} from "/app/os/chapters/registry.ts";
import "/app/globals.css";
import "/app/os/os-app.css";
import "/app/os/content-glass.css";
window.backendCalls=[];const nativeFetch=window.fetch.bind(window);window.fetch=(input,...args)=>{const url=new URL(typeof input==="string"?input:input.url,location.origin);if(url.pathname.startsWith("/profiles")){window.backendCalls.push(url.pathname);return Promise.resolve(new Response("Synthetic legacy transport disabled",{status:503}));}return nativeFetch(input,...args);};
function fixture(){let s=circle.ensureDay(circle.createEmptyState(),circle.getDateKey());s.ai.baseUrl=location.origin;s.profile.name="Synthetic writer";s.profile.age=30;
 s.athenaMemory.reading={cover:"Synthetic reading.",days:[],alive:[],shape:[{heading:"A question",paragraphs:["What would you like to notice today?"]}]};s.athenaMemory.updatedAt=new Date().toISOString();
 const at=new Date().toISOString();for(const c of publishedChapters){const id=chapterRunId(c),last=c.pages.at(-1).id;
 s.chapters.runs[id]={...createChapterRun(c),status:"completed",completedAt:at,updatedAt:at,currentPageId:last,furthestPageId:last};
 if(c.id.includes("habit")){const marker="fixture-"+id;s.habits.definitions[marker]={id:marker,text:"",action:"",cue:"",identity:"",status:"archived",setupRunId:id,createdAt:at,updatedAt:at};}
 if(c.id==="day-open"){const key=dayOpenRunId(c,circle.getDateKey());s.chapters.runs[key]={...s.chapters.runs[id],runId:key};}}
 return s;}
function Probe(){const c=useCircleState(),w=useWriting();window.circle=c;window.writing=w;return null;}
function TypeChapterFixture(){const config=window.typeChapter;const original=publishedChapters.find(c=>c.id===config.id&&c.version===config.version);
 const [definition,setDefinition]=useState(()=>({...original,pages:original.pages.map(p=>p.type===config.type?{...p,body:"Synthetic supporting text."}:p)}));const target=definition.pages.find(p=>p.type===config.type);
 const [run,setRun]=useState(()=>({...createChapterRun(definition),currentPageId:target.id,furthestPageId:target.id}));
 return React.createElement(ChapterPlayer,{definition,run,label:"Typography fixture",onRunChange:setRun,previewMode:config.edit,onEditPage:config.edit?(id,field,value)=>setDefinition(d=>({...d,pages:d.pages.map(p=>p.id===id?{...p,[field]:value}:p)})):undefined});}
function Root(){const [path,setPath]=useState(location.pathname);const move=next=>{history.replaceState(history.state,"",next);setPath(location.pathname);};window.goto=setPath;window.navigate=move;const router={push:move,replace:move,prefetch:()=>Promise.resolve(),refresh(){},back(){setPath("/os");},forward(){}};
 const launch=path==="/os" && new URLSearchParams(location.search).has("launch-fixture");
 return React.createElement(AppRouterContext.Provider,{value:router},React.createElement(PathnameContext.Provider,{value:path},
 React.createElement(CircleStateProvider,null,React.createElement(Probe),React.createElement(OSFrame,null,path==="/os/home"?React.createElement(Home):path==="/os/explore"?React.createElement(Explore):path==="/os/type-chapter"?React.createElement(TypeChapterFixture):path==="/os/mirror"?React.createElement(Mirror):path==="/os/admin"?React.createElement(ChapterEditor):React.createElement(TodayExperience,{key:launch?"launch":"today",launch})))));}
const root=createRoot(document.getElementById("root"));
window.api={...scopes,...circle,...logHistory,...circleStore,...writingStore,...writingModel,...chapterPublications,createChapterRun,chapterRunId,publishedChapters,fixture,writePinnedChapter,readPinnedDoor,openDevelopmentTestSession,
 async init(account=true){if(account==="imprint")openDevelopmentTestSession();else if(account)scopes.activateAccountScope("synthetic-writer-a");if(account!=="fresh-imprint")await circleStore.saveCircleState(scopes.getAccountScope(),fixture());sessionStorage.setItem("writing-fixture-ready",account==="imprint"?"imprint":"yes");root.render(React.createElement(Root));},
 mount(){root.render(React.createElement(Root));},
 load(){return writingStore.loadWritingState(scopes.getAccountScope());}
};
if(sessionStorage.getItem("writing-fixture-ready")==="imprint")openDevelopmentTestSession();
if(sessionStorage.getItem("writing-fixture-ready"))window.api.mount();
`;

let server,browser,baseURL;
test('adopted Routine template renders real rows, source details and dated completion after reload',{timeout:90000},async()=>isolated(390,async page=>{
 await page.evaluate(async()=>{const{addRoutineTemplate}=await import('/app/os/routine-template-adoption.js');const{createTemplateDraft,createTemplateItem,createTemplatePage,fixedValue}=await import('/app/os/admin/template-model.js');const template=createTemplateDraft().template;template.title='A real Routine group';template.items[0].action='Read a page';template.items[0].identity='A reader';template.items.push({...createTemplateItem('task'),action:'Water a plant',cue:fixedValue('At seven')});const q={...createTemplatePage('short-text'),question:'Why this group?',purpose:'reflection'};template.pages.push(q);window.circle.updateState(s=>addRoutineTemplate(s,{template,sourceId:'synthetic-routine',version:2,operationId:'real-routine-fixture',ongoing:true,answers:{[q.answerKey]:'A quiet practice'}}).state);});
 await openRoutineTool(page);const row=page.locator('.os-repeated-habit').filter({has:page.getByRole('textbox',{name:'Edit habit: Read a page',exact:true})});const task=page.locator('.os-task-row').filter({has:page.getByRole('textbox',{name:'Edit task: Water a plant',exact:true})});await expect(task.getByText('At seven',{exact:true})).toBeVisible();
 for(const item of [row,task]){const positions=await item.evaluate(el=>({copy:el.querySelector('textarea').getBoundingClientRect().top,tick:el.querySelector('.os-row-tick').getBoundingClientRect().top}));assert.ok(Math.abs(positions.copy-positions.tick)<14,'source details must not move completion away from the action');}
 const before=await page.evaluate(()=>({evidence:window.circle.state.evidence,records:window.circle.state.templateAdoptions,habit:Object.values(window.circle.state.habits.definitions).find(h=>h.action==='Read a page')}));
 await row.locator('.os-template-source > summary').click();await expect(row.locator('.os-template-source-copy')).toContainText('A quiet practice');await expect(row.getByRole('link',{name:'Open original template',exact:true})).toHaveAttribute('href','/os/catalog/read?id=synthetic-routine&version=2');await page.getByRole('button',{name:'Record',exact:true}).focus();
 const after=await page.evaluate(()=>({evidence:window.circle.state.evidence,records:window.circle.state.templateAdoptions,habit:Object.values(window.circle.state.habits.definitions).find(h=>h.action==='Read a page')}));assert.deepEqual(after,before,'reading a source saves no personal evidence');
 await page.locator('.os-habit-session').screenshot({path:'outputs/routine-template-adopted-390.png'});
 await row.getByRole('button',{name:'Mark done: Read a page',exact:true}).click();await task.getByRole('button',{name:'Complete task: Water a plant',exact:true}).click();await expect(task).toHaveCount(0);await page.reload();await ready(page);await openRoutineTool(page);await expect(page.getByRole('button',{name:'Undo: Read a page',exact:true})).toBeVisible();
 assert.equal(await page.evaluate(()=>Object.keys(window.circle.state.templateAdoptions).length),1);assert.equal(await page.evaluate(()=>Object.values(window.circle.state.tasks.completions).filter(c=>c.completed).length),1);
}));
before(async()=>{
  server=await createServer({configFile:false,define:{"process.env":JSON.stringify({
    NODE_ENV:"development", CIRCLE_IMPRINT_HOSTED_REVIEW: hostedImprintReview ? "enabled" : "disabled",
  })},
    plugins:[react(),{name:"writing-ui-fixture",resolveId(id){if(id==="virtual:writing-ui")return "\0writing-ui.tsx";},load(id){if(id==="\0writing-ui.tsx")return useProductionCSS?harness.replace('import "/app/globals.css";','').replace('import "/app/os/os-app.css";','').replace('import "/app/os/content-glass.css";',''):harness;if(useProductionCSS&&id.endsWith("/app/os/explore/explore.css"))return "";},
      configureServer(vite){vite.middlewares.use(async(request,response,next)=>{
        if(useProductionCSS&&request.url==="/fixture-production.css"){response.setHeader("Content-Type","text/css; charset=utf-8");response.end(productionStyles);return;}
        const pathname=request.url?.split("?")[0];
        const artwork=imprintAssets.get(pathname);
        if(artwork){
          response.setHeader("Content-Type",artwork.type);
          response.end(readFileSync(`docs/design/${artwork.file}`));return;
        }
        if(pathname==="/os/home/imprint-art/bone"||pathname==="/os/home/imprint-art/coordinates"){
          const bone=pathname.endsWith("/bone");
          response.setHeader("Content-Type",bone?"image/png":"application/octet-stream");
          response.end(readFileSync(`docs/design/personal-imprint-color-v1-sori-${bone?"bone.png":"coordinates.bin"}`));return;
        }
        if(!["/os","/os/home","/os/today","/os/mirror","/os/connect"].includes(pathname))return next();
        try{response.setHeader("Content-Type","text/html; charset=utf-8");response.end(await vite.transformIndexHtml("/os",'<meta name="viewport" content="width=device-width, initial-scale=1">'+(useProductionCSS?'<link rel="stylesheet" href="/fixture-production.css">':'')+'<div id="root"></div><script type="module" src="/@id/virtual:writing-ui"></script>'));}catch(cause){next(cause);}
      });}}],server:{host:"127.0.0.1",port:0,watch:{ignored:["**/.next/**","**/dist/**"]}},
    optimizeDeps:{include:["react","react-dom/client","next/link","next/navigation","next/dist/shared/lib/app-router-context.shared-runtime.js","next/dist/shared/lib/hooks-client-context.shared-runtime.js"]}});
  await server.listen();baseURL=`http://127.0.0.1:${server.httpServer.address().port}`;browser=await chromium.launch();
});
after(async()=>{await browser?.close();await server?.close();});
async function open(page){await page.goto(`${baseURL}/os/today`,{waitUntil:"domcontentloaded",timeout:60_000});await page.waitForFunction(()=>Boolean(window.api),{},{timeout:60_000});}
test('adopted Protocol template renders on the real Protocol page and keeps fixed terms',{timeout:90000},async()=>isolated(390,async page=>{
 await page.evaluate(async()=>{const{startProtocolTemplate}=await import('/app/os/protocol-template-adoption.js');const{createTemplateDraft}=await import('/app/os/admin/template-model.js');const template=createTemplateDraft('protocol').template;template.title='Adopted reading';template.items[0].action='Read one page';window.circle.updateState(s=>startProtocolTemplate({...s,protocol:{...s.protocol,runs:{}}},{template,sourceId:'synthetic',version:1,operationId:'real-page-fixture',days:3,answers:{}}).state);});
 await openRoutineTool(page,'Protocol');await expect(page.getByText('Adopted reading',{exact:true})).toBeVisible();await expect(page.getByText('Day 1 of 3',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Keep: Read one page',exact:true}).click();await expect(page.getByRole('button',{name:'Undo: Read one page',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(page.getByRole('textbox',{name:'Protocol name',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'End',exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:/Edit Non-negotiable/})).toHaveCount(0);await expect(page.getByRole('button',{name:/Add a non-negotiable/})).toHaveCount(0);
 await page.reload();await ready(page);await openRoutineTool(page,'Protocol');await expect(page.getByText('Adopted reading',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Undo: Read one page',exact:true})).toBeVisible();
}));
test('Routine and Week open without legacy setup completion and preserve unfinished runs', { timeout: 90000 }, async () => isolated(390, async page => {
  const saved = await page.evaluate(() => {
    const runs = Object.fromEntries(['habit-building', 'week-setup'].map(id => {
      const chapter = window.api.publishedChapters.find(c => c.id === id);
      const run = { ...window.api.createChapterRun(chapter), status: 'in-progress' };
      return [run.runId, run];
    }));
    window.circle.updateState(s => ({ ...s, chapters: { ...s.chapters, runs: {
      ...Object.fromEntries(Object.entries(s.chapters.runs).filter(([key]) => !key.startsWith('habit-building@') && !key.startsWith('week-setup@'))), ...runs,
    } } }));
    return runs;
  });
  const verifyRuns = async () => {
    const runs = await page.evaluate(() => window.circle.state.chapters.runs);
    assert.deepEqual(Object.fromEntries(Object.entries(runs).filter(([key]) => key.startsWith('habit-building@') || key.startsWith('week-setup@'))), saved);
    assert.ok(!Object.values(runs).some(run => run.chapterId === 'routine-surface'), 'opening tools never saves their presentation run');
  };
  await openRoutineTool(page);
  await expect(page.getByRole('button', { name: 'New habit', exact: true })).toBeVisible();
  await expect(page.locator('.os-habit-session .os-chapter-cover')).toHaveCount(0);
  await page.locator('.os-habit-session').getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.getByRole('button', { name: 'Open Week', exact: true }).click();
  await expect(page.getByRole('button', { name: '+ Add goal', exact: true })).toBeVisible();
  await verifyRuns();
  await page.evaluate(() => history.replaceState(null, '', '/os'));
  await page.reload(); await ready(page); await openRoutineTool(page);
  await expect(page.getByRole('button', { name: 'New habit', exact: true })).toBeVisible();
  await verifyRuns();
}));

test('completed Habit restores its result without replay on reopen and edit return', { timeout: 90000 }, async () => isolated(390, async page => {
  await page.evaluate(() => window.circle.updateState(s => {
    const added = window.api.addHabitDefinition(s, 'restored-result');
    const next = window.api.updateHabitDefinitionParts(added.state, added.id, {
      action: 'Read a line', cue: 'After breakfast', identity: 'I am a reader',
    });
    return window.api.toggleHabitForDay(next, added.id, window.api.getDateKey());
  }));
  const box = page.locator('.os-habit-session');
  const row = box.locator('.os-repeated-habit').filter({ has: page.getByRole('textbox', { name: 'Edit habit: Read a line', exact: true }) });
  const verifyArrival = async action => {
    await page.evaluate(() => {
      window.habitArrival = [];
      window.habitArrivalDone = false;
      const start = performance.now();
      const sample = () => {
        const row = [...document.querySelectorAll('.os-routine-open .os-repeated-habit')].find(el => el.querySelector('.os-habit-identity-copy')?.textContent === 'I am a reader');
        if (row && !row.classList.contains('is-editing')) {
          const result = row.querySelector('.os-habit-identity-copy');
          window.habitArrival.push({
            result: Number(getComputedStyle(result).opacity),
            action: Number(getComputedStyle(row.querySelector('.os-habit-action-copy')).opacity),
            fading: result.getAnimations().some(animation => animation.transitionProperty === 'opacity' && animation.playState === 'running'),
          });
        }
        if (performance.now() - start < 1200) requestAnimationFrame(sample);
        else window.habitArrivalDone = true;
      };
      requestAnimationFrame(sample);
    });
    await action();
    await page.waitForFunction(() => window.habitArrivalDone);
    const frames = await page.evaluate(() => window.habitArrival);
    assert.ok(frames.length > 0, 'observe the completed result during arrival');
    assert.ok(frames.every(frame => frame.result === 1 && frame.action === 0 && !frame.fading), 'restored wording appears immediately without replay or overlapping words');
  };
  await verifyArrival(() => openRoutineTool(page));
  await row.getByRole('button', { name: 'Edit habit behind: I am a reader', exact: true }).click();
  await expect(row.getByRole('textbox', { name: 'Edit habit: Read a line', exact: true })).toBeVisible();
  await expect(row.getByRole('textbox', { name: 'When you do it: Read a line', exact: true })).toHaveValue('After breakfast');
  await verifyArrival(() => box.getByRole('button', { name: 'Record', exact: true }).focus());
  await box.getByRole('button', { name: 'Back', exact: true }).click();
  await verifyArrival(() => openRoutineTool(page));
  await page.reload(); await ready(page);
  await verifyArrival(() => openRoutineTool(page));
  await expect(row.getByRole('button', { name: 'Undo: Read a line', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await box.screenshot({ path: 'outputs/routine-cleanup-restored.png' });
}, { reducedMotion: 'no-preference' }));
test('Routine schedules repeat tasks, preserve Record and recover after reload', {timeout:120_000}, async()=>isolated(390, async page=>{
  await openRoutineTool(page);
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  const task=page.getByRole('textbox',{name:'Edit task: New Task',exact:true});
  await task.fill('Synthetic daily reading');
  const row=page.locator('.os-task-row').filter({hasText:'Schedule'}).last();
  await row.locator('summary').click();
  await row.getByLabel('Repeat',{exact:true}).selectOption('daily');
  await row.getByLabel('Number of days').fill('0');
  await row.getByLabel('Number of days').blur();
  await expect(row.getByRole('alert')).toContainText('at least 1');
  await row.getByLabel('Number of days').fill('2');
  await row.getByLabel('Number of days').blur();
  const edges=await row.evaluate(el=>{const text=el.querySelector('textarea').getBoundingClientRect(),tick=el.querySelector('.os-row-tick').getBoundingClientRect();return {textTop:text.top,tickTop:tick.top};});
  assert.ok(Math.abs(edges.textTop-edges.tickTop)<24,JSON.stringify(edges));
  await row.screenshot({path:'outputs/routine-schedule.png'});
  await page.getByRole('button',{name:'Complete task: Synthetic daily reading',exact:true}).click();
  await expect(page.locator('.os-task-row')).toHaveCount(0);
  const record=await page.evaluate(()=>{const s=window.circle.state;const t=Object.values(s.tasks.items).find(t=>t.text==='Synthetic daily reading');return {schedule:t.schedule,status:t.status,done:Object.values(s.tasks.completions).filter(c=>c.completed).length};});
  assert.equal(record.schedule.days,2);assert.equal(record.status,'open');assert.equal(record.done,1);
  await page.reload();await ready(page);await openRoutineTool(page);
  assert.equal(await page.evaluate(()=>Object.values(window.circle.state.tasks.completions).filter(c=>c.completed).length),1);
  await page.getByRole('button',{name:'Record',exact:true}).click();
  await page.getByRole('button',{name:'Undo task: Synthetic daily reading',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.tasks.completions).filter(c=>c.completed).length)).toBe(0);
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByRole('button',{name:'Complete task: Synthetic daily reading',exact:true})).toBeVisible();
}));
async function ready(page){await page.waitForFunction(()=>Boolean(window.api),{},{timeout:60_000});await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy","false",{timeout:30_000});await page.evaluate(()=>document.fonts.ready);}
async function isolated(width,work,{account=true,reducedMotion="reduce",height=844,clock=false,deviceScaleFactor=1}={}){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor,isMobile:true,hasTouch:true,timezoneId:"Asia/Bangkok",reducedMotion});
  const errors=[],external=[];context.on("page",page=>page.on("pageerror",cause=>errors.push(cause.message)));
  await context.addInitScript(()=>{window.resizeNotifications=0;window.addEventListener("error",event=>{if(event.message.includes("ResizeObserver"))window.resizeNotifications++;});});
  await context.route("**/*",route=>{if(new URL(route.request().url()).origin===baseURL)return route.continue();external.push(route.request().url());return route.abort();});
  try{const page=await context.newPage();page.setDefaultTimeout(30_000);if(clock)await page.clock.install();await open(page);await page.evaluate(account=>window.api.init(account),account);await ready(page);await work(page,context);await auditAppType(page);assert.deepEqual(errors,[],"no uncaught errors");assert.deepEqual(external,[],"no external backend/model traffic");if(account)assert.deepEqual(await page.evaluate(()=>window.backendCalls),[],"account writing never calls the legacy transport");}
  finally{await context.close();}
}

for(const [width,height] of [[360,740],[390,844],[416,844]]) test(`writing pair shares glass, cues and action spacing at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  await quoteBackend(context);
  const nav=page.getByRole("navigation",{name:"Circle OS",exact:true});
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session");
  const reference=await routine.evaluate(el=>{
    const habit=el.querySelector(".os-routine-create"),tasks=el.querySelector("#task-session-title"),add=el.querySelectorAll(".os-routine-create")[1],cue=el.querySelector(".os-routine-swipe-cue button");
    const range=document.createRange();range.selectNodeContents(tasks);const heading=range.getBoundingClientRect();
    const text=[...cue.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());range.selectNodeContents(text);const wording=range.getBoundingClientRect();
    return {section:tasks.getBoundingClientRect().top-habit.getBoundingClientRect().bottom,visibleSection:heading.top-habit.getBoundingClientRect().bottom,cue:wording.top-add.getBoundingClientRect().bottom};
  });
  console.log("Writing cue reference",width,JSON.stringify(reference));
  assert.equal(reference.section,40);assert.ok(Math.abs(reference.cue-reference.visibleSection)<1,JSON.stringify(reference));
  await routine.screenshot({path:`outputs/writing-pair-routine-${width}.png`});
  await nav.getByRole("link",{name:"Today",exact:true}).click();
  await page.getByRole("button",{name:"Note",exact:true}).click();
  const note=notePage(page),frame=page.locator(".os-checkin-session"),noteInput=note.getByRole("textbox",{name:"Write a note",exact:true});
  await expect(note.getByRole("button",{name:"Back",exact:true})).toBeVisible();
  await noteInput.fill("A synthetic note across the pair.");await accepted(page,"A synthetic note across the pair.");await noteInput.blur();
  const measure=async box=>{await expect.poll(()=>box.evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.closest('.os-swipe-session').getBoundingClientRect().left-1))).toBeLessThan(1);return box.evaluate(el=>{
    const cue=el.querySelector(".os-routine-swipe-cue button"),action=el.querySelector(".os-writing-footer .os-creative-button"),frame=el.closest(".os-swipe-session").getBoundingClientRect();
    const range=document.createRange(),text=[...cue.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());range.selectNodeContents(text);const wording=range.getBoundingClientRect();
    return {gap:wording.top-action.getBoundingClientRect().bottom,right:cue.parentElement.classList.contains("is-back")?cue.getBoundingClientRect().left-frame.left-1:frame.right-cue.getBoundingClientRect().right-1,target:cue.getBoundingClientRect().height,action:action.getBoundingClientRect().height,body:getComputedStyle(el.querySelector("textarea")).color};
  });};
  const noteMetrics=await measure(note);console.log("Writing Note cue",width,JSON.stringify(noteMetrics));
  assert.ok(Math.abs(noteMetrics.gap-reference.visibleSection)<1);assert.ok(Math.abs(noteMetrics.right-24)<1);assert.ok(noteMetrics.target>=44);assert.equal(noteMetrics.action,52);
  await frame.screenshot({path:`outputs/writing-pair-note-${width}.png`});
  await note.getByRole("button",{name:"Open Deep Thoughts",exact:true}).click();
  const deep=page.locator(".os-writing-page.os-deep-thoughts-page"),answer=deep.getByRole("textbox",{name:"Answer the deep thought",exact:true});
  await expect(answer).toBeVisible();assert.equal(await page.evaluate(()=>location.hash),"#thoughts");
  await expect(deep.getByRole("button",{name:"Show a Quote",exact:true})).toHaveText("Quote");
  await expect(page.locator(".os-note-tool-back")).toBeHidden();
  await expect(deep.getByRole("button",{name:"History",exact:true})).toHaveCSS("font-weight","700");
  const deepMetrics=await measure(deep);console.log("Writing Deep Thoughts cue",width,JSON.stringify(deepMetrics));
  assert.ok(Math.abs(deepMetrics.gap-reference.visibleSection)<1);assert.ok(Math.abs(deepMetrics.right-24)<1);assert.equal(deepMetrics.action,52);assert.equal(deepMetrics.body,"rgb(241, 239, 232)");
  const question=await deep.locator(".os-deep-thought-question").textContent();
  await answer.fill("An unfinished synthetic answer.");
  await deep.getByRole("button",{name:"Open Note",exact:true}).click();await expect(noteInput).toHaveValue("A synthetic note across the pair.");
  await thoughts(page);await expect(answer).toHaveValue("An unfinished synthetic answer.");
  await page.reload();await ready(page);await expect(answer).toHaveValue("An unfinished synthetic answer.");await expect(deep.locator(".os-deep-thought-question")).toHaveText(question);
  await deep.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toContainText("Synthetic quote 1");
  await swipeBoundary(page,-500);await expect(answer).toHaveValue("An unfinished synthetic answer.");await expect(deep.locator(".os-deep-thought-question")).toHaveText(question);
  const long=Array(28).fill("A longer synthetic answer.").join("\n");await answer.fill(long);await answer.blur();
  await expect.poll(()=>deep.evaluate(el=>el.closest(".os-swipe-session").getBoundingClientRect().height)).toBeGreaterThan(height);
  const growth=await deep.evaluate(el=>({height:el.closest(".os-swipe-session").getBoundingClientRect().height,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length}));
  assert.ok(growth.height>height);assert.equal(growth.scrollers,0);
  await answer.fill("A saved synthetic answer.");await deep.getByRole("button",{name:"Send",exact:true}).click();await accepted(page,"A saved synthetic answer.");
  await expect(answer).toHaveValue("A saved synthetic answer.");await expect(deep.getByRole("button",{name:"Next question",exact:true})).toBeVisible();
  await answer.fill("A corrected synthetic answer.");await deep.getByRole("button",{name:"Save changes",exact:true}).click();await accepted(page,"A corrected synthetic answer.");
  await deep.getByRole("button",{name:"Next question",exact:true}).click();await expect(deep.locator(".os-deep-thought-question")).not.toHaveText(question);
  await frame.screenshot({path:`outputs/writing-pair-deep-${width}.png`});
  await deep.getByRole("button",{name:"Open Note",exact:true}).click();await note.getByRole("button",{name:"Back",exact:true}).click();
  await page.getByRole("button",{name:"Deep Thoughts",exact:true}).click({position:{x:40,y:40}});await expect(answer).toBeVisible();
  await nav.getByRole("link",{name:"Today",exact:true}).click();await expect(page.locator(".os-note-open")).toHaveCount(0);
  console.log("Writing pair",width,height,JSON.stringify({reference,noteMetrics,deepMetrics,growth}));
},{height}));

for(const [width,height] of [[360,740],[390,844],[416,844]]) test(`full-page Log adoption at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async page=>{
  const entry=page.getByRole("button",{name:"Log",exact:true}),box=page.locator(".os-log-session");
  await expect(box).toBeHidden();await entry.click();await expect(box).toBeVisible();
  await expect(box.getByRole("button",{name:"History",exact:true})).toBeVisible();
  await expect(box.getByRole("button",{name:"History",exact:true})).toHaveCSS("text-transform","none");
  await expect(box.getByRole("button",{name:"Now",exact:true})).toHaveCount(0);
  const timeline=box.locator(".os-timeline"),rows=timeline.locator("article");
  await expect(timeline.locator(":scope > :first-child")).toHaveAttribute("data-log-hour","6");
  const addHour=timeline.getByRole("button",{name:/^Add \d{2}:00 to the log$/});
  await expect(addHour).toHaveText("+");
  const plusGeometry=()=>addHour.evaluate(button=>{
    const bounds=button.getBoundingClientRect(),timeline=button.parentElement.getBoundingClientRect();
    return {width:bounds.width,height:bounds.height,offset:bounds.left+bounds.width/2-timeline.left-timeline.width/2};
  });
  await expect.poll(async()=>{
    const {width,height}=await plusGeometry();
    return Math.min(width,height);
  },{message:"add-hour touch target at rest"}).toBeGreaterThanOrEqual(44);
  assert.ok(Math.abs((await plusGeometry()).offset)<=1,"add-hour control is centered");
  await expect(addHour).toHaveCSS("color","rgb(227, 107, 55)");
  const rowCount=await rows.count();
  const nextHour=Number(await rows.last().getAttribute("data-log-hour"))+1;
  await addHour.click();
  await expect(rows).toHaveCount(rowCount+1);
  await expect(rows.last()).toHaveAttribute("data-log-hour",String(nextHour));
  const title=box.getByRole("textbox",{name:"What this day is called",exact:true});
  await title.fill("Synthetic glass Log");await title.blur();
  await box.locator(".os-timeline article .os-add-moment").first().click();
  const main=box.getByRole("textbox",{name:/^Main activity at/});await expect(main).toBeVisible();
  await main.fill("A synthetic walk");await box.getByRole("button",{name:"Save main activity",exact:true}).click();
  await expect(box.getByRole("button",{name:"A synthetic walk",exact:true})).toBeVisible();
  const activity=box.locator(".os-timeline article").filter({hasText:"A synthetic walk"});
  await expect(activity.locator('.os-log-copy > button')).toHaveCSS('font-size','18px');
  await expect(activity.locator('.os-log-copy > button')).toHaveCSS('font-weight','700');
  const alignment=await activity.evaluate(el=>{const a=el.querySelector('.os-time-range').getBoundingClientRect(),b=el.querySelector('.os-log-copy > button').getBoundingClientRect();return Math.abs(a.top-b.top);});assert.ok(alignment<=1,`hour/activity alignment ${alignment}`);
  console.log('alignment styles',await activity.evaluate(el=>['.os-time-range','.os-time-range strong','.os-log-copy > button'].map(s=>{const e=el.querySelector(s),c=getComputedStyle(e),r=e.getBoundingClientRect();return {s,display:c.display,align:c.alignItems,height:r.height,top:r.top,line:c.lineHeight,size:c.fontSize};})));
  const inkAlignment=await activity.evaluate(el=>{const center=s=>{const range=document.createRange();range.selectNodeContents(el.querySelector(s).lastChild);const r=range.getBoundingClientRect();return r.top+r.height/2;};return Math.abs(center('.os-time-range strong')-center('.os-log-copy > button'));});assert.ok(inkAlignment<=2,`visible hour/activity alignment ${inkAlignment}`);
  await activity.getByRole("button",{name:/^Add a small moment/}).click();
  await activity.getByRole("textbox",{name:/^Small moment at/}).fill("A synthetic small moment");
  await activity.getByRole("button",{name:"Save small moment",exact:true}).click();
  await expect(activity.locator('.os-log-copy ul')).toHaveCSS('font-size','18px');
  await page.reload();await ready(page);await expect(title).toHaveValue("Synthetic glass Log");
  await expect(rows.last()).toHaveAttribute("data-log-hour",String(nextHour));
  await expect(box.getByRole("button",{name:"A synthetic walk",exact:true})).toBeVisible();
  await expect(box.getByRole("button",{name:"A synthetic small moment",exact:true})).toBeVisible();
  const metrics=await box.evaluate(el=>{const p=el.querySelector(".os-log-page"),header=p.querySelector(".os-page-header-left"),heading=p.querySelector(".os-page-heading");return {height:el.getBoundingClientRect().height,gap:heading.getBoundingClientRect().top-header.getBoundingClientRect().bottom,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length,color:getComputedStyle(p).color};});
  assert.equal(metrics.gap,24);assert.equal(metrics.scrollers,0);assert.ok(metrics.height>=height-196);assert.equal(metrics.color,"rgb(241, 239, 232)");
  await box.screenshot({path:`outputs/log-adoption-${width}.png`,animations:"disabled"});
  await box.getByRole("button",{name:"Open Week",exact:true}).click();await expect(box.locator(".os-log-week")).toBeVisible();
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:-500,deltaY:0,bubbles:true,cancelable:true})));await expect(title).toBeVisible();
  await page.getByRole("navigation",{name:"Circle OS",exact:true}).getByRole("link",{name:"Today",exact:true}).click();await expect(entry).toBeVisible();await expect(box).toBeHidden();
  console.log("Log adoption",width,height,JSON.stringify(metrics));
},{height}));

for (const width of [360, 390, 416]) test(`Today previews share Explore glass and open all six tools at ${width}px`, { timeout: 90_000 }, async () => isolated(width, async (page, context) => {
  const overview = page.locator(".os-today-previews");
  const rows = overview.getByRole("region");
  const preview = name => overview.getByRole("group", { name, exact: true });
  const nav = page.getByRole("navigation", { name: "Circle OS", exact: true });
  await expect(rows).toHaveCount(3);
  await expect(overview.getByRole("heading", { level: 3 })).toHaveText(["Notes", "Deep Thoughts", "Routine", "Protocol", "Log", "Week"]);
  for (const name of ["Notes", "Routine", "Protocol"]) {
    await expect(preview(name).locator(".os-today-preview-copy")).toHaveCount(0);
  }
  await expect(preview("Week").locator(".os-today-preview-copy")).toHaveText(/^[A-Z][a-z]{2} \d+ - (?:[A-Z][a-z]{2} )?\d+$/);
  await expect(preview("Deep Thoughts").locator(".os-today-preview-copy")).not.toBeEmpty();
  await expect(preview("Log").locator("time")).toHaveCount(5);
  await expect(preview("Log").locator("time[aria-current='time']")).toHaveCount(1);
  const questionStart = await preview("Deep Thoughts").evaluate(card => {
    const panel = card.getBoundingClientRect();
    const second = card.querySelector(".os-today-questions button span").getBoundingClientRect();
    return (second.top - panel.top) / panel.height;
  });
  assert.ok(questionStart >= 0.50 && questionStart <= 0.62, `Second question starts at ${questionStart} of the card`);

  const geometry = await rows.evaluateAll(elements => elements.map(row => {
    const viewport = row.getBoundingClientRect();
    const [first, next] = row.querySelectorAll(".os-explore-panel");
    const lead = first.getBoundingClientRect(), peek = next.getBoundingClientRect();
    const style = getComputedStyle(first);
    return { width: lead.width, floor: lead.height, inset: lead.left - viewport.left, peek: viewport.right - peek.left, radius: style.borderRadius, motion: style.transitionDuration, snap: getComputedStyle(row).scrollSnapType };
  }));
  for (const entry of geometry) {
    assert.equal(entry.width, width - 72);
    assert.equal(entry.floor, 344);
    assert.equal(entry.inset, 24);
    assert.ok(entry.peek > 16 && entry.peek < 32, JSON.stringify(entry));
    assert.equal(entry.radius, "36px");
    if (width === 390) assert.equal(entry.motion, "0.26s");
    else assert.ok(Number.parseFloat(entry.motion) <= 0.001);
    assert.equal(entry.snap, "x mandatory");
  }
  const firstRow = rows.first();
  async function expectEndGutter(row, start) {
    await expect.poll(() => row.evaluate(element => {
      const viewport = element.getBoundingClientRect();
      const [previous, last] = [...element.querySelectorAll(".os-explore-panel")].map(panel => panel.getBoundingClientRect());
      return { inset: Math.round(viewport.right - last.right), peek: Math.round(previous.right - viewport.left) };
    })).toEqual({ inset: start.inset, peek: Math.round(start.peek) });
  }
  for (const [index, row] of (await rows.all()).entries()) {
    const panels = row.locator(".os-explore-panel");
    await row.focus();
    await row.press("End");
    await expect(panels.last()).toHaveClass(/is-selected/);
    await expectEndGutter(row, geometry[index]);
    await row.press("Home");
    await expect(panels.first()).toHaveClass(/is-selected/);
    await expect.poll(() => row.evaluate(el => el.scrollLeft)).toBe(0);
  }
  await firstRow.focus();
  if (width === 390) {
    await firstRow.scrollIntoViewIfNeeded();
    const touch = await context.newCDPSession(page);
    const bounds = await firstRow.boundingBox();
    const x = bounds.x + bounds.width - 36, y = bounds.y + bounds.height / 2;
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 7; i++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 35, y }], timestamp: Date.now() / 1000 + i * .03 });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await touch.detach();
    await expect(preview("Deep Thoughts")).toHaveClass(/is-selected/);
    await expect.poll(() => preview("Deep Thoughts").evaluate(el => getComputedStyle(el).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await expectEndGutter(firstRow, geometry[0]);
    await firstRow.press("Home");
    await expect.poll(() => firstRow.evaluate(el => el.scrollLeft)).toBe(0);
    await expect.poll(() => preview("Notes").evaluate(el => getComputedStyle(el).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await firstRow.evaluate(el => el.blur());
    await page.screenshot({ path: "outputs/today-previews-empty-390.png", fullPage: true });
  }
  const destinations = [
    ["Deep Thoughts", ".os-note-open .os-deep-thought-question"],
    ["Notes", ".os-note-open .os-notes-add"],
    ["Routine", ".os-routine-open #task-session-title"],
    ["Protocol", ".os-routine-open .os-protocol-home"],
    ["Log", ".os-log-open .os-timeline"],
    ["Week", ".os-log-open .os-week-overview"],
  ];
  const question = await preview("Deep Thoughts").locator("p").textContent();
  for (const [name, selector] of destinations) {
    const entry = overview.getByRole("button", { name, exact: true });
    if (width === 390 && name === "Deep Thoughts") {
      const bounds = await firstRow.boundingBox();
      await page.touchscreen.tap(bounds.x + bounds.width - 6, bounds.y + 100);
    } else {
      await entry.focus();
      await entry.press("Enter");
    }
    await expect(page.locator(selector)).toBeVisible();
    if (name === "Deep Thoughts") await expect(page.locator(selector)).toHaveText(question);
    await expect(overview).toBeHidden();
    await nav.getByRole("link", { name: "Today", exact: true }).click();
    await expect(overview).toBeVisible();
    await expect(entry).toBeFocused();
  }
}, { reducedMotion: width === 390 ? "no-preference" : "reduce" }));

for (const width of [360, 390, 416]) test(`Today previews use saved text, due items and the current stage at ${width}px`, { timeout: 90_000 }, async () => isolated(width, async page => {
  await page.clock.setSystemTime(new Date("2026-11-26T14:00:00+07:00"));
  await page.reload();
  await ready(page);
  const overview = page.locator(".os-today-previews");
  const preview = name => overview.getByRole("group", { name, exact: true });
  await overview.getByRole("button", { name: "Notes", exact: true }).click();
  const notes = notePage(page);
  await notes.getByRole("button", { name: "Add note", exact: true }).click();
  await notes.getByRole("textbox", { name: "Note title", exact: true }).fill("Before the rain");
  await notes.getByRole("button", { name: "Back", exact: true }).click();
  await notes.getByRole("button", { name: "Add note", exact: true }).click();
  await notes.getByRole("textbox", { name: "Note title", exact: true }).fill("After the rain on the long way home from the market and a walk through the neighbourhood");
  const body = "A quiet morning on the way to the market. ".repeat(14).trim();
  await notes.getByRole("textbox", { name: "Write a note", exact: true }).fill(body);
  await notes.getByRole("button", { name: "Back", exact: true }).click();
  await expect(notes.locator(".os-notes-panel").first()).toContainText("After the rain");
  await notes.getByRole("button", { name: "Back", exact: true }).click();
  await expect(preview("Notes")).toContainText("After the rain");
  await expect(preview("Notes").locator(".os-today-older-note")).toHaveText("Before the rain");
  await expect(preview("Notes").locator("time")).not.toBeEmpty();
  const excerpt = preview("Notes").locator(".os-today-note-excerpt");
  await expect(excerpt).toHaveCSS("-webkit-line-clamp", "3");
  assert.ok(await excerpt.evaluate(el => el.scrollHeight > el.clientHeight));
  await page.evaluate(async () => {
    const api = window.api;
    const goals = await import("/app/os/goal-model.js");
    const { planningWeekStartKey } = await import("/app/os/week-app-model.js");
    const now = new Date(), day = api.getDateKey(now), at = now.toISOString();
    const hour = now.getHours() < 6 ? now.getHours() + 24 : now.getHours();
    const label = h => String(h % 24).padStart(2, "0") + ":00";
    window.circle.updateState(state => {
      for (const [id, text] of [["stretch", "Stretch five minutes"], ["read", "Read a page"], ["water", "Water the plants"]]) {
        state = api.updateHabitDefinition(api.addHabitDefinition(state, id).state, id, text);
      }
      state = api.toggleHabitForDay(state, "water", day);
      state = api.updateTask(api.addTask(state, "call").state, "call", "Call Mum");
      state = api.startProtocolDraft(state, "sleep").state;
      state = api.renameProtocolRun(state, "sleep", "Steady sleep");
      state = api.addProtocolItem(state, "sleep", "non-negotiable", "ten").state;
      state = api.updateProtocolItem(state, "sleep", "ten", "In bed by 10", day);
      state = api.addProtocolItem(state, "sleep", "negotiable", "a-page").state;
      state = api.updateProtocolItem(state, "sleep", "a-page", "Read one page", day);
      state = api.beginProtocolRun(state, "sleep", day);
      const week = planningWeekStartKey(day, hour);
      const first = goals.addWeekGoal(state, week, "first");
      state = goals.updateGoal(first.state, first.id, "An earlier goal without a step");
      const goal = goals.addWeekGoal(state, week, "outside");
      state = goals.updateGoal(goal.state, goal.id, "Spend more time outside");
      const step = goals.addGoalStep(state, goal.id, api.addTask, "walking-route", at, day);
      state = api.updateTask(step.state, step.taskId, "Pick a walking route");
      state = api.ensureDay(state, day);
      const saved = [-2, -1, 0, 1, 2].reduce((record, offset) => api.upsertTimeBlock(record, {
        id: `today-preview-log-${offset}`, start: label(hour + offset), end: label(hour + offset + 1),
        activity: offset === 0 ? "Writing" : "A saved activity", note: "A private smaller moment", createdAt: at, updatedAt: at,
      }), state.days[day]);
      return { ...state, days: { ...state.days, [day]: saved } };
    });
  });
  await expect(preview("Routine")).toContainText("Stretch five minutes");
  await expect(preview("Routine")).toContainText("Call Mum");
  await expect(preview("Routine")).toContainText("Read a page");
  await expect(preview("Routine")).toContainText("4 left");
  await expect(preview("Routine")).toContainText("1 checked off");
  await expect(preview("Protocol")).toContainText("Steady sleep");
  await expect(preview("Protocol")).toContainText("In bed by 10");
  await expect(preview("Protocol")).toContainText("Read one page");
  await expect(preview("Protocol")).toContainText("Day 1 of 7");
  await expect(preview("Protocol")).toContainText("0 of 2 kept");
  await expect(preview("Log")).toContainText("Writing");
  await expect(preview("Log")).not.toContainText("A private smaller moment");
  await expect(preview("Week")).toContainText("Spend more time outside");
  await expect(preview("Week")).toContainText("Pick a walking route");
  for (const [name, labels] of [["Routine", ["Habits", "Tasks"]], ["Protocol", ["Non-negotiable", "Negotiable"]], ["Week", ["Goal", "Step"]]]) {
    const card = preview(name);
    await expect(card.getByRole("heading", { level: 4 })).toHaveText(labels);
    for (const group of await card.locator(".os-today-preview-group").all()) {
      const heading = group.locator("h4");
      const value = group.locator("p").first();
      await expect(heading).toHaveCSS("font-size", "18px");
      await expect(value).toHaveCSS("font-size", "18px");
      await expect(heading).toHaveCSS("font-weight", "700");
      await expect(value).toHaveCSS("font-weight", "400");
    }
    if (name !== "Week") await expect(card.locator(".os-today-preview-dot")).toHaveCSS("color", "rgb(227, 107, 55)");
  }
  const activityLefts = await preview("Log").locator("li > .os-today-preview-line").evaluateAll(items =>
    items.map(item => item.getBoundingClientRect().left));
  assert.equal(activityLefts.length, 5);
  assert.equal(new Set(activityLefts).size, 1, "All five activity rows share the same left edge");
  for (const row of await overview.getByRole("region").all()) {
    const card = row.locator(".is-selected");
    assert.equal(await card.evaluate(element => element.getBoundingClientRect().height), 344, await card.getAttribute("aria-label"));
  }
  if (width === 390) await page.screenshot({ path: "outputs/today-previews-saved-390.png", fullPage: true });
}, { clock: true }));

test("Today Deep Thoughts opens either question and recovers both drafts after reload", { timeout: 90_000 }, async () => isolated(390, async page => {
  const card = page.getByRole("group", { name: "Deep Thoughts", exact: true }).filter({ has: page.locator(".os-today-questions") });
  const first = card.locator(".os-today-questions p");
  const second = card.locator(".os-today-questions button");
  const questions = [await first.textContent(), await second.textContent()];
  assert.notEqual(questions[0], questions[1]);
  const answer = page.getByRole("textbox", { name: "Answer the deep thought" });
  const today = page.getByRole("navigation", { name: "Circle OS" }).getByRole("link", { name: "Today" });
  for (const [index, button] of [card.getByRole("button", { name: "Deep Thoughts", exact: true }), second].entries()) {
    await button.focus();
    if (index === 0) await button.press("Enter");
    else await button.click();
    await expect(page.locator(".os-note-open .os-deep-thought-question")).toHaveText(questions[index]);
    await answer.fill(`Separate draft ${index}`);
    await today.click();
    await expect(button).toBeFocused();
  }
  await page.reload();
  await ready(page);
  for (const prompt of [first, second]) {
    const question = await prompt.textContent();
    const index = questions.indexOf(question);
    assert.ok(index >= 0);
    const button = prompt === first ? card.getByRole("button", { name: "Deep Thoughts", exact: true }) : second;
    await button.focus();
    await button.press("Enter");
    await expect(answer).toHaveValue(`Separate draft ${index}`);
    await today.click();
  }
}));

test("Today Log plus follows 06:00 and Week shows the planned date range", { timeout: 90_000 }, async () => isolated(390, async page => {
  const overview = page.locator(".os-today-previews");
  const log = overview.getByRole("group", { name: "Log", exact: true });
  const week = overview.getByRole("group", { name: "Week", exact: true });
  const today = page.getByRole("navigation", { name: "Circle OS" }).getByRole("link", { name: "Today" });
  await page.clock.setSystemTime(new Date("2026-11-29T19:59:30+07:00"));
  await page.reload();
  await ready(page);
  await expect(week).toContainText("Nov 23 - 29");
  await page.clock.fastForward(60_000);
  await expect(week).toContainText("Nov 30 - Dec 6");

  await page.clock.setSystemTime(new Date("2026-11-30T05:59:00+07:00"));
  await page.reload();
  await ready(page);
  const plus = log.getByRole("button", { name: "Add activity at 05:00" });
  await expect(plus).toHaveCSS("font-size", "16px");
  await expect(plus).toHaveCSS("font-weight", "700");
  const box = await plus.boundingBox();
  assert.ok(box && box.width >= 44 && box.height >= 44);
  await plus.click();
  const closing = page.getByRole("textbox", { name: "Main activity at 05:00" });
  await closing.fill("Before sunrise");
  await closing.press("Enter");
  await expect(closing).toBeHidden();
  await today.click();
  await expect(log.getByRole("button", { name: "Log", exact: true })).toBeFocused();
  await page.clock.fastForward(60_000);
  await expect(log.locator('li:has(time[datetime="05:00"])')).toContainText("Before sunrise");
  await log.getByRole("button", { name: "Add activity at 06:00" }).click();
  await expect(page.getByRole("textbox", { name: "Main activity at 06:00" })).toBeVisible();
}, { clock: true }));

test("Today Log preview crosses 06:00 live and reads the closing day's entry", { timeout: 90_000 }, async () => isolated(390, async page => {
  await page.clock.setSystemTime(new Date("2026-11-26T05:59:00+07:00"));
  await page.reload();
  await ready(page);
  await page.evaluate(() => window.circle.updateState(state => {
    const { ensureDay, upsertTimeBlock } = window.api;
    const closingDay = "2026-11-25", newDay = "2026-11-26";
    const withDays = ensureDay(ensureDay(state, closingDay), newDay);
    const entry = (day, id, start, end, activity) => upsertTimeBlock(withDays.days[day], { id, start, end, activity, note: "", createdAt: new Date().toISOString() });
    return { ...withDays, days: { ...withDays.days,
      [closingDay]: entry(closingDay, "closing-entry", "05:00", "06:00", "Before sunrise"),
      [newDay]: entry(newDay, "opening-entry", "06:00", "07:00", "Tea at sunrise"),
    } };
  }));
  const log = page.locator(".os-today-previews").getByRole("group", { name: "Log", exact: true });
  const times = log.locator("time");
  const values = () => times.evaluateAll(items => items.map(item => item.dateTime));
  await expect.poll(values).toEqual(["03:00", "04:00", "05:00", "06:00", "07:00"]);
  await expect(log.locator("time[aria-current='time']")).toHaveAttribute("datetime", "05:00");
  await expect(log.locator("li").nth(2)).toContainText("Before sunrise");
  await expect(log.locator("li").nth(3)).toContainText("Tea at sunrise");
  await page.clock.fastForward(60_000);
  await expect.poll(values).toEqual(["04:00", "05:00", "06:00", "07:00", "08:00"]);
  await expect(log.locator("li").nth(1)).toContainText("Before sunrise");
  await expect(log.locator("time[aria-current='time']")).toHaveAttribute("datetime", "06:00");
  await expect(log.locator("li").nth(2)).toContainText("Tea at sunrise");
}, { clock: true }));

test("Log keeps its last hour on the closing Circle day at 06:00",{timeout:90_000},async()=>isolated(390,async page=>{
  const beforeBoundary=new Date("2026-11-26T05:59:00+07:00");
  await page.clock.setSystemTime(beforeBoundary);
  await page.reload();
  await ready(page);
  await page.evaluate(()=>{
    const {getDateKey,setDayLogRange,ensureDay}=window.api;
    const key=getDateKey();
    window.circle.updateState(state=>{
      const next=ensureDay(state,key);
      return {...next,days:{...next.days,[key]:setDayLogRange(next.days[key],9,28)}};
    });
  });
  await page.getByRole("button",{name:"Log",exact:true}).click();
  const timeline=page.locator(".os-log-session .os-timeline"),rows=timeline.locator("article");
  const addLastHour=timeline.getByRole("button",{name:"Add 05:00 to the log",exact:true});
  await expect(rows.first()).toHaveAttribute("data-log-hour","6");
  await addLastHour.click();
  await expect(rows.last()).toHaveAttribute("data-log-hour","29");
  await expect(rows.last().locator("[aria-current='time']")).toContainText("05:00");
  await expect(addLastHour).toHaveCount(0);
  await rows.last().getByRole("button",{name:"Add a small moment at 05:00",exact:true}).click();
  await rows.last().getByRole("textbox",{name:"Main activity at 05:00",exact:true}).fill("Before sunrise");
  await rows.last().getByRole("button",{name:"Save main activity",exact:true}).click();
  await expect(rows.last().getByRole("button",{name:"Before sunrise",exact:true})).toBeVisible();

  await page.clock.setSystemTime(new Date("2026-11-26T06:00:00+07:00"));
  await page.reload();
  await ready(page);
  await expect(rows.first().locator("[aria-current='time']")).toContainText("06:00");
  await expect(timeline.getByRole("button",{name:"Before sunrise",exact:true})).toHaveCount(0);
  assert.equal(await page.evaluate(()=>window.circle.state.days["2026-11-25"].timeBlocks[0].title),"Before sunrise");
},{clock:true}));

for(const width of [360,390]) test(`Log quiet hour controls at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const visibleHour = await page.evaluate(() => {
    const date = new Date();
    date.setHours(14, 0, 0, 0);
    return date.toISOString();
  });
  await page.clock.setFixedTime(new Date(visibleHour));
  await page.reload();
  await ready(page);
  await page.getByRole("button",{name:"Log",exact:true}).click();
  const box=page.locator(".os-log-session");await expect(box.locator('.os-empty-hour').filter({hasText:"Add activity"})).toHaveCount(1);await box.locator(".is-current-hour .os-empty-hour").click();
  await expect(box.locator('[aria-current="time"]')).toHaveCSS("font-weight","700");
  await expect(box.locator(".os-current-time")).toHaveCount(0);
  await expect(box.locator('[aria-current="time"]')).toHaveCSS("color","rgb(227, 107, 55)");
  assert.match(await box.locator('[aria-current="time"]').ariaSnapshot(),/Current hour:/);
  const borders=await box.locator(".os-timeline article").evaluateAll(rows=>rows.map(el=>getComputedStyle(el).borderBottomWidth));assert.ok(borders.every(b=>b==="0px"));
  const save=box.getByRole("button",{name:"Save main activity",exact:true});
  async function checkRightAnchor(button){const gap=await button.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const frame=el.closest('.os-log-session').getBoundingClientRect();return frame.right-1-range.getBoundingClientRect().right;});assert.ok(Math.abs(gap-24)<1,`visible mark right inset ${gap}`);}
  await checkRightAnchor(save);
  const style=await save.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {color:s.color,bg:s.backgroundColor,size:s.fontSize,width:r.width,height:r.height};});
  assert.equal(style.color,"rgb(227, 107, 55)");assert.equal(style.bg,"rgba(0, 0, 0, 0)");assert.equal(style.size,"16px");assert.ok(style.width>=44&&style.height>=44);
  await box.getByRole("textbox",{name:/^Main activity at/}).fill("Quiet synthetic activity");await save.click();
  const row=box.locator(".os-timeline article").filter({hasText:"Quiet synthetic activity"});
  await checkRightAnchor(row.locator('.os-add-moment'));
  await expect(row.locator('.os-add-moment')).toHaveCSS('font-weight','700');
  await row.getByRole("button",{name:/Add a small moment/}).click();await row.getByRole("textbox",{name:/^Small moment at/}).fill("Quiet synthetic moment");
  await expect(row.getByRole("button",{name:"Save small moment",exact:true})).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
  await checkRightAnchor(row.getByRole("button",{name:"Save small moment",exact:true}));
  await row.getByRole("button",{name:"Save small moment",exact:true}).click();await row.getByRole("button",{name:"Quiet synthetic moment",exact:true}).click();
  await expect(row.getByRole("button",{name:"Save small moment",exact:true})).toHaveCSS("font-size",style.size);
  await checkRightAnchor(row.getByRole("button",{name:"Save small moment",exact:true}));
  await row.getByRole("textbox",{name:/^Edit small moment at/}).fill("Corrected quiet moment");await row.getByRole("button",{name:"Save small moment",exact:true}).click();
  const count=await box.locator(".os-timeline article").count(),add=box.getByRole("button",{name:/^Add \d{2}:00 to the log$/});
  const rowPlus=row.getByRole("button",{name:/^Add a small moment/});
  await expect(add).toHaveText("+");
  for(const property of ["color","font-size","background-color","border-style"]){
    await expect(add).toHaveCSS(property,await rowPlus.evaluate((button,name)=>getComputedStyle(button).getPropertyValue(name),property));
  }
  await add.click();await expect(box.locator(".os-timeline article")).toHaveCount(count+1);
  await page.reload();await ready(page);await expect(box.getByRole("button",{name:"Corrected quiet moment",exact:true})).toBeVisible();
  await box.screenshot({path:`outputs/log-quiet-controls-${width}.png`,animations:"disabled"});
  console.log("Log quiet controls",width,JSON.stringify(style));
}));

for(const width of [360,390,416]) test(`Week day-filtered tasks and shared history at ${width}px`,{timeout:120_000},async()=>isolated(width,async(page)=>{
  await page.getByRole('button',{name:'Log',exact:true}).click();await page.getByRole('button',{name:'Open Week',exact:true}).click();
  const week=page.locator('.os-week-overview');
  await week.getByRole('button',{name:'+ Add goal',exact:true}).click();
  const goal=week.getByRole('textbox',{name:'Goal for this week',exact:true});await goal.fill('Family time');await goal.blur();
  await page.evaluate(()=>window.circle.updateState(s=>({...s,goals:{...s.goals,items:{...s.goals.items,abandoned:{...Object.values(s.goals.items)[0],id:'abandoned',text:'',previousText:''}}}})));
  await expect(goal).toHaveCount(1);
  await expect(week.getByRole('button',{name:'+ Add step',exact:true})).toHaveCount(0);
  await expect(week.getByRole('combobox')).toHaveCount(0);
  await week.getByRole('button',{name:'Show steps for Family time',exact:true}).click();
  await week.getByRole('button',{name:'+ Add step',exact:true}).click();
  let task=week.getByRole('textbox',{name:'One step toward this goal',exact:true});await task.fill('Call Mum');await task.blur();
  const today=await page.evaluate(()=>window.api.getDateKey());
  const future=await week.locator('.os-week-date-button').evaluateAll((buttons,today)=>buttons.find(b=>b.dataset.dateKey>today)?.dataset.dateKey,today);
  assert.ok(future,'fixture has a future day in this week');
  await week.locator('[data-date-key="'+future+'"]').click();await expect(goal).toHaveValue('Family time');await expect(task).toHaveCount(0);
  await week.getByRole('button',{name:'+ Add step',exact:true}).click();await task.fill('Dinner together');await task.blur();
  await week.locator('[data-date-key="'+today+'"]').click();await expect(task).toHaveValue('Call Mum');
  const past=await week.locator('.os-week-date-button').evaluateAll((buttons,today)=>buttons.find(b=>b.dataset.dateKey<today).dataset.dateKey,today);
  await week.locator('[data-date-key="'+past+'"]').click();await expect(goal).toBeVisible();await expect(task).toHaveCount(0);await expect(week.getByRole('button',{name:'+ Add step',exact:true})).toHaveCount(0);
  await week.locator('[data-date-key="'+today+'"]').click();
  const alignment=await week.locator('.os-week-goal-head').evaluate(el=>{const input=el.querySelector('textarea'),check=el.querySelector('.os-creative-button'),a=input.getBoundingClientRect(),b=check.getBoundingClientRect();return Math.abs(a.top+a.height/2-b.top-b.height/2);});assert.ok(alignment<=2,alignment);
  await expect(week.locator('.os-week-record-date,.os-week-record-title,.os-week-completed')).toHaveCount(0);
  await task.fill('');await task.blur();await expect(task).toHaveCount(0);
  await week.getByRole('button',{name:'History',exact:true}).click();await expect(page.getByLabel('Finished goals and tasks')).toContainText('Call Mum');
  await page.locator('.os-week-history-page').getByRole('button',{name:'Week',exact:true}).click();
  await goal.fill('');await goal.blur();await expect(goal).toHaveCount(0);
  assert.ok(await page.evaluate(()=>Object.values(window.circle.state.tasks.items).every(t=>t.status==='archived')));
  await week.getByRole('button',{name:'History',exact:true}).click();await expect(page.getByLabel('Finished goals and tasks')).toContainText('Family time');await expect(page.getByLabel('Finished goals and tasks')).toContainText('Dinner together');
  await page.locator('.os-week-history-page').getByRole('button',{name:'Week',exact:true}).click();
  await week.getByRole('button',{name:'+ Add goal',exact:true}).click();await goal.blur();await expect(goal).toHaveCount(0);
  await week.getByRole('button',{name:'+ Add goal',exact:true}).click();await goal.fill('Write a note');await goal.blur();
  await week.getByRole('button',{name:'Show steps for Write a note',exact:true}).click();await week.getByRole('button',{name:'+ Add step',exact:true}).click();await task.fill('A small note');await task.blur();
  await week.getByRole('button',{name:'Complete step: A small note',exact:true}).click();await expect(task).toHaveCount(0);
  await week.getByRole('button',{name:'Complete goal: Write a note',exact:true}).click();await expect(goal).toHaveCount(0);
  await week.getByRole('button',{name:'History',exact:true}).click();await expect(page.getByLabel('Finished goals and tasks')).toContainText('Write a note');await expect(page.getByLabel('Finished goals and tasks').locator('.os-week-history-day > summary').first()).toContainText(/[A-Za-z]+, [A-Za-z]+ [0-9]+/);
  await page.reload();await ready(page);await week.getByRole('button',{name:'History',exact:true}).click();await expect(page.getByLabel('Finished goals and tasks')).toContainText('Write a note');
  await page.locator('.os-week-history-page').getByRole('button',{name:'Week',exact:true}).click();await week.screenshot({path:`outputs/week-refined-${width}.png`,animations:'disabled'});
}));

for(const width of [360,390,416]) test(`Week compact rows and folded records at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.getByRole('button',{name:'Log',exact:true}).click();const frame=page.locator('.os-log-session');await logSettled(frame);
  const headerInk=async()=>frame.locator('.os-page-header-right button').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect(),f=el.closest('.os-log-session').getBoundingClientRect();return {top:r.top-f.top-1,right:f.right-1-r.right};});
  const logHeader=await headerInk();await page.getByRole('button',{name:'Open Week',exact:true}).click();await logSettled(frame);const week=page.locator('.os-week-overview');const weekHeader=await headerInk();
  assert.ok(Math.abs(logHeader.top-weekHeader.top)<=1,JSON.stringify({logHeader,weekHeader}));assert.ok(Math.abs(logHeader.right-24)<=1,JSON.stringify(logHeader));assert.ok(Math.abs(weekHeader.right-24)<=1,JSON.stringify(weekHeader));
  const record = week.locator('.os-week-record');
  const summary = record.locator('summary');
  for (const heading of [week.getByRole('heading', { name: 'This week', exact: true }), summary]) {
    await expect(heading).toHaveCSS('font-size', '28px');
    await expect(heading).toHaveCSS('font-weight', '700');
    await expect(heading).toHaveCSS('line-height', '33.6px');
    await expect(heading).toHaveCSS('letter-spacing', '-0.42px');
  }
  assert.ok((await summary.boundingBox()).height >= 44);
  const recordChevron = summary.locator('.os-week-inline-arrow');
  await expect(recordChevron).toHaveCSS('color', 'rgb(227, 107, 55)');
  await expect(recordChevron).toHaveText('›');
  await expect(recordChevron).toHaveCSS('rotate', '90deg');
  await expect(record).not.toHaveAttribute('open');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(record.getByText('Nothing recorded in Log yet.', { exact: true })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(record).not.toHaveAttribute('open');
  await week.getByRole('button',{name:'+ Add goal',exact:true}).click();const goal=week.getByRole('textbox',{name:'Goal for this week',exact:true});await goal.fill('Walk');await goal.blur();
  await week.getByRole('button',{name:'Show steps for Walk',exact:true}).click();
  await expect(week.getByRole('button',{name:'Hide steps for Walk',exact:true}).locator('span')).toHaveCSS('rotate','90deg');
  for(const words of ['First step','Second step']){await week.getByRole('button',{name:'+ Add step',exact:true}).click();await week.getByRole('textbox',{name:'One step toward this goal',exact:true}).last().fill(words);await week.getByRole('textbox',{name:'One step toward this goal',exact:true}).last().blur();}
  const metrics=await week.evaluate(el=>{const frame=el.closest('.os-log-session').getBoundingClientRect(),head=el.querySelector('.os-week-goal-head'),input=head.querySelector('textarea'),arrow=head.querySelector('.os-week-goal-disclosure span'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),font=getComputedStyle(input);ctx.font=font.font;const textRight=input.getBoundingClientRect().left+ctx.measureText(input.value).width;const rows=[head,...el.querySelectorAll('.os-week-step')];return {arrowGap:arrow.getBoundingClientRect().left-textRight,arrowColor:getComputedStyle(arrow).color,rims:rows.map(row=>{const r=row.querySelector('.os-checkbox-face').getBoundingClientRect();return {right:frame.right-1-r.right,center:r.top+r.height/2,size:r.width};}),crosses:rows.map(row=>row.querySelector('.os-routine-clear-cross').getBoundingClientRect().left-frame.left-1),goalGap:rows[1].getBoundingClientRect().top-head.getBoundingClientRect().bottom,taskGap:rows[2].getBoundingClientRect().top-rows[1].getBoundingClientRect().bottom};});
  console.log('Week compact metrics',width,JSON.stringify({logHeader,weekHeader,...metrics}));assert.ok(metrics.arrowGap>=0&&metrics.arrowGap<=8,JSON.stringify(metrics));assert.equal(metrics.arrowColor,'rgb(227, 107, 55)');assert.ok(metrics.rims.every(r=>Math.abs(r.right-24)<=1&&r.size===28));assert.ok(Math.abs(metrics.crosses[0]-24)<=1);assert.ok(metrics.crosses.slice(1).every(x=>Math.abs(x-44)<=1));assert.equal(metrics.goalGap,12);assert.equal(metrics.taskGap,8);
  const alignment=await week.evaluate(el=>{const left=target=>target.getBoundingClientRect().left,group=el.querySelector('.os-week-goal-group'),goal=group.querySelector('textarea'),steps=[...group.querySelectorAll('.os-week-step')],addStep=group.querySelector('.os-week-text-action'),addGoal=el.querySelector('.os-week-open-goals > .os-week-text-action');return {goalLeft:left(goal),taskLeft:left(steps[0].querySelector('textarea')),crossLeft:left(steps[0].querySelector('.os-routine-clear-cross')),addGoalLeft:left(addGoal),addStepLeft:left(addStep),addStepGap:addStep.getBoundingClientRect().top-steps.at(-1).getBoundingClientRect().bottom,addGoalGap:addGoal.getBoundingClientRect().top-group.getBoundingClientRect().bottom,taskFont:getComputedStyle(steps[0].querySelector('textarea')).fontWeight};});
  console.log('Week indentation metrics',width,JSON.stringify(alignment));assert.ok(Math.abs(alignment.crossLeft-alignment.goalLeft)<=1);assert.equal(alignment.taskLeft-alignment.goalLeft,20);assert.equal(alignment.addGoalLeft,alignment.goalLeft-20);assert.equal(alignment.addStepLeft,alignment.goalLeft);assert.equal(alignment.addStepGap,8);assert.equal(alignment.addGoalGap,8);assert.equal(alignment.taskFont,'400');
  const corrected=await week.evaluate(el=>{const groups=el.querySelector('.os-week-open-goals'),goal=groups.querySelector('textarea'),step=groups.querySelector('.os-week-step textarea'),addGoal=groups.querySelector(':scope > .os-week-add-action'),addStep=groups.querySelector('.os-week-goal-steps > .os-week-add-action'),left=node=>node.getBoundingClientRect().left;return {goalLabel:left(addGoal.lastElementChild)-left(goal),stepLabel:left(addStep.lastElementChild)-left(step),goalPlus:left(addGoal.firstElementChild)-left(groups.querySelector('.os-week-goal-head .os-routine-clear-cross')),stepPlus:left(addStep.firstElementChild)-left(groups.querySelector('.os-week-step .os-routine-clear-cross')),forehead:el.querySelector('.os-page-heading').getBoundingClientRect().top-el.querySelector('.os-page-header-left').getBoundingClientRect().bottom};});console.log('Week corrected anchors',width,JSON.stringify(corrected));for(const key of ['goalLabel','stepLabel','goalPlus','stepPlus'])assert.ok(Math.abs(corrected[key])<=1,JSON.stringify(corrected));assert.equal(corrected.forehead,24);
  for(const header of [week.locator('.os-page-header-left .os-card-label'),week.getByRole('button',{name:'History',exact:true})]){await expect(header).toHaveCSS('font-size','16px');await expect(header).toHaveCSS('font-weight','700');}
  await expect(week.locator('.os-week-step-text').first()).toHaveCSS('font-size','18px');await expect(week.getByRole('button',{name:'+ Add step',exact:true})).toHaveCSS('font-size','16px');await expect(week.getByRole('button',{name:'+ Add step',exact:true})).toHaveCSS('font-weight','400');
  await week.getByRole('button',{name:'+ Add goal',exact:true}).click();await expect(week.locator('.os-week-goal-group')).toHaveCount(2);const groupGap=await week.evaluate(el=>{const groups=[...el.querySelectorAll('.os-week-goal-group')];return groups[1].getBoundingClientRect().top-groups[0].getBoundingClientRect().bottom;});assert.equal(groupGap,24);await week.getByRole('textbox',{name:'Goal for this week',exact:true}).last().blur();await expect(week.locator('.os-week-goal-group')).toHaveCount(1);
  await page.evaluate(()=>window.circle.updateState(s=>{const key=window.api.getDateKey();return {...s,days:{...s.days,[key]:{...s.days[key],timeBlocks:[{id:'walk',start:'08:00',end:'09:00',title:'Morning walk',moments:['Birdsong','Met a friend']},{id:'read',start:'20:00',end:'21:00',title:'Reading',moments:['A good line']}]}}};}));
  await expect(record).not.toHaveAttribute('open');await expect(record.getByText('Morning walk',{exact:true})).toBeHidden();await summary.click();await expect(record.locator('article')).toHaveCount(2);await expect(record.locator('article').first().locator('strong')).toHaveText('Morning walk');await expect(record.locator('article').first().locator('time')).toHaveText('08:00');await expect(record.locator('article').first().locator('li')).toHaveText(['Birdsong','Met a friend']);await expect(record.locator('li').first()).toHaveCSS('font-size','16px');
  await expect(record.getByRole('button',{name:/Open Log/})).toHaveCount(0);
  await week.screenshot({path:`outputs/week-compact-${width}.png`,animations:'disabled'});
  await week.getByRole('button',{name:'Clear task: Second step',exact:true}).click();await expect(week.getByRole('textbox',{name:'One step toward this goal',exact:true})).toHaveCount(1);
  await week.getByRole('button',{name:'Clear goal: Walk',exact:true}).click();await expect(goal).toHaveCount(0);assert.ok(await page.evaluate(()=>Object.values(window.circle.state.tasks.items).every(task=>task.status==='archived')));
  const before=await page.evaluate(()=>JSON.stringify(window.api.normalizeState(window.circle.state).goals));await week.getByRole('button',{name:'History',exact:true}).click();const history=page.locator('.os-week-history-page'),day=history.locator('.os-week-history-day').first();await expect(day).not.toHaveAttribute('open');await expect(day.locator('.os-week-history-goal > summary')).toBeHidden();await day.locator(':scope > summary').click();const savedGoal=day.locator('.os-week-history-goal');await expect(savedGoal).not.toHaveAttribute('open');await savedGoal.locator('summary').click();await expect(savedGoal.locator('li')).toHaveText(['First step','Second step']);assert.equal(await page.evaluate(()=>JSON.stringify(window.api.normalizeState(window.circle.state).goals)),before);await history.screenshot({path:`outputs/week-grouped-history-${width}.png`,animations:'disabled'});
  for (const chevron of await history.locator('.os-week-inline-arrow:visible').all()) {
    await expect(chevron).toHaveText('›');
    await expect(chevron).toHaveCSS('rotate', '90deg');
  }
}));

test('Week tasks fade immediately with the shared checkbox response',{timeout:90_000},async()=>isolated(390,async page=>{
  await page.getByRole('button',{name:'Log',exact:true}).click();await page.getByRole('button',{name:'Open Week',exact:true}).click();const week=page.locator('.os-week-overview');await week.getByRole('button',{name:'+ Add goal',exact:true}).click();const goal=week.getByRole('textbox',{name:'Goal for this week',exact:true});await goal.fill('A small start');await goal.blur();await week.getByRole('button',{name:'Show steps for A small start',exact:true}).click();await week.getByRole('button',{name:'+ Add step',exact:true}).click();const text=week.getByRole('textbox',{name:'One step toward this goal',exact:true});await text.fill('Take one step');await text.blur();
  const button=week.getByRole('button',{name:'Complete step: Take one step',exact:true});await expect(button).toHaveAttribute('aria-busy','false');
  const samples=await button.evaluate(async el=>{const row=el.closest('.os-week-step'),text=row.querySelector('textarea'),liquid=el.querySelector('.os-checkbox-liquid'),out=[],start=performance.now();el.click();for(let i=0;i<70&&row.isConnected;i++){await new Promise(requestAnimationFrame);out.push({checked:el.getAttribute('aria-pressed'),t:performance.now()-start,fill:Math.min(1,Number(liquid.getAnimations()[0]?.currentTime??300)/300),text:Number(getComputedStyle(text).opacity)});}return out;});
  assert.ok(samples.some(s=>s.checked==='true'&&s.fill>0&&s.fill<1&&s.text>0&&s.text<1),'checkbox and wording animate together');assert.ok(samples.some(s=>s.t<220&&s.text<0.95),'no checkbox-first text delay');assert.ok(samples.at(-1).t<600,'row leaves after the shared 300ms response');await expect(text).toHaveCount(0);assert.equal(await page.evaluate(()=>Object.values(window.circle.state.tasks.items)[0].status),'completed');console.log('Week completion samples',JSON.stringify(samples));
},{reducedMotion:'no-preference'}));

for(const reducedMotion of ['no-preference','reduce'])test(`Week goals share immediate completion and retain history with ${reducedMotion} motion`,{timeout:60_000},async()=>isolated(390,async page=>{
  await page.getByRole('button',{name:'Log',exact:true}).click();await page.getByRole('button',{name:'Open Week',exact:true}).click();
  const week=page.locator('.os-week-overview');await week.getByRole('button',{name:'+ Add goal',exact:true}).click();
  const text=week.getByRole('textbox',{name:'Goal for this week',exact:true});await text.fill('A kept goal');await text.blur();
  const button=week.getByRole('button',{name:'Complete goal: A kept goal',exact:true});await expect(button).toHaveAttribute('aria-busy','false');
  const frames=await button.evaluate(async el=>{const row=el.closest('.os-week-goal-group'),out=[];let start=null;el.click();for(let i=0;i<70&&row.isConnected;i++){await new Promise(requestAnimationFrame);if(el.getAttribute('aria-pressed')==='true'&&start===null)start=performance.now();if(start!==null)out.push({t:performance.now()-start,connected:row.isConnected,opacity:Number(getComputedStyle(row).opacity)});}return out;});
  if(reducedMotion==='no-preference')assert.ok(frames.some(f=>f.t<220&&f.opacity>0&&f.opacity<1),'goal fades with no three-second dwell');
  if(reducedMotion==='no-preference')assert.ok(frames.at(-1).t<650);await expect(text).toHaveCount(0);
  assert.equal(await page.evaluate(()=>Object.values(window.circle.state.goals.items)[0].status),'done');
  await week.getByRole('button',{name:'History',exact:true}).click();const history=page.locator('.os-week-history-page');await history.locator('.os-week-history-day > summary').first().click();await expect(history.locator('.os-week-history-goal > summary')).toContainText('A kept goal');
  await page.reload();await ready(page);assert.equal(await page.evaluate(()=>Object.values(window.circle.state.goals.items)[0].status),'done');
},{reducedMotion}));

test("normal-motion writing cues and gestures keep the shared frame stable",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.getByRole("button",{name:"Note",exact:true}).click();
  const frame=page.locator(".os-checkin-session"),note=notePage(page);
  const input=note.getByRole("textbox",{name:"Write a note",exact:true});
  await input.fill("Synthetic words through normal page travel.");await accepted(page,"Synthetic words through normal page travel.");await input.blur();
  async function travel(action) {
    const samples=await frame.evaluate(async(el,action)=>{
      if(action==="forward")el.querySelector('[aria-label="Open Deep Thoughts"]').click();
      else if(action==="back")el.querySelector('[aria-label="Open Note"]').click();
      else el.dispatchEvent(new WheelEvent("wheel",{deltaX:action==="swipe-forward"?500:-500,deltaY:0,bubbles:true,cancelable:true}));
      const samples=[];
      for(let i=0;i<28;i++){
        await new Promise(requestAnimationFrame);
        const current=el.querySelector(".os-app-page.current"),window=el.querySelector(".os-app-window"),a=el.getBoundingClientRect(),b=current.getBoundingClientRect();
        samples.push({x:b.left-a.left-1,height:a.height,top:a.top,overflow:getComputedStyle(window).overflowX});
      }
      return samples;
    },action);
    assert.ok(samples.some(s=>Math.abs(s.x)>1),`${action} has visible intermediate travel`);
    for(const sample of samples){assert.ok(Math.abs(sample.height-670)<1);assert.equal(sample.top,74);assert.ok(["clip","hidden"].includes(sample.overflow));}
    assert.ok(Math.abs(samples.at(-1).x)<1,`${action} settles at the shared anchor`);
    console.log("Writing normal motion",action,JSON.stringify({maxTravel:Math.max(...samples.map(s=>Math.abs(s.x))),height:samples.at(-1).height}));
  }
  await travel("forward");await expect(page.locator(".os-deep-thought-question")).toBeVisible();
  await travel("back");await expect(input).toHaveValue("Synthetic words through normal page travel.");
  await travel("swipe-forward");await expect(page.locator(".os-deep-thought-question")).toBeVisible();
  await travel("swipe-back");await expect(input).toHaveValue("Synthetic words through normal page travel.");
},{reducedMotion:"no-preference"}));

for(const width of [360,390]) test(`automatic writing Sparks stay paused at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const before=await page.evaluate(async()=>{
    const a=window.api,ids=['spark-animal-today','spark-brain-noise'];
    const selected=ids.map(id=>a.publishedChapters.find(c=>c.id===id));
    if(selected.some(c=>!c))throw new Error('Missing real Spark fixtures');
    const old=new Date(Date.now()-86400000).toISOString();
    window.circle.updateState(s=>{
      for(const run of Object.values(s.chapters.runs)){run.startedAt=old;run.completedAt=old;run.updatedAt=old;}
      selected.forEach((c,i)=>{if(i===0)s.chapters.runs[a.chapterRunId(c)]={...a.createChapterRun(c),status:'in-progress'};else delete s.chapters.runs[a.chapterRunId(c)];});
      return {...s,chapters:{...s.chapters,runs:{...s.chapters.runs}}};
    });
    for(const [i,c] of selected.entries()) await a.writeChapterPublication(a.getAccountScope(),{chapter:c,source:'admin',publishedAt:new Date().toISOString(),targetApp:i===0?'note':'thoughts',visibility:'public',delivery:'on-view'});
    a.announceChapterPublication();
    return JSON.stringify(window.circle.state.chapters.runs[a.chapterRunId(selected[0])]);
  });
  await page.getByRole('button',{name:'Note',exact:true}).click();
  const body=notePage(page).getByRole('textbox',{name:'Write a note',exact:true});
  await expect(body).toBeVisible();
  await expect(page.getByText('What animal was today?',{exact:true})).toHaveCount(0);
  await expect(page.getByText('What noise is your head making?',{exact:true})).toHaveCount(0);
  await body.fill('Free writing without a Spark.');await accepted(page,'Free writing without a Spark.');
  await page.reload();await ready(page);await expect(body).toHaveValue('Free writing without a Spark.');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.chapters.runs['spark-animal-today@1'])),before,'unfinished Spark is unchanged');
  await expect(page.getByText('What animal was today?',{exact:true})).toHaveCount(0);
  await expect(page.getByText('What noise is your head making?',{exact:true})).toHaveCount(0);
  await thoughts(page);await expect(page.locator('.os-deep-thought-question')).toBeVisible();
}));

for (const width of [360,390,416]) test(`bottom navigation routes and stays visible in tools at ${width}px`, {timeout:90_000}, async () => isolated(width, async page => {
  const nav=page.getByRole("navigation",{name:"Circle OS",exact:true});
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link",{name:"Today",exact:true})).toHaveAttribute("aria-current","page");
  assert.equal(await nav.getByRole("link").count(),4);
  const pill=nav.locator(".os-bottom-nav-pill"),explore=nav.getByRole("link",{name:"Explore",exact:true});
  await expect(pill.getByRole("link")).toHaveText(["Today","Home","Reflect"]);
  const bounds=await nav.boundingBox(),pillBounds=await pill.boundingBox(),exploreBounds=await explore.boundingBox();
  const mainBounds=await page.locator(".os-today-overview").boundingBox();
  assert.deepEqual([bounds.x,bounds.width,bounds.height],[mainBounds.x+24,mainBounds.width-48,60]);
  assert.deepEqual([pillBounds.height,exploreBounds.width,exploreBounds.height],[60,60,60]);
  assert.equal(exploreBounds.x-pillBounds.x-pillBounds.width,8);
  for(const link of await nav.getByRole("link").all()){
    const {width,height}=await link.boundingBox();
    assert.ok(width>=44&&height>=44);
    await expect(link).toHaveCSS("gap","4px");
    await expect(link.locator("svg")).toHaveCSS("width","22px");
    await expect(link.locator("span")).toHaveCSS("font-size","12px");
  }
  for(const name of ["Home","Explore"]){
    await nav.getByRole("link",{name,exact:true}).click();
    await expect(page.getByRole("main",{name,exact:true})).toHaveCount(1);
    if(name==="Home")assert.equal(await page.getByRole("main",{name,exact:true}).innerHTML(),"");
    else {
      await expect(page.locator('.os-explore-row-title')).toHaveText(['Chapters','Habit/Protocol','Articles']);
      await expect(page.locator('.os-explore-panel')).toHaveCount(6);
    }
    await expect(nav.getByRole("link",{name,exact:true})).toHaveAttribute("aria-current","page");
  }
  await nav.getByRole("link",{name:"Reflect",exact:true}).click();
  await expect(nav.getByRole("link",{name:"Reflect",exact:true})).toHaveAttribute("aria-current","page");
  await nav.getByRole("link",{name:"Today",exact:true}).click();
  await openRoutineTool(page);
  await expect(nav).toBeVisible();
  async function paired(selector) {
    const frame=page.locator(selector);
    await expect.poll(async()=>{
      const a=await frame.boundingBox(),b=await nav.boundingBox();
      return Math.max(Math.abs(a.x-b.x),Math.abs(a.width-b.width),Math.abs(b.y-a.y-a.height-16));
    }).toBeLessThan(1);
    const appearance=await frame.evaluate(el=>{
      const frame=getComputedStyle(el),bar=getComputedStyle(document.querySelector('.os-bottom-nav-pill')),circle=getComputedStyle(document.querySelector('.os-bottom-nav-explore'));
      return ['borderTopColor','boxShadow','backdropFilter'].map(key=>[key,frame[key],bar[key],circle[key]]);
    });
    for(const [key,a,b,c] of appearance){assert.equal(a,b,`pill glass ${key}`);assert.equal(a,c,`circle glass ${key}`);}
    await expect(pill).toHaveCSS("border-radius","30px");
    await expect(explore).toHaveCSS("border-radius","30px");
    await expect(frame).toHaveCSS("border-top-color", "rgba(241, 239, 232, 0.16)");
    const [frameRim, navRim] = await Promise.all([frame, pill].map(surface =>
      surface.evaluate(el => getComputedStyle(el, "::after").backgroundImage)));
    assert.match(frameRim, /rgba\(241, 239, 232, 0\.28\)/);
    assert.equal(navRim, frameRim);
    console.log('Paired glass',width,selector,JSON.stringify({frame:await frame.boundingBox(),nav:await nav.boundingBox()}));
  }
  await paired('.os-routine-open .os-habit-session');
  await nav.getByRole("link",{name:"Today",exact:true}).click();
  await expect(page.locator(".os-routine-open")).toHaveCount(0);
  await page.getByRole("button",{name:"Notes",exact:true}).click();
  await expect(nav).toBeVisible();
  await paired('.os-note-open .os-checkin-session');
  await page.screenshot({path:`outputs/navigation-paired-rest-${width}.png`});
  if(width===360){
    await page.setViewportSize({width:1280,height:900});
    await paired('.os-note-open .os-checkin-session');
    await page.screenshot({path:'outputs/navigation-paired-desktop.png'});
    await page.setViewportSize({width,height:844});
    await paired('.os-note-open .os-checkin-session');
  }
  const notes=notePage(page);
  const footer=notes.getByRole("button",{name:"Add note",exact:true});
  await footer.click();
  const body=notes.getByRole("textbox",{name:"Write a note",exact:true});
  await body.fill("Navigation keeps these words.");await accepted(page,"Navigation keeps these words.");
  await page.evaluate(()=>{Object.defineProperty(window.visualViewport,"height",{configurable:true,value:window.innerHeight-240});window.visualViewport.dispatchEvent(new Event("resize"));});
  await expect(nav).toBeHidden();
  await page.evaluate(()=>{delete window.visualViewport.height;window.visualViewport.dispatchEvent(new Event("resize"));});
  await expect(nav).toBeVisible();await body.blur();
  await nav.getByRole("link",{name:"Home",exact:true}).click();
  await nav.getByRole("link",{name:"Today",exact:true}).click();
  await page.getByRole("button",{name:"Notes",exact:true}).click();
  await notes.locator(".os-notes-panel").filter({hasText:"Navigation keeps these words."}).click();
  await expect(body).toHaveValue("Navigation keeps these words.");
  await notes.getByRole("button",{name:"Back",exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  assert.ok((await footer.boundingBox()).y+(await footer.boundingBox()).height<=(await nav.boundingBox()).y,"last action can clear the navigation");
  await page.screenshot({path:`outputs/bottom-navigation-${width}.png`});
  await nav.getByRole("link",{name:"Today",exact:true}).click();
  await expect(page.locator(".os-note-open")).toHaveCount(0);
}));


async function openRoutineTool(page, name = "Routine") {
  if (!(await page.locator(".os-routine-open").isVisible())) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  await expect(page.locator(".os-routine-open")).toBeVisible();
}


test('Protocol interaction audit retains term records through toggle and reload',{timeout:90_000},async()=>isolated(390,async page=>{
  await openRoutineTool(page,'Protocol');const box=page.locator('.os-habit-session');
  await box.getByRole('button',{name:'Start a phase',exact:true}).click();await box.getByRole('textbox',{name:'Protocol name',exact:true}).fill('Comparison phase');
  await box.getByRole('button',{name:'Add a non-negotiable',exact:true}).click();await box.locator('.os-protocol-block-edit').fill('Walk outside');
  await box.getByRole('button',{name:'Add a negotiable',exact:true}).click();await box.locator('.os-protocol-block-edit').last().fill('Read a line');
  await box.getByRole('button',{name:'Begin 7 days',exact:true}).click();await logSettled(box);
  const term=box.getByRole('button',{name:'Keep: Walk outside',exact:true});await expect(term).toHaveAttribute('aria-busy','false');
  const rect=await term.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.waitForTimeout(180);
  const pressScale=await term.locator('.os-checkbox-face').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m11);
  assert.ok(Math.abs(pressScale-.86)<.01,'Protocol uses shared checkbox press feedback');
  await page.mouse.move(1,1);await page.mouse.up();await expect(term).toHaveAttribute('aria-pressed','false');
  await box.locator('.os-protocol-word-base').first().click();await page.waitForTimeout(140);await expect(term).toHaveAttribute('aria-pressed','false');
  const motion=await term.evaluate(async el=>{const words=el.closest('.os-protocol-term-row').querySelector('.os-protocol-word-liquid'),fill=el.querySelector('.os-checkbox-liquid'),samples=[];el.click();for(let i=0;i<35;i++){await new Promise(requestAnimationFrame);samples.push({checked:el.getAttribute('aria-pressed'),words:getComputedStyle(words).clipPath,fill:getComputedStyle(fill).clipPath,tick:getComputedStyle(el.querySelector('.os-checkbox-mark')).opacity});}return samples;});
  assert.ok(motion.some(s=>s.checked==='true'&&s.fill===s.words&&s.tick==='1'&&!s.fill.includes('-10%')&&!s.fill.includes('110%')),'Orange words and checkbox visibly fill together');
  const kept=box.getByRole('button',{name:'Undo: Walk outside',exact:true});await expect(kept).toHaveAttribute('aria-pressed','true');
  const evidence=await kept.evaluate(el=>{const face=el.querySelector('.os-checkbox-face'),liquid=face.querySelector('.os-checkbox-liquid'),mark=face.querySelector('.os-checkbox-mark'),words=el.closest('.os-protocol-term-row').querySelector('.os-protocol-block-text');return {checked:el.getAttribute('aria-pressed'),faceDirectChild:face.parentElement===el,markOpacity:getComputedStyle(mark).opacity,liquidClip:getComputedStyle(liquid).clipPath,textDecoration:getComputedStyle(words).textDecorationLine,wordOpacity:getComputedStyle(words).opacity,rowWidth:el.getBoundingClientRect().width,faceWidth:face.getBoundingClientRect().width};});
  await expect(kept.locator('.os-checkbox-mark')).toHaveCSS('opacity','1');
  await expect(box.locator('.os-protocol-word-base').first()).toHaveText('Walk outside');await expect(box.locator('.os-protocol-block-text').first()).toHaveCSS('text-decoration-line','none');await expect(box.locator('.os-protocol-word-liquid').first()).toHaveCSS('transition-duration','0.3s');await expect(box.locator('textarea')).toHaveCount(0);await expect(box.getByRole('button',{name:'Edit',exact:true})).toBeVisible();
  console.log('Protocol comparison audit',JSON.stringify({...evidence,pressScale,keptRows:await box.locator('.os-protocol-block.is-kept').count()}));
  await expect(box.locator('.os-protocol-word-liquid').first()).toHaveCSS('color','rgb(227, 107, 55)');await box.screenshot({path:'outputs/protocol-orange-words.png'});
  await page.reload();await ready(page);await openRoutineTool(page,'Protocol');await expect(box.getByRole('button',{name:'Undo: Walk outside',exact:true})).toHaveAttribute('aria-pressed','true');
  await box.getByRole('button',{name:'Undo: Walk outside',exact:true}).focus();await page.keyboard.press('Space');await expect(box.getByRole('button',{name:'Keep: Walk outside',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(box.locator('.os-protocol-word-liquid').first()).toHaveCSS('transition-duration','0s');
},{reducedMotion:'no-preference'}));

for(const deviceScaleFactor of [1,2,3])test(`checkbox endpoints have no liquid seam at device scale ${deviceScaleFactor}`,{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>window.api.updateHabitDefinitionParts(window.api.addHabitDefinition(s,'edge-test').state,'edge-test',{action:'Read a line',cue:'',identity:''})));
  await openRoutineTool(page);
  await page.evaluate(()=>{
    const probe=document.createElement('div');probe.id='checkbox-edge-probe';probe.style.cssText='position:fixed;left:32.5px;top:32.5px;z-index:9999;';
    const owner=document.createElement('button');owner.type='button';owner.append(document.querySelector('.os-row-tick .os-checkbox-face').cloneNode(true));probe.append(owner);
    const native=document.createElement('input');native.type='checkbox';native.style.margin='0';probe.append(native);document.querySelector('.circle-os').append(probe);
  });
  await page.addStyleTag({content:'#checkbox-edge-probe button{display:block;padding:0;border:0;background:none;}#checkbox-edge-probe .os-checkbox-liquid{transition:none!important;}#checkbox-edge-probe input{display:block;}#checkbox-edge-probe .reference[aria-pressed="false"] .os-checkbox-liquid,#checkbox-edge-probe input.reference:not(:checked)::before{visibility:hidden;}#checkbox-edge-probe .reference[aria-pressed="true"] .os-checkbox-liquid,#checkbox-edge-probe input.reference:checked::before{clip-path:none;}'});
  const probe=page.locator('#checkbox-edge-probe');
  for(const native of [false,true])for(const checked of [false,true]){
    const owner=probe.locator(native?'input':'button'),surface=native?owner:owner.locator('.os-checkbox-face');
    await owner.evaluate((el,{native,checked})=>{if(native)el.checked=checked;else el.setAttribute('aria-pressed',String(checked));},{native,checked});
    const actual=await surface.screenshot();await owner.evaluate(el=>el.classList.add('reference'));const reference=await surface.screenshot();await owner.evaluate(el=>el.classList.remove('reference'));
    const a=await sharp(actual).removeAlpha().raw().toBuffer(),b=await sharp(reference).removeAlpha().raw().toBuffer();let differences=0;
    for(let i=0;i<a.length;i+=3)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>8)differences++;
    assert.equal(differences,0,`${native?'native':'shared'} ${checked?'filled':'empty'} endpoint matches an unclipped fill or a fully hidden liquid`);
  }
} ,{deviceScaleFactor}));

test('shared checkbox glass, immediate Log tick and 300ms liquid response',{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await page.evaluate(()=>window.circle.updateState(s=>window.api.updateHabitDefinitionParts(window.api.addHabitDefinition(s,'checkbox-test').state,'checkbox-test',{action:'Read a line',cue:'',identity:''})));
  await openRoutineTool(page);
  const tick=page.getByRole('button',{name:'Mark done: Read a line',exact:true});
  await expect(tick).toHaveAttribute('aria-busy','false');
  const face=tick.locator('.os-checkbox-face'),liquid=face.locator('.os-checkbox-liquid'),mark=face.locator('.os-checkbox-mark');
  await expect(face).toHaveCSS('border-color','rgb(227, 107, 55)');await expect(face).toHaveCSS('width','28px');await expect(liquid).toHaveCSS('width','22px');
  await expect(liquid).toHaveCSS('transition-duration','0.3s');await expect(mark).toHaveText('✓');await expect(mark).toHaveCSS('font-size','16px');await expect(mark).toHaveCSS('font-weight','400');
  await expect(mark).toHaveCSS('color','rgb(255, 255, 255)');await expect(mark).toHaveCSS('opacity','0');
  const samples=await tick.evaluate(async el=>{const fill=el.querySelector('.os-checkbox-liquid'),mark=el.querySelector('.os-checkbox-mark'),out=[];el.click();for(let i=0;i<25;i++){await new Promise(requestAnimationFrame);out.push({clip:getComputedStyle(fill).clipPath,tick:getComputedStyle(mark).opacity});}return out;});
  assert.ok(samples.some(s=>s.tick==='1'&&!s.clip.includes('-10%')),'tick appears before fill finishes');assert.ok(new Set(samples.map(s=>s.clip)).size>3,'liquid visibly rises');assert.ok(samples.at(-1).clip.includes('-10%'),'fill finishes with the 300ms text response');
  await page.locator('.os-habit-session').screenshot({path:'outputs/checkbox-routine.png'});
  const undo=page.getByRole('button',{name:'Undo: Read a line',exact:true});await expect(undo).toHaveAttribute('aria-pressed','true');await undo.click();await expect(tick).toHaveAttribute('aria-pressed','false');
  await page.reload();await ready(page);await openRoutineTool(page);await expect(page.getByRole('button',{name:'Mark done: Read a line',exact:true})).toHaveAttribute('aria-pressed','false');
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]});
  await expect(page.locator('.os-row-tick .os-checkbox-liquid').first()).toHaveCSS('transition-duration','0s');await expect(page.locator('.os-row-tick .os-checkbox-face').first()).toHaveCSS('backdrop-filter','none');
  await page.evaluate(()=>{const label=document.createElement('label');label.className='os-admin-check';label.innerHTML='<input type="checkbox" aria-label="Synthetic admin setting"><span>Synthetic admin setting</span>';document.querySelector('.circle-os').append(label);});
  const native=page.getByRole('checkbox',{name:'Synthetic admin setting',exact:true});await native.check();await expect(native).toBeChecked();
  assert.deepEqual(await native.evaluate(el=>({rim:el.getBoundingClientRect().width,liquid:getComputedStyle(el,'::before').width,tick:getComputedStyle(el,'::after').content,opacity:getComputedStyle(el,'::after').opacity})),{rim:28,liquid:'22px',tick:'"✓"',opacity:'1'});
  await native.uncheck();await expect(native).not.toBeChecked();
  await page.emulateMedia({forcedColors:'active'});await expect(page.locator('.os-row-tick .os-checkbox-face').first()).toHaveCSS('forced-color-adjust','none');
},{reducedMotion:'no-preference'}));

for(const width of [360,390,416])test(`tool consistency across six apps and supporting views at ${width}px`,{timeout:120_000},async()=>isolated(width,async page=>{
  const results=[];
  async function audit(selector,name){
    const box=page.locator(selector);await expect(box).toBeVisible();
    await expect.poll(()=>box.evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.closest('.os-swipe-session').getBoundingClientRect().left-1))).toBeLessThan(1);
    await expect.poll(()=>box.evaluate(el=>el.closest('.os-swipe-session').getBoundingClientRect().height)).toBeGreaterThan(669.5);
    const metrics=await box.evaluate(el=>{
      const frame=el.closest('.os-swipe-session'),r=frame.getBoundingClientRect(),left=el.querySelector('.os-page-header-left'),heading=el.querySelector('.os-page-heading'),body=el.querySelector('.os-page-body');
      const start=heading?.getBoundingClientRect().height?heading:body;
      const headers=[...el.querySelectorAll('.os-page-header button')].map(button=>{
        const style=getComputedStyle(button),text=button.querySelector('.os-routine-nav-text'),range=document.createRange();range.selectNodeContents(text||button);const ink=range.getBoundingClientRect(),rect=button.getBoundingClientRect();
        return {text:button.textContent.trim(),size:style.fontSize,weight:style.fontWeight,line:style.lineHeight,width:rect.width,height:rect.height,left:ink.left-r.left-1,right:r.right-ink.right-1,shared:!!text};
      });
      return {height:r.height,gap:start.getBoundingClientRect().top-left.getBoundingClientRect().bottom,growth:getComputedStyle(frame).getPropertyValue('--os-growth-ms').trim(),headers,overflow:el.scrollWidth>el.clientWidth+1};
    });
    assert.equal(metrics.gap,24,name+' content anchor');assert.equal(metrics.growth,'600');assert.equal(metrics.overflow,false);
    assert.ok(metrics.height>=669.5,name+' shared minimum');
    assert.equal(await box.evaluate(el => getComputedStyle(el.closest('.os-swipe-session')).backdropFilter), 'blur(12px) saturate(1.2)', name+' glass blur');
    for(const header of metrics.headers){assert.equal(header.size,'16px');assert.equal(header.weight,'700');assert.equal(header.line,'22.4px');assert.ok(header.width>=44&&header.height>=44);assert.equal(header.shared,true,name+' shared header engine');assert.ok(Math.abs(header.left-24)<1||Math.abs(header.right-24)<1,name+' visible edge '+JSON.stringify(header));}
    if(width===390){
      const buttons=box.locator('.os-page-header button:has(.os-routine-nav-text)');
      await page.emulateMedia({reducedMotion:'no-preference'});
      for(const button of await buttons.all()){
        await button.dispatchEvent('pointerdown');
        const light=await button.locator('.os-routine-nav-text').evaluate(el=>({clip:getComputedStyle(el).backgroundClip,durations:el.getAnimations().map(a=>a.effect.getTiming().duration)}));
        assert.equal(light.clip,'text',name+' clipped reflection');assert.deepEqual(light.durations,[240],name+' header response');
        await button.dispatchEvent('pointercancel');
      }
      await page.waitForTimeout(260);await page.emulateMedia({reducedMotion:'reduce'});
      for(const button of await buttons.all()){await button.dispatchEvent('pointerdown');assert.equal(await button.locator('.os-routine-nav-text').evaluate(el=>el.getAnimations().length),0,name+' reduced-motion header');await button.dispatchEvent('pointercancel');}
    }
    const actions=await box.locator('.os-routine-create, .os-protocol-add, .os-creative-button-shell:not(.role-habit) .os-creative-button').evaluateAll(buttons=>buttons.map(button=>{const s=getComputedStyle(button),r=button.getBoundingClientRect(),f=button.closest('.os-swipe-session').getBoundingClientRect();return {text:button.textContent.trim(),height:r.height,radius:s.borderRadius,size:s.fontSize,weight:s.fontWeight,left:r.left-f.left-1,right:f.right-r.right-1};}));
    for(const action of actions){assert.equal(action.height,52,name+' action height');assert.equal(action.radius,'12px',name+' action radius');assert.equal(action.size,'18px');assert.equal(action.weight,'700');assert.ok(Math.abs(action.left-24)<1&&Math.abs(action.right-24)<1,name+' full-width action '+JSON.stringify(action));}
    await auditAppType(page);results.push({name,...metrics,actions});
  }
  const nav=page.getByRole('navigation',{name:'Circle OS',exact:true});
  await page.getByRole('button',{name:'Notes',exact:true}).click();
  const note=notePage(page);await audit('.os-note-page','Notes collection');
  await note.getByRole('button',{name:'Add note',exact:true}).click();
  await note.getByRole('textbox',{name:'Note title',exact:true}).fill('Consistency fixture');
  await note.getByRole('textbox',{name:'Write a note',exact:true}).fill('Synthetic writing kept safe.');
  await accepted(page,'Synthetic writing kept safe.');
  await note.getByRole('button',{name:'Back',exact:true}).click();await audit('.os-note-page','Notes with a saved panel');
  await note.locator('.os-notes-panel').filter({hasText:'Consistency fixture'}).click();
  await note.getByRole('button',{name:'Move note to Trash',exact:true}).click();
  await note.getByRole('button',{name:'Trash',exact:true}).click();await audit('.os-note-page','Note Trash');
  await note.locator('.os-writing-entry').click();await audit('.os-note-page','Note Trash detail');
  await note.getByRole('button',{name:'Delete forever',exact:true}).click();await audit('.os-note-page','Deletion confirmation');
  await note.getByRole('button',{name:'Cancel',exact:true}).click();await note.getByRole('button',{name:'Restore',exact:true}).click();
  await nav.getByRole('link',{name:'Today',exact:true}).click();await thoughts(page);
  await audit('.os-deep-thoughts-page','Deep Thoughts');
  const deep=page.locator('.os-deep-thoughts-page');
  await deep.getByRole('button',{name:'History',exact:true}).click();await audit('.os-deep-thoughts-page','Deep Thoughts History');
  await deep.getByRole('button',{name:'Trash',exact:true}).click();await audit('.os-deep-thoughts-page','Deep Thoughts Trash');
  await nav.getByRole('link',{name:'Today',exact:true}).click();await openRoutineTool(page);
  await audit('.os-habit-session .os-page-layout','Routine');
  await page.locator('.os-habit-session').getByRole('button',{name:'Record',exact:true}).click();await audit('.os-habit-session .os-page-layout','Routine Record');
  await nav.getByRole('link',{name:'Today',exact:true}).click();await openRoutineTool(page,'Protocol');
  await audit('.os-protocol-home','Protocol home / phases');
  await page.locator('.os-protocol-home').getByRole('button',{name:'Start a phase',exact:true}).click();await audit('.os-protocol-draft','Protocol draft');
  await page.locator('.os-protocol-draft').getByRole('button',{name:'Back',exact:true}).click();
  await nav.getByRole('link',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Log',exact:true}).click();
  await audit('.os-log-page:not(.os-log-week)','Log');
  await page.locator('.os-log-page:not(.os-log-week)').getByRole('button',{name:'History',exact:true}).click();await audit('.os-log-history-page','Log History');
  await page.locator('.os-log-history-page').getByRole('button',{name:'Log',exact:true}).click();
  await page.getByRole('button',{name:'Open Week',exact:true}).click();await audit('.os-week-overview','Week');
  await page.locator('.os-week-overview .os-week-date-button').last().click();await audit('.os-week-overview','Week Sunday review');
  await page.locator('.os-week-overview').getByRole('button',{name:'History',exact:true}).click();await audit('.os-week-history-page','Week History');
  await page.locator('.os-log-session').screenshot({path:`outputs/tool-consistency-${width}.png`});
  console.log('Tool consistency',width,JSON.stringify(results));
}));

async function auditAppType(page) {
  const violations = await page.locator(".circle-os").evaluateAll(roots => [...new Set(roots.flatMap(root => [...root.querySelectorAll("*")]))].flatMap(el => {
    if (!(el instanceof HTMLElement) || !el.checkVisibility({checkVisibilityCSS:true}) || !el.getBoundingClientRect().width) return [];
    const text = [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!text && !el.matches("input,textarea,select")) return [];
    const s=getComputedStyle(el), problems=[];
    if (!["12px","16px","18px","28px"].includes(s.fontSize)) problems.push(`size ${s.fontSize}`);
    if (!["400","700"].includes(s.fontWeight)) problems.push(`weight ${s.fontWeight}`);
    if (!s.fontFamily.includes("Geist")) problems.push(`family ${s.fontFamily}`);
    if (el.matches("input,textarea")) {
      const p=getComputedStyle(el,"::placeholder");
      if (p.fontSize!==s.fontSize || p.fontWeight!==s.fontWeight) problems.push("placeholder metrics");
    }
    return problems.length ? [{element:el.tagName,class:el.className,problems}] : [];
  }));
  assert.deepEqual(violations,[],"rendered app text follows the four-size/two-weight system");
}

for(const width of [360,390])test(`Small cross stays balanced beside mixed habit and task names at ${width}px`,{timeout:60_000},async()=>isolated(width,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api;
    for(const [i,name] of ["read a page","Read a page","10 push ups"].entries()){
      s=a.updateHabitDefinition(a.addHabitDefinition(s,`small-cross-${i}`).state,`small-cross-${i}`,name);
      s=a.updateTask(a.addTask(s,`small-task-${i}`).state,`small-task-${i}`,name);
    }return s;
  }));
  await openRoutineTool(page);const box=page.locator(".os-habit-session");
  const metrics=await box.locator(".os-repeated-habit,.os-task-row").evaluateAll(rows=>rows.map(row=>{
    const button=row.querySelector(".os-routine-clear"),cross=button.querySelector("span"),b=button.getBoundingClientRect(),c=cross.getBoundingClientRect(),t=row.querySelector("textarea").getBoundingClientRect(),stroke=getComputedStyle(cross,"::before");
    return {width:c.width,height:c.height,stroke:stroke.height,hitWidth:b.width,hitHeight:b.height,gap:t.left-c.right,alignment:Math.abs(c.top+c.height/2-t.top-parseFloat(getComputedStyle(row.querySelector("textarea")).lineHeight)/2)};
  }));
  assert.equal(metrics.length,6);assert.ok(metrics.every(m=>m.width===8&&m.height===8&&m.stroke==="1.5px"&&m.hitWidth>=44&&m.hitHeight>=44&&Math.abs(m.gap-12)<0.5&&m.alignment<0.5),JSON.stringify(metrics));
  await box.getByRole("button",{name:"Clear habit: read a page",exact:true}).focus();await page.keyboard.press("Space");
  await expect(box.getByRole("textbox",{name:"Edit habit: read a page",exact:true})).toHaveCount(0);
  await expect(box.getByRole("textbox",{name:"Edit task: read a page",exact:true})).toBeVisible();
  await box.screenshot({path:`outputs/routine-small-cross-${width}.png`});
}));

for (const width of [360, 390, 1280]) test(`Routine glass and navigation stay aligned without the old threads at ${width}px`, { timeout: 90_000 }, async () => isolated(width, async page => {
  await page.evaluate(() => window.circle.updateState(state => {
    const api = window.api;
    for (let i = 0; i < 12; i++) {
      const id = `alignment-${i}`;
      state = api.updateHabitDefinition(api.addHabitDefinition(state, id).state, id, `Read a page ${i + 1}`);
    }
    return state;
  }));
  await openRoutineTool(page);
  const box = page.locator(".os-habit-session");
  const nav = page.getByRole("navigation", { name: "Circle OS" });
  const oldThreads = page.locator(".os-routine-threads");
  await expect(oldThreads).toHaveCount(0);
  await expect(box).toHaveCSS("backdrop-filter", "blur(12px) saturate(1.2)");
  await expect(page.locator(".os-route-stage")).toHaveCSS("view-transition-name", "none");
  const expectAligned = () => expect.poll(async () => {
    const frame = await box.boundingBox();
    const bar = await nav.boundingBox();
    return Math.max(Math.abs(frame.x - bar.x), Math.abs(frame.width - bar.width));
  }).toBeLessThan(1);
  await expectAligned();
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expectAligned();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await box.getByRole("button", { name: "Record", exact: true }).click();
  await expect(box).toHaveClass(/is-history/);
  await expect(oldThreads).toHaveCount(0);
  await expectAligned();
}));

for (const width of [360,390]) test(`Record matches Habits and clear glyph spacing at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api,h=a.addHabitDefinition(s,"record-style");
    s=a.updateHabitDefinitionParts(h.state,h.id,{action:"Read ten pages",cue:"After breakfast",identity:"A thoughtful reader"});
    s=a.toggleHabitForDay(s,h.id,a.previousDateKey(a.getDateKey()));
    s=a.toggleHabitForDay(s,h.id,a.getDateKey());
    s=a.updateTask(a.addTask(s,"record-style-task").state,"record-style-task","Bring a book");
    s=a.completeTask(s,"record-style-task");
    return a.updateTask(a.addTask(s,"layout-task").state,"layout-task","Call a friend");
  }));
  await auditAppType(page);await openRoutineTool(page);
  const box=page.locator(".os-habit-session");
  const heading=await box.locator("#habit-session-title").evaluate(el=>{const s=getComputedStyle(el);return {size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color};});
  const gap=await box.locator(".os-repeated-habit").evaluate(el=>{
    const x=el.querySelector(".os-routine-clear span").getBoundingClientRect(),copy=el.querySelector(".os-habit-copy-swap").getBoundingClientRect();
    return copy.left-x.right;
  });
  assert.ok(Math.abs(gap-12)<0.5,`visible cross-to-copy gap is 12px, got ${gap}`);
  const geometry=await box.locator(".os-routine-body").evaluate(el=>[...el.querySelectorAll("section")].map(section=>{
    const row=section.querySelector(".os-extra-mission");
    if(!row)return null;
    const head=section.querySelector("h2").getBoundingClientRect(),cross=row.querySelector(".os-routine-clear-cross").getBoundingClientRect(),copy=row.querySelector(".os-habit-copy-swap,textarea").getBoundingClientRect(),create=section.querySelector(".os-routine-create").getBoundingClientRect(),frame=section.closest('.os-habit-session'),box=frame.getBoundingClientRect(),style=getComputedStyle(frame);
    return {head:head.left,cross:cross.left,copy:copy.left,left:create.left-box.left-parseFloat(style.borderLeftWidth),right:box.right-create.right-parseFloat(style.borderRightWidth),height:create.height,width:create.width};
  }).filter(Boolean));
  assert.equal(geometry.length,2,"measure both Habit and Task row/button alignment");
  for(const g of geometry){assert.ok(Math.abs(g.cross-g.head)<0.5);assert.ok(Math.abs(g.copy-g.head-20)<0.5);assert.ok(Math.abs(g.left-24)<0.5&&Math.abs(g.right-24)<0.5,'creation buttons have equal 24px inside-border gutters');assert.equal(g.height,52);assert.equal(g.width,width-98);}
  const glass=await box.evaluate(el=>{const window=el.querySelector(".os-app-window"),surface=getComputedStyle(el);return {surfaceZ:surface.zIndex,filter:surface.backdropFilter,old:getComputedStyle(window,"::after").content};});
  assert.equal(glass.surfaceZ,"1");assert.equal(glass.old,"none");assert.match(glass.filter,/blur\(12px\).*saturate\(1.2\)/);
  await box.screenshot({path:`outputs/routine-cross-glass-${width}.png`});
  await auditAppType(page);
  await page.evaluate(()=>window.circle.updateState(s=>window.api.updateHabitDefinitionParts(s,"record-style",{action:"Changed later",cue:"Not the saved cue",identity:"Not the saved result"})));
  const evidence=await page.evaluate(()=>JSON.stringify(window.circle.state.habits));
  await box.getByRole("button",{name:"Record",exact:true}).click();
  const recordGeometry=await box.evaluate(el=>{const frame=el.getBoundingClientRect(),surface=el.querySelector(".os-app-window").getBoundingClientRect();return {frameHeight:frame.height,surfaceHeight:surface.height,bottomGap:frame.bottom-surface.bottom,rows:[...el.querySelectorAll(".os-record-row")].map(row=>{const copy=row.firstElementChild.getBoundingClientRect(),tick=row.querySelector(".os-row-tick").getBoundingClientRect(),style=getComputedStyle(row.querySelector(".os-creative-button-shell"));return {copyTop:copy.top,tickTop:tick.top,tickX:tick.x,width:tick.width,height:tick.height,visibility:style.visibility,opacity:style.opacity};})};});
  console.log("Record glass geometry",width,JSON.stringify(recordGeometry));
  assert.ok(recordGeometry.rows.every(r=>r.width>=44&&r.height>=44));
  for(const copy of await box.locator(".os-record-habit-copy").all())await expect(copy.locator("p")).toHaveText(["Read ten pages","After breakfast","A thoughtful reader"]);
  await expect(box).not.toContainText("To become");await expect(box).not.toContainText("I will");await expect(box).not.toContainText("Changed later");
  const record=await box.evaluate(el=>{
    const first=el.querySelector(".os-record-label"),s=getComputedStyle(first),header=el.querySelector(".os-page-header-left");
    return {heading:{size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color},gap:first.getBoundingClientRect().top-header.getBoundingClientRect().bottom,
      rows:[...el.querySelectorAll(".os-record-text,.os-yesterday-row.is-task")].map(row=>{const t=getComputedStyle(row);return {size:t.fontSize,weight:t.fontWeight,opacity:t.opacity,color:t.color,border:t.borderBottomWidth,padding:t.padding};})};
  });
  assert.deepEqual(record.heading,heading);assert.ok(Math.abs(record.gap-24)<1);
  assert.ok(record.rows.length>=3);assert.ok(record.rows.every(r=>r.size==="18px"&&r.weight==="700"&&r.opacity==="1"&&r.color===heading.color&&r.border==="0px"&&r.padding==="0px"));
  await expect(box.locator(".os-yesterday-list").first()).toHaveCSS("row-gap","8px");
  await auditAppType(page);
  await expect(box.locator(".os-record-cue").first()).toHaveCSS("font-size","16px");await expect(box.locator(".os-record-cue").first()).toHaveCSS("font-weight","400");
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.habits)),evidence,"Record does not rewrite saved or current words");
  for(const control of await box.locator(".os-record-row .os-row-tick").all()) {
    await expect(control).toHaveCSS("opacity","1");
    assert.match(await control.locator('.os-checkbox-face').evaluate(el=>getComputedStyle(el).boxShadow), /rgba\(227, 107, 55, 0\.12\) 0px 3px 9px/);
    assert.ok(await control.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest("button")===el;}),"Record Undo remains hittable");
  }
  await page.waitForTimeout(500);
  await box.screenshot({path:`outputs/record-shared-style-${width}.png`});
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);await auditAppType(page);
}));

test("Record keeps text-only legacy words and first-line Undo without borrowing fields",{timeout:60_000},async()=>isolated(390,async page=>{
  const dates=await page.evaluate(()=>{
    const a=window.api,today=a.getDateKey(),past=a.previousDateKey(today);
    window.circle.updateState(s=>{
      s=a.updateHabitDefinitionParts(a.addHabitDefinition(s,"legacy-copy").state,"legacy-copy",{action:"A later name",cue:"A later cue",identity:"A later result"});
      for(const day of [today,past]){s=a.toggleHabitForDay(s,"legacy-copy",day);s.habits.completions[day+":legacy-copy"].snapshot={text:"Original free-form writing"};}
      return s;
    });return {today,past};
  });
  await openRoutineTool(page);const box=page.locator(".os-habit-session");await box.getByRole("button",{name:"Record",exact:true}).click();
  for(const copy of await box.locator(".os-record-habit-copy").all())await expect(copy.locator("p")).toHaveText(["Original free-form writing"]);
  await expect(box).not.toContainText("A later");await expect(box.locator(".os-record-cue")).toHaveCount(0);
  const alignment=await box.locator(".os-record-row").evaluate(row=>{const text=row.querySelector("p").getBoundingClientRect(),tick=row.querySelector("button").getBoundingClientRect();return Math.abs(text.top+parseFloat(getComputedStyle(row.querySelector("p")).lineHeight)/2-tick.top-tick.height/2);});
  assert.ok(alignment<0.5,"legacy fallback keeps the same first-line Undo anchor");
  const pastBefore=await page.evaluate(day=>JSON.stringify(window.circle.state.habits.completions[day+":legacy-copy"]),dates.past);
  await box.getByRole("button",{name:"Undo: Original free-form writing",exact:true}).click();
  await expect(box.locator(".os-record-row")).toHaveCount(0);
  assert.equal(await page.evaluate(day=>JSON.stringify(window.circle.state.habits.completions[day+":legacy-copy"]),dates.past),pastBefore);
}));

test("Routine reduced transparency uses solid glass and keeps cross targets usable",{timeout:60_000},async()=>isolated(390,async(page,context)=>{
  await page.evaluate(()=>window.circle.updateState(s=>window.api.updateHabitDefinition(window.api.addHabitDefinition(s,"clear-hit").state,"clear-hit","Read a line")));
  await openRoutineTool(page);const box=page.locator(".os-habit-session");
  const hits=await box.locator(".os-routine-clear").evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,hits:[r.left+2,r.right-2].map(x=>document.elementFromPoint(x,r.top+r.height/2)?.closest("button")===el)};});
  assert.ok(hits.width>=44&&hits.height>=44&&hits.hits.every(Boolean),JSON.stringify(hits));
  const cdp=await context.newCDPSession(page);await cdp.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-transparency",value:"reduce"},{name:"prefers-reduced-motion",value:"reduce"}]});
  await expect(box.locator(".os-app-window")).toHaveCSS("backdrop-filter","none");
  await expect(box).toHaveCSS("backdrop-filter","none");
  await expect(box.getByRole("button",{name:"New habit",exact:true})).toHaveCSS("backdrop-filter","none");
  const fallback=await box.locator('.os-row-tick .os-checkbox-face').first().evaluate(el=>({filter:getComputedStyle(el).backdropFilter,background:getComputedStyle(el).backgroundColor,sheen:getComputedStyle(el.querySelector('.os-checkbox-liquid')).backgroundImage}));
  assert.deepEqual(fallback,{filter:"none",background:"rgb(25, 24, 19)",sheen:"none"});
  await box.getByRole("button",{name:"Clear habit: Read a line",exact:true}).click();await expect(box.locator(".os-repeated-habit")).toHaveCount(0);
}));

for (const width of [360, 390]) test(`Routine field hierarchy and one-click clearing at ${width}px`, {timeout:90_000}, async () => isolated(width, async page => {
  await page.evaluate(() => window.circle.updateState(s => {
    const a = window.api, added = a.addHabitDefinition(s, "clear-habit");
    s = a.updateHabitDefinitionParts(added.state, added.id, {action:"Walk outside", cue:"After breakfast", identity:"I notice the world"});
    s = a.toggleHabitForDay(s, added.id, a.previousDateKey(a.getDateKey()));
    return a.updateTask(a.addTask(s, "clear-task").state, "clear-task", "Bring a book");
  }));
  await openRoutineTool(page);
  const box = page.locator(".os-habit-session");
  await box.getByRole("textbox", {name:"Edit habit: Walk outside", exact:true}).focus();
  for (const [selector, size, weight] of [[".os-repeated-habit .os-mission-text-edit:not(.os-habit-cue-edit)","18px","700"],[".os-habit-cue-edit","16px","400"],[".os-habit-identity-edit","18px","700"],[".os-task-row textarea","18px","700"]]) {
    const field = box.locator(selector);
    await expect(field).toHaveCSS("font-size",size);await expect(field).toHaveCSS("font-weight",weight);
    const placeholder = await field.evaluate(el => {const s=getComputedStyle(el,"::placeholder");return {size:s.fontSize,weight:s.fontWeight,color:s.color};});
    assert.deepEqual(placeholder,{size,weight,color:"rgba(241, 239, 232, 0.65)"});
  }
  const targets = await box.locator(".os-routine-clear").evaluateAll(elements => elements.map(el => {
    const r=el.getBoundingClientRect(), copy=el.parentElement.querySelector("textarea").getBoundingClientRect(), s=getComputedStyle(el);
    return {width:r.width,height:r.height,left:r.right<=copy.left,color:s.color,size:s.fontSize};
  }));
  assert.ok(targets.every(t=>t.width>=44&&t.height>=44&&t.left&&t.color==="rgb(227, 107, 55)"&&t.size==="12px"));
  await box.getByRole("button",{name:"Clear habit: Walk outside",exact:true}).click();
  await expect(box.locator(".os-repeated-habit")).toHaveCount(0);
  await box.getByRole("button",{name:"Clear task: Bring a book",exact:true}).click();
  await expect(box.locator(".os-task-row")).toHaveCount(0);
  await page.waitForTimeout(600);await page.reload();await ready(page);await openRoutineTool(page);
  await expect(box.locator(".os-repeated-habit,.os-task-row")).toHaveCount(0);
  await box.getByRole("button",{name:"Record",exact:true}).click();
  await expect(box).toContainText("Walk outside");
  await expect(box.locator(".os-record-label").first()).toHaveCSS("font-size","28px");
  await box.getByRole("button",{name:"Back",exact:true}).click();
  await box.getByRole("button",{name:"New habit",exact:true}).click();
  await box.getByRole("textbox",{name:"Who this makes you: New Habit",exact:true}).fill("A patient reader");
  await box.getByRole("button",{name:"Clear habit: New Habit",exact:true}).click();
  await expect(box.locator(".os-repeated-habit")).toHaveCount(0);
  await box.getByRole("button",{name:"New habit",exact:true}).click();
  await expect(box.getByRole("textbox",{name:"Who this makes you: New Habit",exact:true})).toHaveValue("");
  await box.getByRole("textbox",{name:"Edit habit: New Habit",exact:true}).fill("Read another line");
  await box.getByRole("button",{name:"Add task",exact:true}).click();
  await box.getByRole("textbox",{name:"Edit task: New Task",exact:true}).fill("Keep the finished record");
  await box.getByRole("button",{name:"Complete task: Keep the finished record",exact:true}).click();
  await expect(box.locator(".os-task-row")).toHaveCount(0);
  await box.getByRole("button",{name:"Record",exact:true}).click();
  await expect(box).toContainText("Keep the finished record");
}));

for (const reducedMotion of ["no-preference", "reduce"]) test(`Routine resize survives typing and clearing with ${reducedMotion} motion`, { timeout:60_000 }, async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    for(let i=0;i<7;i++){const a=window.api.addHabitDefinition(s,`resize-${i}`);s=window.api.updateHabitDefinitionParts(a.state,a.id,{action:`Read ${i}`,cue:"After breakfast",identity:"A reader"});}return s;
  }));
  await openRoutineTool(page);await page.waitForTimeout(2100);
  const box=page.locator('.os-habit-session'),frame=box.locator('.os-app-window');
  await frame.evaluate(el=>{const animate=el.animate.bind(el);el.animate=(...args)=>{const animation=animate(...args);window.activeResize=animation;animation.playbackRate=0.01;return animation;};});
  await box.getByRole('button',{name:'Add task',exact:true}).click();
  await box.getByRole('textbox',{name:'Edit task: New Task',exact:true}).fill('Read and reflect on the world each morning. '.repeat(4));
  if(reducedMotion==='no-preference') assert.equal(await page.evaluate(()=>window.activeResize?.playState),'running','typing retains the running structural expansion');
  await page.evaluate(()=>{if(window.activeResize)window.activeResize.playbackRate=1;});
  await frame.evaluate(el=>{delete el.animate;});
  await page.waitForTimeout(2200);
  await expect.poll(()=>frame.evaluate(el=>Math.abs(el.getBoundingClientRect().height-el.querySelector('.os-app-page.current').getBoundingClientRect().height))).toBeLessThan(0.5);
  await box.getByRole('textbox',{name:'Edit habit: Read 0',exact:true}).click();await page.waitForTimeout(2100);
  await box.getByRole('button',{name:'Clear habit: Read 6',exact:true}).locator('..').evaluate(el=>{window.clearFrames=[];const observer=new MutationObserver(()=>{if(!el.hasAttribute('data-clearing'))return;observer.disconnect();const sample=()=>{window.clearFrames.push({connected:el.isConnected,inert:el.inert,opacity:Number(getComputedStyle(el).opacity),duration:getComputedStyle(el).animationDuration});if(el.isConnected)requestAnimationFrame(sample);};sample();});observer.observe(el,{attributes:true,attributeFilter:['data-clearing']});});
  await box.getByRole('button',{name:'Clear habit: Read 6',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.circle.state.habits.definitions['resize-6'].status),'archived','clear saves before the visual exit');
  if(reducedMotion==='no-preference'){
    await page.waitForFunction(()=>window.clearFrames.some(f=>!f.connected));
    const frames=await page.evaluate(()=>window.clearFrames);
    assert.ok(frames.some(f=>f.inert&&f.duration==='0.3s'&&f.opacity>0&&f.opacity<1),'clear visibly fades for 300ms while inert');
  }
  await expect(box.locator('[data-clearing]')).toHaveCount(0);
  await page.waitForTimeout(2200);
  await expect.poll(()=>frame.evaluate(el=>Math.abs(el.getBoundingClientRect().height-el.querySelector('.os-app-page.current').getBoundingClientRect().height))).toBeLessThan(0.5);
  await page.reload();await ready(page);await openRoutineTool(page);await expect(box.getByRole('textbox',{name:'Edit habit: Read 6',exact:true})).toHaveCount(0);
},{reducedMotion}));

for(const reducedMotion of ['no-preference','reduce'])test(`Task completion shares the Habit response without strike or dwell with ${reducedMotion} motion`,{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{for(let i=0;i<7;i++){const a=window.api.addHabitDefinition(s,`task-response-${i}`);s=window.api.updateHabitDefinitionParts(a.state,a.id,{action:`Read ${i}`,cue:'After breakfast',identity:'A reader'});}const a=window.api.addTask(s,'task-response');return window.api.updateTask(a.state,a.id,'Bring a book');}));
  await openRoutineTool(page);await page.waitForTimeout(1000);const box=page.locator('.os-habit-session');
  const row=box.locator('.os-task-row');
  await row.evaluate(el=>{window.taskResponse=[];window.taskResponseDone=false;const frame=el.closest('.os-app-window'),before=el.getBoundingClientRect().height;const observer=new MutationObserver(()=>{if(!el.classList.contains('completed'))return;observer.disconnect();const start=performance.now();const sample=()=>{const text=el.querySelector('textarea'),style=getComputedStyle(text);window.taskResponse.push({t:performance.now()-start,connected:el.isConnected,opacity:Number(style.opacity),decoration:style.textDecorationLine,color:style.color,row:el.getBoundingClientRect().height,before,frame:frame.getBoundingClientRect().height,fillDuration:getComputedStyle(el.querySelector('.os-row-tick'),'::after').transitionDuration});if(performance.now()-start<1200)requestAnimationFrame(sample);else window.taskResponseDone=true;};sample();});observer.observe(el,{attributes:true,attributeFilter:['class']});});
  await box.getByRole('button',{name:'Complete task: Bring a book',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.circle.state.tasks.items['task-response'].status)).toBe('completed');
  if(reducedMotion==='no-preference'){
    await page.waitForFunction(()=>window.taskResponseDone);const frames=await page.evaluate(()=>window.taskResponse),visible=frames.filter(f=>f.connected);
    assert.ok(visible.some(f=>f.opacity>0&&f.opacity<1),'task words visibly fade');
    assert.ok(visible.every(f=>f.decoration==='none'&&f.color==='rgb(241, 239, 232)'),'no strike or color change');
    assert.ok(visible.every(f=>Math.abs(f.row-f.before)<0.5),'row holds its space through the response');
    assert.ok(frames.find(f=>!f.connected).t<650,'task leaves after the response without a three-second dwell');
    assert.ok(visible.some(f=>f.fillDuration.startsWith('0.3s')),'checkbox shares the response clock');
    const end=await box.locator('.os-app-window').evaluate(el=>({height:el.getBoundingClientRect().height,page:el.querySelector('.os-app-page.current').getBoundingClientRect().height}));assert.ok(Math.abs(end.height-end.page)<0.5);
  }
  await expect(row).toHaveCount(0);
  await box.getByRole('button',{name:'Record',exact:true}).click();const undo=box.getByRole('button',{name:'Undo task: Bring a book',exact:true});await expect(undo).toBeVisible();await undo.click();
  await expect.poll(()=>page.evaluate(()=>window.circle.state.tasks.items['task-response'].status)).toBe('open');
  await box.getByRole('button',{name:'Back',exact:true}).click();await expect(box).not.toHaveClass(/os-app-flip/);await expect(box.getByRole('textbox',{name:'Edit task: Bring a book',exact:true})).toBeVisible();
  await expect.poll(()=>box.locator('.os-app-window').evaluate(el=>Math.abs(el.getBoundingClientRect().height-el.querySelector('.os-app-page.current').getBoundingClientRect().height))).toBeLessThan(0.5);
  await page.reload();await ready(page);await openRoutineTool(page);await expect(box.getByRole('textbox',{name:'Edit task: Bring a book',exact:true})).toBeVisible();
},{reducedMotion}));

test("Habit result fades in and out without overlapping words, including restored Undo", { timeout: 60_000 }, async () => isolated(390, async page => {
  await page.evaluate(() => window.circle.updateState(s => {
    const added = window.api.addHabitDefinition(s, "motion-check");
    return window.api.updateHabitDefinitionParts(added.state, added.id, { action: "Read a line", cue: "After breakfast", identity: "I am a reader" });
  }));
  await openRoutineTool(page);
  const row = page.locator(".os-repeated-habit").filter({ has: page.getByRole("textbox", { name: "Edit habit: Read a line", exact: true }) });
  const before = await row.evaluate(el => {
    const r = el.getBoundingClientRect(), text = el.querySelector(".os-mission-text-edit"), t = text.getBoundingClientRect(), s = getComputedStyle(text);
    // Schedule remains below the animated copy; measure the region that resizes.
    return { height: el.querySelector('.os-habit-copy-swap').getBoundingClientRect().height, x: t.x-r.x, y: t.y-r.y, size: s.fontSize, weight: s.fontWeight, line: s.lineHeight, spacing: s.letterSpacing };
  });
  const completedHeight = await row.locator('.os-habit-copy-swap').evaluate(el => parseFloat(getComputedStyle(el).minHeight));
  assert.ok(before.height > completedHeight, 'the original action and cue need more room than the completed result');
  await row.evaluate(el => {
    window.identityMotion = { frames: [], done: false };
    const observer = new MutationObserver(() => {
      if (!el.classList.contains("completed")) return;
      observer.disconnect();
      const start = performance.now(), copy = el.querySelector(".os-habit-identity-copy");
      const sample = () => {
        const s = getComputedStyle(copy), time = performance.now() - start;
        const outgoing = getComputedStyle(el.querySelector(".os-habit-action-copy")), fill = getComputedStyle(el.querySelector(".os-checkbox-liquid")), r = el.getBoundingClientRect(), t = copy.getBoundingClientRect(), old = el.querySelector(".os-mission-text-edit").getBoundingClientRect();
        const fade=copy.getAnimations().find(a=>'transitionProperty' in a&&a.transitionProperty==='opacity');
        const progress=typeof fade?.currentTime==='number'?Number(fade.currentTime)/300:null;
        window.identityMotion.frames.push({ time, progress, opacity: Number(s.opacity), easing:s.transitionTimingFunction, clip: s.clipPath, x: t.x-r.x, y: t.y-r.y, oldY: old.y-r.y, height: el.querySelector('.os-habit-copy-swap').getBoundingClientRect().height, size: s.fontSize, weight: s.fontWeight, line: s.lineHeight, spacing: s.letterSpacing, filter: s.filter, outgoing: Number(outgoing.opacity), outgoingFilter: outgoing.filter, duration: s.transitionDuration, delay: s.transitionDelay, color: s.color, fill: Math.min(1,Math.max(0,(110-parseFloat(fill.clipPath.split(' ')[1]))/120)), fillDuration: fill.transitionDuration });
        if (time < 1600) requestAnimationFrame(sample); else window.identityMotion.done = true;
      };
      sample();
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  });
  await row.getByRole("button", { name: "Mark done: Read a line", exact: true }).click();
  await page.waitForFunction(() => window.identityMotion.done);
  const frames = await page.evaluate(() => window.identityMotion.frames);
  console.log("Actual identity animation frames", JSON.stringify(frames));
  assert.ok(frames.some(f => f.time < 300 && f.opacity > 0 && f.opacity < 1 && f.duration === '0.3s'), "result visibly fades in over 300ms");
  assert.ok(frames.every(f=>f.easing==='ease-in'),'fade-in uses the time-reverse of fade-out');
  assert.ok(frames.some(f=>f.progress>0.35&&f.progress<0.5&&f.opacity<f.progress-0.1),'fade-in no longer reaches readable opacity too early');
  assert.ok(frames.filter(f=>f.time>330).every(f=>f.opacity===1), "result is fully visible before the frame settles");
  assert.ok(frames.every(f=>f.outgoing===0&&f.clip==='none'), "old words leave cleanly, without overlap or an uncover mask");
  assert.ok(frames.every(f => Math.abs(f.x-before.x) < 0.5 && Math.abs(f.y-before.y) < 0.5 && Math.abs(f.oldY-before.y) < 0.5), "the entire text block retains its anchor, including its parent");
  assert.ok(frames.every(f => f.size === before.size && f.weight === before.weight && f.line === before.line && f.spacing === before.spacing), "both faces retain identical font metrics");
  assert.ok(frames.every(f => f.filter === "none" && f.outgoingFilter === "none"), "no blur hides the dissolve");
  assert.ok(frames.filter(f => f.time < 280).every(f => Math.abs(f.height-before.height) < 0.5), "row holds its height through the response");
  assert.ok(frames.some(f => f.time > 400 && f.time < 750 && f.height > completedHeight + 0.5 && f.height < before.height - 0.5), "excess space settles only after the words change");
  assert.ok(frames.some(f => f.time > 750 && f.time < 850 && f.height > completedHeight + 0.01), "the visible copy continues settling near the end of its 600ms duration");
  assert.ok(frames.some(f => f.time > 70 && f.time < 230 && f.fill > 0 && f.fill < 0.95 && f.fillDuration.startsWith("0.3s")), "Orange visibly grows inside the rim over 300ms");
  const last = frames.at(-1); assert.equal(last.opacity, 1); assert.ok(Math.abs(last.height-completedHeight) < 0.5);
  assert.equal(last.color, "rgb(241, 239, 232)");
  const verifyReturn=async()=>{
    await row.evaluate(el=>{window.habitReturn=[];window.habitReturnDone=false;const observer=new MutationObserver(()=>{if(el.classList.contains('completed'))return;observer.disconnect();const start=performance.now();const sample=()=>{const face=el.querySelector('.os-habit-identity-copy'),result=getComputedStyle(face),action=getComputedStyle(el.querySelector('.os-habit-action-copy')),copy=el.querySelector('.os-habit-copy-swap'),fade=face.getAnimations().find(a=>'transitionProperty' in a&&a.transitionProperty==='opacity');window.habitReturn.push({t:performance.now()-start,progress:typeof fade?.currentTime==='number'?Number(fade.currentTime)/300:null,result:Number(result.opacity),easing:result.transitionTimingFunction,action:Number(action.opacity),height:copy.getBoundingClientRect().height,immediate:copy.classList.contains('is-immediate'),returning:copy.classList.contains('is-returning')});if(performance.now()-start<1200)requestAnimationFrame(sample);else window.habitReturnDone=true;};sample();});observer.observe(el,{attributes:true,attributeFilter:['class']});});
    await row.getByRole('button',{name:'Undo: Read a line',exact:true}).click();await page.waitForFunction(()=>window.habitReturnDone);
    const returning=await page.evaluate(()=>window.habitReturn);
    assert.ok(returning.some(f=>f.t<300&&f.result>0&&f.result<1),'result visibly fades out on uncheck');
    assert.ok(returning.every(f=>f.easing==='ease-out'),'Task-style fade-out keeps its curve');
    const pairs=frames.filter(f=>f.progress>0.1&&f.progress<0.9).map(f=>({incoming:f,outgoing:returning.filter(r=>r.progress!==null).sort((a,b)=>Math.abs(a.progress-(1-f.progress))-Math.abs(b.progress-(1-f.progress)))[0]})).filter(pair=>pair.outgoing&&Math.abs(pair.outgoing.progress-(1-pair.incoming.progress))<0.04);
    assert.ok(pairs.length>=3&&pairs.every(pair=>Math.abs(pair.incoming.opacity-pair.outgoing.result)<0.12),'measured fade curves match when played in reverse');
    assert.ok(returning.filter(f=>f.t<280).every(f=>f.action===0&&Math.abs(f.height-completedHeight)<0.5),'original words and copy geometry wait through the response');
    assert.ok(returning.every(f=>f.result===0||f.action===0),'word faces never overlap');
    assert.ok(returning.every(f=>!f.immediate),'restoration suppression does not swallow deliberate Undo');
    assert.ok(returning.some(f=>f.t>750&&f.t<850&&f.returning),'return state covers the full response and height settle with minified CSS time units');
    assert.equal(returning.at(-1).result,0);assert.equal(returning.at(-1).action,1);assert.ok(Math.abs(returning.at(-1).height-before.height)<0.5);
    await expect(row.locator('.os-habit-copy-swap')).not.toHaveClass(/is-returning/);
  };
  await verifyReturn();
  await row.getByRole('button',{name:'Mark done: Read a line',exact:true}).click();await expect(row.getByRole('button',{name:'Edit habit behind: I am a reader',exact:true})).toHaveCSS('opacity','1');
  await page.reload();await ready(page);await openRoutineTool(page);
  await expect(row.locator('.os-habit-copy-swap')).toHaveClass(/is-immediate/);
  await expect(row.getByRole('button',{name:'Edit habit behind: I am a reader',exact:true})).toHaveCSS('opacity','1');
  await verifyReturn();
}, { reducedMotion: "no-preference" }));

test("Routine shares Task typography and retains unchanged Habit words on check-off", { timeout:60_000 }, async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    for(const [id,action,cue,identity] of [["type-plain","Read a line","",""],["type-identity","Walk outside","After breakfast","I notice the world"]]){
      const a=window.api.addHabitDefinition(s,id);s=window.api.updateHabitDefinitionParts(a.state,a.id,{action,cue,identity});
    }return s;
  }));
  await openRoutineTool(page);const box=page.locator(".os-habit-session");
  await box.getByRole("button",{name:"Add task",exact:true}).click();await box.getByRole("textbox",{name:"Edit task: New Task",exact:true}).fill("Bring a book");await box.getByRole("button",{name:"Add task",exact:true}).focus();
  const metrics=await box.evaluate(el=>{
    const style=e=>{const s=getComputedStyle(e);return {size:s.fontSize,weight:s.fontWeight,line:s.lineHeight};};
    return {heads:[style(el.querySelector("#habit-session-title")),style(el.querySelector("#task-session-title"))],texts:[...el.querySelectorAll(".os-mission-text-edit:not(.os-habit-cue-edit),.os-habit-identity-copy")].map(style),align:[...el.querySelectorAll(".os-extra-mission")].map(row=>{const t=row.querySelector(".os-mission-text-edit"),c=row.querySelector(".os-row-tick"),r=t.getBoundingClientRect(),b=c.getBoundingClientRect();return Math.abs(r.top+parseFloat(getComputedStyle(t).lineHeight)/2-(b.top+b.height/2));})};
  });
  assert.deepEqual(metrics.heads[0],metrics.heads[1]);assert.ok(metrics.texts.every(s=>s.size==="18px"&&s.weight==="700"&&s.line==="23.4px"));assert.ok(metrics.align.every(n=>n<0.5));
  for (const list of [".os-repeated-habits", ".os-one-time-tasks"]) await expect(box.locator(list)).toHaveCSS("row-gap", "8px");
  const row=box.locator(".os-repeated-habit").first();
  await row.evaluate(el=>{window.pulse=[];const observer=new MutationObserver(()=>{if(!el.classList.contains("completed"))return;observer.disconnect();const start=performance.now();const sample=()=>{const s=getComputedStyle(el.querySelector(".os-habit-action-copy"));window.pulse.push({time:performance.now()-start,opacity:Number(s.opacity)});if(performance.now()-start<1600)requestAnimationFrame(sample);};sample();});observer.observe(el,{attributes:true,attributeFilter:["class"]});});
  await row.getByRole("button",{name:"Mark done: Read a line",exact:true}).click();await page.waitForTimeout(1750);
  const pulse=await page.evaluate(()=>window.pulse);assert.ok(pulse.every(f=>f.opacity===1),'unchanged words stay sharp without pulsing');
},{reducedMotion:"no-preference"}));

test("Routine Record uses local slow resize through the full App-back lifecycle",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api,added=a.addHabitDefinition(s,"record-motion");s=a.updateHabitDefinition(added.state,added.id,"A recorded walk");let day=a.getDateKey();
    for(let i=0;i<12;i++){day=a.previousDateKey(day);s=a.toggleHabitForDay(s,added.id,day);}return s;
  }));
  await openRoutineTool(page);await page.waitForTimeout(2000);const box=page.locator(".os-habit-session"),frame=box.locator(".os-app-window");
  const before=await frame.evaluate(el=>el.getBoundingClientRect().height);
  await box.evaluate(el=>{window.recordResize=[];window.recordResizeDone=false;const observer=new MutationObserver(()=>{if(!el.classList.contains('os-app-flip-resizing'))return;observer.disconnect();const frame=el.querySelector('.os-app-window'),start=performance.now();const sample=()=>{window.recordResize.push({height:frame.getBoundingClientRect().height,duration:getComputedStyle(frame).transitionDuration,running:frame.getAnimations().some(a=>a.playState==='running'&&a.effect.getTiming().duration===600)});if(performance.now()-start<1100)requestAnimationFrame(sample);else window.recordResizeDone=true;};sample();});observer.observe(el,{attributes:true,attributeFilter:['class']});});
  await box.getByRole("button",{name:"Record",exact:true}).click();
  await page.waitForFunction(()=>window.recordResizeDone);
  const middle=await page.evaluate(before=>window.recordResize.find(f=>f.running&&f.height>before),before);
  assert.ok(middle,'Record visibly grows during its 600ms transition');
  assert.equal(middle.duration,'0.6s');
  await expect(box).not.toHaveClass(/os-app-flip/);const end=await frame.evaluate(el=>({height:el.getBoundingClientRect().height,page:el.querySelector('.os-app-page.current').getBoundingClientRect().height}));console.log('Record resize',JSON.stringify({before,middle,end}));assert.ok(end.height>middle.height);
  await expect(box.getByRole("button",{name:"History",exact:true})).toHaveCount(0);await box.getByRole("button",{name:"Back",exact:true}).click();await expect(box.getByRole("button",{name:"Add task",exact:true})).toBeVisible();
},{reducedMotion:"no-preference"}));

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`Routine controls press and release with ${reducedMotion} motion`, { timeout: 60_000 }, async () => isolated(390, async page => {
    await page.evaluate(() => window.circle.updateState(s => {
      const added = window.api.addHabitDefinition(s, "press-check");
      return window.api.updateHabitDefinitionParts(added.state, added.id, { action: "Read a line", identity: "I am a reader" });
    }));
    await openRoutineTool(page);
    const box = page.locator(".os-habit-session"), create = box.getByRole("button", { name: "New habit", exact: true });
    await logSettled(box);
    const tick = box.getByRole("button", { name: "Mark done: Read a line", exact: true });
    const scale = locator => locator.evaluate(el => new DOMMatrix(getComputedStyle(el.querySelector('.os-checkbox-face')).transform).m11);
    const geometry = () => box.locator(".os-app-window").evaluate(el => el.getBoundingClientRect().height);
    const frameHeight = await geometry();
    for(const name of ["Back", "Record"]) await expect(box.getByRole("button",{name,exact:true})).toHaveCSS("font-weight","700");
    for (const name of ["New habit", "Add task"]) {
      const face = box.getByRole("button", { name, exact: true });
      await expect(face).toHaveCSS("border-top-color", "rgba(241, 239, 232, 0.72)");
      await expect(face).toHaveCSS("backdrop-filter", "blur(8px) saturate(1.2)");
      await expect(face).toHaveCSS("height", "52px");
      await expect(face).toHaveCSS("border-radius", "12px");
      await expect(face).toHaveCSS("font-weight", "700");
      assert.match(await face.evaluate(el=>getComputedStyle(el).boxShadow), /rgba\(227, 107, 55, 0\.1\) 0px 3px 9px/);
    }
    const material = await tick.evaluate(el => {
      const rim = getComputedStyle(el.querySelector('.os-checkbox-face')), frame = getComputedStyle(el.closest(".os-habit-session"));
      return { border: rim.borderTopColor, filter: rim.backdropFilter, frame: frame.backdropFilter };
    });
    assert.equal(material.border, "rgb(227, 107, 55)");
    assert.equal(material.filter, "blur(8px) saturate(1.2)");
    assert.equal(material.frame, "blur(12px) saturate(1.2)");
    assert.match(await tick.locator('.os-checkbox-face').evaluate(el=>getComputedStyle(el).boxShadow), /rgba\(227, 107, 55, 0\.12\) 0px 3px 9px/);
    const rect = await create.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await expect.poll(() => create.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBe(reducedMotion === "reduce" ? 0 : 2);
    await page.mouse.move(1, 1); await page.mouse.up();
    await expect(create).toHaveCSS("transform", "none");
    await expect(box.getByRole("textbox", { name: "Edit habit: New Habit", exact: true })).toHaveCount(0);
    const hit = await tick.boundingBox();
    await page.mouse.move(hit.x + hit.width / 2, hit.y + hit.height / 2);
    await page.mouse.down();
    await expect.poll(() => scale(tick)).toBe(reducedMotion === "reduce" ? 1 : 0.86);
    const held = await tick.boundingBox();
    assert.equal(held.width, 44); assert.equal(held.height, 44);
    assert.ok(Math.abs(await geometry() - frameHeight) < 0.5, "pressing does not move the frame");
    await page.mouse.move(1, 1); await page.mouse.up();
    await expect.poll(() => scale(tick)).toBe(1);
    await expect(tick).toHaveAttribute("aria-pressed", "false");
    await tick.click();
    const undo = box.getByRole("button", { name: "Undo: Read a line", exact: true });
    await expect(undo).toHaveAttribute("aria-pressed", "true");
    await expect(undo.locator('.os-checkbox-mark')).toHaveCSS('opacity','1');
    const layers = await undo.evaluate(el => {
      const rim = getComputedStyle(el.querySelector('.os-checkbox-face')), fill = getComputedStyle(el.querySelector('.os-checkbox-liquid'));
      return { rim: parseFloat(rim.width), fill: parseFloat(fill.width), border: rim.borderColor, color: fill.backgroundColor, sheen: fill.backgroundImage };
    });
    assert.equal((layers.rim - layers.fill) / 2, 3, "Orange stops 3px inside the glass boundary");
    assert.equal(layers.color, "rgb(227, 107, 55)"); assert.equal(layers.border, layers.color);
    assert.match(layers.sheen, /radial-gradient/);
    if (reducedMotion === "reduce") await box.screenshot({ path: "outputs/routine-controls-glass-checked.png" });
    await expect.poll(() => scale(undo)).toBe(1);
    if (reducedMotion === "reduce") {
      const identity = box.getByRole("button", { name: "Edit habit behind: I am a reader", exact: true });
      await expect(identity).toHaveCSS("opacity", "1");
      assert.equal(await identity.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42), 0);
    }
    await expect(undo).toHaveAttribute("aria-busy", "false"); await undo.click();
    await expect(tick).toHaveAttribute("aria-pressed", "false");
    await create.focus(); await page.keyboard.press("Space");
    await expect(box.getByRole("textbox", { name: "Edit habit: New Habit", exact: true })).toBeFocused();
  }, { reducedMotion }));
}

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`Routine additions stagger new rows and grow smoothly with ${reducedMotion} motion`, { timeout: 90_000 }, async () => isolated(390, async page => {
    await page.evaluate(() => window.circle.updateState(s => {
      for (let i = 0; i < 7; i++) {
        const added = window.api.addHabitDefinition(s, `growth-${i}`);
        s = window.api.updateHabitDefinitionParts(added.state, added.id, { action: `Read a page ${i}`, cue: "After breakfast", identity: "I am a reader" });
      }
      return s;
    }));
    await openRoutineTool(page);
    await page.waitForTimeout(1900);
    const box = page.locator(".os-habit-session");
    const spacing = await box.evaluate(el => {
      const rows = [...el.querySelectorAll(".os-repeated-habit")];
      return { gap: rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom, borders: rows.map(row => getComputedStyle(row).borderBottomWidth), tasks: getComputedStyle(el.querySelector(".os-one-time-tasks")).gap };
    });
    assert.equal(spacing.gap, 8); assert.equal(spacing.tasks, "8px");
    assert.ok(spacing.borders.every(border => border === "0px"), "spacing replaces the dividers");
    await box.evaluate(el => {
      window.routineGrowth = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function(keyframes, options) {
        if (!this.matches(".os-routine-open .os-app-window")) return animate.call(this, keyframes, options);
        const previous = window.routineGrowth.at(-1);
        const call = { keyframes, options, interrupted: Boolean(previous?.cancelRunning), before: previous?.cancelHeight, frames: [] };
        window.routineGrowth.push(call);
        const animation = animate.call(this, keyframes, options), start = performance.now();
        const cancel = animation.cancel.bind(animation);
        animation.cancel = () => {
          call.cancelHeight = this.getBoundingClientRect().height;
          call.cancelRunning = animation.playState === "running";
          cancel();
        };
        const sample = () => {
          const frame = this.getBoundingClientRect(), heading = el.querySelector("#habit-session-title").getBoundingClientRect();
          call.frames.push({ time: performance.now() - start, height: frame.height, page: this.querySelector('.os-app-page.current').getBoundingClientRect().height, anchor: heading.top - frame.top });
          if (animation.playState === "running") requestAnimationFrame(sample);
        };
        sample(); return animation;
      };
      window.newRowMotion = [];
      const observer = new MutationObserver(() => {
        for (const row of el.querySelectorAll(".is-new")) {
          if (window.newRowMotion.some(record => record.row === row)) continue;
          const record = { row, frames: [], timing: row.getAnimations().map(a => a.effect.getTiming()) };
          window.newRowMotion.push(record);
          const start = performance.now();
          const sample = () => {
            record.frames.push({ time: performance.now() - start, opacity: Number(getComputedStyle(row).opacity) });
            if (performance.now() - start < 750 && row.isConnected) requestAnimationFrame(sample);
          };
          sample();
        }
      });
      observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    await box.getByRole("button", { name: "New habit", exact: true }).click();
    // Ensure the next action really interrupts growth even on a slow test host.
    await box.locator('.os-app-window').evaluate(el=>{for(const animation of el.getAnimations())if(animation.effect instanceof KeyframeEffect&&animation.effect.getKeyframes().some(k=>k.height))animation.playbackRate=0.1;});
    await box.getByRole("textbox", { name: "Edit habit: New Habit", exact: true }).fill("A new daily walk");
    // Add another kind of row while the edge is still moving.
    await box.getByRole("button", { name: "Add task", exact: true }).click();
    await box.getByRole("textbox", { name: "Edit task: New Task", exact: true }).fill("Bring a book");
    await page.waitForTimeout(2600);
    const result = await page.evaluate(() => ({ calls: window.routineGrowth, rows: window.newRowMotion.map(({ frames, timing }) => ({ frames, timing })) }));
    console.log("Routine growth and row motion", JSON.stringify(result));
    assert.equal(result.rows.length, 2);
    if (reducedMotion === "reduce") {
      assert.equal(result.calls.length, 0, "reduced motion bypasses JavaScript height animation");
      assert.ok(result.rows.every(row => row.frames.every(frame => frame.opacity === 1)), "new rows are immediately readable");
    } else {
      assert.ok(result.calls.length >= 2, "both additions use the existing growth engine");
      for (const call of result.calls) {
        assert.equal(call.options.duration, 600);
        assert.equal(call.options.easing.replace(/(?<![\d])0\./g, "."), "cubic-bezier(.42, 0, .28, 1)");
        const from = parseFloat(call.keyframes[0].height);
        if (call.interrupted) assert.ok(Math.abs(from - call.before) < 1, "interrupted growth starts at the visible edge");
        assert.ok(call.frames.every(frame => Math.abs(frame.anchor - call.frames[0].anchor) < 1), "heading stays anchored during growth");
        if (call.frames.at(-1).time >= 600) assert.ok(call.frames.some(frame => Math.abs(frame.height-frame.page)>1), "actual intermediate heights are rendered");
      }
      assert.ok(result.calls.some(call => call.interrupted), "rapid additions exercise retargeting");
      const finalGrowth = result.calls.at(-1);
      assert.ok(Math.abs(finalGrowth.frames.at(-1).height - finalGrowth.frames.at(-1).page) < 1, "growth finishes at the live content height without a final snap");
      for (const row of result.rows) {
        assert.ok(row.timing.some(timing => timing.delay === 100 && timing.duration === 500));
        assert.ok(row.frames.some(frame => frame.time < 70 && frame.opacity === 0));
        assert.ok(row.frames.some(frame => frame.opacity > 0 && frame.opacity < 1));
        assert.equal(row.frames.at(-1).opacity, 1);
      }
    }
    await page.reload(); await ready(page);
    await expect(box.getByRole("textbox", { name: "Edit habit: A new daily walk", exact: true })).toHaveValue("A new daily walk");
    await expect(box.getByRole("textbox", { name: "Edit task: Bring a book", exact: true })).toHaveValue("Bring a book");
    await expect(box.locator(".is-new")).toHaveCount(0);
  }, { reducedMotion }));
}

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`Routine small growth and shrink use the full timeline while typing follows directly with ${reducedMotion} motion`, { timeout: 90_000 }, async () => isolated(390, async page => {
    const count = n => page.evaluate(n => window.circle.updateState(s => {
      let next = { ...s, habits: { ...s.habits, definitions: {}, completions: {} } };
      for (let i=0; i<n; i++) {
        const added = window.api.addHabitDefinition(next, `small-${i}`);
        next = window.api.updateHabitDefinitionParts(added.state, added.id, { action: `Read a page ${i}`, cue: "After breakfast", identity: "" });
      }
      return next;
    }), n);
    await count(4); await openRoutineTool(page); await page.waitForTimeout(2100);
    const frame = page.locator(".os-habit-session .os-app-window");
    await page.setViewportSize({ width:390, height:600 });
    await page.waitForTimeout(2100);
    const natural = await frame.evaluate(el => el.getBoundingClientRect().height);
    // Put a real structural addition just above the shared minimum, rather
    // than testing only large lists where every delta already exceeded 40px.
    await page.setViewportSize({ width:390, height:Math.ceil(natural + 182 - 20) });
    await page.waitForTimeout(2100); await count(3); await page.waitForTimeout(2100);
    await frame.evaluate(el => {
      window.smallGrowth = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function(keyframes, options) {
        const animation = animate.call(this, keyframes, options);
        if (this !== el) return animation;
        const start = performance.now(), call = { keyframes, duration:options.duration, frames:[] };
        window.smallGrowth.push(call);
        const sample = () => {
          const r = el.getBoundingClientRect(), heading = el.querySelector("#habit-session-title").getBoundingClientRect();
          call.frames.push({ time:performance.now()-start, height:r.height, anchor:heading.top-r.top });
          if (animation.playState === "running") requestAnimationFrame(sample);
        };
        sample(); return animation;
      };
    });
    await count(4); await page.waitForTimeout(2100);
    await count(3); await page.waitForTimeout(2100);
    const calls = await page.evaluate(() => window.smallGrowth);
    console.log("Small structural height timelines", JSON.stringify(calls.map(call => ({ from:call.keyframes[0].height, to:call.keyframes[1].height, duration:call.duration, samples:call.frames.length, middle:call.frames.find(f => f.time>=900), end:call.frames.at(-1) }))));
    if (reducedMotion === "reduce") assert.equal(calls.length, 0);
    else {
      assert.equal(calls.length, 2, "small expansion and reduction both animate");
      for (const [i,call] of calls.entries()) {
        const from=parseFloat(call.keyframes[0].height), to=parseFloat(call.keyframes[1].height);
        assert.ok(Math.abs(to-from)>1 && Math.abs(to-from)<40, "exercise the former instant path");
        assert.equal(Math.sign(to-from), i===0 ? 1 : -1);
        assert.equal(call.duration,600);
        assert.ok(call.frames.some(f => f.time>150 && f.time<450 && f.height>Math.min(from,to)+0.5 && f.height<Math.max(from,to)-0.5));
        assert.ok(call.frames.every(f => Math.abs(f.anchor-call.frames[0].anchor)<0.5));
        assert.ok(Math.abs(call.frames.at(-1).height-to)<0.5);
      }
    }
    const field=page.getByRole("textbox",{name:"Edit habit: Read a page 0",exact:true});
    await field.focus(); await page.waitForTimeout(2100);
    await page.evaluate(() => { window.smallGrowth=[]; });
    await field.fill("Read and reflect on a little of the world around me each morning. ".repeat(3));
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.smallGrowth.length),0,"actual typing bypasses decorative frame motion");
    const typing=await frame.evaluate(el => ({ frame:el.getBoundingClientRect().height, page:el.querySelector(".os-app-page.current").getBoundingClientRect().height }));
    assert.ok(Math.abs(typing.frame-typing.page)<0.5,"frame follows the caret immediately");
  }, { reducedMotion }));
}

for (const [width, reducedMotion] of [[360, "reduce"], [390, "no-preference"]]) {
  test(`Habit completion hides empty fields and reveals identity without another tap at ${width}px`, { timeout: 120_000 }, async () => isolated(width, async page => {
    await page.evaluate(() => window.circle.updateState(s => {
      for (const [id, action, cue, identity] of [
        ["name-only", "Read ten pages", "", ""],
        ["with-cue", "Walk outside", "After breakfast", ""],
        ["with-identity", "Draw a line", "", "I am creative"],
        ["all-fields", "Read a page", "Before bed", "I am a reader"],
        ["undo-early", "Stretch gently", "", "I move each day"],
      ]) {
        const added = window.api.addHabitDefinition(s, id);
        s = window.api.updateHabitDefinitionParts(added.state, id, { action, cue, identity });
      }
      return s;
    }));
    await openRoutineTool(page);
    const box = page.locator(".os-habit-session");
    for (const action of ["Read ten pages", "Walk outside"]) {
      const row = box.locator(".os-repeated-habit").filter({ has: page.getByRole("textbox", { name: `Edit habit: ${action}`, exact: true }) });
      const field = row.getByRole("textbox", { name: `Edit habit: ${action}`, exact: true }), original = await field.elementHandle();
      const geometry = await field.evaluate(el => { const r = el.closest("article").getBoundingClientRect(), t = el.getBoundingClientRect(), s = getComputedStyle(el); return { x: t.x-r.x, y: t.y-r.y, size: s.fontSize, weight: s.fontWeight }; });
      await row.getByRole("button", { name: `Mark done: ${action}`, exact: true }).click();
      await expect(row).toHaveClass(/completed/); await expect(row).not.toHaveClass(/is-editing/);
      await expect(row.locator(".os-habit-identity-edit")).toBeHidden();
      if (action === "Read ten pages") await expect(row.locator(".os-habit-cue-edit")).toBeHidden();
      else await expect(row.locator(".os-habit-cue-edit")).toHaveValue("After breakfast");
      assert.equal(await field.evaluate((el, prior) => el === prior, original), true, "unchanged words retain their original element");
      const after = await field.evaluate(el => { const r = el.closest("article").getBoundingClientRect(), t = el.getBoundingClientRect(), s = getComputedStyle(el); return { x: t.x-r.x, y: t.y-r.y, size: s.fontSize, weight: s.fontWeight }; });
      assert.deepEqual(after, geometry, "unchanged words keep their position and font");
      await expect(row.locator(".os-habit-action-copy")).toHaveCSS("opacity", "1");
      await expect(field).toHaveCSS("color", "rgb(241, 239, 232)");
      await expect(row.locator(".os-habit-identity-copy")).toHaveCount(0);
      await expect(row.getByRole("textbox", { name: `Edit habit: ${action}`, exact: true })).toHaveCSS("text-decoration-line", "none");
    }
    for (const [action, identity] of [["Draw a line", "I am creative"], ["Read a page", "I am a reader"]]) {
      const row = box.locator(".os-repeated-habit").filter({ has: page.getByRole("textbox", { name: `Edit habit: ${action}`, exact: true }) });
      const field = row.getByRole("textbox", { name: `Edit habit: ${action}`, exact: true });
      await field.focus();
      await row.getByRole("button", { name: `Mark done: ${action}`, exact: true }).click();
      const copy = row.getByRole("button", { name: `Edit habit behind: ${identity}`, exact: true });
      await expect(copy).toHaveCSS("opacity", "1", { timeout: 8_000 });
      await expect(copy).toHaveCSS("clip-path", "none");
      await expect.poll(() => copy.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBe(0);
      const timing = await copy.evaluate(el => getComputedStyle(el).transitionDuration);
      if (reducedMotion === "reduce") assert.ok(timing.split(",").every(value => parseFloat(value) <= 0.001));
      else assert.equal(timing, "0.3s");
      await copy.click(); await expect(row.locator(".os-habit-identity-edit")).toBeFocused();
      await row.getByRole("button", { name: `Undo: ${action}`, exact: true }).click();
      await expect(row.locator(".os-habit-copy-swap")).not.toHaveClass(/show-identity/);
    }
    const early = box.locator(".os-repeated-habit").filter({ has: page.getByRole("textbox", { name: "Edit habit: Stretch gently", exact: true }) });
    await early.getByRole("button", { name: "Mark done: Stretch gently", exact: true }).click();
    await expect(early.getByRole("button", { name: "Undo: Stretch gently", exact: true })).toHaveAttribute("aria-busy", "false");
    await early.getByRole("button", { name: "Undo: Stretch gently", exact: true }).click();
    await box.getByRole("button", { name: "Mark done: Draw a line", exact: true }).click();
    await page.waitForTimeout(4_200);
    await expect(early.locator(".os-habit-copy-swap")).not.toHaveClass(/show-identity/);
    await expect.poll(() => page.evaluate(async () => (await window.api.loadCircleState(window.api.getAccountScope())).habits.completions[window.api.getDateKey() + ":name-only"]?.completed)).toBe(true);
    await page.reload(); await ready(page);
    await expect(box.getByRole("button", { name: "Undo: Read ten pages", exact: true })).toBeVisible();
    const restoredIdentity = box.getByRole("button", { name: "Edit habit behind: I am creative", exact: true });
    await expect(restoredIdentity).toHaveCSS("opacity", "1");
    await expect(restoredIdentity).toHaveCSS("clip-path", "none");
    await expect(restoredIdentity.locator("..")).toHaveClass(/is-immediate/);
    for (const emptyCue of await box.locator('.os-repeated-habit.completed .os-habit-cue-edit[data-empty="true"]').all()) await expect(emptyCue).toBeHidden();
    await box.screenshot({ path: `outputs/habit-completion-refined-${width}.png` });
  }, { reducedMotion }));
}

test("Routine full-page touch switching pauses hidden writing and removes Focus without deleting its value", { timeout: 90_000 }, async () => isolated(390, async (page, context) => {
  const writingFace = () => page.locator(".os-checkin-session .os-app-page.current").evaluate(el => el.firstElementChild.className);
  const writingIndex = await writingFace();
  await openRoutineTool(page);
  const box = page.locator(".os-habit-session"), touch = await context.newCDPSession(page);
  async function swipe(forward) {
    const rect = await box.boundingBox(), start = forward ? rect.x + rect.width - 20 : rect.x + 20;
    const y = rect.y + 85;
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
    for (let n = 1; n <= 6; n++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (forward ? -1 : 1) * n * 30, y }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await swipe(true); await expect(box.locator(".os-app-page.current .os-protocol-home")).toBeVisible(); await logSettled(box);
  await swipe(false); await expect(box.locator(".os-app-page.current .os-routine-body")).toBeVisible(); await logSettled(box);
  await page.clock.fastForward(31_000);
  assert.equal(await writingFace(), writingIndex);
  await box.getByRole("button", { name: "Record", exact: true }).click(); await logSettled(box);
  await expect(box.locator(".os-routine-focus")).toHaveCount(0);
  await expect(box.getByRole("textbox", { name: "Routine identity", exact: true })).toHaveCount(0);
  await touch.detach();
}, { clock: true }));

for (const [width, height] of [[360, 667], [390, 844]]) {
  test(`Routine redesign keeps editing, completion, Protocol and reload at ${width}px`, { timeout: 120_000 }, async () => isolated(width, async (page, context) => {
    await openRoutineTool(page);
    const box = page.locator(".os-habit-session");
    const metrics = await box.locator(".os-page-layout").evaluate(el => {
      const s = getComputedStyle(el), buttons = [...el.querySelectorAll(".os-page-header button")];
      const textTops = buttons.map(button => { const range = document.createRange(); range.selectNodeContents(button); return range.getBoundingClientRect().top; });
      return { padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft], textTops };
    });
    assert.deepEqual(metrics.padding, ["24px", "24px", "24px", "24px"]);
    assert.ok(Math.abs(metrics.textTops[0] - metrics.textTops[1]) < 0.5, "Header words align");
    await expect(box.getByRole("button", { name: "New habit", exact: true })).toHaveCSS("height", "52px");
    await expect(box.getByRole("button", { name: "New habit", exact: true })).toHaveCSS("font-size", "18px");
    await expect(page.locator(".os-nav")).toBeHidden();
    for (const name of ["Habits", "Tasks"]) {
      const heading = box.getByRole("heading", { name, exact: true });
      await expect(heading).toHaveCSS("font-size", "28px");
      await expect(heading).toHaveCSS("font-weight", "700");
      await expect(heading).toHaveCSS("text-transform", "none");
      await expect(heading).toHaveCSS("color", "rgb(241, 239, 232)");
    }
    await expect(box.getByRole("button", { name: "New habit", exact: true })).toBeVisible();
    await expect(box.getByRole("button", { name: "Add task", exact: true })).toBeVisible();
    await box.getByRole("button", { name: "New habit", exact: true }).click();
    await box.getByRole("textbox", { name: "Edit habit: New Habit", exact: true }).fill("Read ten pages");
    await box.getByRole("textbox", { name: "When you do it: Read ten pages", exact: true }).fill("After breakfast");
    await box.getByRole("button", { name: "New habit", exact: true }).focus();
    await box.getByRole("button", { name: "Add task", exact: true }).click();
    const focused = box.getByRole("textbox", { name: "Edit task: New Task", exact: true });
    await expect(focused).toBeFocused();
    const editorStyle = await focused.evaluate(el => { const s = getComputedStyle(el); return { background: s.backgroundColor, border: s.borderWidth, outline: s.outlineStyle, shadow: s.boxShadow }; });
    assert.deepEqual(editorStyle, { background: "rgba(0, 0, 0, 0)", border: "0px", outline: "none", shadow: "none" });
    await box.getByRole("textbox", { name: "Edit task: New Task", exact: true }).fill("Update my CV");
    await box.getByRole("button", { name: "Add task", exact: true }).focus();
    await box.getByRole("button", { name: "Mark done: Read ten pages", exact: true }).click();
    const done = box.getByRole("button", { name: "Undo: Read ten pages", exact: true });
    await expect(done).toHaveAttribute("aria-pressed", "true");
    await expect(done.locator('.os-checkbox-mark')).toHaveCSS('opacity','1');
    await expect(done.locator('.os-checkbox-liquid')).toHaveCSS('background-color','rgb(227, 107, 55)');
    await expect(done.locator('.os-checkbox-face')).toHaveCSS('width','28px');
    const hit = await done.boundingBox();
    assert.ok(hit.width >= 44 && hit.height >= 44);
    await expect(done).toHaveAttribute("aria-busy", "false");
    await done.click();
    await expect(box.getByRole("button", { name: "Mark done: Read ten pages", exact: true })).toBeVisible();
    await box.getByRole("button", { name: "Complete task: Update my CV", exact: true }).click();
    await expect.poll(() => page.evaluate(() => Object.values(window.circle.state.tasks.items).find(t => t.text === "Update my CV")?.status)).toBe("completed");
    await box.getByRole("button", { name: "Record", exact: true }).click();
    await expect(box).not.toHaveClass(/os-app-flip/);
    await expect(box.getByRole("button", { name: "Undo task: Update my CV", exact: true })).toBeVisible();
    await box.getByRole("button", { name: "Undo task: Update my CV", exact: true }).click();
    await box.getByRole("button", { name: "Back", exact: true }).click();
    await expect(box).not.toHaveClass(/os-app-flip/);
    await box.screenshot({ path: `outputs/routine-design-${width}.png` });
    const layout = await box.evaluate(el => ({ height: el.getBoundingClientRect().height, overflow: el.scrollWidth > el.clientWidth + 1,
      scrollers: [...el.querySelectorAll("*")].filter(n => ["auto", "scroll"].includes(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1).length }));
    assert.equal(layout.overflow, false); assert.equal(layout.scrollers, 0); console.log("Routine design", width, layout);
    await box.getByRole("button", { name: "Back", exact: true }).click();
    await openRoutineTool(page, "Protocol");
    await box.getByRole("button", { name: "Start a phase", exact: true }).click();
    await expect(box.getByRole("button", { name: "Add one non-negotiable", exact: true })).toBeDisabled();
    await box.getByRole("button", { name: "Back", exact: true }).click();
    assert.equal(await page.evaluate(() => window.api.protocolPhaseRecords(window.circle.state).length), 0, "discarded draft creates no past phase");
    await box.getByRole("button", { name: "Start a phase", exact: true }).click();
    await box.getByRole("textbox", { name: "Protocol name", exact: true }).fill("Monk Mode");
    await expect(box.getByRole("group", { name: "How many days" }).getByRole("button")).toHaveCount(5);
    await box.getByRole("button", { name: "Add a non-negotiable", exact: true }).click();
    await box.locator(".os-protocol-block-edit").fill("Walk outside");
    await box.getByRole("button", { name: "Begin 7 days", exact: true }).click();
    await expect(box.getByRole("button", { name: "Completed today", exact: true })).toHaveCount(0);
    await box.getByRole("button", { name: "Keep: Walk outside", exact: true }).click();
    await expect(box.getByRole("button", { name: "Completed today", exact: true })).toBeVisible();
    await expect(box.getByRole("button", { name: "Completed today", exact: true })).toHaveCSS("border-radius","12px");
    await expect.poll(()=>box.getByRole("button", { name: "Completed today", exact: true }).evaluate(el=>el.getBoundingClientRect().height)).toBe(52);
    await logSettled(box);
    assert.deepEqual(await box.locator(".os-protocol-term-row .os-checkbox-face").evaluate(el => ({rim:el.getBoundingClientRect().width,fill:getComputedStyle(el.querySelector('.os-checkbox-liquid')).width,shape:getComputedStyle(el.querySelector('.os-checkbox-liquid')).borderRadius})),{rim:28,fill:"22px",shape:"50%"});
    await box.screenshot({ path: `outputs/protocol-design-${width}.png` });
    await context.setOffline(true);
    await box.getByRole("button", { name: "Completed today", exact: true }).click();
    await expect(box).toContainText("Day 1 of 7 kept");
    await expect.poll(() => page.evaluate(async () => Object.keys((await window.api.loadCircleState(window.api.getAccountScope())).protocol.seals).length)).toBe(1);
    await context.setOffline(false); await page.reload(); await ready(page);
    await expect(page.locator(".os-routine-open")).toBeVisible();
    await expect(box.getByRole("button", { name: "Completed today", exact: true })).toHaveCount(0);
    await box.getByRole("button", { name: "Phases", exact: true }).click();
    await expect(box.locator(".os-protocol-standing")).toHaveCount(0);
    await box.locator(".os-protocol-past-head").click();
    await expect(box.locator(".os-protocol-home")).not.toHaveClass(/os-app-flip/);
    await box.screenshot({ path: `outputs/phases-design-${width}.png` });
    await box.getByRole("button", { name: "Back", exact: true }).click();
    await expect(box.locator(".os-protocol-title-row")).toBeVisible();
    await expect(box.locator(".os-protocol")).not.toHaveClass(/os-app-flip/);
    await box.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.locator(".os-today-previews")).toBeVisible();
    await openRoutineTool(page);
    await page.goBack();
    await expect(page.locator(".os-today-previews")).toBeVisible();
  }, { height, reducedMotion: width === 390 ? "no-preference" : "reduce" }));
}

for (const width of [360, 390]) test(`Bundled Chapters stay retired after reload at ${width}px`, { timeout: 90_000 }, () => isolated(width, async page => {
  await page.evaluate(async () => {
    const api = window.api;
    const scope = api.getAccountScope();
    const state = api.createEmptyState();
    const definition = api.publishedChapters.find(chapter => chapter.id === "day-one" && chapter.version === 3);
    const run = { ...api.createChapterRun(definition), status: "in-progress" };
    state.chapters.runs[run.runId] = run;
    localStorage.setItem(api.accountStorageKey(scope, "circle-os-pinned-door"), "week-review");
    await api.saveCircleState(scope, state);
  });
  await page.reload();
  await ready(page);
  await expect(page.locator(".os-splash, .os-checkin-session[aria-label='Check-in chapter']")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => Object.keys(window.circle.state.chapters.runs))).toEqual([]);
  await openRoutineTool(page, "Protocol");
  await expect(page.getByRole("button", { name: "Start a phase" })).toBeVisible();
  await page.evaluate(() => window.navigate("/os?launch-fixture=1"));
  await expect(page).toHaveURL(/\/os\/home$/);
  await page.evaluate(() => window.navigate("/os/mirror"));
  await ready(page);
  await expect(page.getByRole("region", { name: "Quests", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Set up", exact: true }).first().click();
  await expect(page.getByRole("textbox", { name: /^Edit / }).first()).toBeVisible();
}));

async function installSyncFixture(page) {
  await page.evaluate(()=>{
    window.syncSave=async(body,entryId=null)=>{
      const a=window.api,scope=a.getAccountScope(),state=await a.loadWritingState(scope),entry=state.entries[entryId],at=new Date().toISOString();
      const draft={id:crypto.randomUUID(),entryId:entry?.id||crypto.randomUUID(),kind:"note",source:null,
        startedAt:entry?.startedAt||at,attribution:a.writingAttribution(at,"Asia/Bangkok"),
        baseVersionId:entry?.currentVersionId||null,baseGeneration:entry?.generation||0,content:{title:"",body,tags:[]}};
      await a.commitWritingOperation(scope,{owner:state.owner,at,operationId:crypto.randomUUID(),type:"write-draft",draft,expectedDraftVersion:0});
      const command={owner:state.owner,at,operationId:crypto.randomUUID(),type:"save",draft:{...draft,version:1}};
      window.lastSyncCommand=command;
      return a.commitWritingOperation(scope,command);
    };
    // Synthetic receipt only. No authenticated transport is enabled by this test.
    window.syncReceipt=change=>({owner:change.owner,operationId:change.operationId,entryId:change.entryId,
      fingerprint:change.fingerprint,generation:change.generation,receiptId:crypto.randomUUID(),serverVersion:change.sequence});
  });
}

for(const width of [360,390])test(`durable writing sync queue survives offline edits, old acknowledgements and reload at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  await installSyncFixture(page);await context.setOffline(true);
  const saved=await page.evaluate(()=>window.syncSave("First synthetic saved words"));
  const first=await page.evaluate(async()=>Object.values((await window.api.loadWritingSyncState(window.api.getAccountScope())).pending)[0]);
  await page.evaluate(entryId=>window.syncSave("Newer synthetic saved words",entryId),saved.receipt.entryId);
  const snapshot=await page.evaluate(async()=>JSON.stringify(await window.api.loadWritingState(window.api.getAccountScope())));
  await page.evaluate(async change=>{
    const a=window.api,scope=a.getAccountScope(),receipt=window.syncReceipt(change);
    window.lastSyncAck=receipt;
    const before=await a.loadWritingSyncState(scope);
    await a.acknowledgeWritingSync(scope,[receipt]);
    await a.acknowledgeWritingSync(scope,[receipt]);
    const after=await a.loadWritingSyncState(scope);
    if(Object.keys(before.pending).length!==2||Object.keys(after.pending).length!==1)throw Error("An older ack retired the newer save");
  },first);
  assert.equal(await page.evaluate(async()=>JSON.stringify(await window.api.loadWritingState(window.api.getAccountScope()))),snapshot);
  await context.setOffline(false);await page.reload();await ready(page);
  const stored=await page.evaluate(async()=>({writing:await window.api.loadWritingState(window.api.getAccountScope()),sync:await window.api.loadWritingSyncState(window.api.getAccountScope())}));
  assert.equal(Object.keys(stored.sync.pending).length,1);assert.equal(Object.keys(stored.sync.acknowledgements).length,1);
  assert.equal(stored.writing.entries[saved.receipt.entryId].versions.at(-1).content.body,"Newer synthetic saved words");
  assert.equal(JSON.stringify(stored.sync).includes("synthetic saved words"),false);
  await context.setOffline(true);
  await page.getByRole("button",{name:"History",exact:true}).first().click();
  await logSettled(page.locator(".os-note-page"));
  await page.locator(".os-note-page").getByRole("button",{name:/^Untitled/}).click();
  await logSettled(page.locator(".os-note-page"));
  await expect(page.locator(".os-note-page").getByRole("textbox",{name:"Write a note",exact:true})).toHaveValue("Newer synthetic saved words");
  await context.setOffline(false);
},{height:width===360?667:844,reducedMotion:width===390?"no-preference":"reduce"}));

test("durable writing sync transaction failures retain the draft and retry atomically",{timeout:90_000},async()=>isolated(390,async page=>{
  await installSyncFixture(page);
  const result=await page.evaluate(async()=>{
    const a=window.api,scope=a.getAccountScope(),nativePut=IDBObjectStore.prototype.put;
    let failure="sync-v1";
    IDBObjectStore.prototype.put=function(value,key){if(key===failure&&Object.keys(value.pending||{}).length)throw new DOMException("Synthetic quota failure","QuotaExceededError");return nativePut.call(this,value,key);};
    try { await window.syncSave("Recover this synthetic draft");throw Error("Expected failure"); }
    catch(error){if(!error.message.includes("Synthetic quota failure"))throw error;}
    finally{IDBObjectStore.prototype.put=nativePut;}
    const before=await a.loadWritingState(scope),queue=await a.loadWritingSyncState(scope);
    const draft=Object.values(before.drafts)[0];
    if(Object.keys(before.entries).length||Object.keys(queue.pending).length||draft.status!=="active")throw Error("Partial transaction survived");
    const command=window.lastSyncCommand;
    // Failure of the other write must leave the same recovered draft too.
    failure="records";IDBObjectStore.prototype.put=function(value,key){if(key===failure)throw new DOMException("Synthetic quota failure","QuotaExceededError");return nativePut.call(this,value,key);};
    try {await a.commitWritingOperation(scope,command);throw Error("Expected failure");}
    catch(error){if(!error.message.includes("Synthetic quota failure"))throw error;}
    finally{IDBObjectStore.prototype.put=nativePut;}
    const afterFailure=await a.loadWritingState(scope);
    if(JSON.stringify(before)!==JSON.stringify(afterFailure))throw Error("Failed save changed writing");
    // Both put requests may succeed before the transaction itself is aborted.
    IDBObjectStore.prototype.put=function(value,key){const request=nativePut.call(this,value,key);if(key==="sync-v1")request.addEventListener("success",()=>this.transaction.abort(),{once:true});return request;};
    let aborted=false;
    try {await a.commitWritingOperation(scope,command);}
    catch{aborted=true;}
    finally{IDBObjectStore.prototype.put=nativePut;}
    if(!aborted||JSON.stringify(before)!==JSON.stringify(await a.loadWritingState(scope))||Object.keys((await a.loadWritingSyncState(scope)).pending).length)throw Error("Request success was mistaken for transaction commit");
    await a.commitWritingOperation(scope,command);await a.commitWritingOperation(scope,command);
    const accepted=await a.loadWritingSyncState(scope),change=Object.values(accepted.pending)[0],receipt=window.syncReceipt(change);
    failure="sync-v1";IDBObjectStore.prototype.put=function(value,key){if(key===failure)throw new DOMException("Synthetic quota failure","QuotaExceededError");return nativePut.call(this,value,key);};
    try {await a.acknowledgeWritingSync(scope,[receipt]);throw Error("Expected failure");}
    catch(error){if(!error.message.includes("Synthetic quota failure"))throw error;}
    finally{IDBObjectStore.prototype.put=nativePut;}
    const failedAck=await a.loadWritingSyncState(scope);
    if(JSON.stringify(accepted)!==JSON.stringify(failedAck))throw Error("Failed ack retired pending work");
    await a.acknowledgeWritingSync(scope,[receipt]);
    return {before,accepted,final:await a.loadWritingSyncState(scope),writing:await a.loadWritingState(scope)};
  });
  assert.equal(Object.keys(result.accepted.pending).length,1);
  assert.equal(Object.keys(result.final.pending).length,0);
  assert.equal(Object.keys(result.final.acknowledgements).length,1);
  assert.equal(Object.values(result.writing.entries)[0].versions.length,1);
}));

test("durable writing sync rejects account-switched and logged-out acknowledgements",{timeout:90_000},async()=>isolated(390,async page=>{
  await installSyncFixture(page);await page.evaluate(()=>window.syncSave("Account A words"));
  const result=await page.evaluate(async()=>{
    const a=window.api,scope=a.getAccountScope(),queue=await a.loadWritingSyncState(scope),receipt=window.syncReceipt(Object.values(queue.pending)[0]);
    let rejected=0;
    for(const target of ["synthetic-sync-b",null]){
      const current=a.getAccountScope(),nativeGet=IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get=function(key){const request=nativeGet.call(this,key);if(key==="sync-v1")request.addEventListener("success",()=>a.activateAccountScope(target),{once:true});return request;};
      try {await a.acknowledgeWritingSync(current,[receipt]);}
      catch{rejected++;}
      finally{IDBObjectStore.prototype.get=nativeGet;}
      if(target){const other=await a.loadWritingSyncState(a.getAccountScope());if(Object.keys(other.pending).length||Object.keys(other.acknowledgements).length)throw Error("Cross-account sync data");}
      a.activateAccountScope("synthetic-writer-a");
    }
    const active=a.getAccountScope();
    try{await a.acknowledgeWritingSync(scope,[receipt]);}catch{rejected++;}
    const before=JSON.stringify(await a.loadWritingSyncState(active));
    try{await a.acknowledgeWritingSync(active,[{...receipt,owner:"account:synthetic-sync-b"}]);}catch{rejected++;}
    const after=await a.loadWritingSyncState(active);
    if(before!==JSON.stringify(after))throw Error("Rejected acknowledgement changed queue");
    return {rejected,after};
  });
  assert.equal(result.rejected,4);assert.equal(Object.keys(result.after.pending).length,1);assert.equal(Object.keys(result.after.acknowledgements).length,0);
}));

test("durable writing sync serializes competing same-account tabs",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await installSyncFixture(page);
  const other=await context.newPage();await open(other);await other.evaluate(()=>window.api.mount());await ready(other);await installSyncFixture(other);
  await Promise.all([page.evaluate(()=>window.syncSave("First tab words")),other.evaluate(()=>window.syncSave("Second tab words"))]);
  const before=await page.evaluate(async()=>window.api.loadWritingSyncState(window.api.getAccountScope()));
  const changes=Object.values(before.pending).sort((a,b)=>a.sequence-b.sequence);
  assert.equal(changes.length,2);assert.deepEqual(changes.map(c=>c.sequence),[1,2]);
  await Promise.all([page.evaluate(change=>window.api.acknowledgeWritingSync(window.api.getAccountScope(),[window.syncReceipt(change)]),changes[0]),other.evaluate(()=>window.syncSave("Third tab change"))]);
  const stored=await other.evaluate(async()=>({writing:await window.api.loadWritingState(window.api.getAccountScope()),sync:await window.api.loadWritingSyncState(window.api.getAccountScope())}));
  assert.equal(Object.keys(stored.writing.entries).length,3);assert.equal(Object.keys(stored.sync.pending).length,2);assert.equal(Object.keys(stored.sync.acknowledgements).length,1);
  await other.close();
}));

async function seedLogHistory(page) {
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api,at="2020-01-02T10:00:00Z";
    for(const key of ["2020-01-01","2026-01-01"]){s=a.ensureDay(s,key);s.days[key]={...s.days[key],title:key==="2020-01-01"?"Old market day":"",timeBlocks:[
      {id:key+"-late",start:"05:30",end:"06:00",activity:"",note:"Legacy midnight moment",createdAt:at},
      {id:key+"-early",start:"08:15",end:"09:00",activity:"Saved walk",title:"Saved walk",moments:["A small saved moment"],note:"",createdAt:at},
    ]};}
    s=a.ensureDay(s,"2021-01-01");
    for(let n=1;n<=18;n++){const key=`2025-01-${String(n).padStart(2,"0")}`;s=a.ensureDay(s,key);s.days[key].title="Synthetic recorded day "+n;}
    return s;
  }));
  if(!await page.locator(".os-log-open").isVisible()) await page.getByRole("button",{name:"Log",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.circle.state.days["2020-01-01"]?.timeBlocks.length)).toBe(2);
  await expect.poll(()=>page.evaluate(async()=>Boolean((await window.api.loadCircleState(window.api.getAccountScope()))?.days?.["2020-01-01"]))).toBe(true);
}
async function logSettled(box) {
  await expect(box).not.toHaveClass(/os-app-flip/);
  await expect(box.locator('.os-app-flip')).toHaveCount(0);
  await box.evaluate(async el=>{for(let i=0;i<3;i++){await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})));}});
}
for(const [width,height]of[[360,667],[390,844]])test(`Log history reads all recorded days without writing at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  await seedLogHistory(page);const box=page.locator(".os-log-session");await box.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>JSON.stringify({days:window.circle.state.days,queue:window.circle.state.outbox,evidence:window.circle.state.evidence}));
  const todayTitle=box.getByRole("textbox",{name:"What this day is called",exact:true});
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);
  const list=box.getByLabel("Recorded Log days");await expect(list.locator("button")).toHaveCount(20);
  await expect.poll(()=>box.evaluate(el=>{const page=el.querySelector(".os-page-layout"),header=page.querySelector(".os-page-header-left"),heading=page.querySelector(".os-page-heading");return heading.getBoundingClientRect().top-header.getBoundingClientRect().bottom;})).toBe(24);
  await expect(list.locator("button").first()).toContainText("2026-01-01");await expect(list).not.toContainText("2021-01-01");
  const old=list.getByRole("button",{name:"Old market day 2020-01-01",exact:true});await old.scrollIntoViewIfNeeded();
  const touch=await old.boundingBox();assert.ok(touch.width>=44&&touch.height>=44);
  await old.click();await logSettled(box);await expect(box.getByRole("heading",{name:"Old market day",exact:true})).toBeVisible();
  const timeline=box.getByLabel("Log for 2020-01-01");await expect(timeline.locator("article")).toHaveCount(2);
  await expect(timeline.locator("article").first()).toContainText("08:15");await expect(timeline).toContainText("05:30");await expect(timeline).toContainText("Legacy midnight moment");await expect(timeline).toContainText("A small saved moment");
  await expect(box.locator("input,textarea,form")).toHaveCount(0);await expect(box.getByRole("button",{name:"Now",exact:true})).toHaveCount(0);await expect(timeline).not.toContainText("Wake up");
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(timeline).toBeVisible();
  const metrics=await box.evaluate(el=>({width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(node=>["auto","scroll"].includes(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1).length}));assert.ok(metrics.scrollWidth<=metrics.width+1);assert.equal(metrics.scrollers,0);
  await box.screenshot({path:`outputs/log-history-day-${width}.png`});
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await expect(list.locator("button")).toHaveCount(20);
  await list.getByRole("button",{name:"Synthetic recorded day 18 2025-01-18",exact:true}).click();await logSettled(box);await expect(box).toContainText("No activities recorded.");
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);
  assert.equal(await page.evaluate(()=>JSON.stringify({days:window.circle.state.days,queue:window.circle.state.outbox,evidence:window.circle.state.evidence})),before,"browsing changes no records or queue");
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await expect(todayTitle).toBeVisible();await expect(box.getByRole("button",{name:"History",exact:true})).toBeVisible();
  await page.reload();await ready(page);await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await expect(list.locator("button")).toHaveCount(20);
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await box.locator(".os-timeline article .os-add-moment").first().click();await expect(box.getByRole("textbox",{name:/Main activity at/})).toBeVisible();
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Log history is empty for another account and reads offline after reload",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await seedLogHistory(page);const box=page.locator(".os-log-session");await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);
  await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await expect(box).toContainText("Legacy midnight moment");
  await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-log-b");await window.api.saveCircleState(scope,window.api.fixture());});await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-log-b");
  await expect(box).not.toContainText("Old market day");await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await expect(box).toContainText("No past days recorded yet.");
  await expect(box.getByLabel("Recorded Log days").locator("button")).toHaveCount(0);
  await page.evaluate(()=>window.api.activateAccountScope("synthetic-writer-a"));await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-writer-a");
  // Reload through the local harness, then take the browser offline to read.
  await page.reload();await ready(page);await context.setOffline(true);
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await expect(box.getByLabel("Recorded Log days").locator("button")).toHaveCount(20);
  await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await expect(box).toContainText("Saved walk");
  await context.setOffline(false);
}));

test("Log history grows for long days, resizes and returns to the existing Week Page",{timeout:90_000},async()=>isolated(360,async page=>{
  await seedLogHistory(page);
  await page.evaluate(()=>window.circle.updateState(s=>({...s,days:{...s.days,"2026-01-01":{...s.days["2026-01-01"],timeBlocks:Array.from({length:24},(_,index)=>({id:"long-"+index,start:String((index+6)%24).padStart(2,"0")+":00",end:String((index+7)%24).padStart(2,"0")+":00",activity:"A saved activity with enough words to wrap comfortably on a phone "+index,note:"",moments:["A saved moment "+index],createdAt:"2026-01-02T10:00:00Z"}))}}})));
  if(!await page.locator(".os-log-open").isVisible()) await page.getByRole("button",{name:"Log",exact:true}).click();
  const box=page.locator(".os-log-session");await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).focus();await page.keyboard.press("Enter");await logSettled(box);
  await box.getByLabel("Recorded Log days").getByRole("button",{name:"Thursday 2026-01-01",exact:true}).tap();await logSettled(box);
  const timeline=box.getByLabel("Log for 2026-01-01");await expect(timeline.locator("article")).toHaveCount(24);await timeline.locator("article").last().scrollIntoViewIfNeeded();await expect(timeline.locator("article").last()).toContainText("A saved moment 23");
  for(const width of [360,390]){await page.setViewportSize({width,height:667});await logSettled(box);const metrics=await box.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(node=>["auto","scroll"].includes(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1).length}));assert.ok(metrics.height>480);assert.equal(metrics.scrollers,0);assert.ok(metrics.scrollWidth<=metrics.width+1);console.log("Log long day",width,JSON.stringify(metrics));}
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(box.locator(".os-log-week")).toBeVisible();
}));

async function openPastLog(page) {
  await seedLogHistory(page);const box=page.locator(".os-log-session");await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);
  await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await logSettled(box);return box;
}

async function openWeekHistory(page) {
  await page.evaluate(()=>window.circle.updateState(s=>window.api.normalizeState({...s,
    weeks:{...s.weeks,"2020-01-06":{weekKey:"2020-01-06",kept:false,fed:"mind",moved:"A saved small start",blocked:"Late nights",keep:"The morning walk",reviewedAt:"2020-01-12T14:00:00Z"}},
    goals:{items:{...s.goals.items,old:{id:"old",scope:"week",dateKey:"2020-01-06",text:"An old weekly goal",status:"done",createdAt:"2020-01-06T01:00:00Z"},unreviewed:{id:"unreviewed",scope:"week",dateKey:"2020-01-13",text:"An unreviewed goal",status:"open",createdAt:"2020-01-13T01:00:00Z"}},steps:{...s.goals.steps,oldstep:{id:"oldstep",goalId:"old",taskId:"oldtask",dateKey:"2020-01-07",createdAt:"2020-01-06T01:00:00Z"}}},
    tasks:{...s.tasks,items:{...s.tasks.items,oldtask:{id:"oldtask",text:"A saved linked step",status:"archived",createdAt:"2020-01-06T01:00:00Z",updatedAt:"2020-01-08T01:00:00Z"}}}
  })));
  await page.getByRole("button",{name:"Log",exact:true}).click();
  const box=page.locator(".os-log-session");await box.getByRole("button",{name:"Open Week",exact:true}).click();
  await expect(box.locator('.os-week-overview')).toBeVisible();await logSettled(box);
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);
  await box.locator('.os-week-saved-weeks > summary').click();
  return box;
}
for(const [width,height] of [[360,667],[390,844]])test(`Week history reads saved goals and reviews without writes at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  const box=await openWeekHistory(page),list=box.getByLabel("Recorded weeks");
  await expect(list.locator("button")).toHaveCount(2);await expect(list.locator("button").first()).toHaveText("Week of 2020-01-13");
  const before=await page.evaluate(()=>JSON.stringify({goals:window.circle.state.goals,tasks:window.circle.state.tasks,weeks:window.circle.state.weeks,chapters:window.circle.state.chapters,protocol:window.circle.state.protocol,outbox:window.circle.state.outbox,evidence:window.circle.state.evidence}));
  const older=list.getByRole("button",{name:"Week of 2020-01-06",exact:true});const hit=await older.boundingBox();assert.ok(hit.width>=44&&hit.height>=44);
  await older.focus();await page.keyboard.press("Enter");await logSettled(box);
  const detail=box.getByLabel("Saved week 2020-01-06");await expect(detail).toContainText("An old weekly goal");await expect(detail).toContainText("A saved linked step");await expect(detail).toContainText("Archived");await expect(detail).toContainText("2020-01-07");await expect(detail).toContainText("A saved small start");await expect(detail.locator("time")).toHaveAttribute("datetime","2020-01-12T14:00:00Z");await expect(detail.locator("time")).toContainText("Jan 12, 2020");
  await expect(box.locator("input,textarea,form")).toHaveCount(0);
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(detail).toBeVisible();
  await box.screenshot({path:`outputs/week-history-${width}.png`});
  const metrics=await box.evaluate(el=>{const p=el.querySelector(".os-page-layout"),header=p.querySelector(".os-page-header-left"),heading=p.querySelector(".os-page-heading");return {gap:heading.getBoundingClientRect().top-header.getBoundingClientRect().bottom,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length};});assert.equal(metrics.gap,24);assert.ok(metrics.scrollWidth<=metrics.width+1);assert.equal(metrics.scrollers,0);console.log("Week history metrics",width,metrics);
  await box.getByRole("button",{name:"History",exact:true}).tap();await logSettled(box);await box.locator('.os-week-saved-weeks > summary').click();await list.getByRole("button",{name:"Week of 2020-01-13",exact:true}).tap();await logSettled(box);await expect(box).toContainText("No review saved.");
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await box.getByRole("button",{name:"Week",exact:true}).click();await logSettled(box);await expect(box.getByRole("button",{name:"+ Add goal",exact:true})).toBeVisible();
  assert.equal(await page.evaluate(()=>JSON.stringify({goals:window.circle.state.goals,tasks:window.circle.state.tasks,weeks:window.circle.state.weeks,chapters:window.circle.state.chapters,protocol:window.circle.state.protocol,outbox:window.circle.state.outbox,evidence:window.circle.state.evidence})),before);
  await page.reload();await ready(page);await expect(box.getByRole("button",{name:"History",exact:true})).toBeVisible();await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await expect(list.locator("button")).toHaveCount(2);
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Week history closes on account switch and reads offline",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  const box=await openWeekHistory(page);await context.setOffline(true);await box.getByRole("button",{name:"Week of 2020-01-06",exact:true}).click();await expect(box).toContainText("A saved small start");await context.setOffline(false);
  await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-week-b");await window.api.saveCircleState(scope,window.api.fixture());});await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-week-b");
  await expect(box).not.toContainText("An old weekly goal");await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(box.getByRole("button",{name:"History",exact:true})).toBeVisible();await logSettled(box);await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await expect(box).toContainText("No past weeks recorded yet.");
}));

test("Week history reaches long and incomplete records across resize",{timeout:90_000},async()=>isolated(360,async page=>{
  const box=await openWeekHistory(page);
  await page.evaluate(()=>window.circle.updateState(s=>{
    const goals={...s.goals,items:{...s.goals.items},steps:{...s.goals.steps}},weeks={...s.weeks};
    for(let i=1;i<=24;i++){const d=new Date(Date.UTC(2021,0,4+(i-1)*7)),key=d.toISOString().slice(0,10);weeks[key]={...weeks["2020-01-06"],weekKey:key};}
    for(let i=0;i<25;i++)goals.steps["missing-"+i]={id:"missing-"+i,goalId:"old",taskId:"unavailable-"+i,dateKey:"2020-01-08",createdAt:"2020-01-07T01:00:00Z"};
    return {...s,goals,weeks};
  }));
  const list=box.getByLabel("Recorded weeks");await expect(list.locator("button")).toHaveCount(26);await list.locator("button").last().scrollIntoViewIfNeeded();await list.locator("button").last().tap();await logSettled(box);
  await expect(box.getByText("Step unavailable",{exact:true})).toHaveCount(25);
  await box.locator('.os-week-history-goal > summary').first().click();
  for(const width of [360,390]){await page.setViewportSize({width,height:667});await logSettled(box);await box.getByLabel("Saved review").scrollIntoViewIfNeeded();const m=await box.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length}));assert.ok(m.height>480);assert.ok(m.scrollWidth<=m.width+1);assert.equal(m.scrollers,0);console.log("Long Week history",width,m);}
}));
for(const [width,height]of[[360,667],[390,844]])test(`Log corrections save, cancel and reload at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  const box=await openPastLog(page),before=await page.evaluate(()=>JSON.stringify(window.circle.state.days));
  const entry=box.getByRole("button",{name:"Edit entry at 08:15",exact:true});await entry.click();await logSettled(box);
  await box.getByRole("textbox",{name:"Past activity",exact:true}).fill("Unaccepted words");await box.getByRole("button",{name:"Cancel",exact:true}).click();await logSettled(box);assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.days)),before);
  await entry.click();await logSettled(box);await box.getByRole("textbox",{name:"Past activity",exact:true}).fill("A corrected saved walk");await box.getByRole("textbox",{name:"Past moments",exact:true}).fill("A corrected moment\nAnother moment");
  for(const name of ["Past activity","Past moments"]){const input=box.getByRole("textbox",{name,exact:true});await input.focus();await expect(input).toBeFocused();await expect(input).toHaveCSS("outline-style","none");const caret=await input.evaluate(el=>({color:getComputedStyle(el).caretColor,visibility:getComputedStyle(el).visibility}));assert.notEqual(caret.color,"transparent");assert.notEqual(caret.color,"rgba(0, 0, 0, 0)");assert.equal(caret.visibility,"visible");}
  await box.getByRole("button",{name:"Cancel",exact:true}).focus();await page.keyboard.press("Tab");await page.keyboard.press("Shift+Tab");await expect(box.getByRole("button",{name:"Cancel",exact:true})).toBeFocused();await expect(box.getByRole("button",{name:"Cancel",exact:true})).toHaveCSS("outline-style","solid");await box.getByRole("textbox",{name:"Past moments",exact:true}).focus();
  await box.screenshot({path:`outputs/log-correction-editor-${width}.png`});
  const earliest=Date.now();if(width===360)await context.setOffline(true);
  await box.getByRole("button",{name:"Save changes",exact:true}).click();await expect(box.locator("form")).toHaveCount(0);await logSettled(box);await expect(entry).toContainText("A corrected saved walk");await expect(entry).toContainText("Another moment");
  const saved=await page.evaluate(()=>window.circle.state.days["2020-01-01"]),receipt=Object.values(saved.logCorrections)[0];
  assert.equal(Object.keys(saved.logCorrections).length,1);assert.ok(Date.parse(receipt.correctedAt)>=earliest);assert.equal(receipt.before.activity,"Saved walk");assert.equal(receipt.after.activity,"A corrected saved walk");
  assert.equal(receipt.after.start,"08:15");assert.equal(receipt.after.end,"09:00");assert.equal(receipt.after.createdAt,"2020-01-02T10:00:00Z");
  const original=JSON.parse(before)["2020-01-01"];assert.deepEqual(saved.timeBlocks.find(b=>b.start==="05:30"),original.timeBlocks.find(b=>b.start==="05:30"));
  await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.loadCircleState(window.api.getAccountScope())).days["2020-01-01"].logCorrections||{}).length)).toBe(1);
  if(width===360)await context.setOffline(false);await page.reload();await ready(page);
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await logSettled(box);await expect(entry).toContainText("A corrected saved walk");
  const unchanged=await page.evaluate(()=>JSON.stringify({day:window.circle.state.days["2020-01-01"],evidence:window.circle.state.evidence,outbox:window.circle.state.outbox}));
  await entry.click();await logSettled(box);await box.getByRole("button",{name:"Save changes",exact:true}).click();await expect(box.locator("form")).toHaveCount(0);await logSettled(box);
  assert.equal(await page.evaluate(()=>JSON.stringify({day:window.circle.state.days["2020-01-01"],evidence:window.circle.state.evidence,outbox:window.circle.state.outbox})),unchanged,"unchanged save is a no-op");
  await page.evaluate(()=>window.circle.updateState(s=>({...s,days:{...s.days,"2020-01-01":{...s.days["2020-01-01"],timeBlocks:s.days["2020-01-01"].timeBlocks.map(b=>b.start==="05:30"?{...b,note:"First legacy line\nSecond legacy line"}:b)}}})));
  const legacyBefore=await page.evaluate(()=>JSON.stringify(window.circle.state.days["2020-01-01"]));
  await box.getByRole("button",{name:"Edit entry at 05:30",exact:true}).click();await logSettled(box);await expect(box.getByRole("textbox",{name:"Past moments",exact:true})).toHaveValue("First legacy line\nSecond legacy line");
  await box.getByRole("button",{name:"Save changes",exact:true}).click();await expect(box.locator("form")).toHaveCount(0);await logSettled(box);assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.days["2020-01-01"])),legacyBefore,"unchanged multiline legacy note retains its representation");
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Log corrections reject stale drafts and close on account changes",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=await openPastLog(page),entry=box.getByRole("button",{name:"Edit entry at 08:15",exact:true});await entry.click();await logSettled(box);await box.getByRole("textbox",{name:"Past activity",exact:true}).fill("Stale local draft");
  await page.evaluate(()=>window.circle.updateState(s=>({...s,days:{...s.days,"2020-01-01":{...s.days["2020-01-01"],timeBlocks:s.days["2020-01-01"].timeBlocks.map(b=>b.start==="08:15"?{...b,activity:"A newer saved change",title:"A newer saved change",updatedAt:new Date().toISOString()}:b)}}})));
  await expect(box.getByRole("alert")).toContainText("This entry changed");await expect(box.getByRole("button",{name:"Save changes",exact:true})).toBeDisabled();
  await box.getByRole("button",{name:"Cancel",exact:true}).click();await logSettled(box);await expect(entry).toContainText("A newer saved change");assert.equal(await page.evaluate(()=>Object.keys(window.circle.state.days["2020-01-01"].logCorrections||{}).length),0);
  await entry.click();await logSettled(box);await box.getByRole("textbox",{name:"Past moments",exact:true}).fill("Only account A's unsaved draft");
  await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-correction-b");await window.api.saveCircleState(scope,window.api.fixture());});await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-correction-b");
  await expect(box.getByRole("textbox",{name:"Past moments",exact:true})).toHaveCount(0);await expect(box).not.toContainText("A newer saved change");
  await page.evaluate(()=>window.api.activateAccountScope("synthetic-writer-a"));await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-writer-a");
  await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await logSettled(box);await expect(entry).toContainText("A newer saved change");await expect(box).not.toContainText("Only account A's unsaved draft");
}));

test("Log corrections keep clearing evidence through stale merge and reload",{timeout:90_000},async()=>isolated(360,async(page,context)=>{
  const box=await openPastLog(page),stale=await page.evaluate(()=>structuredClone(window.circle.state));await context.setOffline(true);
  for(const start of ["08:15","05:30"]){await box.getByRole("button",{name:`Edit entry at ${start}`,exact:true}).click();await logSettled(box);await box.getByRole("textbox",{name:"Past activity",exact:true}).fill("");await box.getByRole("textbox",{name:"Past moments",exact:true}).fill("");await box.getByRole("button",{name:"Save changes",exact:true}).click();await expect(box.locator("form")).toHaveCount(0);await logSettled(box);}
  await expect(box).toContainText("No activities recorded.");await expect(box.getByRole("button",{name:/Edit entry at/})).toHaveCount(0);
  await page.evaluate(stale=>window.circle.updateState(s=>window.api.mergeServerState(s,stale)),stale);await expect(box).toContainText("No activities recorded.");
  const cleared=await page.evaluate(()=>window.circle.state.days["2020-01-01"]);assert.equal(cleared.timeBlocks.length,0);assert.equal(Object.keys(cleared.logCorrections).length,2);assert.ok(Object.values(cleared.logCorrections).every(r=>r.after.updatedAt&&!r.after.activity&&!r.after.note&&r.after.moments.length===0));
  await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.loadCircleState(window.api.getAccountScope())).days["2020-01-01"].logCorrections||{}).length)).toBe(2);
  await context.setOffline(false);await page.reload();await ready(page);await box.getByRole("button",{name:/^(Log|History)$/,exact:true}).click();await logSettled(box);await box.getByLabel("Recorded Log days").getByRole("button",{name:"Old market day 2020-01-01",exact:true}).click();await logSettled(box);await expect(box).toContainText("No activities recorded.");
}));

test("baseline legacy placeholder report is reproducible without touching owner data",{timeout:90_000},async()=>isolated(390,async page=>{
  const title=page.getByRole("textbox",{name:"Edit idle title",exact:true});await expect(title).toBeVisible();
  const placeholder=await title.getAttribute("placeholder");assert.ok(placeholder);
  await title.focus();await page.getByRole("textbox",{name:"Edit idle note",exact:true}).focus();
  await expect(title).toHaveValue(placeholder);
  await expect.poll(()=>page.evaluate(()=>window.circle.state.profile.profileCase.survey.answers.find(a=>a.questionId==="checkin-idle-title")?.answer)).toBe(placeholder);
},{account:false}));

const notePage=page=>page.locator(".os-writing-page.os-note-page");
for(const [width,height] of [[360,740],[390,844],[416,844]])test(`Notes collection and full-page writing at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  if (width === 390) {
    await page.evaluate(()=>window.circle.updateState(state=>{
      const {profileCase}=state.profile;
      const answers=[...profileCase.survey.answers,{questionId:"checkin-note",kind:"note",answer:"Synthetic older check-in note"}];
      return {...state,profile:{...state.profile,profileCase:{...profileCase,survey:{...profileCase.survey,answers}}}};
    }));
    await expect.poll(()=>page.evaluate(()=>window.writing.view?.sources.some(source=>source.sourceSystem==="existing"&&source.id==="checkin-note"))).toBe(true);
  }
  const entry=page.locator(".os-today-previews").getByRole("button",{name:"Notes",exact:true});
  await expect(notePage(page)).toBeHidden();await expect(entry).toBeVisible();
  await entry.click();await expect(page.locator(".os-note-open")).toBeVisible();assert.equal(await page.evaluate(()=>location.hash),"#note");
  await expect(page.locator(".os-today-previews")).toBeHidden();await expect(page.locator(".os-nav")).toBeHidden();
  const box=notePage(page),frame=page.locator(".os-note-open .os-checkin-session"),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  await expect.poll(()=>frame.evaluate(el=>el.getBoundingClientRect().height)).toBe(height-174);
  const floor=await frame.evaluate(el=>el.getBoundingClientRect().height);
  const thought=await thoughts(page);const thoughtMetrics=await thought.evaluate(el=>({height:el.closest(".os-swipe-session").getBoundingClientRect().height,gap:el.querySelector(".os-deep-thought-question").getBoundingClientRect().top-el.querySelector(".os-page-header-left").getBoundingClientRect().bottom}));
  assert.equal(thoughtMetrics.height,floor);assert.equal(thoughtMetrics.gap,24);
  await frame.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:-500,deltaY:0,bubbles:true,cancelable:true})));await expect(box.getByRole("heading",{name:"Notes",exact:true})).toBeVisible();
  const add=box.getByRole("button",{name:"Add note",exact:true});
  const goBack=box.getByRole("button",{name:"Back",exact:true});
  await expect(goBack).toHaveText("←");
  const arrow = goBack.locator(".os-routine-back-icon");
  await expect(arrow).toHaveCSS("background-image", /^linear-gradient\(90deg, rgb\(227, 107, 55\)/);
  await expect(add).toHaveCSS("font-size", "16px");
  await expect(add).toHaveCSS("font-weight", "700");
  for (const button of [goBack, add]) {
    const target = await button.boundingBox();
    assert.ok(target.width >= 44 && target.height >= 44);
  }
  const panel=title=>box.locator(".os-notes-panel").filter({hasText:title});
  await expect(box.locator(".os-notes-collection")).toBeEmpty();
  await expect(add).toHaveText("+");await add.click();await expect(body).toBeVisible();
  await goBack.click();await expect(box.locator(".os-notes-collection")).toBeEmpty();
  await add.click();await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toBeFocused();
  await frame.screenshot({path:`outputs/note-full-page-empty-${width}.png`});
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("A full page for writing");await body.fill("My words stay here when I return.");await accepted(page,"My words stay here when I return.");await body.blur();
  await frame.screenshot({path:`outputs/note-full-page-written-${width}.png`});
  const long=Array(40).fill("Long writing grows the page downward.").join("\n");await body.fill(long);await accepted(page,long);
  const metrics=await box.evaluate(el=>({height:el.closest(".os-swipe-session").getBoundingClientRect().height,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length,gap:el.querySelector("textarea").getBoundingClientRect().top-el.querySelector(".os-page-header-left").getBoundingClientRect().bottom}));
  assert.ok(metrics.height>floor+400);assert.equal(metrics.scrollers,0);assert.equal(metrics.gap,24);
  await goBack.click();await expect(panel("A full page for writing")).toBeFocused();
  await expect(box.getByRole("button",{name:/Move.*to Trash/})).toHaveCount(0);
  await context.setOffline(true);
  await add.click();await expect(body).toHaveValue("");
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Second note");await body.fill("A short note still gives enough words to fill two preview lines.");await goBack.click();
  await expect(panel("Second note")).toBeVisible();
  await context.setOffline(false);
  await add.click();await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Newest note");await body.fill("A longer note preview, spread across enough lines to check the column height. ".repeat(3));await goBack.click();
  await expect(panel("Newest note")).toBeVisible();
  const layout=await box.locator(".os-notes-columns").evaluate(grid=>{
    const [left,right]=grid.children;
    const [first,third]=left.querySelectorAll(".os-notes-panel");const second=right.querySelector(".os-notes-panel");
    const a=first.getBoundingClientRect(),b=second.getBoundingClientRect(),c=third.getBoundingClientRect();
    const previews=[first,second,third].map(panel=>{
      const body=panel.querySelector("[data-note-preview-lines]");
      const style=getComputedStyle(body);
      return {limit:Number(style.webkitLineClamp),lines:Math.round(body.getBoundingClientRect().height/parseFloat(style.lineHeight)),type:[getComputedStyle(panel.querySelector("strong")).fontSize,style.fontSize,getComputedStyle(panel.querySelector("time")).fontSize]};
    });
    return {first:first.querySelector("strong").textContent,second:second.querySelector("strong").textContent,gaps:[b.left-a.right,b.top-a.top,c.top-a.bottom],previews};
  });
  assert.deepEqual([layout.first,layout.second,layout.gaps],["Newest note","Second note",[4,0,4]]);
  assert.deepEqual(layout.previews,[4,2,6].map(limit=>({limit,lines:limit,type:["18px","16px","12px"]})));
  await expect(box.getByText("Synthetic older check-in note",{exact:true})).toHaveCount(0);
  await expect(panel("Newest note").locator("time")).toHaveText(/\d:\d\d (AM|PM)/);
  await panel("A full page for writing").click();
  await expect(box.getByRole("button",{name:"New Note",exact:true})).toHaveCount(0);
  await box.getByRole("button",{name:"Move note to Trash",exact:true}).click();
  await expect(panel("A full page for writing")).toHaveCount(0);
  await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,"A full page for writing").click();await box.getByRole("button",{name:"Restore",exact:true}).click();
  await panel("A full page for writing").click();await expect(body).toHaveValue(long);
  await expect(box.getByRole("button",{name:"Line",exact:true})).toHaveCount(0);
  await expect(box.getByRole("button",{name:"Show a Line",exact:true})).toHaveCount(0);
  await expect(page.locator(".os-line-page")).toHaveCount(0);
  await goBack.click();await goBack.click();await expect(entry).toBeVisible();await expect(box).toBeHidden();
  await entry.click();await page.reload();await ready(page);await expect(panel("A full page for writing")).toBeVisible();await expect(panel("Second note")).toBeVisible();
  await goBack.click();await openRoutineTool(page);const routine=page.locator(".os-habit-session");await expect.poll(async()=>(await routine.boundingBox()).height).toBe(floor);assert.ok(Math.abs((await routine.boundingBox()).height-floor)<1);
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(routine.locator(".os-protocol-home")).toBeVisible();
  const protocolMetrics=await routine.locator(".os-protocol-home").evaluate(el=>({height:el.closest(".os-swipe-session").getBoundingClientRect().height,gap:el.querySelector(".os-protocol-past").getBoundingClientRect().top-el.querySelector(".os-page-header-left").getBoundingClientRect().bottom}));assert.equal(protocolMetrics.height,floor);assert.equal(protocolMetrics.gap,24);
  await routine.getByRole("button",{name:"Back",exact:true}).click();await entry.click();
  await page.goBack();await expect(entry).toBeVisible();await expect(page.locator(".os-note-open")).toHaveCount(0);
  console.log("Full-page Note",width,height,JSON.stringify({floor,...metrics,thoughtMetrics,protocolMetrics}));
},{height}));
async function options(box,name){if(name==="History"&&await box.getAttribute("class").then(value=>value.includes("os-writing-bounded"))){await box.getByRole("button",{name:"History",exact:true}).click();return;}await box.getByRole("button",{name:"Writing options",exact:true}).click();await box.getByRole("button",{name,exact:true}).click();}
async function saved(page,count=1){await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.load()).entries).length)).toBe(count);}
async function accepted(page,body){await expect.poll(()=>page.evaluate(async body=>Object.values((await window.api.load()).entries).some(entry=>entry.versions.at(-1).content.body===body),body)).toBe(true);await expect.poll(()=>page.evaluate(()=>window.writing.status)).toBe("ready");}
const row=(box,title)=>box.locator(".os-writing-entry").filter({hasText:title});
const trashRow=(box,title)=>box.getByRole("button",{name:`Move ${title} to Trash`,exact:true});

async function checkTrashSpacing(box){
  await expect(box.getByText("In Trash",{exact:true})).toHaveCount(0);
  const restore=box.getByRole("button",{name:"Restore",exact:true}),remove=box.getByRole("button",{name:"Delete forever",exact:true});
  await expect(restore).toBeVisible();await expect(remove).toBeVisible();
  await expect(box.locator(".os-writing-footer")).toHaveCSS("gap","4px");
  await expect(box.locator(".os-page-footer")).toHaveCSS("padding-top","24px");
  const a=await restore.boundingBox(),b=await remove.boundingBox();
  const shell=await restore.evaluate(el=>el.closest(".os-creative-button-shell").getBoundingClientRect().toJSON());
  assert.ok(a.height>=44&&b.height>=44,"Trash actions retain touch targets");
  assert.ok(Math.abs(b.y-shell.y-shell.height-4)<=1,"rendered Trash layout gap is 4px");
}

const syntheticQuote=n=>({id:`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`,text:`Synthetic quote ${n}`,author:"Synthetic author"});
async function quoteBackend(context) {
  const state={pool:[syntheticQuote(1),syntheticQuote(2),syntheticQuote(3)],fail:false};
  await context.route("**/os/quotes",route=>state.fail?route.abort():route.fulfill({json:state.pool}));
  await context.route("**/os/admin/quotes",async route=>{
    if(state.fail)return route.fulfill({status:503,json:{error:"Synthetic database failure."}});
    const request=route.request();if(request.method()==="GET")return route.fulfill({json:state.pool});
    const value=request.postDataJSON();
    if(request.method()==="POST"){const added={id:crypto.randomUUID(),...value};state.pool.push(added);return route.fulfill({json:[added]});}
    const removed=state.pool.filter(item=>item.id===value.id);state.pool=state.pool.filter(item=>item.id!==value.id);return route.fulfill({json:removed});
  });
  return state;
}
async function swipeBoundary(page,deltaX){await page.locator(".os-checkin-session").evaluate((el,deltaX)=>el.dispatchEvent(new WheelEvent("wheel",{deltaX,deltaY:0,bubbles:true,cancelable:true})),deltaX);}

test("Quote visits rotate, preserve the question/draft, survive reload/offline, and honor an empty catalog",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  const backend=await quoteBackend(context),box=await thoughts(page),question=await box.locator(".os-deep-thought-question").textContent();
  const input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("An unfinished synthetic answer.");
  for(const n of [1,2,3,1]){
    await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toContainText(`Synthetic quote ${n}`);
    const loved = page.getByRole("button", { name: "Loved it", exact: true });
    const notForMe = page.getByRole("button", { name: "Not for me", exact: true });
    await expect(loved).toBeVisible();
    await expect(notForMe).toBeVisible();
    if (n === 2) await loved.click();
    else if (n === 3) await notForMe.click();
    else await swipeBoundary(page, -500);
    await expect(input).toHaveValue("An unfinished synthetic answer.");
    await expect(box.locator(".os-deep-thought-question")).toHaveText(question);
  }
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0,"viewing quotes never submits a draft");
  await options(box,"History");
  const unsent = row(box, "An unfinished synthetic answer.");
  await expect(unsent).toContainText("Unsent");
  await expect(unsent.locator("time").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
  await expect(unsent.locator("time").nth(1)).toHaveText(/\d+:\d{2} [AP]M/);
  await box.getByRole("button",{name:"Deep Thoughts",exact:true}).click();
  await page.reload();await ready(page);await thoughts(page);backend.fail=true;
  await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toContainText("Synthetic quote 2");
  await swipeBoundary(page,500);
  await expect(input).toHaveValue("An unfinished synthetic answer.");
  await expect(box.locator(".os-deep-thought-question")).toHaveText(question);
  backend.fail=false;backend.pool=[];await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(box.getByRole("alert")).toContainText("No quotes are available yet");
  backend.fail=true;await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toHaveCount(0);await expect(input).toHaveValue("An unfinished synthetic answer.");
  await page.locator(".os-checkin-session").screenshot({path:"outputs/deep-thoughts-quote-return-390.png"});
}));

for(const [width,height]of[[360,667],[390,844]])test(`Deep Thoughts History/Trash matches Note at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  const box=await thoughts(page),question=await box.locator(".os-deep-thought-question").textContent();
  await box.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("A saved synthetic answer for Trash.");await box.getByRole("button",{name:"Send",exact:true}).click();await saved(page);
  await options(box,"History");await expect(box.getByText("Today",{exact:true})).toBeVisible();await expect(box.getByRole("button",{name:/Undo|Versions|Writing options/})).toHaveCount(0);
  const entry = await page.evaluate(async () => Object.values((await window.api.load()).entries)[0]);
  const { day } = entry.versions.find(version => version.id === entry.currentVersionId).attribution;
  const times = row(box, question).locator("time");
  await expect(times.first()).toHaveAttribute("datetime", day);
  await expect(times.first()).toHaveText(new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
  }).format(new Date(`${day}T12:00:00Z`)));
  await expect(times.nth(1)).toHaveAttribute("datetime", entry.createdAt);
  const bounds=await trashRow(box,question).boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44);
  await trashRow(box,question).click();await expect(row(box,question)).toHaveCount(0);await expect(box).not.toContainText("Moved to Trash");
  await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,question).click();await expect(box.getByRole("heading",{name:question,exact:true})).toBeVisible();await expect(box).toContainText("A saved synthetic answer for Trash.");
  await box.getByRole("button",{name:"Restore",exact:true}).click();await row(box,question).click();await expect(box.getByRole("textbox",{name:"Answer the deep thought",exact:true})).toHaveValue("A saved synthetic answer for Trash.");
  await options(box,"History");await trashRow(box,question).click();await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,question).click();await box.getByRole("button",{name:"Delete forever",exact:true}).click();await box.getByRole("button",{name:"Delete forever",exact:true}).click();
  const ledger=await page.evaluate(()=>window.api.load());assert.equal(Object.keys(ledger.entries).length,0);assert.equal(Object.values(ledger.tombstones)[0].usage.question,question);
  await box.getByRole("button",{name:"History",exact:true}).click();await box.getByRole("button",{name:"Deep Thoughts",exact:true}).click();await expect(box.getByText("This question was answered.",{exact:true})).toBeVisible();await expect(box.getByRole("button",{name:"Send",exact:true})).toHaveCount(0);
  await box.getByRole("button",{name:"Next question",exact:true}).click();await expect(box.locator(".os-deep-thought-question")).not.toHaveText(question);
  await page.evaluate(async()=>{const a=window.api,scope=a.getAccountScope(),owner="account:"+scope.accountId;
    for(let i=0;i<18;i++){const at=new Date(Date.now()-i*60_000-60_000).toISOString(),draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"deep-thought",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:a.writingAttribution(at,"Asia/Bangkok"),content:{title:"",body:"Synthetic saved answer "+i,tags:[]},source:{questionId:"synthetic-"+i,question:"Synthetic saved question "+i,source:"local"}};const commit=v=>a.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,...v});await commit({type:"write-draft",draft,expectedDraftVersion:0});await commit({type:"save",draft:{...draft,version:1}});}
  });
  await options(box,"History");const frame=page.locator(".os-checkin-session");await expect(box).not.toHaveClass(/\bos-app-flip\b/);await expect.poll(async()=>(await frame.boundingBox()).height).toBeGreaterThan(height);
  const metrics=await box.evaluate(el=>{const body=el.querySelector(".os-page-body");return{height:el.closest(".os-swipe-session").getBoundingClientRect().height,overflow:body.scrollHeight-body.clientHeight,scrollers:[...el.querySelectorAll("*")].filter(e=>["auto","scroll"].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).length};});
  assert.ok(metrics.height>height,JSON.stringify(metrics));assert.equal(metrics.overflow,0);assert.equal(metrics.scrollers,0);
  await frame.screenshot({path:`outputs/deep-thoughts-history-${width}.png`});
},{height}));

test("Quotes Admin adds/removes shared quotes and preserves failed input",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  const backend=await quoteBackend(context);await page.evaluate(()=>window.goto("/os/admin"));await ready(page);await page.waitForTimeout(900);const existingResize=await page.evaluate(()=>window.resizeNotifications);await page.getByRole("tab",{name:"Quotes",exact:true}).click();
  const editor=page.getByRole("region",{name:"Quote library",exact:true});await expect(editor).toContainText("Synthetic quote 1");
  for(const action of [editor.getByRole("button",{name:"Add quote",exact:true}),editor.getByRole("button",{name:"Remove quote",exact:true}).first()])assert.ok((await action.boundingBox()).height>=44);
  await editor.getByLabel("Quote",{exact:true}).fill("A newly authored synthetic quote.");await editor.getByLabel("Author (optional)",{exact:true}).fill("Synthetic writer");backend.fail=true;
  await editor.getByRole("button",{name:"Add quote",exact:true}).click();await expect(editor.getByRole("alert")).toContainText("Synthetic database failure");await expect(editor.getByRole("textbox",{name:"Quote",exact:true})).toHaveValue("A newly authored synthetic quote.");
  backend.fail=false;await editor.getByRole("button",{name:"Add quote",exact:true}).click();await expect(editor.locator("blockquote").filter({hasText:"A newly authored synthetic quote."})).toBeVisible();
  const article=editor.locator("article").filter({hasText:"A newly authored synthetic quote."});await article.getByRole("button",{name:"Remove quote",exact:true}).click();await article.getByRole("button",{name:"Confirm removal",exact:true}).click();await expect(article).toHaveCount(0);
  await page.locator(".os-admin").screenshot({path:"outputs/quote-admin-390.png"});
  assert.equal(await page.evaluate(()=>window.resizeNotifications),existingResize,"Quote controls add no resize notifications after the existing Admin navigation settles");console.log("Existing Admin navigation resize notifications",existingResize);
}));

test("Note Line keeps its existing first-swipe reactions and second-swipe exit",{timeout:90_000},async()=>isolated(390,async page=>{
  const note=notePage(page);await note.getByRole("button",{name:"Show a Line",exact:true}).click();const line=page.locator(".os-line-page");await expect(line).toBeVisible();await expect(page.getByRole("button",{name:"Loved this",exact:true})).toHaveCount(0);
  await swipeBoundary(page,500);await expect(page.getByRole("button",{name:"Loved this",exact:true})).toBeVisible();await expect(line).toBeVisible();await swipeBoundary(page,500);await expect(note.getByRole("button",{name:"Show a Line",exact:true})).toBeVisible();
}));

test("legacy Deep Thoughts keeps the answer and uses the quote back without migrating writing",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await quoteBackend(context);
  await page.getByRole("button", { name: "Deep Thoughts", exact: true }).click({ position: { x: 40, y: 40 } });
  const box=page.locator(".os-thoughts-page"),question=await box.locator(".os-deep-thought-question").textContent();
  const input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("A synthetic legacy answer.");await box.getByRole("button",{name:"Send",exact:true}).click();await expect(box.getByRole("button",{name:"Next question",exact:true})).toBeVisible();await expect(input).toHaveValue("A synthetic legacy answer.");
  await box.getByRole("button",{name:"Show a Quote",exact:true}).click();
  const quote = page.locator(".os-quote-page");
  await expect(quote).toContainText("Synthetic quote 1");
  await expect(quote.getByRole("button", { name: "Loved it", exact: true })).toBeVisible();
  await expect(quote.getByRole("button", { name: "Not for me", exact: true })).toBeVisible();
  await swipeBoundary(page,500);
  await expect(input).toHaveValue("A synthetic legacy answer.");
  await expect(box.locator(".os-deep-thought-question")).toHaveText(question);
  await box.getByRole("button",{name:"Next question",exact:true}).click();await expect(input).toHaveValue("");await expect(box.locator(".os-deep-thought-question")).not.toHaveText(question);
},{account:false}));

test("older untitled Thoughts remain correctable without inventing a question",{timeout:90_000},async()=>isolated(360,async page=>{
  await page.evaluate(async()=>{const a=window.api,scope=a.getAccountScope(),owner="account:"+scope.accountId,at=new Date().toISOString(),draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"thought",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:a.writingAttribution(at,"Asia/Bangkok"),content:{title:"",body:"An older synthetic untitled Thought.",tags:[]},source:null};const commit=v=>a.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,...v});await commit({type:"write-draft",draft,expectedDraftVersion:0});await commit({type:"save",draft:{...draft,version:1}});});
  const box=await thoughts(page);await options(box,"History");await row(box,"An older synthetic untitled Thought.").click();
  await expect(box.locator(".os-deep-thought-question")).toHaveCount(0);const input=box.getByRole("textbox",{name:"Write a thought",exact:true});await input.fill("A corrected older Thought.");await box.getByRole("button",{name:"Save changes",exact:true}).click();await accepted(page,"A corrected older Thought.");
  const entries=Object.values((await page.evaluate(()=>window.api.load())).entries);assert.equal(entries.length,1);assert.equal(entries[0].kind,"thought");assert.equal(entries[0].source,null);assert.equal(entries[0].versions[0].content.body,"An older synthetic untitled Thought.");
}));

test("Deep Thought save failures and in-flight typing keep recoverable writing",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=await thoughts(page),input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("Initial synthetic answer.");
  await expect.poll(()=>page.evaluate(()=>window.writing.status)).toBe("ready");
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&value.entries&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await box.getByRole("button",{name:"Send",exact:true}).click();await expect(box.getByRole("alert")).toBeVisible();await expect(input).toHaveValue("Initial synthetic answer.");await expect(box.getByRole("button",{name:"Next question",exact:true})).toHaveCount(0);
  await page.reload();await ready(page);await thoughts(page);await expect(input).toHaveValue("Initial synthetic answer.");
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{if(new TextDecoder().decode(args[1]).includes('"type":"save"')){crypto.subtle.digest=digest;await new Promise(resolve=>window.releaseSend=resolve);}return digest(...args);};});
  await box.getByRole("button",{name:"Send",exact:true}).click();await page.waitForFunction(()=>Boolean(window.releaseSend));await input.fill("Newer synthetic answer while saving.");await page.evaluate(()=>window.releaseSend());await saved(page);
  await expect(input).toHaveValue("Newer synthetic answer while saving.");await box.getByRole("button",{name:"Save changes",exact:true}).click();await accepted(page,"Newer synthetic answer while saving.");
  const entry=Object.values((await page.evaluate(()=>window.api.load())).entries)[0];assert.equal(entry.versions[0].content.body,"Initial synthetic answer.");assert.equal(entry.versions.at(-1).content.body,"Newer synthetic answer while saving.");
}));

test("normal-motion Quote flips keep the frame filled and return to the same answer",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await quoteBackend(context);const box=await thoughts(page),input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("A synthetic answer held through a flip.");await box.getByRole("button",{name:"Show a Quote",exact:true}).click();
  const quote=page.locator(".os-quote-page");await expect(quote).toBeVisible();await expect(quote).not.toHaveClass(/\bos-app-flip\b/);
  const rect=await page.locator(".os-checkin-session").boundingBox();assert.ok(rect.height>=346);await swipeBoundary(page,-500);await expect(input).toHaveValue("A synthetic answer held through a flip.");await expect(box).not.toHaveClass(/\bos-app-flip\b/);
  await page.locator(".os-checkin-session").screenshot({path:"outputs/deep-thoughts-motion-390.png"});
},{reducedMotion:"no-preference"}));
test("Note autosaves silently offline and restores only through the Trash page",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  let box=notePage(page);
  const title=box.getByRole("textbox",{name:"Note title",exact:true});
  await title.focus();await box.getByRole("textbox",{name:"Write a note",exact:true}).focus();
  await expect(title).toHaveValue("");
  assert.deepEqual(await page.evaluate(async()=>Object.keys((await window.api.load()).drafts)),[]);
  await title.fill("A small moment");await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("Synthetic walk by the river.");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).drafts).filter(d=>d.status==="active")[0]?.content.body)).toBe("Synthetic walk by the river.");
  await page.reload();await ready(page);box=notePage(page);
  await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("A small moment");
  await context.setOffline(true);await accepted(page,"Synthetic walk by the river.");
  await expect(box.getByRole("button",{name:/^Save/})).toHaveCount(0);await expect(box).not.toContainText(/draft/i);
  await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("Synthetic walk by the quiet river.");
  await accepted(page,"Synthetic walk by the quiet river.");
  await box.getByRole("textbox",{name:"Write a note",exact:true}).blur();
  await expect(box).not.toContainText(/Saving on this device|Saved on this device/);await expect(box.getByRole("button",{name:/Versions|Writing options|Undo/})).toHaveCount(0);
  await page.locator(".os-checkin-session").screenshot({path:"outputs/note-controls-write-390.png"});
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).entries)[0]?.versions.length)).toBe(2);
  await options(box,"History");await expect(box.getByText("Today",{exact:true})).toBeVisible();await page.locator(".os-checkin-session").screenshot({path:"outputs/note-controls-history-390.png"});
  await trashRow(box,"A small moment").click();await expect(row(box,"A small moment")).toHaveCount(0);await expect(box.getByRole("button",{name:"Undo",exact:true})).toHaveCount(0);await expect(box).not.toContainText("Moved to Trash");
  await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,"A small moment").click();
  await page.locator(".os-checkin-session").screenshot({path:"outputs/note-controls-trash-390.png"});
  await box.getByRole("button",{name:"Restore",exact:true}).click();await expect(row(box,"A small moment")).toBeVisible();await trashRow(box,"A small moment").click();
  await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,"A small moment").click();
  await box.getByRole("button",{name:"Delete forever",exact:true}).click();await expect(box.getByRole("button",{name:"Cancel",exact:true})).toBeVisible();
  await box.getByRole("button",{name:"Delete forever",exact:true}).click();
  await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.load()).entries).length)).toBe(0);
  const ledger=await page.evaluate(()=>window.api.load());assert.equal(Object.keys(ledger.tombstones).length,1);assert.equal(Object.keys(ledger.drafts).length,0);
}));

async function thoughts(page){
  const box=page.locator(".os-writing-page.os-thoughts-page");
  if(!await page.locator(".os-note-open").isVisible()) await page.getByRole("button",{name:"Deep Thoughts",exact:true}).click({position:{x:40,y:40}});
  const session=page.locator(".os-checkin-session");
  await session.scrollIntoViewIfNeeded();
  if(!await box.locator(".os-deep-thought-question").isVisible()) await session.evaluate(element=>{element.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true}));});
  await expect(box.getByRole("button",{name:"Show a Quote",exact:true})).toBeVisible();await expect(box.locator(".os-deep-thought-question")).toBeVisible();return box;
}
test("Deep Thoughts opens directly, holds its saved answer, and advances only on Next question",{timeout:90_000},async()=>isolated(360,async page=>{
  const box=await thoughts(page);
  const question=await box.locator(".os-deep-thought-question").textContent();
  await box.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("Synthetic answer with enough words to keep.");
  await expect(box.getByRole("button",{name:"Send",exact:true})).toBeEnabled();await box.getByRole("button",{name:"Send",exact:true}).click();await saved(page);
  const ledger=await page.evaluate(()=>window.api.load());const deep=Object.values(ledger.entries).find(e=>e.kind==="deep-thought");assert.equal(deep.source.question,question);assert.ok(deep.source.questionId);
  await expect(box.getByRole("textbox",{name:"Answer the deep thought",exact:true})).toHaveValue("Synthetic answer with enough words to keep.");
  await expect(box.getByRole("button",{name:"Next question",exact:true})).toBeVisible();
  await page.reload();await ready(page);await thoughts(page);await expect(box.getByRole("textbox",{name:"Answer the deep thought",exact:true})).toHaveValue("Synthetic answer with enough words to keep.");
  await box.getByRole("button",{name:"Next question",exact:true}).click();await expect(box.locator(".os-deep-thought-question")).not.toHaveText(question);
  await expect(box.getByRole("textbox",{name:"Answer the deep thought",exact:true})).toHaveValue("");
  await options(box,"History");await row(box,question).click();await expect(box.getByRole("heading",{name:question,exact:true})).toBeVisible();
  await box.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("A corrected synthetic answer.");
  await box.getByRole("button",{name:"Save changes",exact:true}).click();await accepted(page,"A corrected synthetic answer.");
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,1);
}));

test("Deep Thoughts quietly recovers drafts and clearing an answer survives reload",{timeout:90_000},async()=>isolated(390,async page=>{
  let box=await thoughts(page);
  const quiet=async()=>{await expect(box.locator(".os-writing-footer")).not.toContainText(/Saving on this device|Saved on this device|Recovered draft|Draft discarded|\bSent\b/i);await expect(box.getByRole("button",{name:"Discard draft",exact:true})).toHaveCount(0);};
  const input=()=>box.getByRole("textbox",{name:"Answer the deep thought",exact:true});
  await input().fill("An unfinished synthetic answer.");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).drafts).some(d=>d.status==="active"&&d.content.body==="An unfinished synthetic answer."))).toBe(true);
  await quiet();await page.reload();await ready(page);box=await thoughts(page);
  await expect(input()).toHaveValue("An unfinished synthetic answer.");await quiet();
  await input().fill("");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).drafts).filter(d=>d.status==="active").every(d=>d.content.body===""))).toBe(true);
  await page.reload();await ready(page);box=await thoughts(page);await expect(input()).toHaveValue("");await quiet();
  await input().fill("An answer deliberately sent.");await box.getByRole("button",{name:"Send",exact:true}).click();await accepted(page,"An answer deliberately sent.");
  await expect(box.getByRole("button",{name:"Next question",exact:true})).toBeVisible();await quiet();
}));

test("failed local commit keeps open text and retry saves once",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page);
  await page.getByRole("button",{name:"Notes",exact:true}).click();
  await box.getByRole("button",{name:"Add note",exact:true}).click();
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&value.entries&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Synthetic retry");await box.getByRole("button",{name:"Back",exact:true}).click();await expect(box.getByRole("alert")).toContainText("Your open text is still here");await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("Synthetic retry");
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0);
  await box.getByRole("button",{name:"Try again",exact:true}).click();await saved(page);
  await box.getByRole("button",{name:"Back",exact:true}).click();await expect(box.locator(".os-notes-panel")).toContainText("Synthetic retry");
  assert.equal(Object.values((await page.evaluate(()=>window.api.load())).entries)[0].versions.length,1);
}));

for (const width of [360, 390, 416]) test(`Home Imprint launches whole and clips at the correct edges at ${width}px`, { timeout: 90_000 }, async () => isolated(width, async page => {
  await page.goto(`${baseURL}/os?launch-fixture=1`);
  await expect(page).toHaveURL(/\/os\/home$/);
  const nav = page.getByRole("navigation", { name: "Circle OS" });
  assert.deepEqual(await nav.getByRole("link").allTextContents(), ["Today", "Home", "Reflect", "Explore"]);
  const background = page.locator(".os-imprint-background");
  const canvas = background.locator("canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  const geometry = () => background.evaluate(el => {
    const shell = el.getBoundingClientRect();
    const art = el.querySelector(".imprint-home-art");
    const rect = art.getBoundingClientRect();
    return { width: rect.width, height: rect.height, middle: (rect.left + rect.right) / 2,
      left: shell.left, right: shell.right, clip: getComputedStyle(art).clipPath.replace(/(?<!\d)0%/g, "0px") };
  });
  const home = await geometry();
  assert.ok(Math.abs(home.middle - (home.left + home.right) / 2) < 1);
  for (const [name, view, edge, clip] of [
    ["Today", "today", "right", "inset(0px 50% 0px 0px)"],
    ["Reflect", "reflect", "left", "inset(0px 0px 0px 50%)"],
  ]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(background).toHaveAttribute("data-imprint-view", view);
    await expect(background).toHaveAttribute("aria-hidden", "true");
    const crop = await geometry();
    assert.equal(crop.width, home.width);
    assert.equal(crop.height, home.height);
    await expect.poll(async () => {
      const settled = await geometry();
      return Math.abs(settled.middle - settled[edge]);
    }, { message: `${name} crop at ${width}px: ${JSON.stringify(crop)}` }).toBeLessThan(1);
    await expect.poll(async () => (await geometry()).clip).toBe(clip);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    if (width === 390 && name === "Today") {
      await page.screenshot({ path: "outputs/compact-navigation-imprint-390.png" });
    }
  }
  await page.goto(`${baseURL}/os?launch-fixture=1#note`);
  await expect(page).toHaveURL(/\/os\/today.*#note$/);
  await expect(page.getByRole("textbox", { name: "Write a note" })).toBeVisible();
}, { account: imprintAccount }));

for (const width of [360, 390]) test(`real writing feeds the Home Imprint at ${width}px`, { timeout: 120_000 }, async () => {
  const reduced = width === 360;
  await isolated(width, async (page, context) => {
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const showHome = async () => {
      await page.evaluate(() => window.navigate("/os/home"));
      await expect(canvas).toHaveAttribute("data-ready", "true");
    };
    const today = () => page.evaluate(() => window.navigate("/os"));
    const pixels = async () => createHash("sha256").update(await canvas.evaluate(element => element.toDataURL())).digest("hex");
    const days = () => page.evaluate(async () => (await window.api.load()).imprint?.days || {});
    const openNote = async () => {
      await today();
      await page.getByRole("button", { name: "Note", exact: true }).click();
      return notePage(page);
    };
    await showHome();
    const empty = await pixels();
    const note = await openNote();
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, ...args) {
        if (this.name === "writing" && value.imprint) {
          IDBObjectStore.prototype.put = put;
          throw new DOMException("Synthetic full device", "QuotaExceededError");
        }
        return put.call(this, value, ...args);
      };
    });
    await note.getByRole("textbox", { name: "Note title", exact: true }).fill("First Imprint Note");
    await expect(note.getByRole("alert")).toContainText("Your open text is still here");
    assert.deepEqual(await days(), {});
    assert.deepEqual((await page.evaluate(() => window.api.load())).entries, {});
    await context.setOffline(true);
    await note.getByRole("button", { name: "Try again", exact: true }).click();
    await saved(page);
    await showHome();
    if (!reduced) {
      await expect(canvas).toHaveAttribute("data-pulsing", "true");
      const during = await pixels();
      await expect(canvas).toHaveAttribute("data-pulsing", "false");
      assert.notEqual(await pixels(), during);
    }
    const firstNote = await pixels();
    assert.notEqual(firstNote, empty);
    assert.equal(Object.values(await days()).filter(day => day.group === "notes").length, 1);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), firstNote);

    await openNote();
    await options(note, "History");
    await expect(note.getByRole("heading", { name: "History", exact: true })).toBeVisible();
    await expect(note).not.toHaveClass(/os-app-flip/);
    await trashRow(note, "First Imprint Note").click();
    await expect.poll(() => page.evaluate(() => window.writing.trash.map(entry => entry.title))).toContain("First Imprint Note");
    await showHome();
    await expect.poll(pixels).toBe(empty);
    await openNote();
    await options(note, "History");
    await expect(note.getByRole("heading", { name: "History", exact: true })).toBeVisible();
    await expect(note).not.toHaveClass(/os-app-flip/);
    await note.getByRole("button", { name: "Trash", exact: true }).click();
    await expect(note.getByRole("heading", { name: "Trash", exact: true })).toBeVisible();
    await expect(note).not.toHaveClass(/os-app-flip/);
    await row(note, "First Imprint Note").click();
    await expect(note.getByRole("heading", { name: "First Imprint Note", exact: true })).toBeVisible();
    await expect(note).not.toHaveClass(/os-app-flip/);
    await note.getByRole("button", { name: "Restore", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.writing.history.map(entry => entry.title))).toContain("First Imprint Note");
    await showHome();
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), firstNote);

    await today();
    const thought = await thoughts(page);
    await page.clock.setFixedTime(new Date("2026-11-21T05:55:00+07:00"));
    await thought.getByRole("textbox", { name: "Answer the deep thought", exact: true }).fill("Across the Circle day.");
    await expect.poll(() => page.evaluate(async () => Object.values((await window.api.load()).drafts)
      .some(draft => draft.status === "active" && draft.content?.body === "Across the Circle day."))).toBe(true);
    await page.clock.setFixedTime(new Date("2026-11-21T06:10:00+07:00"));
    await thought.getByRole("button", { name: "Send", exact: true }).click();
    await saved(page, 2);
    const stamp = (await days())["thoughts:2026-11-20"];
    assert.equal(stamp.at, "2026-11-20T23:10:00.000Z");
    assert.equal(stamp.timeZone, "Asia/Bangkok");
    assert.equal(stamp.fadeAt, Date.parse("2026-11-23T06:00:00+07:00"));
    await showHome();
    await expect.poll(pixels).not.toBe(firstNote);
    await page.evaluate(() => window.api.openDevelopmentTestSession(true));
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), empty);
  }, { account: "imprint", reducedMotion: reduced ? "reduce" : "no-preference" });
});

test("a fresh signed-in account sees the sample Imprint before onboarding", { skip: !hostedImprintReview, timeout: 90_000 }, async () => {
  await isolated(390, async page => {
    await page.evaluate(() => window.navigate("/os/home"));
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const { runs, entries } = await page.evaluate(async () => ({
      runs: window.circle.state.chapters.runs,
      entries: (await window.api.load()).entries,
    }));
    assert.ok(!Object.values(runs).some(run => run.chapterId === "day-one" && run.status === "completed"));
    assert.deepEqual(entries, {});
  }, { account: "fresh-imprint" });
});

test("Routine habit saves feed Home and Undo removes only the last daily contribution", { timeout: 90_000 }, async () => {
  await isolated(390, async (page, context) => {
    await page.evaluate(() => window.circle.updateState(state => {
      for (const action of ["Read a page", "Walk outside"]) {
        const added = window.api.addHabitDefinition(state);
        state = window.api.updateHabitDefinitionParts(added.state, added.id, { action, identity: "A learner" });
      }
      return state;
    }));
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const pixels = () => canvas.evaluate(element => element.toDataURL());
    const showHome = async () => {
      await page.evaluate(() => window.navigate("/os/home"));
      await expect(canvas).toHaveAttribute("data-ready", "true");
    };
    const routine = async () => {
      await page.evaluate(() => window.navigate("/os"));
      await openRoutineTool(page);
      return page.locator(".os-habit-session");
    };
    const waitForSources = count => expect.poll(() => page.evaluate(() =>
      window.circle.localImprint.days.flatMap(day => day.sources).length)).toBe(count);
    const complete = async (action, count) => {
      await (await routine()).getByRole("button", { name: `Mark done: ${action}`, exact: true }).click();
      await waitForSources(count);
      await page.clock.fastForward(10_100);
      await showHome();
      await expect(canvas).toHaveAttribute("data-pulsing", "true");
      await expect(canvas).toHaveAttribute("data-pulsing", "false");
    };

    await showHome();
    const empty = await pixels();
    await context.setOffline(true);
    await complete("Read a page", 1);
    const first = await pixels();
    assert.notEqual(first, empty);
    await complete("Walk outside", 2);
    assert.equal(await pixels(), first);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), first);

    let box = await routine();
    await box.getByRole("button", { name: "Undo: Read a page", exact: true }).click();
    await waitForSources(1);
    await showHome();
    assert.equal(await pixels(), first);
    box = await routine();
    await box.getByRole("button", { name: "Record", exact: true }).click();
    await box.getByRole("button", { name: "Undo: Walk outside", exact: true }).click();
    await waitForSources(0);
    await showHome();
    assert.equal(await pixels(), empty);
    box = await routine();
    await box.getByRole("button", { name: "Mark done: Read a page", exact: true }).click();
    await waitForSources(1);
    const undo = box.getByRole("button", { name: "Undo: Read a page", exact: true });
    await expect(undo).toHaveAttribute("aria-busy", "false");
    await undo.click();
    await waitForSources(0);
    await showHome();
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    await complete("Read a page", 1);
    assert.equal(await pixels(), first);

    box = await routine();
    await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("circle-os-state-v2")) throw new DOMException("Synthetic full device", "QuotaExceededError");
        return set.call(this, key, value);
      };
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "state") throw new DOMException("Synthetic full device", "QuotaExceededError");
        return put.call(this, value, key);
      };
    });
    const failedSave = page.waitForEvent("console", { predicate: message =>
      message.text() === "Circle local state could not be saved." });
    await box.getByRole("button", { name: "Undo: Read a page", exact: true }).click();
    await failedSave;
    await showHome();
    assert.equal(await pixels(), first);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
  }, { account: imprintAccount, reducedMotion: "no-preference", clock: true });
});

test("Week task check colors Log/Week, Routine Undo removes it, and Routine re-check changes patches", { timeout: 90_000 }, async () => {
  await isolated(390, async (page, context) => {
    const go = path => page.evaluate(path => window.navigate(path), path);
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const showHome = async () => {
      await go("/os/home");
      await expect(canvas).toHaveAttribute("data-ready", "true");
    };
    const pixels = () => canvas.evaluate(element => element.toDataURL());
    const groups = () => page.evaluate(() => window.circle.localImprint.days.map(day => day.group));
    await showHome();
    const empty = await pixels();
    await go("/os");
    await page.getByRole("button", { name: "Log", exact: true }).click();
    await page.getByRole("button", { name: "Open Week", exact: true }).click();
    const week = page.locator(".os-week-overview");
    await week.getByRole("button", { name: "+ Add goal", exact: true }).click();
    const goal = week.getByRole("textbox", { name: "Goal for this week", exact: true });
    await goal.fill("Read more");
    await goal.blur();
    await week.getByRole("button", { name: "Show steps for Read more", exact: true }).click();
    await week.getByRole("button", { name: "+ Add step", exact: true }).click();
    const step = week.getByRole("textbox", { name: "One step toward this goal", exact: true });
    await step.fill("Read one page");
    await step.blur();
    await context.setOffline(true);
    await week.getByRole("button", { name: "Complete step: Read one page", exact: true }).click();
    await expect.poll(groups).toEqual(["log-week"]);
    await showHome();
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const weekColor = await pixels();
    assert.notEqual(weekColor, empty);

    await go("/os");
    await openRoutineTool(page);
    const routine = page.locator(".os-habit-session");
    await routine.getByRole("button", { name: "Record", exact: true }).click();
    await routine.getByRole("button", { name: "Undo task: Read one page", exact: true }).click();
    await expect.poll(groups).toEqual([]);
    await showHome();
    assert.equal(await pixels(), empty);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");

    await go("/os");
    await openRoutineTool(page);
    await routine.getByRole("button", { name: "Complete task: Read one page", exact: true }).click();
    await expect.poll(groups).toEqual(["routine"]);
    await showHome();
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const routineColor = await pixels();
    assert.notEqual(routineColor, weekColor);
    assert.notEqual(routineColor, empty);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), routineColor);
  }, { account: imprintAccount, reducedMotion: "no-preference" });
});

test("Chapter Imprint counts durable Day One and resumed published finishes", { timeout: 90_000 }, async () => {
  await isolated(390, async (page, context) => {
    const go = path => page.evaluate(path => window.navigate(path), path);
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const days = () => page.evaluate(() => window.circle.localImprint.days);
    const seed = (id, pin = false) => page.evaluate(({ id, pin }) => {
      const api = window.api;
      const chapter = api.publishedChapters.filter(chapter => chapter.id === id).at(-1);
      const terminal = chapter.pages.find(page => page.type === "result");
      const run = { ...api.createChapterRun(chapter), status: "in-progress",
        currentPageId: terminal.id, furthestPageId: terminal.id, startedAt: new Date().toISOString() };
      if (pin) api.writePinnedChapter(id);
      window.circle.updateState(state => ({
        ...state, chapters: { ...state.chapters, runs: {
          ...Object.fromEntries(Object.entries(state.chapters.runs).filter(([, run]) => run.chapterId !== id)),
          [run.runId]: run,
        } },
      }));
      return run.runId;
    }, { id, pin });
    const finish = async (session) => {
      await expect(session.getByText("Swipe when ready", { exact: true })).toBeVisible();
      await session.scrollIntoViewIfNeeded();
      const { x, y, width, height } = await session.boundingBox();
      await page.mouse.move(x + width * .8, y + Math.min(150, height / 2));
      await page.mouse.down();
      await page.mouse.move(x + width * .2, y + Math.min(150, height / 2), { steps: 14 });
      await page.mouse.up();
    };
    const showPulse = async () => {
      await go("/os/home");
      await expect(canvas).toHaveAttribute("data-ready", "true");
      await expect(canvas).toHaveAttribute("data-pulsing", "true");
      await expect(canvas).toHaveAttribute("data-pulsing", "false");
    };
    await go("/os/home");
    await expect(canvas).toHaveAttribute("data-ready", "true");
    assert.deepEqual(await days(), []);
    const dayOne = await seed("day-one");
    await context.setOffline(true);
    await go("/os");
    await finish(page.locator(".os-day-one-session"));
    await expect.poll(async () => (await days())[0]?.sources).toEqual([`chapter:${dayOne}`]);
    await showPulse();
    const [first] = await days();

    const continued = await seed("declare-mission-statement", true);
    await go("/os");
    await finish(page.locator(".os-quest-step-session"));
    await expect.poll(async () => (await days())[0]?.sources.length).toBe(2);
    await showPulse();
    assert.deepEqual(await days(), [{ ...first, sources: [`chapter:${dayOne}`, `chapter:${continued}`] }]);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");

    await seed("declare-vision", true);
    await go("/os");
    await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("circle-os-state-v2")) throw new DOMException("Synthetic full device", "QuotaExceededError");
        return set.call(this, key, value);
      };
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "state") throw new DOMException("Synthetic full device", "QuotaExceededError");
        return put.call(this, value, key);
      };
    });
    const failed = page.waitForEvent("console", { predicate: message => message.text() === "Circle local state could not be saved." });
    await finish(page.locator(".os-quest-step-session"));
    await failed;
    await go("/os/home");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal((await days())[0].sources.length, 2);
  }, { account: imprintAccount, reducedMotion: "no-preference" });
});

test("Log Imprint waits for the end, pulses for a late save, and survives reload", { timeout: 90_000 }, async () => {
  await isolated(390, async (page, context) => {
    await page.clock.setSystemTime(new Date("2026-11-22T14:55:00+07:00"));
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const go = path => page.evaluate(path => window.navigate(path), path);
    const home = async () => {
      await go("/os/home");
      await expect(canvas).toHaveAttribute("data-ready", "true");
    };
    const openLog = async () => {
      await go("/os");
      if (!(await page.locator(".os-log-session").isVisible())) {
        await page.getByRole("button", { name: "Log", exact: true }).click();
      }
    };
    const save = async (hour, words, existing) => {
      const row = page.locator(`[data-log-hour="${hour}"]`);
      if (existing) await row.getByRole("button", { name: existing, exact: true }).click();
      else await row.locator(".os-add-moment").click();
      await row.getByRole("textbox", { name: /^Main activity at/ }).fill(words);
      await row.getByRole("button", { name: "Save main activity", exact: true }).click();
    };
    const days = () => page.evaluate(() => window.circle.localImprint.days);
    await home();
    await context.setOffline(true);
    await openLog();
    await save(14, "An on-time walk");
    await home();
    assert.deepEqual(await days(), []);
    const untilEnd = await page.evaluate(() => Date.parse("2026-11-22T15:00:00+07:00") - Date.now());
    await page.clock.fastForward(untilEnd + 100);
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const [first] = await days();
    assert.equal(first.at, "2026-11-22T08:00:00.000Z");

    await openLog();
    await save(13, "A late walk");
    await expect.poll(async () => (await days())[0]?.sources.length).toBe(2);
    await page.clock.fastForward(10_100);
    await home();
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal((await days())[0].at, first.at);
    assert.equal((await days())[0].sources.length, 2);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");

    await openLog();
    await save(14, "", "An on-time walk");
    await home();
    await expect.poll(async () => (await days())[0]?.sources.length).toBe(1);
    assert.equal((await days())[0].at, first.at);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");

    await openLog();
    await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("circle-os-state-v2")) throw new DOMException("Synthetic full device", "QuotaExceededError");
        return set.call(this, key, value);
      };
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "state") throw new DOMException("Synthetic full device", "QuotaExceededError");
        return put.call(this, value, key);
      };
    });
    const failed = page.waitForEvent("console", { predicate: message => message.text() === "Circle local state could not be saved." });
    await save(12, "A failed save");
    await failed;
    await home();
    assert.equal((await days())[0].sources.length, 1);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await openLog();
    await save(13, "An edited walk", "A late walk");
    await home();
    assert.equal((await days())[0].at, first.at);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    await openLog();
    await save(13, "", "An edited walk");
    await home();
    await expect.poll(days).toEqual([]);
  }, { account: imprintAccount, reducedMotion: "no-preference", clock: true });
});

test("a saved Protocol seal colors Home and a failed re-seal leaves the patch empty", { timeout: 90_000 }, async () => {
  await isolated(390, async (page, context) => {
    await page.evaluate(() => window.circle.updateState(state => {
      const a = window.api;
      state = a.startProtocolDraft(state, "imprint-phase").state;
      state = a.setProtocolDays(state, "imprint-phase", 3);
      state = a.addProtocolItem(state, "imprint-phase", "non-negotiable", "imprint-term").state;
      state = a.updateProtocolItem(state, "imprint-phase", "imprint-term", "Read a page");
      return a.beginProtocolRun(state, "imprint-phase", a.getDateKey());
    }));
    const nav = page.getByRole("navigation", { name: "Circle OS", exact: true });
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const box = page.locator(".os-habit-session");
    const keep = box.getByRole("button", { name: "Keep: Read a page", exact: true });
    const seal = box.getByRole("button", { name: "Completed today", exact: true });
    const days = () => page.evaluate(() => window.circle.localImprint.days);
    const pixels = () => canvas.evaluate(element => element.toDataURL());
    const home = async () => {
      await nav.getByRole("link", { name: "Home", exact: true }).click();
      await expect(canvas).toHaveAttribute("data-ready", "true");
    };
    const protocol = async () => {
      await nav.getByRole("link", { name: "Today", exact: true }).click();
      await openRoutineTool(page, "Protocol");
    };
    const observeSeal = async () => {
      await seal.click();
      await expect(box.getByText("Day 1 of 3 kept", { exact: true })).toBeVisible();
      await expect.poll(async () => (await days()).map(day => day.group)).toEqual(["protocol"]);
      await home();
      await expect(canvas).toHaveAttribute("data-pulsing", "true");
      await expect(canvas).toHaveAttribute("data-pulsing", "false");
    };

    await home();
    const empty = await pixels();
    await context.setOffline(true);
    await protocol();
    await keep.click();
    await expect(seal).toBeVisible();
    await home();
    assert.equal(await pixels(), empty);
    await protocol();
    await observeSeal();
    const [first] = await days();
    const colored = await pixels();
    assert.notEqual(colored, empty);
    await context.setOffline(false);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.equal(await pixels(), colored);

    await protocol();
    await box.getByRole("button", { name: "Undo: Read a page", exact: true }).click();
    await expect.poll(days).toEqual([]);
    await home();
    assert.equal(await pixels(), empty);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    await protocol();
    await keep.click();
    await observeSeal();
    assert.deepEqual(await days(), [first]);
    assert.equal(await pixels(), colored);

    await protocol();
    await box.getByRole("button", { name: "Undo: Read a page", exact: true }).click();
    await expect.poll(days).toEqual([]);
    await expect(keep).toHaveAttribute("aria-busy", "false");
    await keep.click();
    await expect(seal).toBeVisible();
    await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("circle-os-state-v2")) throw new DOMException("Synthetic full device", "QuotaExceededError");
        return set.call(this, key, value);
      };
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "state") throw new DOMException("Synthetic full device", "QuotaExceededError");
        return put.call(this, value, key);
      };
    });
    const failed = page.waitForEvent("console", { predicate: message => message.text() === "Circle local state could not be saved." });
    await seal.click();
    await failed;
    await home();
    assert.equal(await pixels(), empty);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    await page.reload();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    assert.equal(await pixels(), empty);
    assert.deepEqual(await days(), []);
  }, { account: imprintAccount, reducedMotion: "no-preference" });
});

test("Home draws the sharper Imprint on a high-density screen and falls back when its asset fails", { timeout: 90_000 }, async () => {
  await isolated(390, async page => {
    const nav = page.getByRole("navigation", { name: "Circle OS", exact: true });
    const home = nav.getByRole("link", { name: "Home", exact: true });
    const today = nav.getByRole("link", { name: "Today", exact: true });
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    const measure = () => canvas.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return [element.width, element.height, rect.width, rect.height];
    });
    let requests = 0;
    const url = "**/os/home/imprint-art/bone-strands-1170?*";
    await page.route(url, async route => { requests++; await route.continue(); });
    await home.click();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    assert.deepEqual(await measure(), [1170, 1755, 390, 585]);
    await today.click();
    await expect(canvas).toHaveCount(0);
    await home.click();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    assert.deepEqual(await measure(), [1170, 1755, 390, 585]);
    assert.equal(requests, 1, "the decoded artwork is reused on return");

    await page.route(url, route => route.fulfill({ status: 404 }));
    await page.reload();
    await ready(page);
    await expect(canvas).toHaveAttribute("data-ready", "true");
    assert.deepEqual(await measure(), [390, 585, 390, 585]);
  }, { account: imprintAccount, deviceScaleFactor: 3 });
});

test("Home claims the Imprint pulse on arrival even when the artwork is delayed", { timeout: 90_000 }, async () => {
  await isolated(390, async page => {
    const nav = page.getByRole("navigation", { name: "Circle OS", exact: true });
    const home = nav.getByRole("link", { name: "Home", exact: true });
    const today = nav.getByRole("link", { name: "Today", exact: true });
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    await page.evaluate(() => {
      window.imprintFrames = [];
      const put = CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData = function (frame, ...args) {
        if (this.canvas.matches(".imprint-loop-reference")) {
          let orange = 0;
          for (let index = 0; index < frame.data.length; index += 4) {
            orange += frame.data[index] - frame.data[index + 1];
          }
          window.imprintFrames.push(orange);
        }
        return put.call(this, frame, ...args);
      };
    });
    const frames = () => page.evaluate(() => {
      const values = window.imprintFrames;
      return { first: values[0], peak: Math.max(...values), settled: values.at(-1) };
    });
    let colorRequested = false;
    const colorLoad = Promise.withResolvers();
    await page.route(url => url.pathname === "/os/home/imprint-art/coordinates-strands-1170", async route => {
      colorRequested = true;
      await colorLoad.promise;
      await route.continue();
    });

    try {
      await page.getByRole("button", { name: "Note", exact: true }).click();
      await notePage(page).getByRole("textbox", { name: "Note title", exact: true }).fill("Note before a slow Home visit");
      await saved(page);
      await expect.poll(() => page.evaluate(() => window.writing.write.status)).toBe("saved");
      await page.clock.fastForward(6_000);
      await notePage(page).getByRole("textbox", { name: "Write a note", exact: true }).fill("I kept writing after the first autosave.");
      await accepted(page, "I kept writing after the first autosave.");
      await page.clock.fastForward(5_000);
      await home.click();
      await expect(page.getByRole("main", { name: "Home", exact: true })).toHaveCount(1);
      await expect.poll(() => colorRequested).toBe(true);
      const plain = page.locator(".imprint-home-art > img");
      await expect(plain).toBeVisible();
      await expect.poll(() => plain.evaluate(element => element.naturalWidth)).toBe(390);
      await expect(page.getByText("Loading artwork…", { exact: true })).toHaveCount(0);
      await expect(canvas).not.toHaveAttribute("data-ready", "true");
      await today.click();
      await expect(canvas).toHaveCount(0);
      await page.clock.fastForward(10_100);
      await home.click();
      await expect(canvas).not.toHaveAttribute("data-ready", "true");
    } finally {
      colorLoad.resolve();
    }

    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    assert.deepEqual(await canvas.evaluate(element => [element.width, element.height]), [1170, 1755]);
    await page.clock.runFor(450);
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    const brightened = await canvas.evaluate(element => element.toDataURL());
    await page.clock.runFor(1_500);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const settled = await canvas.evaluate(element => element.toDataURL());
    assert.notEqual(brightened, settled);
    const firstNote = await frames();
    assert.ok(firstNote.first < firstNote.settled, "the first frame still shows the previous color");
    assert.ok(firstNote.peak > firstNote.settled, "the new color brightens before settling");

    await today.click();
    await home.click();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");

    await today.click();
    await expect(today).toHaveAttribute("aria-current", "page");
    await page.evaluate(async () => {
      const { owner } = window.writing;
      const [first] = Object.values((await window.api.load()).entries);
      const at = new Date().toISOString();
      const draft = {
        id: crypto.randomUUID(), entryId: crypto.randomUUID(), kind: "note", source: null,
        startedAt: at, attribution: first.versions[0].attribution,
        content: { title: "Repeat Note", body: "", tags: [] }, baseGeneration: 0, baseVersionId: null,
      };
      const commit = operation => window.writing.commit({
        ...operation, owner, at, operationId: crypto.randomUUID(),
      });
      await commit({ type: "write-draft", draft, expectedDraftVersion: 0 });
      await commit({ type: "save", draft: { ...draft, version: 1 } });
      window.imprintFrames = [];
    });
    await home.click();
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await page.clock.runFor(1_700);
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const repeatNote = await frames();
    assert.equal(repeatNote.first, firstNote.settled);
    assert.equal(repeatNote.settled, firstNote.settled);
    assert.ok(repeatNote.peak > repeatNote.settled, "a repeat Note lifts the same patch");
  }, { account: imprintAccount, reducedMotion: "no-preference", clock: true, deviceScaleFactor: 2 });
});

test("Home shows saved Imprint growth after reloading before the first visit", { timeout: 90_000 }, async () => {
  await isolated(390, async page => {
    const home = page.getByRole("navigation", { name: "Circle OS", exact: true })
      .getByRole("link", { name: "Home", exact: true });
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    await page.getByRole("button", { name: "Note", exact: true }).click();
    await notePage(page).getByRole("textbox", { name: "Note title", exact: true }).fill("Note before reloading");
    await saved(page);
    await expect.poll(() => page.evaluate(() => window.writing.write.status)).toBe("saved");
    await page.reload();
    await ready(page);
    await home.click();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.ok(await canvas.evaluate(element => {
      const { data } = element.getContext("2d").getImageData(0, 0, element.width, element.height);
      return data.some((value, index) => index % 4 === 0 && value - data[index + 1] > 50);
    }), "the saved Note leaves visible Orange");
  }, { account: imprintAccount, reducedMotion: "no-preference", clock: true });
});

test("3× Home pulses Notes and Routine together after a minute away", { timeout: 90_000 }, async () => {
  await isolated(390, async page => {
    const nav = page.getByRole("navigation", { name: "Circle OS", exact: true });
    const home = nav.getByRole("link", { name: "Home", exact: true });
    const canvas = page.getByRole("img", { name: "Activity colors on the accepted shape" });
    await page.evaluate(() => window.circle.updateState(state => {
      const added = window.api.addHabitDefinition(state);
      return window.api.updateHabitDefinitionParts(added.state, added.id, { action: "Read a page", identity: "A learner" });
    }));
    await page.getByRole("button", { name: "Note", exact: true }).click();
    await notePage(page).getByRole("textbox", { name: "Note title", exact: true }).fill("Two areas on Home");
    await saved(page);
    await expect.poll(() => page.evaluate(() => window.writing.write.status)).toBe("saved");
    await notePage(page).getByRole("button", { name: "Back", exact: true }).click();
    await openRoutineTool(page);
    await page.getByRole("button", { name: "Mark done: Read a page", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.circle.localImprint.days.some(day => day.group === "routine"))).toBe(true);
    await page.locator(".os-habit-session").getByRole("button", { name: "Back", exact: true }).click();
    await page.clock.fastForward(60_000);

    await page.evaluate(() => {
      window.strandFrames = [];
      const put = CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData = function (...args) {
        if (this.canvas.dataset.pulsing === "true") window.strandFrames.push(performance.now());
        return put.apply(this, args);
      };
    });
    await home.click();
    await expect(canvas).toHaveAttribute("data-pulse-groups", "notes routine");
    await expect(canvas).toHaveAttribute("data-pulsing", "true");
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    const timings = await page.evaluate(() => {
      const frames = window.strandFrames;
      const gaps = frames.slice(1).map((time, index) => time - frames[index]).sort((a, b) => a - b);
      return { frames: frames.length, medianMs: gaps[Math.floor(gaps.length / 2)], p95Ms: gaps[Math.floor(gaps.length * .95)] };
    });
    assert.ok(timings.frames > 8, "the two areas draw intermediate frames");
    console.log("3× Home frame intervals at 390px", timings);
    await canvas.screenshot({ path: "outputs/imprint/strands/home-390-3x.png" });
    await page.reload();
    await expect(canvas).toHaveAttribute("data-pulsing", "false");
    assert.deepEqual(await canvas.evaluate(element => [element.width, element.height]), [1170, 1755]);
  }, { account: imprintAccount, reducedMotion: "no-preference", clock: true, deviceScaleFactor: 3 });
});

test("another tab's correction requires review before Note autosave",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  const box=notePage(page);await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Shared synthetic Note");await saved(page);await expect.poll(()=>page.evaluate(()=>window.writing.status)).toBe("ready");
  const other=await context.newPage();await open(other);await other.evaluate(()=>window.api.mount());await ready(other);const otherBox=notePage(other);
  await otherBox.getByRole("textbox",{name:"Write a note",exact:true}).fill("Other saved words.");await accepted(other,"Other saved words.");
  await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("My unsaved words.");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).entries)[0].versions.length)).toBe(2);
  await expect(box.getByText("Review both copies",{exact:true})).toBeVisible();
  await expect(box.getByText("My unsaved words.",{exact:true})).toBeVisible();await expect(box.getByText("Other saved words.",{exact:true})).toBeVisible();
  await expect(box).not.toContainText(/draft|discard/i);await box.getByRole("button",{name:"Keep my text",exact:true}).click();await expect(box.getByRole("textbox",{name:"Write a note",exact:true})).toHaveValue("My unsaved words.");
  await accepted(page,"My unsaved words.");await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).entries)[0].versions.length)).toBe(3);
}));

async function questSetupFixture(page) {
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api,added=a.addHabitDefinition(s,"quest-existing-habit");s=a.updateHabitDefinitionParts(added.state,added.id,{action:"A habit already set",cue:"After breakfast",identity:"Someone who walks"});
    const runs=Object.fromEntries(Object.entries(s.chapters.runs).filter(([id])=>!id.startsWith("habit-building@")&&!id.startsWith("log-setup@")&&!id.startsWith("week-review@")));
    const at="2020-01-01T01:00:00.000Z",answers=[...s.profile.profileCase.survey.answers.filter(a=>!["routine-wake","routine-sleep"].includes(a.questionId)),...[["routine-wake","07:00"],["routine-sleep","23:00"]].map(([questionId,answer])=>({questionId,answer,answeredAt:at,updatedAt:at}))];
    return {...s,chapters:{...s.chapters,runs},profile:{...s.profile,profileCase:{...s.profile.profileCase,survey:{...s.profile.profileCase.survey,answers}}}};
  }));
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);const box=page.locator(".quest-catalogue-apps");await box.scrollIntoViewIfNeeded();await logSettled(box);return box;
}

for(const [width,height]of[[360,667],[390,844]])test(`Quest setup status and reusable View Hide steps at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  const box=await questSetupFixture(page);await expect(box.locator(".quest-count")).toContainText("4 of 5 steps");
  const before=await page.evaluate(()=>JSON.stringify({habits:window.circle.state.habits,days:window.circle.state.days,profile:window.circle.state.profile,chapters:window.circle.state.chapters,goals:window.circle.state.goals,protocol:window.circle.state.protocol,evidence:window.circle.state.evidence,outbox:window.circle.state.outbox}));
  for(let i=0;i<3;i++){
    await box.getByRole("button",{name:"View steps",exact:true}).tap();await expect(box.locator(".quest-steps")).toBeVisible();await logSettled(box);
    await box.getByRole("button",{name:"Hide steps",exact:true}).tap();await expect(box.locator(".quest-steps")).toHaveCount(0);await logSettled(box);
  }
  await box.getByRole("button",{name:"View steps",exact:true}).click();await logSettled(box);await box.screenshot({path:`outputs/quest-setup-${width}.png`});const setup=box.locator(".quest-step").filter({hasText:"Habit"});await expect(setup).toContainText("Already set up");
  await setup.click();await logSettled(box);await expect(box).toContainText("Already set up. No chapter answers were saved.");await expect(box.locator("form,input,textarea")).toHaveCount(0);
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await expect(box.getByLabel("Completed chapters").locator("button")).toHaveCount(4);
  await box.getByRole("button",{name:"Quests",exact:true}).click();await logSettled(box);await expect(box.locator(".quest-steps")).toBeVisible();
  const logStep=box.locator(".quest-step").nth(2);await expect(logStep).toContainText("Already set up");await logStep.click();await logSettled(box);await expect(box).toContainText("Already set up. No chapter answers were saved.");
  assert.equal(await page.evaluate(()=>JSON.stringify({habits:window.circle.state.habits,days:window.circle.state.days,profile:window.circle.state.profile,chapters:window.circle.state.chapters,goals:window.circle.state.goals,protocol:window.circle.state.protocol,evidence:window.circle.state.evidence,outbox:window.circle.state.outbox})),before);
  await page.evaluate(()=>{window.api.writePinnedChapter("habit-building");window.goto("/os");});await ready(page);await expect.poll(()=>page.evaluate(()=>window.api.readPinnedDoor())).toBe(null);await expect(page.locator(".os-habit-session")).toContainText("A habit already set");
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);await page.evaluate(()=>{window.api.writePinnedChapter("log-setup");window.goto("/os");});await ready(page);await expect.poll(()=>page.evaluate(()=>window.api.readPinnedDoor())).toBe(null);await expect(page.locator(".os-log-session").getByRole("button",{name:"History",exact:true})).toBeVisible();
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Completed Quests open history and unfinished steps still launch",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);const box=page.locator(".quest-catalogue-apps");await logSettled(box);await expect(box.getByRole("button",{name:"View history",exact:true})).toBeVisible();
  await box.getByRole("button",{name:"View history",exact:true}).click();await logSettled(box);await expect(box.getByLabel("Completed chapters").locator("button")).toHaveCount(5);await box.screenshot({path:"outputs/completed-quest-history-390.png"});await box.getByLabel("Completed chapters").locator("button").first().click();await logSettled(box);await expect(box).toContainText("No chapter answers were saved.");
  await page.evaluate(()=>window.goto("/os"));await ready(page);await page.evaluate(()=>window.circle.updateState(s=>({...s,chapters:{...s.chapters,runs:Object.fromEntries(Object.entries(s.chapters.runs).filter(([id])=>!id.startsWith("profile-spark-01@")))}})));await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);
  for(let i=0;i<2;i++){await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await logSettled(box);}
  await expect(box.getByRole("button",{name:"View steps",exact:true})).toBeVisible();await box.getByRole("button",{name:"View steps",exact:true}).click();await logSettled(box);const first=box.locator(".quest-step").first();await expect(first).not.toContainText("Done");await first.click();await expect.poll(()=>page.evaluate(()=>window.api.readPinnedDoor())).toBe("chapter:profile-spark-01");await expect(page.locator(".quest-catalogue-apps")).toHaveCount(0);
}));

async function chapterArchive(page,{empty=false,long=false}={}) {
  await page.evaluate(({empty,long})=>window.circle.updateState(s=>{
    const runs={...s.chapters.runs},base=runs["day-one@3"],at="2020-01-02T04:00:00.000Z";
    for(const [id,run] of Object.entries(runs))if(id.startsWith("day-one@")||id.startsWith("week-review@"))runs[id]={...run,completedAt:"2019-01-01T04:00:00.000Z"};
    if(!empty){
      for(const [id,date] of [["day-one@3:history-one",at],["day-one@3:history-two","2020-02-02T04:00:00.000Z"]])runs[id]={...base,runId:id,status:"completed",completedAt:date,answers:Array.from({length:long?26:1},(_,i)=>({pageId:"old-question-"+i,answerKey:"old-key-"+i,questionSnapshot:"An original saved question "+i+"?",value:"Saved raw value",displaySnapshot:"An original saved answer "+i,answeredAt:date,changedAt:date}))};
      runs["week-review@999:missing"]={...base,runId:"week-review@999:missing",chapterId:"week-review",chapterVersion:999,status:"completed",completedAt:null,updatedAt:"2020-03-01T04:00:00.000Z",answers:[{pageId:"old",answerKey:"old",value:0,displaySnapshot:"",answeredAt:at,changedAt:at}]};
    }
    return {...s,chapters:{...s.chapters,runs}};
  }),{empty,long});
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);
  const box=page.locator(".quest-catalogue-apps");await box.scrollIntoViewIfNeeded();await logSettled(box);
  await expect(box.getByRole("button",{name:"Chapter History",exact:true})).toHaveCount(0);
  const entry=box.getByRole("button",{name:"View history",exact:true}),target=await entry.boundingBox();assert.ok(target.width>=44&&target.height>=44);
  await entry.click();await expect(box.getByLabel("Completed chapters")).toBeVisible();await logSettled(box);return box;
}

for(const [width,height]of[[360,667],[390,844]])test(`Chapter history preserves answered runs without replay at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const box=await chapterArchive(page),list=box.getByLabel("Completed chapters");await expect(list.locator("button")).toHaveCount(5);await expect(box).not.toContainText(/Version \d/);
  const snapshot=()=>page.evaluate(async()=>JSON.stringify({profile:window.circle.state.profile,habits:window.circle.state.habits,tasks:window.circle.state.tasks,days:window.circle.state.days,goals:window.circle.state.goals,protocol:window.circle.state.protocol,chapters:window.circle.state.chapters,evidence:window.circle.state.evidence,outbox:window.circle.state.outbox,writing:await window.api.load()}));
  const before=await snapshot();const first=list.locator("button").first(),hit=await first.boundingBox();assert.ok(hit.width>=44&&hit.height>=44);await first.focus();await page.keyboard.press("Enter");await logSettled(box);
  const detail=box.getByLabel("Saved chapter answers");await expect(detail).not.toContainText(/Version \d/);await expect(detail.locator("time")).toHaveAttribute("datetime","2020-02-02T04:00:00.000Z");await expect(detail).toContainText("An original saved question 0?");await expect(detail).toContainText("An original saved answer 0");await expect(box.locator("form,input,textarea")).toHaveCount(0);
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(detail).toBeVisible();
  await box.screenshot({path:`outputs/chapter-history-${width}.png`});
  const m=await box.evaluate(el=>{const p=el.querySelector(".os-chapter-history-page");return {gap:p.querySelector(".os-page-heading").getBoundingClientRect().top-p.querySelector(".os-page-header-left").getBoundingClientRect().bottom,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth};});assert.equal(m.gap,48);assert.ok(m.scrollWidth<=m.width+1);console.log("Chapter history",width,m);
  await box.getByRole("button",{name:"History",exact:true}).tap();await logSettled(box);await list.locator("button").last().tap();await logSettled(box);await expect(box).toContainText("Chapter title unavailable");await expect(detail).toContainText("Original question unavailable");await expect(detail).toContainText("Completion date not recorded");await expect(detail.getByText("0",{exact:true})).toBeVisible();
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await box.getByRole("button",{name:"Quests",exact:true}).click();await logSettled(box);await expect(box.getByRole("button",{name:"View history",exact:true})).toBeVisible();await expect(box.getByRole("button",{name:"Chapter History",exact:true})).toHaveCount(0);assert.equal(await snapshot(),before);
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await logSettled(box);
  const chosenTitle=await box.locator(".quest-page .os-page-main h2").textContent();await box.getByRole("button",{name:"View history",exact:true}).click();await logSettled(box);await box.getByRole("button",{name:"Quests",exact:true}).click();await logSettled(box);await expect(box.locator(".quest-page .os-page-main h2")).toHaveText(chosenTitle);
  await page.reload({waitUntil:"domcontentloaded",timeout:60_000});await ready(page);await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);await expect(box.locator(".quest-page .os-page-main h2")).toHaveText(chosenTitle);await box.getByRole("button",{name:"View history",exact:true}).click();await logSettled(box);await expect(list.locator("button")).toHaveCount(4);
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Chapter history is isolated, reads offline and handles empty/long records",{timeout:90_000},async()=>isolated(360,async(page,context)=>{
  let box=await chapterArchive(page,{long:true});await context.setOffline(true);await box.getByLabel("Completed chapters").locator("button").first().click();await logSettled(box);await expect(box).toContainText("An original saved answer 25");
  for(const width of [360,390]){await page.setViewportSize({width,height:667});await logSettled(box);const m=await box.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length}));assert.ok(m.height>480);assert.ok(m.scrollWidth<=m.width+1);assert.equal(m.scrollers,0);console.log("Long chapter history",width,m);}
  await context.setOffline(false);await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-chapter-b");await window.api.saveCircleState(scope,window.api.fixture());});await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-chapter-b");await expect(box).not.toContainText("An original saved answer");
  await box.getByRole("button",{name:"View history",exact:true}).click();await logSettled(box);await box.getByLabel("Completed chapters").locator("button").first().click();await logSettled(box);await expect(box).toContainText("No chapter answers were saved.");await expect(box).not.toContainText(/Version \d/);
}));

async function readingHistory(page,{empty=false,long=false}={}) {
  await page.evaluate(({empty,long})=>window.circle.updateState(s=>({...s,athenaMemory:{...s.athenaMemory,
    reading:empty?{cover:"",days:[],alive:[],shape:[]}:s.athenaMemory.reading,
    rhythms:[{id:"today-only",statement:"Today-only derived rhythm",sourceRefs:[]}],
    editions:empty?[]:[
      {id:"old-reading",publishedAt:"2020-01-02T04:00:00.000Z",cover:"An older saved reading",days:[{heading:"An older day",paragraphs:long?Array.from({length:28},(_,i)=>"A saved paragraph that grows down the page "+i):["Exact old words.","A second saved paragraph."]}],alive:[],shape:[]},
      {id:"undated-reading",publishedAt:null,cover:"An undated saved reading",shape:[{heading:"An earlier question",paragraphs:["An old saved question?"]}]},
    ]}})),{empty,long});
  await expect.poll(()=>page.evaluate(()=>window.writing?.memory?.editions?.some(e=>e.id==="old-reading")||false)).toBe(!empty);
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);
  const box=page.locator(".athena-reader-session");await box.scrollIntoViewIfNeeded();await logSettled(box);
  const opener=box.getByRole("button",{name:"Athena's Reading",exact:true});await expect(opener).toBeVisible();
  await expect.poll(async()=>Math.round((await opener.boundingBox()).height)).toBe(44);
  const hit=await opener.boundingBox();assert.ok(hit.width>=44&&hit.height>=43.99);
  await opener.focus();await page.keyboard.press("Enter");await logSettled(box);return box;
}

for(const [width,height]of[[360,667],[390,844]])test(`Athena history reads immutable saved editions at ${width}px`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  const box=await readingHistory(page),list=box.getByLabel("Saved readings");await expect(list.locator("button")).toHaveCount(3);
  await expect(list.locator("button").first()).toContainText("Synthetic reading.");await expect(list.locator("button").last()).toContainText("Date not recorded");
  const snapshot=()=>page.evaluate(async()=>JSON.stringify({memory:window.circle.state.athenaMemory,chapters:window.circle.state.chapters,profile:window.circle.state.profile,outbox:window.circle.state.outbox,evidence:window.circle.state.evidence,writing:await window.api.load()}));
  const before=await snapshot();const old=list.getByRole("button",{name:/An older saved reading/});const hit=await old.boundingBox();assert.ok(hit.width>=44&&hit.height>=44);await old.tap();await logSettled(box);
  const detail=box.getByLabel("Saved reading",{exact:true});await expect(detail).toContainText("Exact old words.");await expect(detail).toContainText("A second saved paragraph.");await expect(detail.getByLabel("What feels alive",{exact:true})).toContainText("No saved words for this part.");await expect(detail.getByLabel("Your shape",{exact:true})).toContainText("No saved words for this part.");
  await expect(detail).not.toContainText("Today-only");await expect(detail).not.toContainText("What would you like to notice today?");await expect(detail.locator("time")).toHaveAttribute("datetime","2020-01-02T04:00:00.000Z");await expect(box.locator("input,textarea,form")).toHaveCount(0);
  await box.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(detail).toBeVisible();
  const metrics=await box.evaluate(el=>{const p=el.querySelector(".athena-history-page"),header=p.querySelector(".os-page-header-left"),heading=p.querySelector(".os-page-heading");return {gap:heading.getBoundingClientRect().top-header.getBoundingClientRect().bottom,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth};});assert.equal(metrics.gap,48);assert.ok(metrics.scrollWidth<=metrics.width+1);console.log("Athena history",width,metrics);
  await box.screenshot({path:`outputs/athena-history-${width}.png`});
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);await list.getByRole("button",{name:/An undated saved reading/}).click();await logSettled(box);await expect(detail).toContainText("Date not recorded");await expect(detail).toContainText("An old saved question?");await expect(box.locator("input,textarea,form")).toHaveCount(0);
  await box.getByRole("button",{name:"History",exact:true}).click();await logSettled(box);assert.equal(await snapshot(),before,"browsing changes no saved records or writing");
  await box.getByRole("button",{name:"Athena’s Reading",exact:true}).click();await logSettled(box);await expect(box.locator(".gap-cover")).toBeVisible();
  await page.reload();await ready(page);await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);await box.getByRole("button",{name:"Athena's Reading",exact:true}).click();await logSettled(box);await expect(list.locator("button")).toHaveCount(3);
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

test("Athena history reads offline and closes across account changes",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  const box=await readingHistory(page);await context.setOffline(true);await box.getByRole("button",{name:/An older saved reading/}).click();await expect(box).toContainText("Exact old words.");await context.setOffline(false);
  await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-reading-b");await window.api.saveCircleState(scope,window.api.fixture());});await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-reading-b");await expect(box).not.toContainText("Exact old words.");await expect(box.locator(".gap-cover")).toBeVisible();
  await box.getByRole("button",{name:"Athena's Reading",exact:true}).click();await logSettled(box);await expect(box.getByLabel("Saved readings").locator("button")).toHaveCount(1);await expect(box).not.toContainText("An older saved reading");
}));

test("Athena history shows an empty archive and long editions grow through resize",{timeout:90_000},async()=>isolated(360,async page=>{
  let box=await readingHistory(page,{empty:true});await expect(box).toContainText("No saved readings yet.");await box.getByRole("button",{name:"Athena’s Reading",exact:true}).click();await logSettled(box);
  await page.evaluate(()=>window.goto("/os"));await ready(page);box=await readingHistory(page,{long:true});
  await page.evaluate(()=>window.circle.updateState(s=>({...s,athenaMemory:{...s.athenaMemory,editions:[...s.athenaMemory.editions,...Array.from({length:58},(_,i)=>({id:"many-"+i,publishedAt:new Date(Date.UTC(2021,0,i+1)).toISOString(),cover:"Saved reading "+i,days:[{heading:"A saved day",paragraphs:["Saved words "+i]}]}))]}})));
  await expect(box.getByLabel("Saved readings").locator("button")).toHaveCount(60);await box.getByLabel("Saved readings").locator("button").last().scrollIntoViewIfNeeded();await expect(box.getByLabel("Saved readings").locator("button").last()).toContainText("An undated saved reading");
  await box.getByRole("button",{name:/An older saved reading/}).click();await logSettled(box);await expect(box).toContainText("A saved paragraph that grows down the page 27");
  for(const width of [360,390]){await page.setViewportSize({width,height:667});await logSettled(box);const m=await box.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length}));assert.ok(m.height>480);assert.ok(m.scrollWidth<=m.width+1);assert.equal(m.scrollers,0);console.log("Long Athena history",width,m);}
}));

test("real Reflect reading reply uses the shared ledger and edition source",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);
  const session=page.locator(".athena-reader-session");
  for(let i=0;i<3;i++){await session.evaluate(element=>element.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);}
  const reply=page.locator(".os-writing-embedded");await expect(reply).toBeVisible();
  await expect(reply.locator(".os-deep-thought-question")).toHaveCSS("font-size","28px");
  await expect(reply.locator("textarea")).toHaveCSS("font-size","18px");
  await reply.getByRole("textbox",{name:"Reply to Athena: What would you like to notice today?",exact:true}).fill("Synthetic reading answer.");await expect(reply.getByRole("button",{name:"Send",exact:true})).toBeEnabled();await reply.getByRole("button",{name:"Send",exact:true}).click();await saved(page);
  const entry=Object.values((await page.evaluate(()=>window.api.load())).entries)[0];assert.equal(entry.kind,"reading-answer");assert.equal(entry.source.question,"What would you like to notice today?");assert.match(entry.source.editionId,/^edition-/);
}));

test("account change closes autosave and recovers only the original account's text",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page);await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Only account A");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).drafts).some(item=>item.status==="active"&&item.content.title==="Only account A"))).toBe(true);
  await page.evaluate(async()=>{const scope=window.api.activateAccountScope("synthetic-writer-b");await window.api.saveCircleState(scope,window.api.fixture());});
  await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-writer-b");await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("");assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).drafts).length,0);
  await page.evaluate(()=>window.api.activateAccountScope("synthetic-writer-a"));await expect.poll(()=>page.evaluate(()=>window.writing?.owner)).toBe("account:synthetic-writer-a");await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("Only account A");
}));

for(const width of [360,390])test(`Day One v3 Routine task controls at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  // Keep Day One v3 complete, but remove the older setup completions and
  // recovery markers that would hide the actual fresh-v3 regression.
  await page.evaluate(()=>window.circle.updateState(state=>{
    const runs=Object.fromEntries(Object.entries(state.chapters.runs).filter(([id])=>!id.includes("habit")));
    return {...state,chapters:{...state.chapters,runs},habits:{...state.habits,definitions:{}}};
  }));
  const routine=page.locator(".os-habit-session");
  const add=routine.getByRole("button",{name:"Add task",exact:true});
  await expect(add).toBeVisible();
  await add.click();
  const task=routine.getByRole("textbox",{name:"Edit task: New Task",exact:true});
  await task.fill("Synthetic task after v3");await routine.getByRole("textbox",{name:"Edit task: Synthetic task after v3",exact:true}).blur();
  await routine.getByRole("button",{name:"New habit",exact:true}).click();
  const habit=routine.getByRole("textbox",{name:"Edit habit: New Habit",exact:true});
  await habit.fill("Synthetic habit after v3");await routine.getByRole("textbox",{name:"Edit habit: Synthetic habit after v3",exact:true}).blur();
  const habitTick=routine.locator(".os-repeated-habit .os-row-tick-habit");
  const taskTick=routine.getByRole("button",{name:"Complete task: Synthetic task after v3",exact:true});
  for(const tick of [habitTick,taskTick]){
    await expect(tick).toHaveCSS("width","44px");await expect(tick).toHaveCSS("height","44px");
    const hit=await tick.locator(".os-creative-button-label").boundingBox();assert.ok(hit.width>=44&&hit.height>=44,"row tick touch area");
  }
  await habitTick.locator(".os-creative-button-label").click({position:{x:1,y:22}});await expect(habitTick).toHaveAttribute("aria-pressed","true");
  await expect(habitTick.locator('.os-checkbox-mark')).toHaveText('✓');await expect(habitTick.locator('.os-checkbox-mark')).toHaveCSS('opacity','1');
  await expect(habitTick).toHaveAttribute("aria-busy","false");
  await habitTick.click();await expect(habitTick).toHaveAttribute("aria-pressed","false");
  await taskTick.click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.tasks.items).find(t=>t.text==="Synthetic task after v3")?.status)).toBe("completed");
  await expect.poll(()=>page.evaluate(async()=>{const s=await window.api.loadCircleState(window.api.getAccountScope());return Object.values(s.tasks.items).some(t=>t.text==="Synthetic task after v3"&&t.status==="completed");})).toBe(true);
  await page.reload();await ready(page);await expect(add).toBeVisible();
  await expect(routine.getByRole("textbox",{name:"Edit habit: Synthetic habit after v3",exact:true})).toBeVisible();
  assert.equal(await page.evaluate(()=>Object.values(window.circle.state.chapters.runs).some(r=>r.chapterId==="habit-building"&&r.status==="completed")),false,"no false setup completion");
  await routine.getByRole("button",{name:"Record",exact:true}).click();
  await expect(add).toHaveCount(0);
  const undo=routine.getByRole("button",{name:"Undo task: Synthetic task after v3",exact:true});await expect(undo).toBeVisible();await undo.click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.tasks.items).find(t=>t.text==="Synthetic task after v3")?.status)).toBe("open");
}));

for(const width of [360,390])test(`Habit dated history scrolls separately and keeps today's Undo at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  const dates=await page.evaluate(()=>{
    const a=window.api,today=a.getDateKey(),yesterday=a.previousDateKey(today);
    let past=yesterday;for(let i=0;i<7;i++)past=a.previousDateKey(past);
    window.circle.updateState(s=>{
      let added=a.addHabitDefinition(s,"history-snapshot");
      s=a.updateHabitDefinitionParts(added.state,added.id,{action:"Original walk",cue:"after coffee",identity:"A steady walker"});
      s=a.toggleHabitForDay(s,added.id,past);
      s=a.toggleHabitForDay(s,added.id,yesterday);
      let older=past;for(let i=0;i<12;i++){older=a.previousDateKey(older);s=a.toggleHabitForDay(s,added.id,older);}
      s=a.updateHabitDefinitionParts(s,added.id,{action:"Renamed action",cue:"at night",identity:"New identity"});
      s.habits.definitions[added.id].status="archived";
      added=a.addHabitDefinition(s,"history-legacy");s=a.updateHabitDefinition(added.state,added.id,"Legacy current wording");s=a.toggleHabitForDay(s,added.id,past);delete s.habits.completions[past+":"+added.id].snapshot;
      added=a.addHabitDefinition(s,"history-orphan");s=a.updateHabitDefinition(added.state,added.id,"Unavailable old wording");s=a.toggleHabitForDay(s,added.id,past);delete s.habits.completions[past+":"+added.id].snapshot;delete s.habits.definitions[added.id];
      added=a.addHabitDefinition(s,"history-today");s=a.updateHabitDefinition(added.state,added.id,"Today only");s=a.toggleHabitForDay(s,added.id,today);
      s.tasks.items["history-task"]={id:"history-task",text:"Older task",status:"completed",createdAt:past+"T12:00:00+07:00",updatedAt:past+"T12:00:00+07:00",completedAt:past+"T12:00:00+07:00"};
      return s;
    });return {today,yesterday,past};
  });
  await expect.poll(()=>page.evaluate(async()=>Boolean((await window.api.loadCircleState(window.api.getAccountScope())).habits.completions[window.api.getDateKey()+":history-today"]?.completed))).toBe(true);
  const routine=page.locator(".os-habit-session");await routine.getByRole("button",{name:"Record",exact:true}).click();
  const historyButton=routine.getByRole("button",{name:"History",exact:true});await expect(historyButton).toHaveCount(0);await expect(routine).not.toHaveClass(/\bos-app-flip\b/);
  await expect(routine.locator(".os-page-header")).toHaveText("Back");
  await expect(routine.getByRole("combobox")).toHaveCount(0);await expect(routine.locator(".os-record-seam")).toHaveCount(0);
  await expect(routine.getByRole("button",{name:"Back",exact:true})).toBeVisible();
  const before=await page.evaluate(()=>JSON.stringify({habits:window.circle.state.habits,tasks:window.circle.state.tasks,protocol:window.circle.state.protocol}));
  const history=routine.locator('[aria-label="Habit history"]');await expect(history).toBeVisible();await expect(routine).not.toHaveClass(/\bos-app-flip\b/);
  const past=history.locator(`[aria-label="${dates.past}"]`);
  const originalCopy=()=>past.locator(".os-record-habit-copy").filter({has:page.getByText("Original walk",{exact:true})});
  await expect(originalCopy().locator("p")).toHaveText(["Original walk", "after coffee", "A steady walker"]);
  await expect(past).not.toContainText("To become");
  await expect(past).not.toContainText("Renamed action");await expect(past).toContainText("Legacy current wording");
  await expect(history).not.toContainText("Original wording");await expect(past).toContainText("Older task");
  await expect(history.locator(`[aria-label="${dates.yesterday}"] .os-record-label`)).toHaveText("Yesterday");
  await expect(history).not.toContainText(dates.yesterday);await expect(past.locator(".os-record-label")).toHaveText(dates.past);
  await expect(history.getByRole("button")).toHaveCount(0);await expect(history.getByRole("textbox")).toHaveCount(0);
  assert.equal(await page.evaluate(()=>JSON.stringify({habits:window.circle.state.habits,tasks:window.circle.state.tasks,protocol:window.circle.state.protocol})),before,"browsing does not write records or replay outcomes");
  const layout=await routine.evaluate(el=>({scroll:[...el.querySelectorAll("*")].some(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1),overflow:el.scrollWidth>el.clientWidth+1}));
  assert.deepEqual(layout,{scroll:false,overflow:false});
  assert.ok((await routine.boundingBox()).height>(width===360?667:844),"long history grows with its records");
  await history.locator(".os-habit-history-day").last().scrollIntoViewIfNeeded();
  await routine.screenshot({path:`outputs/habit-history-list-${width}.png`});
  // Today and read-only past records coexist on one Page.
  await routine.getByRole("button",{name:"Undo: Today only",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.circle.state.habits.completions[window.api.getDateKey()+":history-today"].completed)).toBe(false);
  await expect.poll(()=>page.evaluate(async()=>Boolean((await window.api.loadCircleState(window.api.getAccountScope())).habits.completions[window.api.getDateKey()+":history-today"]?.completed))).toBe(false);
  assert.equal(await page.evaluate(()=>window.circle.state.habits.completions[Object.keys(window.circle.state.habits.completions).find(k=>k.endsWith(":history-snapshot"))].completed),true);
  await page.reload();await ready(page);await routine.getByRole("button",{name:"Record",exact:true}).click();await expect(historyButton).toHaveCount(0);await expect(originalCopy().locator("p")).toHaveText(["Original walk","after coffee","A steady walker"]);
  assert.equal(await page.evaluate(()=>window.circle.state.habits.completions[window.api.getDateKey()+":history-today"].completed),false);
  await routine.getByRole("button",{name:"Back",exact:true}).click();await expect(routine.getByRole("button",{name:"Add task",exact:true})).toBeVisible();
},{reducedMotion:width===390?"no-preference":"reduce",height:width===360?667:844}));

for(const width of [360,390])test(`new Habit accepts cue and identity before its required name at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session"),add=routine.getByRole("button",{name:"New habit",exact:true});
  const action=()=>routine.getByRole("textbox",{name:"Edit habit: New Habit",exact:true});
  const cue=()=>routine.getByRole("textbox",{name:"When you do it: New Habit",exact:true});
  const identity=()=>routine.getByRole("textbox",{name:"Who this makes you: New Habit",exact:true});
  const revision=await page.evaluate(()=>window.circle.state.evidence.localRevision);
  await add.click();await expect(identity()).toBeVisible();await cue().fill("After lunch");await identity().fill("A steady walker");
  await expect(action()).toHaveValue("");await expect(routine.getByRole("button",{name:"Mark done: New Habit",exact:true})).toBeDisabled();
  await routine.getByRole("button",{name:"New habit",exact:true}).focus();await expect(action()).toHaveCount(0);
  const draft=await page.evaluate(()=>Object.values(window.circle.state.habits.definitions).find(h=>h.status==="draft"));assert.equal(draft.cue,"After lunch");assert.equal(draft.identity,"A steady walker");
  assert.equal(await page.evaluate(()=>window.circle.state.evidence.localRevision),revision,"unnamed fields do not save an active habit");
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.loadCircleState(window.api.getAccountScope())).habits.definitions).find(h=>h.status==="draft")?.identity)).toBe("A steady walker");
  await page.reload();await ready(page);await expect(action()).toHaveCount(0);await add.click();await expect(cue()).toHaveValue("After lunch");await expect(identity()).toHaveValue("A steady walker");
  await action().fill("Cue first walk");await routine.getByRole("textbox",{name:"When you do it: Cue first walk",exact:true}).focus();
  await routine.getByRole("button",{name:"New habit",exact:true}).focus();await expect(routine.getByRole("textbox",{name:"Edit habit: Cue first walk",exact:true})).toBeVisible();
  await add.click();await identity().fill("A reader");await cue().fill("Before bed");await action().fill("Identity first read");await routine.getByRole("button",{name:"New habit",exact:true}).focus();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.habits.definitions).filter(h=>h.status==="active"&&h.text.trim()).length)).toBe(2);
  const names=await page.evaluate(()=>Object.values(window.circle.state.habits.definitions).filter(h=>h.status==="active").map(h=>({action:h.action,cue:h.cue,identity:h.identity})));assert.deepEqual(names,[{action:"Cue first walk",cue:"After lunch",identity:"A steady walker"},{action:"Identity first read",cue:"Before bed",identity:"A reader"}]);
  await add.click();await cue().fill("Unfinished cue");await action().fill("   ");await routine.getByRole("button",{name:"New habit",exact:true}).focus();await expect(action()).toHaveCount(0);
  assert.equal(await page.evaluate(()=>Object.values(window.circle.state.habits.definitions).filter(h=>h.status==="draft").length),1);
  await routine.getByRole("button",{name:"Mark done: Cue first walk",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.habits.completions).find(c=>c.snapshot?.action==="Cue first walk")?.completed)).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.loadCircleState(window.api.getAccountScope())).habits.definitions).filter(h=>h.status==="active"&&h.text.trim()).length)).toBe(2);
  await page.reload();await ready(page);await expect(routine.getByRole("textbox",{name:"Edit habit: Identity first read",exact:true})).toBeVisible();await expect(action()).toHaveCount(0);
}));

for(const width of [360,390])test(`empty Habit History keeps the shared resting frame at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session");await routine.getByRole("button",{name:"Record",exact:true}).click();
  await expect(routine.locator('[aria-label="Habit history"]')).toHaveText("No past records yet.");
  await expect.poll(async()=>Math.round((await routine.boundingBox()).height)).toBe(Math.max(344,844-180)+2);
  assert.equal(await routine.locator(".os-page-body").evaluate(el=>el.scrollHeight>el.clientHeight+1),false);
  await expect(routine.getByRole("combobox")).toHaveCount(0);
}));

async function finishedProtocol(page, terms = 1) {
  return page.evaluate(terms=>{
    const a=window.api,key=a.previousDateKey(a.getDateKey());
    window.circle.updateState(s=>{
      s=a.startProtocolDraft(s,"review-phase").state;s=a.setProtocolDays(s,"review-phase",1);
      for(let i=0;i<terms;i++){
        s=a.addProtocolItem(s,"review-phase","non-negotiable","review-term-"+i).state;
        s=a.updateProtocolItem(s,"review-phase","review-term-"+i,"Synthetic required term "+i);
      }
      s=a.addProtocolItem(s,"review-phase","negotiable","review-extra").state;
      s=a.updateProtocolItem(s,"review-phase","review-extra","Synthetic extra term");
      s=a.beginProtocolRun(s,"review-phase",key);
      for(let i=0;i<terms;i++)s=a.toggleProtocolItem(s,"review-term-"+i,key);
      return a.sealProtocolDay(s,key);
    });return key;
  },terms);
}

for (const width of [360,390]) test(`Protocol wording edits start tomorrow and retain dated history at ${width}px`, {timeout:90_000}, async()=>isolated(width, async(page,context)=>{
  await openRoutineTool(page);
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api, today=a.getDateKey();
    s=a.startProtocolDraft(s,"wording-phase").state;
    s=a.setProtocolDays(s,"wording-phase",3);
    s=a.addProtocolItem(s,"wording-phase","non-negotiable","wording-walk").state;
    s=a.updateProtocolItem(s,"wording-phase","wording-walk","Walk 10 minutes");
    return a.beginProtocolRun(s,"wording-phase",a.previousDateKey(today));
  }));
  const routine=page.locator(".os-habit-session");
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await expect(routine.getByRole("button",{name:"Keep: Walk 10 minutes",exact:true})).toBeVisible();
  await routine.getByRole("button",{name:"Keep: Walk 10 minutes",exact:true}).click();
  await expect(routine.getByRole("button",{name:"Undo: Walk 10 minutes",exact:true})).toBeVisible();
  const evidence=await page.evaluate(()=>JSON.stringify({completions:window.circle.state.protocol.completions,seals:window.circle.state.protocol.seals}));
  await context.setOffline(true);
  await routine.getByRole("button",{name:"Edit",exact:true}).click();
  await expect(routine).toContainText("Term changes start next Circle day at 06:00.");
  await routine.locator(".os-protocol-block-edit").fill("Walk 30 minutes");
  await routine.getByRole("button",{name:"Done",exact:true}).click();
  await expect(routine.getByRole("button",{name:"Undo: Walk 10 minutes",exact:true})).toBeVisible();
  assert.equal(await page.evaluate(()=>JSON.stringify({completions:window.circle.state.protocol.completions,seals:window.circle.state.protocol.seals})),evidence);
  await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.loadCircleState(window.api.getAccountScope())).protocol.termVersions).length)).toBeGreaterThan(1);
  await context.setOffline(false);await page.reload();await ready(page);
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await expect(routine.getByRole("button",{name:"Undo: Walk 10 minutes",exact:true})).toBeVisible();
  await routine.getByRole("button",{name:"Edit",exact:true}).click();
  await expect(routine.locator(".os-protocol-block-edit")).toHaveValue("Walk 30 minutes");
  await routine.getByRole("button",{name:"Done",exact:true}).click();
  await page.evaluate(()=>window.circle.updateState(s=>window.api.endProtocolRun(s,"wording-phase","completed")));
  const home=routine.locator(".os-protocol-home");await home.locator(".os-protocol-past-head").click();
  const rows=home.locator(".os-protocol-record-term");await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Walk 10 minutes");await expect(rows.nth(0)).toContainText("1/2");
  await expect(rows.nth(1)).toContainText("Walk 30 minutes");await expect(rows.nth(1)).toContainText("0/1");
  const saved=await page.evaluate(()=>JSON.stringify(window.circle.state.protocol));
  await rows.nth(0).click();assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.protocol)),saved);
  await rows.nth(1).scrollIntoViewIfNeeded();
  await routine.screenshot({path:`outputs/protocol-wording-${width}.png`});
}, {height:width===360?667:844,reducedMotion:width===390?"no-preference":"reduce"}));

async function protocolHistory(page) {
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session");
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  const home=routine.locator(".os-protocol-home");await expect(home).toBeVisible();
  await home.locator(".os-protocol-past-head").click();return {routine,home};
}

for(const width of [360,390])test(`Protocol finished history stays read only without correction controls at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await finishedProtocol(page);const {home}=await protocolHistory(page);
  const before=await page.evaluate(()=>JSON.stringify(window.circle.state.protocol));
  await home.locator(".os-protocol-record-term").first().click();
  await expect(home.locator(".os-protocol-record-kept")).toHaveCount(0);
  await expect(home.getByRole("button",{name:/Correct last day|Save correction|last day:/})).toHaveCount(0);
  await expect(home.locator("button.os-protocol-record-term")).toHaveCount(0);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.protocol)),before,"browsing cannot alter a completed phase");
  await page.reload();await ready(page);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.protocol)),before,"reload preserves the complete history");
},{reducedMotion:width===390?"no-preference":"reduce"}));

for(const width of [360,390,1280])test(`Protocol term inputs hide native scrollbars and keep wrapped text at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session");
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await routine.getByRole("button",{name:"Start a phase",exact:true}).click();
  const terms=["A synthetic non-negotiable with enough words to wrap across multiple lines in the term field.","A synthetic negotiable with enough words to wrap across multiple lines in the term field."];
  const measure=field=>field.evaluate(el=>({height:el.getBoundingClientRect().height,client:el.clientHeight,scroll:el.scrollHeight,width:el.clientWidth,scrollWidth:el.scrollWidth,scrollbar:getComputedStyle(el).scrollbarWidth,webkit:getComputedStyle(el,"::-webkit-scrollbar").display}));
  for(const [index,kind] of ["non-negotiable","negotiable"].entries()){
    await routine.getByRole("button",{name:`Add a ${kind}`,exact:true}).click();
    const field=routine.locator(".os-protocol-block-edit").nth(index);await expect(field).toHaveValue("");
    await field.fill("Short term");const short=await measure(field);
    await field.fill(terms[index]);const long=await measure(field);
    assert.equal(long.scrollbar,"none");assert.equal(long.webkit,"none");
    assert.ok(long.scroll<=long.client+1,"wrapped text is not clipped vertically");assert.ok(long.scrollWidth<=long.width+1,"no horizontal overflow");
    if(width<500)assert.ok(long.height>short.height,"term grows with real content");
    await expect(field).toHaveValue(terms[index]);console.log("Protocol term input",width,kind,JSON.stringify({short,long}));
  }
  if(width===390)await routine.screenshot({path:"outputs/protocol-inputs-390.png"});
  await routine.getByRole("button",{name:"Begin 7 days",exact:true}).click();
  await expect(routine.locator(".os-protocol-block-text")).toHaveText(terms);
  await page.reload();await ready(page);
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await expect(routine.locator(".os-protocol-block-text")).toHaveText(terms);
  await routine.getByRole("button",{name:`Keep: ${terms[0]}`,exact:true}).click();
  await expect(routine.getByRole("button",{name:`Undo: ${terms[0]}`,exact:true})).toHaveAttribute("aria-pressed","true");
},{height:width===360?667:844}));

for(const [width,height] of [[360,667],[390,844]])test(`Protocol past phases grow naturally and retain read-only records at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const {home}=await protocolHistory(page),summary=home.locator(".os-protocol-past-head");await summary.click();
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api;let key=a.previousDateKey(a.getDateKey());for(let i=0;i<6;i++)key=a.previousDateKey(key);
    for(let i=0;i<12;i++){
      const id="past-phase-"+i,days=i%2?7:1;s=a.startProtocolDraft(s,id).state;s=a.setProtocolDays(s,id,days);s=a.renameProtocolRun(s,id,"Synthetic phase "+i);
      for(const kind of ["non-negotiable","negotiable"]){const term=id+"-"+kind;s=a.addProtocolItem(s,id,kind,term).state;s=a.updateProtocolItem(s,id,term,kind==="non-negotiable"?"Write a line":"Read a page");}
      s=a.beginProtocolRun(s,id,key);s=a.toggleProtocolItem(s,id+"-non-negotiable",key);s=a.endProtocolRun(s,id,i%3?"completed":"ended");
    }return s;
  }));
  await expect(home.locator(".os-protocol-past-count")).toHaveText("12");await summary.click();
  const before=await page.evaluate(()=>JSON.stringify(window.circle.state.protocol));
  for(let i=0;i<12;i++){
    const record=home.locator(".os-protocol-record").filter({has:page.getByRole("heading",{name:"Synthetic phase "+i,exact:true})}),days=i%2?7:1;
    await expect(record.locator(".os-protocol-record-kept")).toHaveCount(0);
    await expect(record.locator(".os-protocol-record-term small:first-of-type")).toHaveText([`1/${days}`,`0/${days}`]);
    await expect(record.locator("button.os-protocol-record-term")).toHaveCount(0);
    const hit=await record.getByRole("button",{name:/Remove phase record:/}).boundingBox();assert.ok(hit.width>=44&&hit.height>=44);
  }
  const dimensions=await home.evaluate(el=>({height:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth+1,scrollers:[...el.querySelectorAll("*")].filter(n=>["auto","scroll"].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).length}));
  assert.ok(dimensions.height>height);assert.equal(dimensions.overflow,false);assert.equal(dimensions.scrollers,0);
  await home.locator(".os-protocol-record").last().scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.protocol)),before);
  await page.reload();await ready(page);const reopened=await protocolHistory(page);
  await expect(reopened.home.locator(".os-protocol-record")).toHaveCount(12);
  const remove=reopened.home.locator(".os-protocol-record").last().getByRole("button",{name:/Remove phase record:/});
  await remove.click();await expect(remove).toHaveText("Tap again to remove");await expect(reopened.home.locator(".os-protocol-record")).toHaveCount(12);
  await remove.click();await expect(reopened.home.locator(".os-protocol-record")).toHaveCount(11);
  assert.deepEqual(await page.evaluate(()=>window.circle.state.protocol.completions),JSON.parse(before).completions);
  console.log("Full-page Protocol history",width,dimensions);
},{height,reducedMotion:width===390?"no-preference":"reduce"}));

for(const width of [360,390,416])test(`Routine approved edges and navigation at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.evaluate(()=>window.circle.updateState(s=>{
    const a=window.api;
    s=a.updateHabitDefinitionParts(a.addHabitDefinition(s,'edge-habit').state,'edge-habit',{action:'Read a page',cue:'After breakfast',identity:'A reader'});
    return a.updateTask(a.addTask(s,'edge-task').state,'edge-task','Call a friend');
  }));
  await openRoutineTool(page);
  const box=page.locator('.os-habit-session');
  const geometry=await box.evaluate(frame=>{
    const b=frame.getBoundingClientRect();
    const left=el=>el.getBoundingClientRect().left-b.left-1;
    const right=el=>b.right-el.getBoundingClientRect().right-1;
    return {head:left(frame.querySelector('#habit-session-title')),cross:left(frame.querySelector('.os-routine-clear-cross')),copy:left(frame.querySelector('.os-habit-copy-swap')),back:left(frame.querySelector('.os-page-header-left .os-routine-nav-text')),record:right(frame.querySelector('.os-page-header-right .os-routine-nav-text')),cue:right(frame.querySelector('.os-routine-swipe-cue button')),arrowGap:getComputedStyle(frame.querySelector('.os-routine-swipe-cue button')).gap,sectionGap:getComputedStyle(frame.querySelector('.os-routine-body')).gap,buttons:[...frame.querySelectorAll('.os-routine-create')].map(el=>({left:left(el),right:right(el),height:el.getBoundingClientRect().height,size:getComputedStyle(el).fontSize})),tick:right(frame.querySelector('.os-row-tick'))+8};
  });
  for(const key of ['head','cross','back','record','cue','tick'])assert.ok(Math.abs(geometry[key]-24)<.6,`${key}: ${JSON.stringify(geometry)}`);
  assert.ok(Math.abs(geometry.copy-44)<.6);assert.equal(geometry.arrowGap,'4px');assert.equal(geometry.sectionGap,'40px');
  for(const button of geometry.buttons){assert.ok(Math.abs(button.left-24)<.6&&Math.abs(button.right-24)<.6);assert.equal(button.height,52);assert.equal(button.size,'18px');}
  const evidence=await page.evaluate(()=>JSON.stringify(window.circle.state.habits));
  const cueEdge=await box.locator('.os-routine-swipe-cue button span').evaluate(el=>{const frame=el.closest('.os-habit-session').getBoundingClientRect(),glyph=el.getBoundingClientRect();return {right:frame.right-glyph.right-1,bottom:frame.bottom-glyph.bottom-1};});
  assert.ok(Math.abs(cueEdge.right-24)<.6,JSON.stringify(cueEdge));
  await box.locator('.os-routine-swipe-cue button').click();await expect(box.locator('.os-protocol-home')).toBeVisible();
  const returning=box.locator('.os-protocol-home .os-routine-swipe-cue button');await expect(returning).toHaveAccessibleName('Open Routine');
  await expect.poll(()=>returning.evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.closest('.os-habit-session').getBoundingClientRect().left-25))).toBeLessThan(.6);
  await returning.click();await expect(box.locator('.os-routine-body')).toBeVisible();
  await box.getByRole('button',{name:'Record',exact:true}).click();await expect(box.locator('.os-habit-history-list')).toBeVisible();
  await box.getByRole('button',{name:'Back',exact:true}).click();await expect(box.locator('.os-routine-body')).toBeVisible();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.circle.state.habits)),evidence);
  await box.screenshot({path:`outputs/routine-approved-${width}.png`});
}));

for(const [width,height] of [[360,740],[390,844],[416,844]])test(`Routine first entries fit the phone at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async page=>{
  await openRoutineTool(page);
  for(const [habit,task] of [[false,false],[true,false],[false,true],[true,true]]){
    await page.evaluate(()=>window.circle.updateState(()=>window.api.fixture()));
    if(habit){
      await page.getByRole('button',{name:'New habit',exact:true}).click();
      await page.locator('.os-repeated-habit textarea').first().fill('Read a page');
      await page.locator('.os-habit-cue-edit').fill('After breakfast');
      await page.locator('#habit-session-title').click();
    }
    if(task){
      await page.getByRole('button',{name:'Add task',exact:true}).click();
      await page.locator('.os-task-row textarea').fill('Call a friend');
      await page.locator('#task-session-title').click();
    }
    await expect(page.locator('.os-repeated-habit')).toHaveCount(habit?1:0);
    await expect(page.locator('.os-task-row')).toHaveCount(task?1:0);
    const fit=await page.evaluate(()=>{const b=document.querySelector('.os-habit-session').getBoundingClientRect();return {viewport:innerHeight,document:document.scrollingElement.scrollHeight,frameTop:b.top,frameBottom:b.bottom,frameHeight:b.height};});
    console.log('Routine phone fit',width,height,{habit,task,...fit});
    assert.ok(fit.document<=height+1,JSON.stringify({habit,task,...fit}));
    assert.ok(fit.frameTop>=0&&fit.frameBottom<=height+1);
  }
},{height}));

test('Routine header reflection stays inside text and respects reduced motion',{timeout:60_000},async()=>isolated(390,async page=>{
  await openRoutineTool(page);const record=page.locator('.os-habit-session').getByRole('button',{name:'Record',exact:true});
  await record.dispatchEvent('pointerdown');
  const result=await record.locator('span').evaluate(el=>({clip:getComputedStyle(el).backgroundClip,animations:el.getAnimations().map(a=>({duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes().map(f=>f.backgroundPosition)}))}));
  assert.equal(result.clip,'text');assert.equal(result.animations[0].duration,240);assert.deepEqual(result.animations[0].frames,['100% 0px','0% 0px']);
  const back=page.locator('.os-habit-session').getByRole('button',{name:'Back',exact:true});await back.dispatchEvent('pointerdown');
  assert.deepEqual(await back.locator('span').evaluate(el=>el.getAnimations()[0].effect.getKeyframes().map(f=>f.backgroundPosition)),['0% 0px','100% 0px']);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(260);await record.dispatchEvent('pointerdown');assert.equal(await record.locator('span').evaluate(el=>el.getAnimations().length),0);
},{reducedMotion:'no-preference'}));

for(const width of [360,390])test(`shared App Box geometry at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  async function measure(selector){await expect.poll(()=>page.locator(selector).evaluate(el=>el.closest(".os-swipe-session").getBoundingClientRect().height)).toBe(670);return page.locator(selector).evaluate(el=>{
    const frame=el.closest(".os-swipe-session"),header=el.querySelector(".os-page-header-left");
    const main=el.querySelector(".os-routine-body, .os-protocol-past, textarea, input, h1, h2, [data-os-main-text]");
    return {height:frame.getBoundingClientRect().height,gap:main.getBoundingClientRect().top-header.getBoundingClientRect().bottom,scroll:el.scrollHeight>el.clientHeight+1};
  });}
  await page.getByRole("button",{name:"Notes",exact:true}).click();
  const result={note:await measure(".os-writing-page.os-note-page")};
  await thoughts(page);result.thoughts=await measure(".os-writing-page.os-thoughts-page");
  await page.getByRole("navigation",{name:"Circle OS",exact:true}).getByRole("link",{name:"Today",exact:true}).click();
  await openRoutineTool(page);result.habit=await measure(".os-habit-session .os-page-layout");
  const routine=page.locator(".os-habit-session");
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await expect(routine.locator(".os-protocol-home")).toBeVisible();await page.waitForTimeout(450);
  result.protocol=await measure(".os-habit-session .os-page-layout");
  console.log("Measured App Boxes",width,JSON.stringify(result));
  assert.equal(result.note.height,670);assert.equal(result.thoughts.height,670);
  assert.ok(Math.abs(result.habit.height-result.protocol.height)<=1,"full-page tools share one minimum");
  assert.equal(result.habit.height,result.note.height,"opened writing and tools share the approved full-page floor");
  for(const item of Object.values(result)){assert.equal(item.scroll,false);assert.ok(Math.abs(item.gap-24)<=1,"approved content anchor");}
}));

test("new typing during delayed autosave is saved again without losing either version",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page);
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{if(new TextDecoder().decode(args[1]).includes('"type":"save"')){crypto.subtle.digest=digest;await new Promise(resolve=>window.releaseSave=resolve);}return digest(...args);};});
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Snapshot at Save");await page.waitForFunction(()=>Boolean(window.releaseSave));
  await expect(box).not.toContainText(/Saving on this device|Saved on this device/);
  await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("Newer typing after Save.");await page.evaluate(()=>window.releaseSave());await saved(page);
  await expect(box.getByRole("textbox",{name:"Write a note",exact:true})).toHaveValue("Newer typing after Save.");await accepted(page,"Newer typing after Save.");
  const ledger=await page.evaluate(()=>window.api.load());assert.equal(Object.values(ledger.entries)[0].versions[0].content.body,"");assert.equal(Object.values(ledger.entries)[0].versions.length,2);
  await expect(box).not.toContainText(/Saving on this device|Saved on this device/);
}));

test("normal-motion Deep Thoughts waits for durable acceptance and retains the answer",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=await thoughts(page);const input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("Synthetic thought waiting for acceptance.");await expect(box.getByRole("button",{name:"Send",exact:true})).toBeEnabled();
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{if(new TextDecoder().decode(args[1]).includes('"type":"save"')){crypto.subtle.digest=digest;await new Promise(resolve=>window.releaseSend=resolve);}return digest(...args);};});
  await box.getByRole("button",{name:"Send",exact:true}).click();await page.waitForFunction(()=>Boolean(window.releaseSend));await page.waitForTimeout(800);
  await expect(box.locator(".os-writing-footer")).not.toContainText(/Saving on this device|Saved on this device|\bSent\b/);
  await expect(input).toHaveValue("Synthetic thought waiting for acceptance.");assert.equal(await box.locator(".is-departing").count(),0);assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0);
  await page.evaluate(()=>window.releaseSend());await saved(page);await expect(input).toHaveValue("Synthetic thought waiting for acceptance.");await expect(box.getByRole("button",{name:"Next question",exact:true})).toBeVisible();
  await expect(box.locator(".os-writing-footer")).not.toContainText(/Saving on this device|Saved on this device|\bSent\b/);
},{reducedMotion:"no-preference"}));

for(const width of [360,390])test(`Page spacing across Today and Reflect at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const measurements=[];
  for(const route of ["/os","/os/mirror"]){
    await page.evaluate(path=>window.goto(path),route);await ready(page);
    await auditAppType(page);
    await expect(page.locator(route==="/os"?".os-checkin-session":".vision-life-apps")).toBeVisible();
    if(route==="/os/mirror")await expect(page.locator(".os-checkin-session")).toHaveCount(0);
    const sessions=page.locator(".os-swipe-session:visible");
    for(let s=0;s<await sessions.count();s++){
      const session=sessions.nth(s),seen=new Set();
      for(let i=0;i<12;i++){
        const current=session.locator(".os-app-page.current");
        const key=await current.innerText();if(seen.has(key))break;seen.add(key);
        await auditAppType(page);
        const metrics=await current.evaluate(el=>{
          const layout=el.querySelector(".os-page-layout"),header=layout?.querySelector(".os-page-header-left"),label=header||el.querySelector(".os-card-label");
          const heading=layout?.querySelector(".os-page-heading");
          const main=layout?(heading?.getBoundingClientRect().height>0?heading:[...layout.querySelectorAll(".os-page-body > *")].find(e=>e.getBoundingClientRect().height>0)):el.querySelector("h2");
          return label&&main?{label:label.textContent.trim(),gap:main.getBoundingClientRect().top-label.getBoundingClientRect().bottom,footer:layout?getComputedStyle(layout).getPropertyValue("--os-body-footer-gap").trim():null}:null;
        });
        if(metrics){measurements.push({route,...metrics});assert.ok(Math.abs(metrics.gap-48)<=1,JSON.stringify(metrics));if(metrics.footer)assert.equal(metrics.footer,"24px");}
        await session.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);
      }
    }
    if(route==="/os/mirror"){
      const gap=await page.locator(".vision-suggestion-app").evaluate(el=>el.querySelector("h2").getBoundingClientRect().top-el.querySelector(".os-card-label").getBoundingClientRect().bottom);
      measurements.push({route,label:"Suggestion",gap});assert.ok(Math.abs(gap-48)<=1);
    }
  }
  console.log("Page spacing audit",width,JSON.stringify(measurements));assert.ok(measurements.length>=10);
}));

for(const width of [360,390])test(`read and write typography at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const size=async(locator,expected)=>{await expect(locator).toHaveCSS("font-size",`${expected}px`);};
  const note=notePage(page);await size(note.getByRole("textbox",{name:"Note title",exact:true}),28);await size(note.getByRole("textbox",{name:"Write a note",exact:true}),18);
  await note.getByRole("textbox",{name:"Note title",exact:true}).fill("A short title");await note.getByRole("textbox",{name:"Write a note",exact:true}).fill("An editable body.");await accepted(page,"An editable body.");if(width===390)await page.locator(".os-checkin-session").screenshot({path:"outputs/writing-type-note-390.png"});
  await options(note,"History");await size(note.locator(".os-writing-list strong").first(),18);await trashRow(note,"A short title").click();await note.getByRole("button",{name:"Trash",exact:true}).click();await row(note,"A short title").click();await size(note.locator(".os-writing-review h2"),28);await size(note.locator(".os-writing-review p"),18);await checkTrashSpacing(note);
  await page.reload();await ready(page);const deep=await thoughts(page);await size(deep.locator(".os-deep-thought-question"),28);await size(deep.getByRole("textbox",{name:"Answer the deep thought",exact:true}),18);
  const question=await deep.locator(".os-deep-thought-question").textContent();await deep.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("A readable answer.");await deep.getByRole("button",{name:"Send",exact:true}).click();await accepted(page,"A readable answer.");await options(deep,"History");await size(deep.locator(".os-writing-list strong").first(),18);await trashRow(deep,question).click();await deep.getByRole("button",{name:"Trash",exact:true}).click();await row(deep,question).click();await size(deep.locator(".os-writing-review h2"),28);await size(deep.locator(".os-writing-review p"),18);await checkTrashSpacing(deep);
}));

for(const type of ["short-text","long-text"])for(const edit of [false,true])test(`Chapter ${type} typography ${edit?"Workshop":"runtime"}`,{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(({type,edit})=>{window.typeChapter={id:"declare-dreamline",version:1,type,edit};window.goto("/os/type-chapter");},{type,edit});
  const card=page.locator(`.os-chapter-card.os-chapter-${type}`);await expect(card).toBeVisible();
  await expect(card.locator(edit?"textarea.os-chapter-inline-copy.main":".os-page-main > h2")).toHaveCSS("font-size","28px");
  await expect(card.locator(edit?"textarea.os-chapter-inline-copy.sub":".os-chapter-body")).toHaveCSS("font-size","18px");
  const input=card.locator("textarea.os-chapter-text-input");await expect(input).toHaveCSS("font-size","18px");await input.fill("Synthetic chapter answer.");await expect(input).toHaveValue("Synthetic chapter answer.");
}));

for(const width of [360,390])test(`Vision and Week read and write sizes at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.evaluate(()=>{window.circle.updateState(state=>window.api.declareLife(state,"vision",{life:"A quiet life",why:"Time with my family"}));window.goto("/os/mirror");});await ready(page);
  const vision=page.locator(".vision-life-apps .vision-declaration-page");await expect(vision).toBeVisible();
  await expect(vision.locator(".os-page-main .vision-declaration-field p")).toHaveCSS("font-size","28px");await expect(vision.locator(".os-page-sub .vision-declaration-field p")).toHaveCSS("font-size","18px");
  await vision.locator(".vision-declaration-copy").click();const main=vision.getByRole("textbox",{name:"Edit Vision: The life",exact:true}),sub=vision.getByRole("textbox",{name:"Edit Vision: Why it is worth wanting",exact:true});
  await expect(main).toHaveCSS("font-size","28px");await expect(sub).toHaveCSS("font-size","18px");await sub.fill("Time to notice my family");await vision.getByRole("button",{name:"Save declaration",exact:true}).click();await expect(vision.locator(".os-page-sub .vision-declaration-field p")).toHaveText("Time to notice my family");
  await page.evaluate(()=>window.goto("/os"));await ready(page);const log=page.locator(".os-log-session");await log.scrollIntoViewIfNeeded();await log.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await log.getByRole("button",{name:"Add Goal",exact:true}).click();const goal=log.getByRole("textbox",{name:"Goal for this week",exact:true});await expect(goal).toHaveCSS("font-size","28px");await goal.fill("An editable week goal");await goal.blur();
  await log.getByRole("button",{name:"Add Step",exact:true}).click();const step=log.getByRole("textbox",{name:"One step toward this goal",exact:true});await expect(step).toHaveCSS("font-size","18px");await step.fill("An editable step");await expect(step).toHaveValue("An editable step");
}));

for(const type of ["cover","info"])test(`reading-only Chapter ${type} keeps its type scale`,{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(type=>{window.typeChapter={id:"day-one",version:1,type,edit:false};window.goto("/os/type-chapter");},type);
  const title=page.locator(type==="cover"?".os-cover-page h2":".os-chapter-info .os-page-main > h2");await expect(title).toBeVisible();await expect(title).toHaveCSS("font-size","28px");
}));

test("real Habit and Protocol rows grow down without nested scrolling",{timeout:90_000},async()=>isolated(390,async page=>{
  await openRoutineTool(page);
  await page.evaluate(()=>window.circle.updateState(state=>{const a=window.api;for(let i=0;i<8;i++){const added=a.addHabitDefinition(state,"synthetic-habit-"+i);state=a.updateHabitDefinitionParts(added.state,added.id,{action:"Synthetic walk "+i,cue:"After lunch",identity:"Someone who notices"});}const started=a.startProtocolDraft(state,"synthetic-phase");state=started.state;for(let i=0;i<8;i++){const added=a.addProtocolItem(state,started.id,"non-negotiable","synthetic-term-"+i);state=a.updateProtocolItem(added.state,started.id,added.id,"Synthetic term "+i);}return a.beginProtocolRun(state,started.id,a.getDateKey());}));
  const routine=page.locator(".os-habit-session");await expect(routine.locator(".os-repeated-habit")).toHaveCount(8);
  await logSettled(routine);
  const habit=await routine.evaluate(el=>({height:el.getBoundingClientRect().height,scroll:[...el.querySelectorAll("*")].some(e=>getComputedStyle(e).overflowY==="auto"&&e.scrollHeight>e.clientHeight+1)}));
  await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await expect(routine.getByRole("button",{name:"Keep: Synthetic term 0",exact:true})).toBeVisible();
  const protocol=await routine.evaluate(el=>({height:el.getBoundingClientRect().height,scroll:[...el.querySelectorAll("*")].some(e=>getComputedStyle(e).overflowY==="auto"&&e.scrollHeight>e.clientHeight+1)}));
  console.log("Measured real row growth",JSON.stringify({habit,protocol}));assert.ok(habit.height>346);assert.ok(protocol.height>346);assert.equal(habit.scroll,false);assert.equal(protocol.scroll,false);
}));

for(const width of [360,390])test(`Note header alignment, borderless focus and manual clearing at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  const box=notePage(page),title=box.getByRole("textbox",{name:"Note title",exact:true}),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  await title.fill("First synthetic Note");await body.fill("Text to clear by selecting it.");await accepted(page,"Text to clear by selecting it.");
  for(const input of [title,body]){await input.focus();await input.press("ControlOrMeta+A");await input.press("Backspace");}
  await expect.poll(()=>page.evaluate(async()=>Object.values((await window.api.load()).entries)[0].versions.at(-1).content)).toEqual({title:"",body:"",tags:[]});
  await page.reload();await ready(page);await expect(title).toHaveValue("");await expect(body).toHaveValue("");
  const entries=Object.values((await page.evaluate(()=>window.api.load())).entries);assert.equal(entries.length,1);assert.equal(entries[0].versions[0].content.title,"First synthetic Note");assert.ok(entries[0].versions.length>=2,"each accepted clearing edit can retain its own revision");
  for(const button of [box.getByRole("button",{name:"Show a Line",exact:true}),box.getByRole("button",{name:"History",exact:true})]){
    assert.equal(await button.evaluate(el=>getComputedStyle(el).color),"rgb(241, 239, 232)");const bounds=await button.boundingBox();assert.ok(bounds.height>=44&&bounds.width>=44);
  }
  const labels=await box.locator("[data-os-note-header-text]").evaluateAll(elements=>elements.map(el=>{const range=document.createRange();range.selectNodeContents(el);const rect=range.getBoundingClientRect(),style=getComputedStyle(el);return{top:rect.top,bottom:rect.bottom,font:style.fontFamily,size:style.fontSize,weight:style.fontWeight,line:style.lineHeight,spacing:style.letterSpacing};}));
  console.log("Measured Note header",width,JSON.stringify(labels));assert.ok(Math.abs(labels[0].top-labels[1].top)<=0.25);assert.ok(Math.abs(labels[0].bottom-labels[1].bottom)<=0.25);assert.deepEqual({...labels[0],top:0,bottom:0},{...labels[1],top:0,bottom:0});
  for(const input of [title,body]){await input.focus();const style=await input.evaluate(el=>{const s=getComputedStyle(el);return{outline:s.outlineStyle,border:s.borderWidth,shadow:s.boxShadow,caret:s.caretColor,focused:el===document.activeElement};});assert.deepEqual({...style,caret:null},{outline:"none",border:"0px",shadow:"none",caret:null,focused:true});assert.notEqual(style.caret,"transparent");}
  await expect(box.getByRole("button",{name:/^(Clear|Discard.*|Drafts|Save.*|Versions|Undo|Writing options)$/})).toHaveCount(0);await expect(box).not.toContainText(/draft|Saving on this device|Saved on this device/i);
  assert.equal(await box.getByRole("button",{name:"History",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(241, 239, 232)");await box.getByRole("button",{name:"History",exact:true}).click();
  assert.equal(await box.getByRole("button",{name:"Trash",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(241, 239, 232)");
  await expect(box.getByRole("button",{name:"New Note",exact:true})).toHaveCount(0);await box.getByRole("button",{name:"Note",exact:true}).click();await box.getByRole("button",{name:"New Note",exact:true}).click();await expect(title).toBeFocused();await expect(title).toHaveValue("");await body.fill("A separate second Note.");await saved(page,2);
}));

for(const [width,height] of [[360,740],[390,844],[416,844]])test(`Note adopts Routine glass without changing its writing frame at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.getByRole("button",{name:"Note",exact:true}).click();
  const box=notePage(page),frame=page.locator(".os-checkin-session"),action=box.getByRole("button",{name:"New Note",exact:true});
  await expect(frame).toHaveCSS("border-radius","36px");
  await expect(frame).toHaveCSS("backdrop-filter","blur(12px) saturate(1.2)");
  await expect(box).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
  await expect(box.getByRole("textbox",{name:"Write a note",exact:true})).toHaveCSS("color","rgb(241, 239, 232)");
  await expect(action).toHaveCSS("border-radius","12px");await expect(action).toHaveCSS("font-size","18px");
  const metrics=await box.evaluate(el=>{
    const frame=el.closest(".os-swipe-session"),r=frame.getBoundingClientRect(),button=el.querySelector(".os-creative-button"),b=button.getBoundingClientRect();
    const headers=[...el.querySelectorAll(".os-page-header button")].map(header=>{
      const text=header.querySelector(".os-routine-nav-text"),range=document.createRange();range.selectNodeContents(text);
      const t=range.getBoundingClientRect(),s=getComputedStyle(header);return{left:t.left-r.left-1,right:r.right-1-t.right,size:s.fontSize,weight:s.fontWeight};
    });
    return{height:r.height,buttonHeight:b.height,left:b.left-r.left-1,right:r.right-1-b.right,headers,overflow:el.scrollWidth>el.clientWidth+1};
  });
  assert.equal(metrics.height,height-196);assert.equal(metrics.buttonHeight,52);assert.equal(metrics.overflow,false);
  assert.equal(metrics.headers.length,2);
  for(const value of [metrics.left,metrics.right,metrics.headers[0].left,metrics.headers[1].right])assert.ok(Math.abs(value-24)<0.5,JSON.stringify(metrics));
  assert.ok(metrics.headers.every(h=>h.size==="16px"&&h.weight==="700"));
  const finish=await frame.evaluate(el=>{const s=getComputedStyle(el);return{s:s.boxShadow,b:s.borderColor,bg:s.backgroundColor};});
  await frame.screenshot({path:`outputs/note-glass-empty-${width}.png`});
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("A quiet moment");
  await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("I sat outside after breakfast and watched the street wake up.");
  await accepted(page,"I sat outside after breakfast and watched the street wake up.");
  await box.getByRole("textbox",{name:"Write a note",exact:true}).blur();
  await frame.screenshot({path:`outputs/note-glass-writing-${width}.png`});
  await options(box,"History");await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();
  await expect(box.locator("time")).toHaveCSS("font-size","12px");
  await expect(box.getByRole("button",{name:"Note",exact:true})).toHaveCSS("font-size","16px");
  await frame.screenshot({path:`outputs/note-glass-history-${width}.png`});
  await page.getByRole("navigation",{name:"Circle OS",exact:true}).getByRole("link",{name:"Today",exact:true}).click();
  await openRoutineTool(page);
  const routine=page.locator(".os-habit-session");
  assert.deepEqual(await routine.evaluate(el=>{const s=getComputedStyle(el);return{s:s.boxShadow,b:s.borderColor,bg:s.backgroundColor};}),finish,"Note and Routine consume the same panel finish");
  console.log("Note glass geometry",width,height,JSON.stringify(metrics));
},{height}));

test("Note shares immediate header light and accessible glass fallbacks",{timeout:90_000},async()=>isolated(390,async(page,context)=>{
  await page.getByRole('button',{name:'Note',exact:true}).click();
  const box=notePage(page),frame=page.locator(".os-checkin-session"),history=box.getByRole("button",{name:"History",exact:true});
  await page.keyboard.press('Tab');await history.focus();await expect(history).toHaveCSS("outline-style","solid");
  await history.dispatchEvent("pointerdown");
  const light=await history.locator(".os-routine-nav-text").evaluate(el=>({clip:getComputedStyle(el).backgroundClip,duration:el.getAnimations()[0].effect.getTiming().duration}));
  assert.deepEqual(light,{clip:"text",duration:240});
  await history.click();await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();
  await expect(box).not.toHaveClass(/\bos-app-flip\b/);
  const back=box.getByRole("button",{name:"Note",exact:true});await back.dispatchEvent("pointerdown");
  assert.deepEqual(await back.locator(".os-routine-nav-text").evaluate(el=>el.getAnimations()[0].effect.getKeyframes().map(f=>f.backgroundPosition)),["0% 0px","100% 0px"]);
  const cdp=await context.newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-transparency",value:"reduce"},{name:"prefers-reduced-motion",value:"reduce"}]});
  assert.equal(await page.evaluate(()=>matchMedia("(prefers-reduced-transparency: reduce)").matches),true);
  await expect(frame).toHaveCSS("backdrop-filter","none");
  assert.equal(await frame.evaluate(el => getComputedStyle(el, "::after").display), "none");
  await back.click();await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toBeVisible();
  const fresh=box.getByRole("button",{name:"New Note",exact:true});await expect(fresh).toHaveCSS("backdrop-filter","none");
  await fresh.dispatchEvent("pointerdown");await expect(fresh).toHaveCSS("transform","none");
  await history.dispatchEvent("pointerdown");assert.equal(await history.locator(".os-routine-nav-text").evaluate(el=>el.getAnimations().length),0);
  await cdp.send("Emulation.setEmulatedMedia",{features:[{name:"forced-colors",value:"active"},{name:"prefers-reduced-motion",value:"reduce"}]});
  await expect(frame).toHaveCSS("backdrop-filter","none");
  assert.notEqual(await history.locator(".os-routine-nav-text").evaluate(el=>getComputedStyle(el).webkitTextFillColor),"rgba(0, 0, 0, 0)");
  await cdp.detach();
},{reducedMotion:"no-preference"}));

test("leaving Note and hiding the page flush autosave before the pause; composition waits",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  await body.dispatchEvent("compositionstart");await body.fill("မင်္ဂလာပါ — mixed writing");await page.waitForTimeout(1200);
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0,"composition does not publish partial writing");
  await body.dispatchEvent("compositionend");await options(box,"History");await expect(row(box,"Untitled")).toBeVisible();await accepted(page,"မင်္ဂလာပါ — mixed writing");
  await row(box,"Untitled").click();await body.fill("Saved when the page hides.");await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent("pagehide")));await accepted(page,"Saved when the page hides.");
  await body.fill("Saved when leaving Today.");await page.evaluate(()=>window.goto("/os/mirror"));await accepted(page,"Saved when leaving Today.");
  await page.evaluate(()=>window.goto("/os"));await expect(body).toHaveValue("Saved when leaving Today.");
}));

test("older Note recovery copies are reachable from the collection with a short date",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.clock.setFixedTime(new Date("2026-11-26T12:00:00+07:00"));
  await page.evaluate(async()=>{
    const scope=window.api.getAccountScope(),owner="account:"+scope.accountId;
    for(const title of ["Recovered one","Recovered two"]){const at="2026-11-25T05:00:00.000Z",draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:window.api.writingAttribution(at,"Asia/Bangkok"),content:{title,body:title+" body",tags:[]},source:null};
      await window.api.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,type:"write-draft",draft,expectedDraftVersion:0});}
  });
  await page.goto(`${baseURL}/os#note`);await ready(page);
  const box=notePage(page),panel=title=>box.locator(".os-notes-panel").filter({hasText:title});
  await expect(box.getByRole("heading",{name:"Notes",exact:true})).toBeVisible();
  await expect(box).not.toContainText(/draft|discard/i);await saved(page,0);
  for(const title of ["Recovered one","Recovered two"]){await expect(panel(title).locator("time")).toHaveText("Nov 25");await panel(title).click();await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue(title);await accepted(page,title+" body");await box.getByRole("button",{name:"Back",exact:true}).click();}
  await saved(page,2);await page.reload();await ready(page);await expect(panel("Recovered one")).toHaveCount(1);await expect(panel("Recovered two")).toHaveCount(1);
}));

test("erasing a new Note before autosave creates no empty History entry",{timeout:90_000},async()=>isolated(360,async page=>{
  const box=notePage(page),body=box.getByRole("textbox",{name:"Write a note",exact:true});await body.fill("Temporary text");await body.fill("");await options(box,"History");
  await expect(box.getByText("No saved writing yet.",{exact:true})).toBeVisible();assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0);
  await page.reload();await ready(page);await expect(body).toHaveValue("");await options(box,"History");await expect(box.getByText("No saved writing yet.",{exact:true})).toBeVisible();
}));

test("History bins move only their own Note and restore is available only in Trash",{timeout:90_000},async()=>isolated(360,async page=>{
  const box=notePage(page),title=box.getByRole("textbox",{name:"Note title",exact:true}),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  await title.fill("First note with a longer title that wraps");await body.fill("First note evidence.");await accepted(page,"First note evidence.");await box.getByRole("button",{name:"New Note",exact:true}).click();
  await expect(title).toHaveValue("");
  await title.fill("Second note");await body.fill("Second note evidence.");await accepted(page,"Second note evidence.");await options(box,"History");
  const bin=trashRow(box,"First note with a longer title that wraps"),bounds=await bin.boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44);assert.equal(await bin.evaluate(el=>getComputedStyle(el).color),"rgb(227, 107, 55)");
  await bin.focus();await page.keyboard.press("Tab");await page.keyboard.press("Shift+Tab");await expect(bin).toBeFocused();assert.equal(await bin.evaluate(el=>getComputedStyle(el).outlineStyle),"solid","button keyboard focus stays visible");
  await page.locator(".os-checkin-session").screenshot({path:"outputs/note-controls-history-360.png"});await bin.click();
  await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();await expect(row(box,"First note")).toHaveCount(0);await expect(row(box,"Second note")).toBeVisible();await expect(box.getByRole("button",{name:"Undo",exact:true})).toHaveCount(0);
  const before=Object.values((await page.evaluate(()=>window.api.load())).entries);assert.equal(before.find(e=>e.versions.at(-1).content.title.startsWith("First note")).status,"trashed");assert.equal(before.find(e=>e.versions.at(-1).content.title==="Second note").status,"active");
  await page.reload();await ready(page);await options(box,"History");await expect(row(box,"First note")).toHaveCount(0);await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,"First note").click();await box.getByRole("button",{name:"Restore",exact:true}).click();
  await expect(row(box,"First note")).toBeVisible();await expect(row(box,"Second note")).toBeVisible();const after=Object.values((await page.evaluate(()=>window.api.load())).entries);assert.deepEqual(after.map(e=>[e.id,e.versions]),before.map(e=>[e.id,e.versions]));
}));

test("a recovered History row is saved before Trash and a failed save keeps all its text",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(async()=>{const scope=window.api.getAccountScope(),owner="account:"+scope.accountId;for(const title of ["Recovered target","Other recovery"]){const at=new Date().toISOString(),draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:window.api.writingAttribution(at,"Asia/Bangkok"),content:{title,body:title+" text",tags:[]},source:null};await window.api.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,type:"write-draft",draft,expectedDraftVersion:0});}});
  const box=notePage(page);await options(box,"History");
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&value.entries&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await trashRow(box,"Recovered target").click();await expect(box.getByRole("alert")).toContainText("Your open text is still here");await expect(row(box,"Recovered target")).toBeVisible();let state=await page.evaluate(()=>window.api.load());assert.equal(Object.keys(state.entries).length,0);assert.equal(Object.values(state.drafts).filter(d=>d.status==="active").length,2);
  await trashRow(box,"Recovered target").click();await expect(row(box,"Recovered target")).toHaveCount(0);await expect(row(box,"Other recovery")).toBeVisible();await expect(box.getByRole("button",{name:"Undo",exact:true})).toHaveCount(0);
  await box.getByRole("button",{name:"Trash",exact:true}).click();await row(box,"Recovered target").click();await expect(box.getByText("Recovered target text",{exact:true})).toBeVisible();await box.getByRole("button",{name:"Restore",exact:true}).click();await expect(row(box,"Recovered target")).toBeVisible();await expect(row(box,"Other recovery")).toBeVisible();
  state=await page.evaluate(()=>window.api.load());assert.equal(Object.values(state.entries)[0].versions.at(-1).content.body,"Recovered target text");assert.equal(Object.values(state.drafts).find(d=>d.status==="active").content.body,"Other recovery text");
}));

test("a stale recovered row cannot trash a newer saved Note",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page);await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Original Note");await box.getByRole("textbox",{name:"Write a note",exact:true}).fill("Original text");await accepted(page,"Original text");await options(box,"History");
  await page.evaluate(async()=>{const a=window.api,scope=a.getAccountScope(),state=await a.load(),entry=Object.values(state.entries)[0],at=new Date().toISOString(),base={entryId:entry.id,kind:"note",baseVersionId:entry.currentVersionId,baseGeneration:entry.generation,startedAt:entry.startedAt,attribution:entry.versions.at(-1).attribution,source:null};
    const commit=values=>a.commitWritingOperation(scope,{owner:state.owner,operationId:crypto.randomUUID(),at,...values});
    const recovery={...base,id:crypto.randomUUID(),content:{title:"Older recovery",body:"Older recovered text",tags:[]}};await commit({type:"write-draft",draft:recovery,expectedDraftVersion:0});
    const newer={...base,id:crypto.randomUUID(),content:{title:"Current saved copy",body:"Newer accepted text",tags:[]}};await commit({type:"write-draft",draft:newer,expectedDraftVersion:0});await commit({type:"save",draft:{...newer,version:1}});
  });
  await expect(row(box,"Current saved copy")).toBeVisible();await trashRow(box,"Older recovery").click();await expect(box.getByRole("alert")).toContainText("Open it to review both copies");await expect(row(box,"Current saved copy")).toBeVisible();
  const state=await page.evaluate(()=>window.api.load()),entry=Object.values(state.entries)[0];assert.equal(entry.status,"active");assert.equal(entry.versions.at(-1).content.body,"Newer accepted text");assert.ok(Object.values(state.drafts).some(d=>d.status==="active"&&d.content.body==="Older recovered text"));
}));

test("New Note flushes in-flight typing and keeps the current note if saving fails",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page),title=box.getByRole("textbox",{name:"Note title",exact:true}),body=box.getByRole("textbox",{name:"Write a note",exact:true}),fresh=box.getByRole("button",{name:"New Note",exact:true});
  await expect(fresh).toBeVisible();
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{if(new TextDecoder().decode(args[1]).includes('"type":"save"')){crypto.subtle.digest=digest;await new Promise(resolve=>window.releaseNewNote=resolve);}return digest(...args);};});
  await title.fill("Save before the next note");await fresh.click();await page.waitForFunction(()=>Boolean(window.releaseNewNote));
  await expect(title).toHaveValue("Save before the next note");await body.fill("Typing while New Note waits.");await page.evaluate(()=>window.releaseNewNote());
  await expect(title).toHaveValue("");await expect(body).toHaveValue("");await accepted(page,"Typing while New Note waits.");await saved(page,1);
  await expect(fresh).toHaveAttribute("aria-busy","false");await body.dispatchEvent("compositionstart");await body.fill("Unfinished composition");await fresh.click();await expect(fresh).toHaveAttribute("aria-busy","false");await expect(body).toHaveValue("Unfinished composition");
  await body.dispatchEvent("compositionend");
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&value.entries&&Object.keys(value.entries).length>1){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await fresh.click();await expect(box.getByRole("alert")).toContainText("Your open text is still here");await expect(body).toHaveValue("Unfinished composition");await saved(page,1);await expect(fresh).toHaveAttribute("aria-busy","false");
  await fresh.click();await expect(title).toBeFocused();await expect(body).toHaveValue("");await accepted(page,"Unfinished composition");await saved(page,2);
  await options(box,"History");await expect(fresh).toHaveCount(0);await expect(row(box,"Save before the next note")).toBeVisible();
}));

for(const [width,height] of [[390,844],[360,667]])test(`Note, History and Trash stay bounded at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  const box=notePage(page),frame=page.locator(".os-checkin-session"),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  const long=Array.from({length:45},(_,i)=>`Line ${i+1}: synthetic writing stays inside the frame.`).join("\n");
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("A longer bounded note");await body.fill(long);await accepted(page,long);
  async function settled(){await expect(box).not.toHaveClass(/\bos-app-flip\b/);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await expect(box.locator(".os-page-body")).toHaveCSS("scrollbar-width","none");}
  async function dimensions(){return box.evaluate(el=>{const body=el.querySelector(".os-page-body"),frame=el.closest(".os-swipe-session"),header=el.querySelector(".os-page-header"),footer=el.querySelector(".os-page-footer"),rect=frame.getBoundingClientRect();return{height:rect.height,bodyHeight:body.clientHeight,overflow:body.scrollHeight-body.clientHeight,top:body.scrollTop,header:header.getBoundingClientRect().top-rect.top,footer:footer.getBoundingClientRect().top-rect.top,footerClass:footer.className,footerHeight:footer.getBoundingClientRect().height,footerPadding:getComputedStyle(footer).paddingTop,parts:[...footer.children].map(e=>({height:e.getBoundingClientRect().height,parts:[...e.children].map(c=>({tag:c.tagName,height:c.getBoundingClientRect().height,cls:c.className}))})),scrollers:[...el.querySelectorAll("*")].filter(e=>["auto","scroll"].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).length};});}
  const ceiling=Math.min(480,height*.6),initial=await dimensions();console.log("Bounded Note",width,height,JSON.stringify(initial));assert.ok(Math.abs(initial.height-ceiling)<=1);assert.ok(initial.bodyHeight>50);assert.ok(initial.overflow>500);assert.equal(initial.scrollers,1);
  await frame.scrollIntoViewIfNeeded();await box.locator(".os-page-body").evaluate(el=>el.scrollTop=el.scrollHeight);
  const before=await dimensions();await body.press("ControlOrMeta+End");await body.press("Enter");await body.pressSequentially("Last visible line");
  await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
  const caret=await box.locator(".os-page-body").evaluate(el=>{const field=el.querySelector('textarea[aria-label="Write a note"]'),line=parseFloat(getComputedStyle(field).lineHeight);return{bottom:field.getBoundingClientRect().bottom,viewport:el.getBoundingClientRect().bottom,line,innerScroll:field.scrollTop,client:field.clientHeight,scroll:field.scrollHeight};});
  assert.ok(caret.bottom<=caret.viewport+caret.line,"typing at the end stays in the visible body");assert.equal(caret.innerScroll,0,`textarea does not create a second scroll area: ${JSON.stringify(caret)}`);
  const after=await dimensions();assert.equal(after.header,before.header);assert.equal(after.footer,before.footer);assert.equal(after.height,before.height);
  await frame.screenshot({path:`outputs/note-bounded-write-${width}.png`});
  await page.evaluate(async()=>{const a=window.api,scope=a.getAccountScope(),owner="account:"+scope.accountId;
    for(let i=0;i<24;i++){const at=new Date(Date.now()-i*60_000-60_000).toISOString(),draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:a.writingAttribution(at,"Asia/Bangkok"),content:{title:`Synthetic row ${String(i).padStart(2,"0")}`,body:Array(30).fill("Long synthetic Trash content.").join("\n"),tags:[]},source:null};
      const commit=values=>a.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,...values});await commit({type:"write-draft",draft,expectedDraftVersion:0});const {receipt}=await commit({type:"save",draft:{...draft,version:1}});if(i>=12)await commit({type:"trash",entryId:draft.entryId,expectedGeneration:receipt.generation});}
  });
  await options(box,"History");await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();await settled();await expect(box.getByRole("button",{name:"New Note",exact:true})).toHaveCount(0);
  let metrics=await dimensions();assert.ok(Math.abs(metrics.height-ceiling)<=1);assert.equal(metrics.scrollers,1);assert.equal(metrics.top,0,"a new page begins at the top");
  const scrollbox=box.locator(".os-page-body");await scrollbox.hover();await page.mouse.wheel(0,240);await expect.poll(()=>scrollbox.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();
  const touch=await context.newCDPSession(page),rect=await scrollbox.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height-15;
  await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});for(let delta=15;delta<Math.min(rect.height-15,100);delta+=15)await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-delta}]});await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await touch.detach();
  await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();await settled();await scrollbox.evaluate(el=>el.scrollTop=el.scrollHeight);await row(box,"Synthetic row 11").click();await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("Synthetic row 11");await settled();
  await options(box,"History");await expect(box.getByRole("heading",{name:"History",exact:true})).toBeVisible();await settled();await frame.screenshot({path:`outputs/note-bounded-history-${width}.png`});await trashRow(box,"A longer bounded note").click();await expect(row(box,"A longer bounded note")).toHaveCount(0);await expect(box).not.toContainText(/Moved to Trash|Undo/);
  await box.getByRole("button",{name:"Trash",exact:true}).click();await expect(box.getByRole("heading",{name:"Trash",exact:true})).toBeVisible();await settled();metrics=await dimensions();assert.ok(Math.abs(metrics.height-ceiling)<=1);assert.equal(metrics.scrollers,1);assert.equal(metrics.top,0);await scrollbox.evaluate(el=>el.scrollTop=el.scrollHeight);await row(box,"Synthetic row 23").click();
  await expect(box.getByRole("button",{name:"Restore",exact:true})).toBeVisible();await settled();metrics=await dimensions();console.log("Bounded Trash",width,height,JSON.stringify(metrics));assert.ok(Math.abs(metrics.height-ceiling)<=1);assert.equal(metrics.scrollers,1);assert.ok(metrics.bodyHeight>50);await expect(box.getByRole("button",{name:"Delete forever",exact:true})).toBeVisible();
  await scrollbox.evaluate(el=>el.scrollTop=el.scrollHeight);const detail=await dimensions();assert.equal(detail.header,metrics.header);assert.equal(detail.footer,metrics.footer,JSON.stringify({metrics,detail}));await frame.screenshot({path:`outputs/note-bounded-trash-${width}.png`});
  await page.setViewportSize({width,height:560});await expect.poll(async()=>(await dimensions()).height).toBeLessThanOrEqual(346);await expect(box.getByRole("button",{name:"Restore",exact:true})).toBeVisible();await page.setViewportSize({width,height});await settled();
  await box.getByRole("button",{name:"Delete forever",exact:true}).click();await expect(box.getByRole("button",{name:"Cancel",exact:true})).toBeVisible();await settled();assert.ok((await dimensions()).height<=ceiling+1);await box.getByRole("button",{name:"Cancel",exact:true}).click();await expect(box.getByRole("button",{name:"Restore",exact:true})).toBeVisible();await settled();
},{height,reducedMotion:height===844?"no-preference":"reduce"}));
