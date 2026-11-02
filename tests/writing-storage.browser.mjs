import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { chromium } from "@playwright/test";

// This isolated harness imports the actual engine/store. It is not a production
// route or proof of the future writing UI, service worker, cloud sync or auth.
const harness = `
import * as scopes from "/app/os/account-scope.js";
import * as model from "/app/os/writing-model.js";
import * as store from "/app/os/writing-store.ts";
const at = "2026-11-02T03:00:00.000Z";
const scope = () => scopes.getAccountScope();
const command = (type, values, operationId = crypto.randomUUID()) => ({owner:store.writingOwner(scope()),at,operationId,type,...values});
const input = (body = "Synthetic writing", overrides = {}) => ({
  id:crypto.randomUUID(),entryId:crypto.randomUUID(),kind:"note",baseVersionId:null,baseGeneration:0,
  startedAt:at,attribution:model.writingAttribution(at,"Asia/Bangkok"),content:{title:"",body,tags:[]},source:null,...overrides
});
async function write(draft, expectedDraftVersion = 0) {
  const request = command("write-draft",{draft,expectedDraftVersion});
  return { ...await store.commitWritingOperation(scope(),request), request };
}
async function save(draft) {
  const request = command("save",{draft});
  return { ...await store.commitWritingOperation(scope(),request), request };
}
async function seed(body = "Synthetic writing") {
  const draft = input(body), result = await write(draft);
  return { ...await save(result.state.drafts[draft.id]), draftId:draft.id, entryId:draft.entryId };
}
async function edit(entryId, body) {
  const state = await store.loadWritingState(scope()), entry=state.entries[entryId], version=entry.versions.at(-1);
  const draft=input(body,{entryId,kind:entry.kind,source:entry.source,startedAt:entry.startedAt,
    baseVersionId:entry.currentVersionId,baseGeneration:entry.generation,attribution:version.attribution});
  const result=await write(draft); return result.state.drafts[draft.id];
}
async function life(type, entryId, overrides={}) {
  const state=await store.loadWritingState(scope());
  return store.commitWritingOperation(scope(),command(type,{entryId,expectedGeneration:state.entries[entryId].generation,...overrides}));
}
window.api={...scopes,...model,...store,scope,command,input,write,save,seed,edit,life,
  init(){return scopes.activateAccountScope("synthetic-a");},
  load(){return store.loadWritingState(scope());}
};
`;

