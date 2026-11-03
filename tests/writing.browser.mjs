import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";

// Actual product components/CSS/stores with a test-only router and synthetic
// account boundary. This is not a hosted Supabase sign-in certification.
const harness = `
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import {PathnameContext} from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import {CircleStateProvider,OSFrame,TodayExperience,useCircleState} from "/app/os/circle-os-shell.tsx";
import Mirror from "/app/os/mirror/page.tsx";
import {ChapterEditor} from "/app/os/admin/chapter-editor.tsx";
import {ChapterPlayer} from "/app/os/chapters/chapter-player.tsx";
import * as scopes from "/app/os/account-scope.js";
import * as circle from "/app/os/circle-os-model.js";
import * as circleStore from "/app/os/circle-os-store.ts";
import * as writingStore from "/app/os/writing-store.ts";
import * as writingModel from "/app/os/writing-model.js";
import {useWriting} from "/app/os/writing-provider.tsx";
import {createChapterRun,chapterRunId} from "/app/os/chapters/chapter-model.js";
import {dayOpenRunId} from "/app/os/day-door.js";
import {publishedChapters} from "/app/os/chapters/registry.ts";
import "/app/globals.css";
import "/app/os/os-app.css";
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
function Root(){const [path,setPath]=useState("/os");window.goto=setPath;const router={push:setPath,replace:setPath,prefetch:()=>Promise.resolve(),refresh(){},back(){setPath("/os");},forward(){}};
 return React.createElement(AppRouterContext.Provider,{value:router},React.createElement(PathnameContext.Provider,{value:path},
 React.createElement(CircleStateProvider,null,React.createElement(Probe),React.createElement(OSFrame,null,path==="/os/type-chapter"?React.createElement(TypeChapterFixture):path==="/os/mirror"?React.createElement(Mirror):path==="/os/admin"?React.createElement(ChapterEditor):React.createElement(TodayExperience)))));}
const root=createRoot(document.getElementById("root"));
window.api={...scopes,...circle,...circleStore,...writingStore,...writingModel,fixture,
 async init(account=true){if(account)scopes.activateAccountScope("synthetic-writer-a");await circleStore.saveCircleState(scopes.getAccountScope(),fixture());sessionStorage.setItem("writing-fixture-ready","yes");root.render(React.createElement(Root));},
 mount(){root.render(React.createElement(Root));},
 load(){return writingStore.loadWritingState(scopes.getAccountScope());}
};
if(sessionStorage.getItem("writing-fixture-ready"))window.api.mount();
`;

let server,browser,baseURL;
before(async()=>{
  server=await createServer({configFile:false,define:{"process.env":JSON.stringify({NODE_ENV:"development"})},
    plugins:[react(),{name:"writing-ui-fixture",resolveId(id){if(id==="virtual:writing-ui")return "\0writing-ui.tsx";},load(id){if(id==="\0writing-ui.tsx")return harness;},
      configureServer(vite){vite.middlewares.use(async(request,response,next)=>{
        if(!["/os","/os/mirror","/os/connect"].includes(request.url?.split("?")[0]))return next();
        try{response.setHeader("Content-Type","text/html");response.end(await vite.transformIndexHtml("/os",'<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script type="module" src="/@id/virtual:writing-ui"></script>'));}catch(cause){next(cause);}
      });}}],server:{host:"127.0.0.1",port:0,watch:{ignored:["**/.next/**","**/dist/**"]}},
    optimizeDeps:{include:["react","react-dom/client","next/link","next/navigation","next/dist/shared/lib/app-router-context.shared-runtime.js","next/dist/shared/lib/hooks-client-context.shared-runtime.js"]}});
  await server.listen();baseURL=`http://127.0.0.1:${server.httpServer.address().port}`;browser=await chromium.launch();
});
after(async()=>{await browser?.close();await server?.close();});
async function open(page){await page.goto(`${baseURL}/os`,{waitUntil:"domcontentloaded",timeout:60_000});await page.waitForFunction(()=>Boolean(window.api),{},{timeout:60_000});}
async function ready(page){await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy","false");await page.evaluate(()=>document.fonts.ready);}
async function isolated(width,work,{account=true,reducedMotion="reduce",height=844}={}){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,timezoneId:"Asia/Bangkok",reducedMotion});
  const errors=[],external=[];context.on("page",page=>page.on("pageerror",cause=>errors.push(cause.message)));
  await context.addInitScript(()=>{window.resizeNotifications=0;window.addEventListener("error",event=>{if(event.message.includes("ResizeObserver"))window.resizeNotifications++;});});
  await context.route("**/*",route=>{if(new URL(route.request().url()).origin===baseURL)return route.continue();external.push(route.request().url());return route.abort();});
  try{const page=await context.newPage();page.setDefaultTimeout(30_000);await open(page);await page.evaluate(account=>window.api.init(account),account);await ready(page);await work(page,context);assert.deepEqual(errors,[],"no uncaught errors");assert.deepEqual(external,[],"no external backend/model traffic");if(account)assert.deepEqual(await page.evaluate(()=>window.backendCalls),[],"account writing never calls the legacy transport");}
  finally{await context.close();}
}

