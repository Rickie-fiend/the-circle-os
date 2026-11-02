import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";

// Isolated test UI imports the actual provider/store; no production test route.
const harness = `
import React, { useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import * as scopes from "/app/os/account-scope.js";
import * as store from "/app/os/writing-store.ts";
import * as model from "/app/os/writing-model.js";
import * as compatibility from "/app/os/writing-compatibility-model.js";
import * as circleStore from "/app/os/circle-os-store.ts";
import { createEmptyState } from "/app/os/circle-os-model.js";
import { buildServerPayload } from "/app/os/circle-os-ai.ts";
import { CircleStateProvider, useCircleState } from "/app/os/circle-os-shell.tsx";
import { WritingProvider, useWriting } from "/app/os/writing-provider.tsx";
import { selectDeepThoughtPrompt } from "/app/os/deep-thought-model.js";
import { firstUsePlaceholder } from "/app/os/first-use.js";
const at="2026-11-02T03:00:00.000Z";
const fixture=()=>{const s=createEmptyState();s.ai.baseUrl="";return s;};
function Probe({state}) {
  const writing=useWriting(); window.currentWriting=writing; window.circleSnapshot=state;
  const view=writing?.view;
  const prompt=writing ? selectDeepThoughtPrompt(state,"2026-11-02",0,{view,curiosity:writing.memory.curiosity||[]}) : null;
  return React.createElement("section",{"data-testid":"probe","data-status":writing?.status||"legacy"},
    React.createElement("pre",{"data-testid":"view"},JSON.stringify(writing ? {
      owner:writing.owner,status:writing.status,error:writing.error,write:writing.write,
      history:writing.history,trash:writing.trash,drafts:writing.drafts,view,memory:writing.memory,prompt,
      noteGreeting:firstUsePlaceholder(state,"note",view),thoughtGreeting:firstUsePlaceholder(state,"thoughts",view)
    }:null)));
}
function Inputs({scope}) {
  const [state,setState]=useState(fixture); window.setInputs=setState;
  return React.createElement(WritingProvider,{scope,enabled:true,answers:state.profile.profileCase.survey.answers,memory:state.athenaMemory},React.createElement(Probe,{state}));
}
function Standalone() {
  const scope=useSyncExternalStore(scopes.subscribeAccountScope,scopes.getAccountScope,scopes.getServerAccountScope);
  return scope.kind==="signed-out" ? null : React.createElement(Inputs,{key:scope.epoch,scope});
}
function ActualProbe() {const {state,ready}=useCircleState();return ready ? React.createElement(Probe,{state}):null;}
const root=createRoot(document.getElementById("root"));
const scope=()=>scopes.getAccountScope();
const command=(type,values,operationId=crypto.randomUUID())=>({owner:store.writingOwner(scope()),at,operationId,type,...values});
const input=(body="Synthetic writing",overrides={})=>({id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,
  startedAt:at,attribution:model.writingAttribution(at,"Asia/Bangkok"),content:{title:"",body,tags:[]},source:null,...overrides});
async function write(draft,expectedDraftVersion=0){return window.currentWriting.commit(command("write-draft",{draft,expectedDraftVersion}));}
async function save(draft){const request=command("save",{draft});return {receipt:await window.currentWriting.commit(request),request};}
async function seed(body="Synthetic writing",overrides={}){const draft=input(body,overrides);await write(draft);const state=await store.loadWritingState(scope());return {...await save(state.drafts[draft.id]),entryId:draft.entryId};}
async function edit(entryId,body){const s=await store.loadWritingState(scope()),e=s.entries[entryId];
  const d=input(body,{entryId,kind:e.kind,source:e.source,startedAt:e.startedAt,attribution:e.versions.at(-1).attribution,baseVersionId:e.currentVersionId,baseGeneration:e.generation});
  await write(d);return (await store.loadWritingState(scope())).drafts[d.id];}
async function life(type,entryId){const s=await store.loadWritingState(scope());return window.currentWriting.commit(command(type,{entryId,expectedGeneration:s.entries[entryId].generation,...(type==="delete"?{confirmed:true}:{})}));}
window.api={...scopes,...store,...model,...compatibility,...circleStore,scope,command,input,write,save,seed,edit,life,fixture,buildServerPayload,
  mount(actual=false){root.render(actual?React.createElement(CircleStateProvider,null,React.createElement(ActualProbe)):React.createElement(Standalone));},
  setAnswers(answers){window.setInputs(s=>({...s,profile:{...s.profile,profileCase:{...s.profile.profileCase,survey:{...s.profile.profileCase.survey,answers}}}}));},
  setMemory(memory){window.setInputs(s=>({...s,athenaMemory:{...s.athenaMemory,...memory}}));},
  load(){return store.loadWritingState(scope());}
};
`;