let server, browser, baseURL;
before(async () => {
  server = await createServer({ configFile: false,
    define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
    plugins: [{ name: "isolated-writing-storage",
      resolveId(id) { if (id === "virtual:writing-storage-test") return "\0writing-storage-test.ts"; },
      load(id) { if (id === "\0writing-storage-test.ts") return harness; },
      configureServer(vite) {
        vite.middlewares.use("/__writing-storage-test", async (_request, response, next) => {
          try {
            response.setHeader("Content-Type", "text/html");
            response.end(await vite.transformIndexHtml("/__writing-storage-test", '<p>Isolated writing storage</p><script type="module" src="/@id/virtual:writing-storage-test"></script>'));
          } catch (error) { next(error); }
        });
      },
    }],
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**", "**/dist/**"] } },
  });
  await server.listen();
  baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server?.close(); });

test("permanently deleted Deep Thought retains question/use metadata across real store reload", { timeout: 60_000 }, async () => isolated(390, async page => {
  const entryId = await page.evaluate(async () => {
    const a=window.api,d=a.input("Answer that must leave the ledger",{kind:"deep-thought",source:{questionId:"deep-source",question:"Original question?",source:"local"}});
    await a.write(d);await a.save((await a.load()).drafts[d.id]);await a.life("trash",d.entryId);await a.life("delete",d.entryId,{confirmed:true});return d.entryId;
  });
  await page.reload();await page.waitForFunction(()=>Boolean(window.api));
  const result=await page.evaluate(async id=>{const state=await window.api.load();return {usage:state.tombstones[id].usage,containsAnswer:JSON.stringify(state).includes("Answer that must leave"),history:window.api.writingHistory(state)};},entryId);
  assert.deepEqual(result,{usage:{kind:"deep-thought",answeredAt:"2026-11-02T03:00:00.000Z",questionId:"deep-source",question:"Original question?"},containsAnswer:false,history:[]});
}));

async function open(page) {
  await page.goto(`${baseURL}/__writing-storage-test`);
  await page.waitForFunction(() => Boolean(window.api));
}
async function isolated(width, work) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const errors = [];
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  await context.route("**/*", route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
  try {
    const page = await context.newPage(); await open(page); await page.evaluate(() => window.api.init());
    await work(page, context); assert.deepEqual(errors, [], "no uncaught page errors");
  } finally { await context.close(); }
}

for (const width of [390, 360]) {
  test(`draft recovery, lost-response retry and saved versions at ${width}px`, { timeout: 60_000 }, async () => isolated(width, async page => {
    const draftId = await page.evaluate(async () => { const a=window.api, d=a.input(); await a.write(d); return d.id; });
    await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    const savedRequest = await page.evaluate(async id => {
      const a=window.api, state=await a.load();
      if(a.writingHistory(state).length || a.writingEvidence(state).length) throw new Error("Draft leaked into history/evidence");
      return (await a.save(state.drafts[id])).request;
    }, draftId);
    await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    const result = await page.evaluate(async request => {
      const a=window.api;
      const retry=await a.commitWritingOperation(a.scope(),request);
      const id=retry.receipt.entryId, original=a.writingHistory(retry.state)[0];
      await a.save(await a.edit(id,"Corrected on return"));
      await a.seed("Second Note today");
      const state=await a.load();
      return { title:original.title, authoredTitle:original.content.title, entries:a.writingHistory(state).length,
        drafts:a.writingDrafts(state).length, versions:a.writingVersions(state,id).map(v=>v.content.body), evidence:a.writingEvidence(state).length };
    }, savedRequest);
    assert.deepEqual(result, { title: "Untitled", authoredTitle: "", entries: 2, drafts: 0,
      versions: ["Corrected on return", "Synthetic writing"], evidence: 2 });
  }));

  test(`loaded offline writes survive reconnection/reload at ${width}px`, { timeout: 60_000 }, async () => isolated(width, async (page, context) => {
    await context.setOffline(true);
    await page.evaluate(async () => {
      const a=window.api; await a.seed("Saved offline"); await a.write(a.input("Unsent offline draft"));
    });
    await context.setOffline(false); await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    const result = await page.evaluate(async () => {
      const a=window.api,s=await a.load(); return { entries:a.writingHistory(s).map(e=>e.content.body),drafts:a.writingDrafts(s).map(d=>d.content.body) };
    });
    assert.deepEqual(result, { entries: ["Saved offline"], drafts: ["Unsent offline draft"] });
  }));

  test(`Trash, Restore and permanent local deletion survive reload at ${width}px`, { timeout: 60_000 }, async () => isolated(width, async page => {
    const savedRequest = await page.evaluate(async () => {
      const a=window.api, saved=await a.seed("synthetic-delete-secret");
      await a.edit(saved.entryId,"synthetic-delete-secret draft");
      let s=(await a.life("trash",saved.entryId)).state;
      if(a.writingEvidence(s).length || a.writingHistory(s).length || a.writingDrafts(s).length) throw new Error("Trash leaked into evidence/history/recovery");
      s=(await a.life("restore",saved.entryId)).state;
      if(a.writingHistory(s)[0].id!==saved.entryId || a.writingVersions(s,saved.entryId).length!==1 || a.writingDrafts(s).length!==1) throw new Error("Restore lost identity/version/draft");
      await a.life("trash",saved.entryId);
      await a.life("delete",saved.entryId,{confirmed:true});
      return saved.request;
    });
    await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    const result = await page.evaluate(async request => {
      const a=window.api, retry=await a.commitWritingOperation(a.scope(),request), s=await a.load();
      const stale=await a.write(a.input("stale resurrection",{entryId:request.draft.entryId})).then(()=>"accepted",e=>e.code);
      return { savedRetry:retry.receipt.outcome,entries:a.writingHistory(s).length,trash:a.writingHistory(s,{status:"trashed"}).length,
        drafts:a.writingDrafts(s).length,hasDeletedText:JSON.stringify(s).includes("synthetic-delete-secret"),stale,tombstones:Object.keys(s.tombstones).length };
    }, savedRequest);
    assert.deepEqual(result, { savedRetry: "saved", entries: 0, trash: 0, drafts: 0, hasDeletedText: false, stale: "deleted", tombstones: 1 });
  }));
}

test("a receipt resolves after actual transaction completion, not request success", { timeout: 60_000 }, async () => isolated(390, async page => {
  const events=await page.evaluate(async () => {
    const a=window.api,events=[],transaction=IDBDatabase.prototype.transaction,put=IDBObjectStore.prototype.put;
    IDBDatabase.prototype.transaction=function(...args){const tx=transaction.apply(this,args);if(args[1]==="readwrite")tx.addEventListener("complete",()=>events.push("committed"));return tx;};
    IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.addEventListener("success",()=>events.push("request-success"));return request;};
    try {await a.write(a.input());events.push("resolved");return events;}
    finally {IDBDatabase.prototype.transaction=transaction;IDBObjectStore.prototype.put=put;}
  });
  assert.deepEqual(events, ["request-success", "committed", "resolved"]);
}));

test("aborting after request success rolls back the entire saved change and receipt", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,first=await a.seed(),draft=await a.edit(first.entryId,"Aborted correction"),before=await a.load();
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.addEventListener("success",()=>this.transaction.abort());return request;};
    let outcome;
    try {outcome=await a.save(draft).then(()=>"resolved",()=>"rejected");}
    finally {IDBObjectStore.prototype.put=put;}
    const after=await a.load();return {outcome,unchanged:JSON.stringify(before)===JSON.stringify(after),body:a.writingHistory(after)[0].content.body,pending:a.writingDrafts(after)[0].content.body};
  });
  assert.deepEqual(result, { outcome: "rejected", unchanged: true, body: "Synthetic writing", pending: "Aborted correction" });
}));