test("baseline legacy placeholder report is reproducible without touching owner data",{timeout:90_000},async()=>isolated(390,async page=>{
  const title=page.getByRole("textbox",{name:"Edit idle title",exact:true});await expect(title).toBeVisible();
  const placeholder=await title.getAttribute("placeholder");assert.ok(placeholder);
  await title.focus();await page.getByRole("textbox",{name:"Edit idle note",exact:true}).focus();
  await expect(title).toHaveValue(placeholder);
  await expect.poll(()=>page.evaluate(()=>window.circle.state.profile.profileCase.survey.answers.find(a=>a.questionId==="checkin-idle-title")?.answer)).toBe(placeholder);
},{account:false}));

const notePage=page=>page.locator(".os-writing-page.os-note-page");
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
  await expect(box.locator(".os-page-footer")).toHaveCSS("padding-top","25px");
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
    await swipeBoundary(page,-500);await expect(input).toHaveValue("An unfinished synthetic answer.");await expect(box.locator(".os-deep-thought-question")).toHaveText(question);
  }
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0,"viewing quotes never submits a draft");
  await options(box,"History");await expect(row(box,"An unfinished synthetic answer.")).toContainText("Unsent");await box.getByRole("button",{name:"Deep Thoughts",exact:true}).click();
  await page.reload();await ready(page);await thoughts(page);backend.fail=true;
  await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toContainText("Synthetic quote 2");
  await swipeBoundary(page,500);await expect(page.getByRole("button",{name:"Loved this",exact:true})).toBeVisible();await page.getByRole("button",{name:"Loved this",exact:true}).click();
  await expect(input).toHaveValue("An unfinished synthetic answer.");
  backend.fail=false;backend.pool=[];await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(box.getByRole("alert")).toContainText("No quotes are available yet");
  backend.fail=true;await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toHaveCount(0);await expect(input).toHaveValue("An unfinished synthetic answer.");
  await page.locator(".os-checkin-session").screenshot({path:"outputs/deep-thoughts-quote-return-390.png"});
}));

