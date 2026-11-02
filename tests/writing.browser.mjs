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
function Root(){const [path,setPath]=useState("/os");window.goto=setPath;const router={push:setPath,replace:setPath,prefetch:()=>Promise.resolve(),refresh(){},back(){setPath("/os");},forward(){}};
 return React.createElement(AppRouterContext.Provider,{value:router},React.createElement(PathnameContext.Provider,{value:path},
 React.createElement(CircleStateProvider,null,React.createElement(Probe),React.createElement(OSFrame,null,path==="/os/mirror"?React.createElement(Mirror):React.createElement(TodayExperience)))));}
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
async function options(box,name){if(name==="History"&&await box.getAttribute("class").then(value=>value.includes("os-note-page"))){await box.getByRole("button",{name:"History",exact:true}).click();return;}await box.getByRole("button",{name:"Writing options",exact:true}).click();await box.getByRole("button",{name,exact:true}).click();}
async function saved(page,count=1){await expect.poll(()=>page.evaluate(async()=>Object.keys((await window.api.load()).entries).length)).toBe(count);}
async function accepted(page,body){await expect.poll(()=>page.evaluate(async body=>Object.values((await window.api.load()).entries).some(entry=>entry.versions.at(-1).content.body===body),body)).toBe(true);await expect.poll(()=>page.evaluate(()=>window.writing.status)).toBe("ready");}
const row=(box,title)=>box.locator(".os-writing-entry").filter({hasText:title});
const trashRow=(box,title)=>box.getByRole("button",{name:`Move ${title} to Trash`,exact:true});
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
  const box=page.locator(".os-writing-page.os-thoughts-page");await expect(box.getByRole("button",{name:"Show Deep Thoughts",exact:true})).toBeVisible();return box;
}
test("Thought sends only after acceptance; Deep answer retains its original question",{timeout:90_000},async()=>isolated(360,async page=>{
  const box=await thoughts(page);
  await box.getByRole("textbox",{name:"Write a thought",exact:true}).fill("Synthetic ordinary thought.");
  await expect(box.getByRole("button",{name:"Send",exact:true})).toBeEnabled();await box.getByRole("button",{name:"Send",exact:true}).click();await saved(page);
  await expect(box.getByRole("textbox",{name:"Write a thought",exact:true})).toHaveValue("");
  await box.getByRole("button",{name:"Show Deep Thoughts",exact:true}).click();
  const question=await box.locator(".os-deep-thought-question").textContent();
  await box.getByRole("textbox",{name:"Answer the deep thought",exact:true}).fill("Synthetic answer with enough words to keep.");
  await expect(box.getByRole("button",{name:"Send",exact:true})).toBeEnabled();await box.getByRole("button",{name:"Send",exact:true}).click();await saved(page,2);
  const ledger=await page.evaluate(()=>window.api.load());const deep=Object.values(ledger.entries).find(e=>e.kind==="deep-thought");assert.equal(deep.source.question,question);assert.ok(deep.source.questionId);
  await expect(box.getByRole("button",{name:"Show Deep Thoughts",exact:true})).toBeVisible();
  await options(box,"History");await box.getByRole("button",{name:/Synthetic answer with enough words to keep/}).click();await expect(box.getByRole("heading",{name:question,exact:true})).toBeVisible();
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
  for(const item of Object.values(result)){assert.equal(item.gap,80,"shared header gap");assert.ok(Math.abs(item.visibleGap-result.habit.visibleGap)<=1,"visible label gaps agree");}
  await page.locator(".os-checkin-session").evaluate(el=>el.dispatchEvent(new WheelEvent("wheel",{deltaX:-500,deltaY:0,bubbles:true,cancelable:true})));await page.waitForTimeout(450);
  await notePage(page).getByRole("textbox",{name:"Note title",exact:true}).fill("A short Note");await notePage(page).getByRole("textbox",{name:"Write a note",exact:true}).fill("A short body.");
  assert.ok(Math.abs((await measure(".os-writing-page.os-note-page")).height-result.note.height)<=1,"short Note rests at default");
  if(width===390)await page.locator(".os-checkin-session").screenshot({path:"outputs/writing-ui-390.png"});
  await notePage(page).getByRole("textbox",{name:"Write a note",exact:true}).fill(Array(25).fill("A longer synthetic paragraph grows downward.").join("\n"));
  const grown=await measure(".os-writing-page.os-note-page");assert.ok(grown.height>result.note.height);assert.ok(grown.height<=480);assert.equal(grown.scroll,false);assert.equal(grown.gap,80);
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

test("normal-motion Thoughts wait for durable acceptance before departure",{timeout:90_000},async()=>isolated(390,async page=>{
  const box=await thoughts(page);const input=box.getByRole("textbox",{name:"Write a thought",exact:true});await input.fill("Synthetic thought waiting for acceptance.");await expect(box.getByRole("button",{name:"Send",exact:true})).toBeEnabled();
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{if(new TextDecoder().decode(args[1]).includes('"type":"save"')){crypto.subtle.digest=digest;await new Promise(resolve=>window.releaseSend=resolve);}return digest(...args);};});
  await box.getByRole("button",{name:"Send",exact:true}).click();await page.waitForFunction(()=>Boolean(window.releaseSend));await page.waitForTimeout(800);
  await expect(input).toHaveValue("Synthetic thought waiting for acceptance.");assert.equal(await box.locator(".is-departing").count(),0);assert.equal(Object.keys((await page.evaluate(()=>window.api.load())).entries).length,0);
  await page.evaluate(()=>window.releaseSend());await saved(page);await expect(input).toHaveValue("");
},{reducedMotion:"no-preference"}));

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
  const entries=Object.values((await page.evaluate(()=>window.api.load())).entries);assert.equal(entries.length,1);assert.equal(entries[0].versions[0].content.title,"First synthetic Note");assert.equal(entries[0].versions.length,2);
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