test("quota failure preserves the previous draft and the same Save request can be retried", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,d=a.input("Keep this text"),written=await a.write(d),request=a.command("save",{draft:written.state.drafts[d.id]});
    const put=IDBObjectStore.prototype.put;let failure;
    IDBObjectStore.prototype.put=function(){throw new DOMException("Synthetic quota failure","QuotaExceededError");};
    try {failure=await a.commitWritingOperation(a.scope(),request).then(()=>"accepted",e=>e.name);}
    finally {IDBObjectStore.prototype.put=put;}
    const pending=a.writingDrafts(await a.load())[0].content.body;
    const saved=await a.commitWritingOperation(a.scope(),request),retry=await a.commitWritingOperation(a.scope(),request);
    return {failure,pending,outcome:saved.receipt.outcome,sameReceipt:JSON.stringify(saved.receipt)===JSON.stringify(retry.receipt),versions:a.writingVersions(retry.state,d.entryId).length};
  });
  assert.deepEqual(result, { failure: "QuotaExceededError", pending: "Keep this text", outcome: "saved", sameReceipt: true, versions: 1 });
}));

test("unavailable IndexedDB rejects draft recovery and never claims a memory fallback", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,descriptor=Object.getOwnPropertyDescriptor(window,"indexedDB");
    Object.defineProperty(window,"indexedDB",{configurable:true,value:{open(){throw new DOMException("Synthetic unavailable store","SecurityError");}}});
    try {return await Promise.all([a.load().then(()=>"loaded",e=>e.name),a.write(a.input()).then(()=>"saved",e=>e.name)]);}
    finally {if(descriptor)Object.defineProperty(window,"indexedDB",descriptor);else delete window.indexedDB;}
  });
  assert.deepEqual(result, ["SecurityError", "SecurityError"]);
}));