for(const [width,height]of[[360,667],[390,844]])test(`Deep Thoughts History/Trash matches Note at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page)=>{
  const box=await thoughts(page),question=await box.locator(".os-deep-thought-question").textContent();
  await box.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("A saved synthetic answer for Trash.");await box.getByRole("button",{name:"Send",exact:true}).click();await saved(page);
  await options(box,"History");await expect(box.getByText("Today",{exact:true})).toBeVisible();await expect(box.getByRole("button",{name:/Undo|Versions|Writing options/})).toHaveCount(0);
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
  await options(box,"History");const frame=page.locator(".os-checkin-session");await expect(box).not.toHaveClass(/\bos-app-flip\b/);await expect.poll(async()=>Math.abs((await frame.boundingBox()).height-Math.min(480,height*.6))).toBeLessThan(1);
  const metrics=await box.evaluate(el=>{const body=el.querySelector(".os-page-body");return{height:el.closest(".os-swipe-session").getBoundingClientRect().height,overflow:body.scrollHeight-body.clientHeight,scrollers:[...el.querySelectorAll("*")].filter(e=>["auto","scroll"].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).length};});
  assert.ok(Math.abs(metrics.height-Math.min(480,height*.6))<1,JSON.stringify(metrics));assert.ok(metrics.overflow>100);assert.equal(metrics.scrollers,1);
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
  await quoteBackend(context);await swipeBoundary(page,500);const box=page.locator(".os-thoughts-page"),question=await box.locator(".os-deep-thought-question").textContent();
  const input=box.getByRole("textbox",{name:"Answer the deep thought",exact:true});await input.fill("A synthetic legacy answer.");await box.getByRole("button",{name:"Send",exact:true}).click();await expect(box.getByRole("button",{name:"Next question",exact:true})).toBeVisible();await expect(input).toHaveValue("A synthetic legacy answer.");
  await box.getByRole("button",{name:"Show a Quote",exact:true}).click();await expect(page.locator(".os-quote-page")).toContainText("Synthetic quote 1");await swipeBoundary(page,-500);await expect(input).toHaveValue("A synthetic legacy answer.");await expect(box.locator(".os-deep-thought-question")).toHaveText(question);
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
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
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
  const session=page.locator(".os-checkin-session");
  await session.scrollIntoViewIfNeeded();
  await session.evaluate(element=>{element.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true}));});
  const box=page.locator(".os-writing-page.os-thoughts-page");await expect(box.getByRole("button",{name:"Show a Quote",exact:true})).toBeVisible();await expect(box.locator(".os-deep-thought-question")).toBeVisible();return box;
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
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("Synthetic retry");await expect(box.getByRole("alert")).toContainText("Your open text is still here");await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue("Synthetic retry");
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0);
  await box.getByRole("button",{name:"Try again",exact:true}).click();await saved(page);
  assert.equal(Object.values((await page.evaluate(()=>window.api.load())).entries)[0].versions.length,1);
}));

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

test("real Reflect reading reply uses the shared ledger and edition source",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.goto("/os/mirror"));await ready(page);
  const session=page.locator(".athena-reader-session");
  for(let i=0;i<3;i++){await session.evaluate(element=>element.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);}
  const reply=page.locator(".os-writing-embedded");await expect(reply).toBeVisible();
  await expect(reply.locator(".os-deep-thought-question")).toHaveCSS("font-size","29px");
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
    await expect(tick).toHaveCSS("width","30px");await expect(tick).toHaveCSS("height","30px");
    const hit=await tick.locator(".os-creative-button-label").boundingBox();assert.ok(hit.width>=44&&hit.height>=44,"row tick touch area");
  }
  await habitTick.locator(".os-creative-button-label").click({position:{x:1,y:22}});await expect(habitTick).toHaveAttribute("aria-pressed","true");
  const check=await habitTick.evaluate(el=>{const c=getComputedStyle(el,"::after");return {width:c.width,height:c.height};});assert.deepEqual(check,{width:"5px",height:"11px"});
  await habitTick.click();await expect(habitTick).toHaveAttribute("aria-pressed","false");
  await taskTick.click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.tasks.items).find(t=>t.text==="Synthetic task after v3")?.status)).toBe("completed");
  await expect.poll(()=>page.evaluate(async()=>{const s=await window.api.loadCircleState(window.api.getAccountScope());return Object.values(s.tasks.items).some(t=>t.text==="Synthetic task after v3"&&t.status==="completed");})).toBe(true);
  await page.reload();await ready(page);await expect(add).toBeVisible();
  await expect(routine.getByRole("textbox",{name:"Edit habit: Synthetic habit after v3",exact:true})).toBeVisible();
  assert.equal(await page.evaluate(()=>Object.values(window.circle.state.chapters.runs).some(r=>r.chapterId==="habit-building"&&r.status==="completed")),false,"no false setup completion");
  await routine.getByRole("button",{name:"Routine",exact:true}).click();
  await expect(add).toHaveCount(0);
  const undo=routine.getByRole("button",{name:"Undo task: Synthetic task after v3",exact:true});await expect(undo).toBeVisible();await undo.click();
  await expect.poll(()=>page.evaluate(()=>Object.values(window.circle.state.tasks.items).find(t=>t.text==="Synthetic task after v3")?.status)).toBe("open");
}));

for(const width of [360,390])test(`shared App Box geometry at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  async function measure(selector){return page.locator(selector).evaluate(el=>{const frame=el.closest(".os-swipe-session"),label=el.querySelector(".os-page-header-left"),main=el.querySelector("textarea,input,h1,h2,[data-os-main-text],.os-protocol-past");const range=document.createRange();range.selectNodeContents(label.querySelector(".os-card-label"));return {height:frame.getBoundingClientRect().height,page:el.getBoundingClientRect().height,gap:main?.getBoundingClientRect().top-label.getBoundingClientRect().bottom,visibleGap:main?.getBoundingClientRect().top-range.getBoundingClientRect().bottom,scroll:el.scrollHeight>el.clientHeight+1};});}
  const result={note:await measure(".os-writing-page.os-note-page")};
  await thoughts(page);result.thoughts=await measure(".os-writing-page.os-thoughts-page");
  result.habit=await measure(".os-habit-session .os-page-layout");
  const routine=page.locator(".os-habit-session");await routine.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);
  result.protocol=await measure(".os-habit-session .os-page-layout");
  console.log("Measured App Boxes",width,JSON.stringify(result));
  assert.ok(Math.abs(result.note.height-result.thoughts.height)<=1,"empty writing frames agree");
  assert.ok(Math.abs(result.note.height-result.habit.height)<=1,"empty Habit shares default");
  assert.ok(Math.abs(result.note.height-result.protocol.height)<=1,"short Protocol shares default");
  for(const item of Object.values(result))assert.equal(item.scroll,false,"no inner scrolling");
  for(const item of Object.values(result)){assert.equal(item.gap,48,"shared header gap");assert.ok(Math.abs(item.visibleGap-result.habit.visibleGap)<=1,"visible label gaps agree");}
  await page.locator(".os-checkin-session").evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:-500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);
  await notePage(page).getByRole("textbox",{name:"Note title",exact:true}).fill("A short Note");await notePage(page).getByRole("textbox",{name:"Write a note",exact:true}).fill("A short body.");
  assert.ok(Math.abs((await measure(".os-writing-page.os-note-page")).height-result.note.height)<=1,"short Note rests at default");
  if(width===390)await page.locator(".os-checkin-session").screenshot({path:"outputs/writing-ui-390.png"});
  await notePage(page).getByRole("textbox",{name:"Write a note",exact:true}).fill(Array(25).fill("A longer synthetic paragraph grows downward.").join("\n"));
  const grown=await measure(".os-writing-page.os-note-page");assert.ok(grown.height>result.note.height);assert.ok(grown.height<=480);assert.equal(grown.scroll,false);assert.equal(grown.gap,48);
  assert.equal(await notePage(page).locator(".os-page-body").evaluate(el=>el.scrollHeight>el.clientHeight+1),true,"long Note scrolls only its body");
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
    await expect(page.locator(route==="/os"?".os-checkin-session":".vision-life-apps")).toBeVisible();
    if(route==="/os/mirror")await expect(page.locator(".os-checkin-session")).toHaveCount(0);
    const sessions=page.locator(".os-swipe-session:visible");
    for(let s=0;s<await sessions.count();s++){
      const session=sessions.nth(s),seen=new Set();
      for(let i=0;i<12;i++){
        const current=session.locator(".os-app-page.current");
        const key=await current.innerText();if(seen.has(key))break;seen.add(key);
        const metrics=await current.evaluate(el=>{
          const layout=el.querySelector(".os-page-layout"),header=layout?.querySelector(".os-page-header-left"),label=header||el.querySelector(".os-card-label");
          const heading=layout?.querySelector(".os-page-heading");
          const main=layout?(heading?.getBoundingClientRect().height>0?heading:[...layout.querySelectorAll(".os-page-body > *")].find(e=>e.getBoundingClientRect().height>0)):el.querySelector("h2");
          return label&&main?{label:label.textContent.trim(),gap:main.getBoundingClientRect().top-label.getBoundingClientRect().bottom,footer:layout?getComputedStyle(layout).getPropertyValue("--os-body-footer-gap").trim():null}:null;
        });
        if(metrics){measurements.push({route,...metrics});assert.ok(Math.abs(metrics.gap-48)<=1,JSON.stringify(metrics));if(metrics.footer)assert.equal(metrics.footer,"25px");}
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
  const note=notePage(page);await size(note.getByRole("textbox",{name:"Note title",exact:true}),29);await size(note.getByRole("textbox",{name:"Write a note",exact:true}),18);
  await note.getByRole("textbox",{name:"Note title",exact:true}).fill("A short title");await note.getByRole("textbox",{name:"Write a note",exact:true}).fill("An editable body.");await accepted(page,"An editable body.");if(width===390)await page.locator(".os-checkin-session").screenshot({path:"outputs/writing-type-note-390.png"});
  await options(note,"History");await size(note.locator(".os-writing-list strong").first(),18);await trashRow(note,"A short title").click();await note.getByRole("button",{name:"Trash",exact:true}).click();await row(note,"A short title").click();await size(note.locator(".os-writing-review h2"),29);await size(note.locator(".os-writing-review p"),18);await checkTrashSpacing(note);
  await page.reload();await ready(page);const deep=await thoughts(page);await size(deep.locator(".os-deep-thought-question"),29);await size(deep.getByRole("textbox",{name:"Answer the deep thought",exact:true}),18);
  const question=await deep.locator(".os-deep-thought-question").textContent();await deep.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("A readable answer.");await deep.getByRole("button",{name:"Send",exact:true}).click();await accepted(page,"A readable answer.");await options(deep,"History");await size(deep.locator(".os-writing-list strong").first(),18);await trashRow(deep,question).click();await deep.getByRole("button",{name:"Trash",exact:true}).click();await row(deep,question).click();await size(deep.locator(".os-writing-review h2"),29);await size(deep.locator(".os-writing-review p"),18);await checkTrashSpacing(deep);
}));