let server, browser, baseURL;
before(async () => {
  server = await createServer({ configFile: false,
    define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
    plugins: [react(), {
      name: "isolated-writing-provider",
      resolveId(id) { if (id === "virtual:writing-provider-test") return "\0writing-provider-test.tsx"; },
      load(id) { if (id === "\0writing-provider-test.tsx") return harness; },
      configureServer(vite) {
        vite.middlewares.use("/__writing-provider-test", async (_request, response, next) => {
          try {
            response.setHeader("Content-Type", "text/html");
            response.end(await vite.transformIndexHtml("/__writing-provider-test", '<div id="root"></div><script type="module" src="/@id/virtual:writing-provider-test"></script>'));
          } catch (cause) { next(cause); }
        });
      },
    }],
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**", "**/dist/**"] } },
    optimizeDeps: { include: ["react", "react-dom/client", "next/link", "next/navigation"] },
  });
  await server.listen(); baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server?.close(); });

async function open(page) {
  await page.goto(`${baseURL}/__writing-provider-test`);
  await page.waitForFunction(() => Boolean(window.api));
}
async function ready(page) { await expect(page.getByTestId("probe")).toHaveAttribute("data-status", "ready"); }
async function state(page) { return page.getByTestId("view").textContent().then(JSON.parse); }
async function isolated(width, work, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const errors = [], requests = [];
  context.on("page", page => page.on("pageerror", cause => errors.push(cause.message)));
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === baseURL) return route.continue();
    requests.push(route.request().url()); return route.abort();
  });
  try {
    if (options.noChannel) await context.addInitScript(() => { window.BroadcastChannel = undefined; });
    const page = await context.newPage(); await open(page);
    await page.evaluate(() => window.api.activateAccountScope("synthetic-a"));
    if (options.mount !== false) { await page.evaluate(() => window.api.mount()); await ready(page); }
    await work(page, context);
    assert.deepEqual(errors, [], "no uncaught page errors"); assert.deepEqual(requests, [], "no external backend/AI requests");
  } finally { await context.close(); }
}

for (const width of [390, 360]) {
  test(`durable drafts, saves, corrections and versions at ${width}px`, { timeout: 60_000 }, async () => isolated(width, async page => {
    const result = await page.evaluate(async () => {
      const a=window.api,d=a.input("Unsent secret");await a.write(d);
      if(window.currentWriting.history.length||window.currentWriting.view?.sources.length)throw Error("Draft became evidence");
      const first=await a.seed("First saved Note");await a.seed("Second saved Note");
      await a.save(await a.edit(first.entryId,"Corrected saved Note"));await window.currentWriting.refresh();
      return first.entryId;
    });
    await ready(page);
    assert.deepEqual(await page.evaluate(id=>window.currentWriting.versions(id).map(v=>v.content.body),result),["Corrected saved Note","First saved Note"]);
    let current=await state(page);
    assert.equal(current.history.length,2);assert.equal(current.drafts.length,1);assert.equal(current.view.sources.length,2);assert.equal(current.noteGreeting,"");
    await page.reload();await page.waitForFunction(()=>Boolean(window.api));await page.evaluate(()=>window.api.mount());await ready(page);current=await state(page);
    assert.equal(current.history.length,2);assert.equal(current.drafts[0].content.body,"Unsent secret");
  }));

  test(`Trash/deletion retain question status, gate memory and ignore old receipt state at ${width}px`, { timeout: 60_000 }, async () => isolated(width, async page => {
    const original=await page.evaluate(async()=>{
      const a=window.api,first=await a.seed("Private answer to delete",{kind:"deep-thought",source:{questionId:"deep-local-old",question:"What is your hidden talent?",source:"local"}});
      const s=await a.load(),v=await a.buildWritingCompatibilityView({owner:s.owner,writingState:s}),source=v.sources[0];
      a.setMemory({ledger:[{id:"dependent",statement:"A derived claim.",sourceRefs:[{owner:s.owner,sourceSystem:"writing",sourceType:"deep-thought",sourceId:source.id,versionId:source.versionId}]}],
        reading:{cover:"Received cover.",days:[{heading:"Received",text:"Received prose."}]},editions:[]});return first;
    });
    await expect.poll(async()=>(await state(page)).memory.ledger.length).toBe(1);const reading=JSON.stringify((await state(page)).memory.reading);
    await page.evaluate(id=>window.api.life("trash",id),original.entryId);await ready(page);
    let current=await state(page);assert.equal(current.memory.ledger.length,0);assert.equal(current.view.answeredQuestions.length,1);assert.equal(current.thoughtGreeting,"");
    await page.evaluate(id=>window.api.life("restore",id),original.entryId);await ready(page);assert.equal((await state(page)).memory.ledger.length,1);
    await page.evaluate(async id=>{await window.api.life("trash",id);await window.api.life("delete",id);},original.entryId);
    await page.evaluate(request=>window.currentWriting.commit(request),original.request);await ready(page);current=await state(page);
    assert.equal(current.write.status,"saved");assert.deepEqual(current.history,[]);assert.deepEqual(current.trash,[]);assert.equal(current.memory.ledger.length,0);
    assert.equal(current.view.answeredQuestions.length,1);assert.equal(current.thoughtGreeting,"");assert.notEqual(current.prompt.text,"What is your hidden talent?");
    assert.equal(JSON.stringify(current.memory.reading),reading);assert.equal(await page.evaluate(async()=>JSON.stringify(await window.api.load()).includes("Private answer to delete")),false);
    await page.reload();await page.waitForFunction(()=>Boolean(window.api));await page.evaluate(()=>window.api.mount());await ready(page);
    current=await state(page);assert.equal(current.view.answeredQuestions.length,1);assert.equal(current.thoughtGreeting,"");
  }));
}

for (const noChannel of [false,true]) {
  test(`two tabs refresh after commits and preserve competing corrections (channel disabled: ${noChannel})`, { timeout: 60_000 }, async()=>isolated(390,async(page,context)=>{
    const other=await context.newPage();await open(other);await other.evaluate(()=>window.api.mount());await ready(other);
    const first=await page.evaluate(()=>window.api.seed("Written in the first tab"));
    await expect.poll(async()=>(await state(other)).history[0]?.content.body).toBe("Written in the first tab");
    const candidateA=await page.evaluate(id=>window.api.edit(id,"Candidate A"),first.entryId);
    const candidateB=await other.evaluate(id=>window.api.edit(id,"Candidate B"),first.entryId);
    await page.evaluate(draft=>window.api.save(draft),candidateA);
    const result=await other.evaluate(draft=>window.api.save(draft),candidateB);assert.equal(result.receipt.outcome,"conflict");
    await expect.poll(async()=>(await state(other)).history[0]?.content.body).toBe("Candidate A");
    assert.ok((await state(other)).drafts.some(d=>d.content.body==="Candidate B"));
    await other.evaluate(id=>window.api.life("trash",id),first.entryId);
    await expect.poll(async()=>(await state(page)).history.length).toBe(0);
  },{noChannel}));
}

test("cross-tab old-answer changes stay fresh after later writing notifications",{timeout:60_000},async()=>isolated(390,async(page,context)=>{
  const other=await context.newPage();await open(other);
  await other.evaluate(async()=>{const a=window.api,s=a.fixture();s.profile.profileCase.survey.answers=[{questionId:"old-thought",kind:"thought",answer:"Existing changed text",question:"Original?"}];await a.saveCircleState(a.scope(),s);});
  await expect.poll(async()=>(await state(page)).view?.sources.find(s=>s.sourceSystem==="existing")?.content.body).toBe("Existing changed text");
  await page.evaluate(()=>window.api.seed("Separate new writing"));await ready(page);
  assert.equal((await state(page)).view.sources.find(s=>s.sourceSystem==="existing").content.body,"Existing changed text");
}));

test("late hashing and captured callbacks cannot cross logout or A/B/A epochs",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>{
    window.oldCommit=window.currentWriting.commit;window.oldVersions=window.currentWriting.versions;
    window.originalDigest=crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest=async(...args)=>{await new Promise(resolve=>window.releaseHash=resolve);return window.originalDigest(...args);};
    window.pending=window.currentWriting.commit(window.api.command("write-draft",{draft:window.api.input("Never cross accounts"),expectedDraftVersion:0})).then(()=>"accepted",e=>e.name);
  });
  await page.waitForFunction(()=>Boolean(window.releaseHash));await page.evaluate(()=>window.api.activateAccountScope("synthetic-b"));await ready(page);
  await page.evaluate(()=>{crypto.subtle.digest=window.originalDigest;window.releaseHash();});assert.equal(await page.evaluate(()=>window.pending),"AccountScopeChangedError");
  assert.equal((await state(page)).owner,"account:synthetic-b");assert.deepEqual((await state(page)).drafts,[]);
  await page.evaluate(()=>window.api.activateAccountScope("synthetic-a"));await ready(page);
  const result=await page.evaluate(async()=>({old:await window.oldCommit(window.api.command("write-draft",{draft:window.api.input(),expectedDraftVersion:0})).then(()=>"accepted",e=>e.name),
    versions:(()=>{try{window.oldVersions("missing");return "accepted";}catch(e){return e.name;}})()}));
  assert.deepEqual(result,{old:"AccountScopeChangedError",versions:"AccountScopeChangedError"});
  await page.evaluate(()=>window.api.activateAccountScope(null));await expect(page.getByTestId("probe")).toHaveCount(0);
}));

test("an older compatibility hash cannot overwrite new inputs",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>{
    window.originalDigest=crypto.subtle.digest.bind(crypto.subtle);let held=false;
    crypto.subtle.digest=async(...args)=>{if(!held){held=true;await new Promise(resolve=>window.releaseHash=resolve);}return window.originalDigest(...args);};
    window.api.setAnswers([{questionId:"old",kind:"thought",answer:"Old snapshot",question:"Old?"}]);
  });
  await page.waitForFunction(()=>Boolean(window.releaseHash));
  await page.evaluate(()=>window.api.setAnswers([{questionId:"new",kind:"thought",answer:"New snapshot",question:"New?"}]));
  await expect.poll(async()=>(await state(page)).view?.sources[0]?.content.body).toBe("New snapshot");
  await page.evaluate(()=>{crypto.subtle.digest=window.originalDigest;window.releaseHash();});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal((await state(page)).view.sources[0].content.body,"New snapshot");
}));

test("a delayed account read is rejected after switching and cannot populate the next account",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>{
    window.originalOpen=indexedDB.open.bind(indexedDB);let held=false;
    indexedDB.open=(...args)=>{const request=window.originalOpen(...args);if(!held){held=true;
      Object.defineProperty(request,"onsuccess",{set(callback){request.addEventListener("success",event=>{window.releaseOpen=()=>callback.call(request,event);});}});
    }return request;};
    window.pendingRead=window.currentWriting.refresh();
  });
  await page.waitForFunction(()=>Boolean(window.releaseOpen));await page.evaluate(()=>window.api.activateAccountScope("synthetic-b"));await ready(page);
  await page.evaluate(()=>{indexedDB.open=window.originalOpen;window.releaseOpen();});
  assert.equal(await page.evaluate(()=>window.pendingRead),false);assert.equal((await state(page)).owner,"account:synthetic-b");assert.deepEqual((await state(page)).history,[]);
}));

test("an older hash from the same inputs cannot erase a newer committed entry",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.api.setAnswers([{questionId:"existing",kind:"thought",answer:"Existing text",question:"Original?"}]));await ready(page);
  await page.evaluate(()=>{
    window.originalDigest=crypto.subtle.digest.bind(crypto.subtle);let held=false;
    crypto.subtle.digest=async(...args)=>{if(!held){held=true;await new Promise(resolve=>window.releaseHash=resolve);}return window.originalDigest(...args);};
    window.pendingRead=window.currentWriting.refresh();
  });
  await page.waitForFunction(()=>Boolean(window.releaseHash));await page.evaluate(()=>window.api.seed("New entry during old read"));await ready(page);
  await page.evaluate(()=>{crypto.subtle.digest=window.originalDigest;window.releaseHash();});assert.equal(await page.evaluate(()=>window.pendingRead),false);
  assert.equal((await state(page)).history[0].content.body,"New entry during old read");
}));

test("an older in-flight write cannot replace the latest action status or erase newer typing",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>{
    const a=window.api;window.originalDigest=crypto.subtle.digest.bind(crypto.subtle);let held=false;
    crypto.subtle.digest=async(...args)=>{if(!held){held=true;await new Promise(resolve=>window.releaseHash=resolve);}return window.originalDigest(...args);};
    window.oldDraft=a.input("Earlier typing");window.pendingWrite=a.write(window.oldDraft);
  });
  await page.waitForFunction(()=>Boolean(window.releaseHash));
  await page.evaluate(()=>window.api.write({...window.oldDraft,content:{title:"",body:"Newer typing",tags:[]}}));
  await page.evaluate(()=>{crypto.subtle.digest=window.originalDigest;window.releaseHash();});
  assert.equal((await page.evaluate(()=>window.pendingWrite)).outcome,"conflict");await ready(page);
  const current=await state(page);assert.equal(current.write.status,"drafted");
  assert.ok(current.drafts.some(d=>d.content.body==="Newer typing"));assert.ok(current.drafts.some(d=>d.content.body==="Earlier typing"));
}));

test("committed save with failed refresh stays saved; failed writes preserve draft and retry",{timeout:60_000},async()=>isolated(390,async page=>{
  const request=await page.evaluate(async()=>{const a=window.api,d=a.input("Recoverable draft");await a.write(d);return a.command("save",{draft:(await a.load()).drafts[d.id]});});
  await page.evaluate(()=>{window.originalTransaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){if(args[1]==="readonly")throw Error("Synthetic read failure");return window.originalTransaction.apply(this,args);};});
  assert.equal((await page.evaluate(request=>window.currentWriting.commit(request),request)).outcome,"saved");
  await expect(page.getByTestId("probe")).toHaveAttribute("data-status","error");assert.equal((await state(page)).write.status,"saved");assert.equal((await state(page)).view,null);
  await page.evaluate(()=>{IDBDatabase.prototype.transaction=window.originalTransaction;return window.currentWriting.refresh();});await ready(page);
  assert.equal((await state(page)).history[0].content.body,"Recoverable draft");
  await page.evaluate(async()=>{const a=window.api,d=a.input("Keep this failed-save text");await a.write(d);window.failedSave=a.command("save",{draft:(await a.load()).drafts[d.id]});
    IDBDatabase.prototype.transaction=function(...args){if(args[1]==="readwrite")throw Error("Synthetic quota failure");return window.originalTransaction.apply(this,args);};});
  assert.equal(await page.evaluate(()=>window.currentWriting.commit(window.failedSave).then(()=>"accepted",()=>"failed")),"failed");
  await expect.poll(async()=>(await state(page)).write.status).toBe("error");
  await page.evaluate(()=>{IDBDatabase.prototype.transaction=window.originalTransaction;return window.currentWriting.refresh();});await ready(page);
  assert.equal((await state(page)).drafts[0].content.body,"Keep this failed-save text");
  await page.evaluate(()=>window.currentWriting.commit(window.failedSave));await ready(page);assert.equal((await state(page)).history.length,2);
}));

test("notification failures cannot turn a committed save into failure or leak writing",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>{
    window.notifications=[];window.addEventListener("circle-os-writing-change",e=>window.notifications.push(e.detail));
    window.BroadcastChannel=class{constructor(){throw Error("Synthetic channel failure");}};
    window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.includes("writing-v1:change"))throw Error("Synthetic marker failure");return window.originalSetItem.call(this,key,value);};
  });
  await page.evaluate(()=>window.api.seed("Never put this text in notifications"));await ready(page);assert.equal((await state(page)).write.status,"saved");
  const notifications=await page.evaluate(()=>window.notifications);assert.ok(notifications.length>=2);assert.equal(JSON.stringify(notifications).includes("Never put this text"),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes("Never put this text")),false);
}));

test("real Circle provider mounts writing separately from legacy payloads and derived memory",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>window.api.mount(true));await ready(page);
  const before=await page.evaluate(()=>JSON.stringify({profile:window.circleSnapshot.profile,memory:window.circleSnapshot.athenaMemory,outbox:window.circleSnapshot.outbox}));
  await page.evaluate(()=>window.api.seed("Ledger-only account writing"));await ready(page);
  await page.evaluate(()=>window.api.write(window.api.input("Draft-only account writing")));await ready(page);
  const result=await page.evaluate(()=>({after:JSON.stringify({profile:window.circleSnapshot.profile,memory:window.circleSnapshot.athenaMemory,outbox:window.circleSnapshot.outbox}),payload:JSON.stringify(window.api.buildServerPayload(window.circleSnapshot))}));
  assert.equal(result.after,before);assert.equal(result.payload.includes("Ledger-only"),false);assert.equal(result.payload.includes("Draft-only"),false);
},{mount:false}));

test("legacy creates no writing ledger; failed account loads do not reset saved data",{timeout:60_000},async()=>isolated(390,async page=>{
  await page.evaluate(()=>localStorage.removeItem("circle-os-account-scope-v1"));await page.reload();await page.waitForFunction(()=>Boolean(window.api));
  await page.evaluate(()=>window.api.mount(true));await expect(page.getByTestId("probe")).toHaveAttribute("data-status","legacy");
  assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).some(db=>db.name.startsWith("circle-os-writing-v1"))),false);
  await page.evaluate(()=>window.api.activateAccountScope("synthetic-a"));await ready(page);await page.evaluate(()=>window.api.seed("Keep previously saved data"));
  await page.evaluate(()=>{window.originalOpen=indexedDB.open.bind(indexedDB);indexedDB.open=()=>{throw Error("Synthetic unavailable storage");};return window.currentWriting.refresh();});
  await expect(page.getByTestId("probe")).toHaveAttribute("data-status","error");assert.equal((await state(page)).view,null);
  await page.evaluate(()=>{indexedDB.open=window.originalOpen;return window.currentWriting.refresh();});await ready(page);
  assert.equal((await state(page)).history[0].content.body,"Keep previously saved data");
},{mount:false}));