test("corrupt stored writing fails closed without replacing the stored bytes", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,scope=a.scope(),bad={schemaVersion:999,owner:a.writingOwner(scope),sentinel:"preserve-corrupt-writing"};
    const raw=(mode,work)=>a.scopedTransaction(scope,a.WRITING_DATABASE_NAME,"writing",mode,db=>db.createObjectStore("writing"),(store,done)=>work(store,done));
    await raw("readwrite",(store,done)=>{store.put(bad,"records");done(null);});
    const outcome=await a.load().then(()=>"loaded",e=>e.code);
    const after=await raw("readonly",(store,done)=>{const request=store.get("records");request.onsuccess=()=>done(request.result);});
    return {outcome,preserved:JSON.stringify(after)===JSON.stringify(bad)};
  });
  assert.deepEqual(result, { outcome: "invalid", preserved: true });
}));

test("account separation preserves legacy state and rejects owner-mismatched commands", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api;localStorage.setItem("circle-os-state-v2","synthetic-legacy-sentinel");
    const first=await a.seed("Account A only"),old=a.scope();a.activateAccountScope("synthetic-b");
    const b=await a.load(),wrong=await a.commitWritingOperation(a.scope(),first.request).then(()=>"accepted",e=>e.code);
    const stale=await a.loadWritingState(old).then(()=>"accepted",e=>e.name);
    a.activateAccountScope("synthetic-a");const again=await a.load();
    return {b:a.writingHistory(b).length,wrong,stale,again:a.writingHistory(again)[0].content.body,legacy:localStorage.getItem("circle-os-state-v2")};
  });
  assert.deepEqual(result, { b: 0, wrong: "owner-mismatch", stale: "AccountScopeChangedError", again: "Account A only", legacy: "synthetic-legacy-sentinel" });
}));

test("switching accounts while hashing rejects queued writes and delayed reads", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,scope=a.scope(),digest=crypto.subtle.digest;let release;
    crypto.subtle.digest=async function(...args){await new Promise(resolve=>{release=resolve;});return digest.apply(this,args);};
    try {
      const pending=a.write(a.input("Queued A text")).then(()=>"accepted",e=>e.name);
      const read=a.loadWritingState(scope).then(()=>"accepted",e=>e.name);
      a.activateAccountScope("synthetic-b");release();const outcomes=await Promise.all([pending,read]);
      const b=await a.load();a.activateAccountScope("synthetic-a");const original=await a.load();
      return {outcomes,b:a.writingDrafts(b).length,original:a.writingDrafts(original).length};
    }finally{crypto.subtle.digest=digest;}
  });
  assert.deepEqual(result, { outcomes: ["AccountScopeChangedError", "AccountScopeChangedError"], b: 0, original: 0 });
}));

test("account change during a live transaction aborts it and preserves earlier writing", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api;await a.seed("Earlier A writing");const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.addEventListener("success",()=>a.activateAccountScope("synthetic-b"));return request;};
    let outcome;
    try{outcome=await a.write(a.input("Late A draft")).then(()=>"accepted",e=>e.name);}
    finally{IDBObjectStore.prototype.put=put;}
    const b=await a.load();a.activateAccountScope("synthetic-a");const original=await a.load();
    return {outcome,b:a.writingHistory(b).length,body:a.writingHistory(original)[0].content.body,drafts:a.writingDrafts(original).length};
  });
  assert.deepEqual(result, { outcome: "AccountScopeChangedError", b: 0, body: "Earlier A writing", drafts: 0 });
}));

test("two actual tabs preserve unrelated entries and competing saved corrections", { timeout: 60_000 }, async () => isolated(390, async (page,context) => {
  const entryId=await page.evaluate(async ()=>(await window.api.seed("Original shared Note")).entryId);
  const other=await context.newPage();await open(other);
  await Promise.all([page.evaluate(()=>window.api.seed("Left entry")),other.evaluate(()=>window.api.seed("Right entry"))]);
  const [left,right]=await Promise.all([
    page.evaluate(id=>window.api.edit(id,"Left correction"),entryId),other.evaluate(id=>window.api.edit(id,"Right correction"),entryId),
  ]);
  const results=await Promise.all([
    page.evaluate(draft=>window.api.save(draft).then(r=>r.receipt.outcome),left),other.evaluate(draft=>window.api.save(draft).then(r=>r.receipt.outcome),right),
  ]);
  assert.deepEqual(results.sort(),["conflict","saved"]);
  const summary=await page.evaluate(async id=>{
    const a=window.api,s=await a.load();return {entries:a.writingHistory(s).length,versions:a.writingVersions(s,id).length,
      accepted:a.writingHistory(s).find(e=>e.id===id).content.body,candidates:a.writingDrafts(s).map(d=>d.content.body)};
  },entryId);
  assert.equal(summary.entries,3);assert.equal(summary.versions,2);
  assert.ok(["Left correction","Right correction"].includes(summary.accepted));
  assert.ok(summary.candidates.includes(summary.accepted==="Left correction"?"Right correction":"Left correction"));
  assert.equal(summary.candidates.length,1,"one durable candidate rather than duplicate recovery drafts");
}));