for(const type of ["short-text","long-text"])for(const edit of [false,true])test(`Chapter ${type} typography ${edit?"Workshop":"runtime"}`,{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(({type,edit})=>{window.typeChapter={id:"declare-dreamline",version:1,type,edit};window.goto("/os/type-chapter");},{type,edit});
  const card=page.locator(`.os-chapter-card.os-chapter-${type}`);await expect(card).toBeVisible();
  await expect(card.locator(edit?"textarea.os-chapter-inline-copy.main":".os-page-main > h2")).toHaveCSS("font-size","29px");
  await expect(card.locator(edit?"textarea.os-chapter-inline-copy.sub":".os-chapter-body")).toHaveCSS("font-size","18px");
  const input=card.locator("textarea.os-chapter-text-input");await expect(input).toHaveCSS("font-size","18px");await input.fill("Synthetic chapter answer.");await expect(input).toHaveValue("Synthetic chapter answer.");
}));

for(const width of [360,390])test(`Vision and Week read and write sizes at ${width}px`,{timeout:90_000},async()=>isolated(width,async page=>{
  await page.evaluate(()=>{window.circle.updateState(state=>window.api.declareLife(state,"vision",{life:"A quiet life",why:"Time with my family"}));window.goto("/os/mirror");});await ready(page);
  const vision=page.locator(".vision-life-apps .vision-declaration-page");await expect(vision).toBeVisible();
  await expect(vision.locator(".os-page-main .vision-declaration-field p")).toHaveCSS("font-size","29px");await expect(vision.locator(".os-page-sub .vision-declaration-field p")).toHaveCSS("font-size","18px");
  await vision.locator(".vision-declaration-copy").click();const main=vision.getByRole("textbox",{name:"Edit Vision: The life",exact:true}),sub=vision.getByRole("textbox",{name:"Edit Vision: Why it is worth wanting",exact:true});
  await expect(main).toHaveCSS("font-size","29px");await expect(sub).toHaveCSS("font-size","18px");await sub.fill("Time to notice my family");await vision.getByRole("button",{name:"Save declaration",exact:true}).click();await expect(vision.locator(".os-page-sub .vision-declaration-field p")).toHaveText("Time to notice my family");
  await page.evaluate(()=>window.goto("/os"));await ready(page);const log=page.locator(".os-log-session");await log.scrollIntoViewIfNeeded();await log.evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:500,deltaY:0,bubbles:true,cancelable:true})));
  await log.getByRole("button",{name:"Add goal",exact:true}).click();const goal=log.getByRole("textbox",{name:"Goal for this week",exact:true});await expect(goal).toHaveCSS("font-size","29px");await goal.fill("An editable week goal");await goal.blur();
  await log.getByRole("button",{name:"Add a step toward a goal",exact:true}).click();const step=log.getByRole("textbox",{name:"One step toward this goal",exact:true});await expect(step).toHaveCSS("font-size","18px");await step.fill("An editable step");await expect(step).toHaveValue("An editable step");
}));

for(const type of ["cover","info"])test(`reading-only Chapter ${type} keeps its type scale`,{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(type=>{window.typeChapter={id:"day-one",version:1,type,edit:false};window.goto("/os/type-chapter");},type);
  const title=page.locator(type==="cover"?".os-cover-page h2":".os-chapter-info .os-page-main > h2");await expect(title).toBeVisible();await expect(title).toHaveCSS("font-size","32px");
}));

test("real Habit and Protocol rows grow down without nested scrolling",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.circle.updateState(state=>{const a=window.api;for(let i=0;i<8;i++){const added=a.addHabitDefinition(state,"synthetic-habit-"+i);state=a.updateHabitDefinitionParts(added.state,added.id,{action:"Synthetic walk "+i,cue:"After lunch",identity:"Someone who notices"});}const started=a.startProtocolDraft(state,"synthetic-phase");state=started.state;for(let i=0;i<8;i++){const added=a.addProtocolItem(state,started.id,"non-negotiable","synthetic-term-"+i);state=a.updateProtocolItem(added.state,started.id,added.id,"Synthetic term "+i);}return a.beginProtocolRun(state,started.id,a.getDateKey());}));
  const routine=page.locator(".os-habit-session");await expect(routine.locator(".os-repeated-habit")).toHaveCount(8);
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
    assert.equal(await button.evaluate(el=>getComputedStyle(el).color),"rgb(227, 107, 55)");const bounds=await button.boundingBox();assert.ok(bounds.height>=44&&bounds.width>=44);
  }
  const labels=await box.locator("[data-os-note-header-text]").evaluateAll(elements=>elements.map(el=>{const range=document.createRange();range.selectNodeContents(el);const rect=range.getBoundingClientRect(),style=getComputedStyle(el);return{top:rect.top,bottom:rect.bottom,font:style.fontFamily,size:style.fontSize,weight:style.fontWeight,line:style.lineHeight,spacing:style.letterSpacing};}));
  console.log("Measured Note header",width,JSON.stringify(labels));assert.ok(Math.abs(labels[0].top-labels[1].top)<=0.25);assert.ok(Math.abs(labels[0].bottom-labels[1].bottom)<=0.25);assert.deepEqual({...labels[0],top:0,bottom:0},{...labels[1],top:0,bottom:0});
  for(const input of [title,body]){await input.focus();const style=await input.evaluate(el=>{const s=getComputedStyle(el);return{outline:s.outlineStyle,border:s.borderWidth,shadow:s.boxShadow,caret:s.caretColor,focused:el===document.activeElement};});assert.deepEqual({...style,caret:null},{outline:"none",border:"0px",shadow:"none",caret:null,focused:true});assert.notEqual(style.caret,"transparent");}
  await expect(box.getByRole("button",{name:/^(Clear|Discard.*|Drafts|Save.*|Versions|Undo|Writing options)$/})).toHaveCount(0);await expect(box).not.toContainText(/draft|Saving on this device|Saved on this device/i);
  assert.equal(await box.getByRole("button",{name:"History",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(227, 107, 55)");await box.getByRole("button",{name:"History",exact:true}).click();
  assert.equal(await box.getByRole("button",{name:"Trash",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(227, 107, 55)");
  await expect(box.getByRole("button",{name:"New Note",exact:true})).toHaveCount(0);await box.getByRole("button",{name:"Note",exact:true}).click();await box.getByRole("button",{name:"New Note",exact:true}).click();await expect(title).toBeFocused();await expect(title).toHaveValue("");await body.fill("A separate second Note.");await saved(page,2);
}));

test("leaving Note and hiding the page flush autosave before the pause; composition waits",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=notePage(page),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  await body.dispatchEvent("compositionstart");await body.fill("မင်္ဂလာပါ — mixed writing");await page.waitForTimeout(1200);
  assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0,"composition does not publish partial writing");
  await body.dispatchEvent("compositionend");await options(box,"History");await expect(row(box,"Untitled")).toBeVisible();await accepted(page,"မင်္ဂလာပါ — mixed writing");
  await row(box,"Untitled").click();await body.fill("Saved when the page hides.");await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent("pagehide")));await accepted(page,"Saved when the page hides.");
  await body.fill("Saved when leaving Today.");await page.evaluate(()=>window.goto("/os/mirror"));await accepted(page,"Saved when leaving Today.");
  await page.evaluate(()=>window.goto("/os"));await expect(body).toHaveValue("Saved when leaving Today.");
}));