test("a real Save/draft-write race keeps newer typing recoverable and correctly based", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,input=a.input(),written=await a.write(input),snapshot=written.state.drafts[input.id];
    await Promise.all([
      a.commitWritingOperation(a.scope(),a.command("save",{draft:snapshot})),
      a.write({...snapshot,content:{...snapshot.content,body:"Typed during the Save"}},snapshot.version),
    ]);
    const state=await a.load(),pending=a.writingDrafts(state)[0],accepted=a.writingHistory(state)[0].content.body;
    const saved=await a.save(pending);
    return {accepted,pending:pending.content.body,second:saved.receipt.outcome,versions:a.writingVersions(saved.state,input.entryId).map(v=>v.content.body)};
  });
  assert.deepEqual(result,{accepted:"Synthetic writing",pending:"Typed during the Save",second:"saved",versions:["Typed during the Save","Synthetic writing"]});
}));

test("a failed draft update rejects rather than claiming the newer text is recoverable", { timeout: 60_000 }, async () => isolated(390, async page => {
  const result=await page.evaluate(async () => {
    const a=window.api,input=a.input("Last durable draft");await a.write(input);
    const update=a.command("write-draft",{draft:{...input,content:{...input.content,body:"Still only in the editor"}},expectedDraftVersion:1});
    const put=IDBObjectStore.prototype.put;let outcome;
    IDBObjectStore.prototype.put=function(){throw new DOMException("Synthetic quota failure","QuotaExceededError");};
    try{outcome=await a.commitWritingOperation(a.scope(),update).then(()=>"accepted",e=>e.name);}
    finally{IDBObjectStore.prototype.put=put;}
    const state=await a.load();return {outcome,recovered:a.writingDrafts(state)[0].content.body,hasFailedReceipt:Boolean(state.receipts[update.operationId])};
  });
  assert.deepEqual(result,{outcome:"QuotaExceededError",recovered:"Last durable draft",hasFailedReceipt:false});
}));

test("starting-day and actual-save timestamps survive the browser store and reload", { timeout: 60_000 }, async () => isolated(360, async page => {
  await page.evaluate(async () => {
    const a=window.api,startedAt="2026-11-02T22:50:00.000Z",savedAt="2026-11-02T23:10:00.000Z";
    const input=a.input("Across 06:00",{startedAt,attribution:a.writingAttribution(startedAt,"Asia/Bangkok")});
    const written=await a.commitWritingOperation(a.scope(),{...a.command("write-draft",{draft:input,expectedDraftVersion:0}),at:startedAt});
    await a.commitWritingOperation(a.scope(),{...a.command("save",{draft:written.state.drafts[input.id]}),at:savedAt});
  });
  await page.reload();await page.waitForFunction(()=>Boolean(window.api));
  const result=await page.evaluate(async()=>{
    const a=window.api,state=await a.load(),entry=a.writingHistory(state)[0];
    return {day:entry.attribution.day,zone:entry.attribution.timeZone,started:entry.startedAt,saved:entry.createdAt,occurrence:entry.attribution.occurrenceAt};
  });
  assert.deepEqual(result,{day:"2026-11-02",zone:"Asia/Bangkok",started:"2026-11-02T22:50:00.000Z",saved:"2026-11-02T23:10:00.000Z",occurrence:null});
}));