test("older Note recovery copies remain reachable in History without draft controls",{timeout:90_000},async()=>isolated(390,async page=>{
  await page.evaluate(async()=>{
    const scope=window.api.getAccountScope(),owner="account:"+scope.accountId;
    for(const title of ["Recovered one","Recovered two"]){const at=new Date().toISOString(),draft={id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,startedAt:at,attribution:window.api.writingAttribution(at,"Asia/Bangkok"),content:{title,body:title+" body",tags:[]},source:null};
      await window.api.commitWritingOperation(scope,{owner,operationId:crypto.randomUUID(),at,type:"write-draft",draft,expectedDraftVersion:0});}
  });
  const box=notePage(page);await options(box,"History");await expect(box).not.toContainText(/draft|discard/i);
  for(const title of ["Recovered one","Recovered two"]){await row(box,title).click();await expect(box.getByRole("textbox",{name:"Note title",exact:true})).toHaveValue(title);await accepted(page,title+" body");await options(box,"History");}
  await saved(page,2);await page.reload();await ready(page);await options(box,"History");await expect(row(box,"Recovered one")).toHaveCount(1);await expect(row(box,"Recovered two")).toHaveCount(1);
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
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&Object.keys(value.entries).length){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
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
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==="writing"&&Object.keys(value.entries).length>1){IDBObjectStore.prototype.put=put;throw new DOMException("Synthetic full device","QuotaExceededError");}return put.call(this,value,...args);};});
  await fresh.click();await expect(box.getByRole("alert")).toContainText("Your open text is still here");await expect(body).toHaveValue("Unfinished composition");await saved(page,1);await expect(fresh).toHaveAttribute("aria-busy","false");
  await fresh.click();await expect(title).toBeFocused();await expect(body).toHaveValue("");await accepted(page,"Unfinished composition");await saved(page,2);
  await options(box,"History");await expect(fresh).toHaveCount(0);await expect(row(box,"Save before the next note")).toBeVisible();
}));

for(const [width,height] of [[390,844],[360,667]])test(`Note, History and Trash stay bounded at ${width}x${height}`,{timeout:90_000},async()=>isolated(width,async(page,context)=>{
  const box=notePage(page),frame=page.locator(".os-checkin-session"),body=box.getByRole("textbox",{name:"Write a note",exact:true});
  const long=Array.from({length:45},(_,i)=>`Line ${i+1}: synthetic writing stays inside the frame.`).join("\n");
  await box.getByRole("textbox",{name:"Note title",exact:true}).fill("A longer bounded note");await body.fill(long);await accepted(page,long);
  async function settled(){await expect(box).not.toHaveClass(/\bos-app-flip\b/);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
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
