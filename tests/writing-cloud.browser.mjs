import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { A, B, database, remote } from "./helpers/writing-cloud.mjs";

// The real store/transport talks to a local PostgreSQL RPC fixture. Bearer tokens
// here are deliberately synthetic; this does not test hosted JWT validation.
const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
import { WritingCloudRunner } from "/app/os/writing-cloud-runner.tsx";
import { SupabaseConnection } from "/app/os/auth/supabase-context.tsx";
import * as scope from "/app/os/account-scope.js";
import * as store from "/app/os/writing-store.ts";
import * as model from "/app/os/writing-model.js";
import { syncAccountWriting } from "/app/os/writing-cloud-sync.js";
import { createWritingTransport } from "/app/os/writing-transport.ts";
import { WritingProvider } from "/app/os/writing-provider.tsx";
import { AccountWritingPage } from "/app/os/writing-pages.tsx";
import "/app/globals.css";
import "/app/os/os-app.css";
let account="${A}", authenticated=true;
scope.activateAccountScope(account);
const client={auth:{getSession:async()=>({data:{session:authenticated?{user:{id:account},access_token:"fixture-"+account}:null},error:null}),
  getUser:async()=>({data:{user:{id:account,email_confirmed_at:at}},error:null})}};
const at="2026-11-05T03:00:00.000Z";
window.api={
  ui(connected=true){const root=createRoot(document.getElementById("root"));const content=React.createElement(WritingProvider,{scope:scope.getAccountScope(),enabled:true,answers:[],memory:{}},React.createElement("div",{className:"circle-os"},React.createElement("div",{className:"os-swipe-session"},React.createElement("div",{className:"os-app-window"},React.createElement(AccountWritingPage,{kind:"note"})))));
    root.render(connected?React.createElement(SupabaseConnection.Provider,{value:{client,config:{url:location.origin,key:"fixture-public"}}},content):content);},
  runner(){const root=createRoot(document.getElementById("runner"));root.render(React.createElement(SupabaseConnection.Provider,
    {value:{client,config:{url:location.origin,key:"fixture-public"}}},React.createElement(WritingCloudRunner,{scope:scope.getAccountScope(),enabled:true})));},
  select(id){account=id;scope.activateAccountScope(id);},
  authenticate(value){authenticated=value;},
  read:()=>store.writingCloudTransaction(scope.getAccountScope()),
  async save(body="Synthetic mobile writing"){
    const s=scope.getAccountScope(),state=await store.loadWritingState(s),entry=state.entries.entry;
    const draft={id:crypto.randomUUID(),entryId:"entry",kind:"note",source:null,startedAt:entry?.startedAt||at,
      baseGeneration:entry?.generation||0,baseVersionId:entry?.currentVersionId||null,
      attribution:model.writingAttribution(at,"Asia/Bangkok"),content:{title:"",body,tags:[]}};
    await store.commitWritingOperation(s,{owner:state.owner,operationId:crypto.randomUUID(),type:"write-draft",at,draft,expectedDraftVersion:0});
    return store.commitWritingOperation(s,{owner:state.owner,operationId:crypto.randomUUID(),type:"save",at,draft:{...draft,version:1}});
  },
  async lifecycle(type){const s=scope.getAccountScope(),state=await store.loadWritingState(s);
    return store.commitWritingOperation(s,{owner:state.owner,operationId:crypto.randomUUID(),type,at,entryId:"entry",expectedGeneration:state.entries.entry.generation,confirmed:true});},
  async sync(){const s=scope.getAccountScope();return syncAccountWriting({current:()=>scope.isAccountScopeCurrent(s),
    remote:createWritingTransport(client,{url:location.origin,key:"fixture-public"},s),
    store:{read:()=>store.writingCloudTransaction(s),inventory:()=>store.inventoryWritingStore(s),update:f=>store.writingCloudTransaction(s,f)}});},
  failCloudWrite(){const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){
    if(key==="cloud-v1")throw new DOMException("Synthetic write failure","DataError");return put.call(this,value,key);};
    return window.restorePut=()=>{IDBObjectStore.prototype.put=put;};},
};
`;
let db, server, browser, baseURL;
before(async () => {
  db=await database();
  server=await createServer({configFile:false,define:{"process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC":JSON.stringify("enabled")},plugins:[react(),{name:"writing-cloud-test",
    resolveId:id=>id==="virtual:writing-cloud-test"?"\0writing-cloud-test":null,
    load:id=>id==="\0writing-cloud-test"?harness:null,
    configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
      if(req.url==="/__writing-cloud-test"){
        res.setHeader("Content-Type","text/html");res.end(await vite.transformIndexHtml(req.url,'<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><div id="runner"></div><script type="module" src="/@id/virtual:writing-cloud-test"></script>'));return;
      }
      if(!req.url?.startsWith("/rest/v1/rpc/"))return next();
      const token=req.headers.authorization;
      const account=[A,B].find(id=>token===`Bearer fixture-${id}`);
      if(!account){res.writeHead(401).end();return;}
      try {
        let input="";for await(const chunk of req)input+=chunk;
        const body=JSON.parse(input),api=remote(db,account),name=req.url.split("/").at(-1);
        const result=name==="circle_writing_inventory"?await api.inventory(body.after_id):name==="circle_writing_receipts"?await api.receipts(body.operation_ids):name==="circle_writing_resolve"?await api.resolve(body.request):name==="circle_writing_resolution_history"?await api.resolutions(body.after_id):await api.apply(body.request);
        res.setHeader("Content-Type","application/json");res.end(JSON.stringify(result));
      }catch {res.writeHead(400).end('{"error":"Synthetic RPC failed"}');}
    });}}],optimizeDeps:{include:["react","react-dom/client"]},server:{host:"127.0.0.1",port:0,watch:{ignored:["**/.next/**","**/dist/**"]}}});
  await server.listen();baseURL=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch();
});
after(async()=>{await browser?.close();await server?.close();await db?.close();});
async function reset(){await db.exec("truncate circle_private.writing_heads,circle_private.writing_receipts,circle_private.writing_conflicts,circle_private.writing_resolutions");}
async function device(width=390){const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,timezoneId:"Asia/Bangkok",reducedMotion:"reduce"});
  await context.route("**/*",route=>route.request().url().startsWith(baseURL)?route.continue():route.abort());
  const page=await context.newPage();await page.goto(`${baseURL}/__writing-cloud-test`);await page.waitForFunction(()=>window.api);return {context,page};}
const read=page=>page.evaluate(()=>window.api.read());
const sync=page=>page.evaluate(()=>window.api.sync());

async function conflictDevices(width) {
  const one=await device(width),two=await device(width);
  await one.page.evaluate(()=>window.api.save());await sync(one.page);await sync(two.page);
  await one.page.evaluate(()=>window.api.save("Cloud branch"));await two.page.evaluate(()=>window.api.save("Device branch"));
  await sync(one.page);await sync(two.page);
  return {one,two};
}
async function openSync(page,connected=true) {
  await page.evaluate(connected=>window.api.ui(connected),connected);
  await page.getByRole("button",{name:"History",exact:true}).click();
  await page.getByRole("button",{name:"Sync",exact:true}).click();
  await expect(page.locator(".os-writing-sync")).toBeVisible();
}
for(const width of [360,390]) {
  test(`writing sync view stays separate from silent Note at ${width}px`,{timeout:90000},async()=>{
    await reset();const one=await device(width);
    try {
      await one.page.evaluate(()=>window.api.save());await one.page.evaluate(()=>window.api.ui(false));
      await one.page.getByRole("button",{name:"History",exact:true}).click();
      await expect(one.page.getByRole("button",{name:"Sync",exact:true})).toHaveCount(0);
      await expect(one.page.getByRole("button",{name:"Try again",exact:true})).toHaveCount(0);
      await one.page.getByRole("button",{name:"Note",exact:true}).click();
      await expect(one.page.locator(".os-note-page")).not.toContainText(/Saved on this device|Synced|Waiting to sync/);
    } finally {await one.context.close();}
  });
  test(`mobile conflict choice retains histories and can be reopened at ${width}px`,{timeout:90000},async()=>{
    await reset();const {one,two}=await conflictDevices(width);const errors=[];two.page.on("pageerror",e=>errors.push(e.message));
    try {
      await openSync(two.page);await two.page.getByRole("button",{name:"Device branch Review copies"}).click();
      await expect(two.page.getByRole("button",{name:"Try again",exact:true})).toHaveCount(0);
      await expect(two.page.getByRole("button",{name:"Open Device history",exact:true})).toBeVisible();
      await expect(two.page.getByRole("button",{name:"Open Cloud history",exact:true})).toBeVisible();
      await expect(two.page.getByText("Saved history",{exact:true})).toHaveCount(0);
      await two.page.getByRole("button",{name:"Open Cloud history",exact:true}).click();
      await expect(two.page.locator(".os-sync-version")).toHaveCount(2);
      await two.page.getByRole("button",{name:"Copies",exact:true}).click();
      const cloudBox=await two.page.getByRole("button",{name:"Use Cloud",exact:true}).boundingBox();
      const deviceBox=await two.page.getByRole("button",{name:"Use Device",exact:true}).boundingBox();
      assert.ok(cloudBox.y+cloudBox.height<=deviceBox.y,"choice buttons stack Cloud above Device");
      assert.equal(await two.page.locator(".os-writing-sync > .os-page-body").evaluate(el=>getComputedStyle(el).scrollbarWidth),"none");
      const buttons=two.page.getByRole("button",{name:/^Use /});
      for(const button of await buttons.all())assert.ok((await button.boundingBox()).height>=44);
      await two.page.screenshot({path:`outputs/writing-conflict-${width}.png`});
      assert.equal(await two.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await two.page.getByRole("button",{name:width===360?"Use Device":"Use Cloud",exact:true}).click();
      await expect(two.page.getByRole("button",{name:/branch Synced/})).toBeVisible({timeout:20000});
      await expect(two.page.getByText(/Your choice is saved/)).toHaveCount(0);
      const data=await read(two.page);assert.equal(Object.keys(data.queue.pending).length,0);assert.equal(Object.keys(data.cloud.resolved).length,1);
      await two.page.getByRole("button",{name:/branch Synced/}).click();
      await expect(two.page.getByRole("button",{name:"Open Cloud history",exact:true})).toBeVisible();
      await two.page.getByRole("button",{name:"Sync",exact:true}).click();
      await two.page.getByRole("button",{name:"History",exact:true}).click();
      await expect(two.page.getByRole("button",{name:"Sync",exact:true})).toHaveCount(0);
      await two.page.evaluate(()=>window.api.save("Newest saved words after resolving"));
      await expect.poll(async()=>Object.keys((await read(two.page)).queue.pending).length).toBe(0);
      await two.page.reload();await two.page.waitForFunction(()=>window.api);await two.page.evaluate(()=>window.api.ui());
      await two.page.getByRole("button",{name:"History",exact:true}).click();
      await two.page.getByRole("button",{name:"Saved copies",exact:true}).click();
      await expect(two.page.getByRole("button",{name:"Open This note history",exact:true})).toContainText("Newest saved words after resolving");
      await two.page.getByRole("button",{name:"Open This note history",exact:true}).click();
      await expect(two.page.locator(".os-sync-version").first()).toContainText("Newest saved words after resolving");
      await two.page.getByRole("button",{name:"Copies",exact:true}).click();
      await two.page.getByRole("button",{name:"Open Cloud history",exact:true}).click();
      await expect(two.page.locator(".os-sync-version")).toHaveCount(2);
      await two.page.getByRole("button",{name:"Copies",exact:true}).click();
      await two.page.getByRole("button",{name:"History",exact:true}).click();
      await two.page.getByRole("button",{name:"Note",exact:true}).click();
      await expect(two.page.getByRole("textbox",{name:"Write a note",exact:true})).toHaveValue("Newest saved words after resolving");
      assert.deepEqual(errors,[]);
    } finally {await one.context.close();await two.context.close();}
  });
}
test("review detects local changes and disables offline choices; lost reply survives reload",{timeout:90000},async()=>{
  await reset();const {one,two}=await conflictDevices(360);
  try {
    await openSync(two.page);await two.page.getByRole("button",{name:"Device branch Review copies"}).click();
    await two.page.evaluate(()=>window.api.save("New local branch"));
    await expect(two.page.getByRole("button",{name:"Review updated copies"})).toBeVisible();
    await two.page.getByRole("button",{name:"Review updated copies"}).click();
    await two.context.setOffline(true);await expect(two.page.getByRole("button",{name:"Use Cloud",exact:true})).toBeDisabled();
    await two.context.setOffline(false);
    await two.page.route("**/rpc/circle_writing_resolve",async route=>{await route.fetch();await route.abort();});
    await two.page.getByRole("button",{name:"Use Cloud",exact:true}).click();
    await expect(two.page.getByText("Could not sync.",{exact:true})).toBeVisible({timeout:20000});
    assert.equal(Object.keys((await read(two.page)).cloud.choices).length,1);
    await two.page.unroute("**/rpc/circle_writing_resolve");
    await two.page.getByRole("button",{name:"Try again",exact:true}).click();
    await expect(two.page.getByRole("button",{name:"Try again",exact:true})).toHaveCount(0);
    await two.page.reload();await two.page.waitForFunction(()=>window.api);await two.page.evaluate(()=>window.api.ui());
    await expect.poll(async()=>Object.keys((await read(two.page)).cloud.choices).length).toBe(0);
    assert.equal(Object.keys((await read(two.page)).cloud.resolved).length,1);
    const rows=await db.query("select count(*)::int as count from circle_private.writing_resolutions");assert.equal(rows.rows[0].count,1);
  } finally {await one.context.close();await two.context.close();}
});

test("long comparison scrolls without a scrollbar and deleted history stops rendering",{timeout:90000},async()=>{
  await reset();const {one,two}=await conflictDevices(360);
  try {
    await two.page.evaluate(()=>window.api.save("Long device copy. ".repeat(150)));
    await openSync(two.page);await two.page.getByRole("button",{name:/Review copies/}).click();
    const body=two.page.locator(".os-writing-sync > .os-page-body");
    assert.equal(await body.evaluate(el=>{el.scrollTop=120;return el.scrollTop>0&&el.scrollHeight>el.clientHeight;}),true);
    await two.page.getByRole("button",{name:"Open Device history",exact:true}).click();
    await expect(two.page.locator(".os-sync-version")).toHaveCount(3);
    await two.page.evaluate(()=>window.api.lifecycle("trash"));await two.page.evaluate(()=>window.api.lifecycle("delete"));
    await expect(two.page.getByText("Deleted forever.",{exact:true})).toBeVisible();
    await expect(two.page.locator(".os-sync-version")).toHaveCount(0);
  } finally {await one.context.close();await two.context.close();}
});

test("Sync is absent for empty and draft-only stores, appears for pending saved work and clears after sync",{timeout:90000},async()=>{
  await reset();const one=await device();
  try {
    await one.page.evaluate(()=>window.api.ui());
    await one.page.getByRole("button",{name:"History",exact:true}).click();
    await expect(one.page.getByRole("button",{name:"Sync",exact:true})).toHaveCount(0);
    await one.page.evaluate(async()=>{
      const store=await import('/app/os/writing-store.ts'),scopes=await import('/app/os/account-scope.js'),model=await import('/app/os/writing-model.js');
      const scope=scopes.getAccountScope(),state=await store.loadWritingState(scope),at=new Date().toISOString();
      await store.commitWritingOperation(scope,{owner:state.owner,operationId:crypto.randomUUID(),type:'write-draft',at,expectedDraftVersion:0,
        draft:{id:crypto.randomUUID(),entryId:'unsent',kind:'thought',source:null,startedAt:at,baseGeneration:0,baseVersionId:null,
          attribution:model.writingAttribution(at,'Asia/Bangkok'),content:{title:'',body:'Unsent words',tags:[]}}});
    });
    await expect(one.page.getByRole("button",{name:"Sync",exact:true})).toHaveCount(0);
    await one.context.setOffline(true);await one.page.evaluate(()=>window.api.save('Pending saved words'));
    await expect(one.page.getByRole("button",{name:"Sync",exact:true})).toBeVisible();
    await one.page.getByRole("button",{name:"Sync",exact:true}).click();
    await expect(one.page.getByRole("button",{name:"Try again",exact:true})).toHaveCount(0);
    await one.context.setOffline(false);await expect.poll(async()=>Object.keys((await read(one.page)).queue.pending).length).toBe(0);
    await one.page.getByRole("button",{name:"History",exact:true}).click();
    await expect(one.page.getByRole("button",{name:"Sync",exact:true})).toHaveCount(0);
  }finally{await one.context.close();}
});

test("real IndexedDB offline save/reload uploads and restores in a separate browser device",async()=>{
  await reset();const one=await device(),two=await device();
  try{
    await one.context.setOffline(true);await one.page.evaluate(()=>window.api.save());
    await assert.rejects(sync(one.page));assert.equal(Object.keys((await read(one.page)).queue.pending).length,1);
    await one.context.setOffline(false);await one.page.reload();await one.page.waitForFunction(()=>window.api);
    assert.equal((await sync(one.page)).pending,0);await sync(two.page);
    assert.equal((await read(two.page)).state.entries.entry.versions[0].content.body,"Synthetic mobile writing");
    assert.deepEqual((await read(two.page)).state.drafts,{});
  }finally{await one.context.close();await two.context.close();}
});
test("clearing, Trash, restore and deletion propagate through authenticated HTTP",async()=>{
  await reset();const one=await device(),two=await device();
  try{
    await one.page.evaluate(()=>window.api.save());await sync(one.page);await sync(two.page);
    await one.page.evaluate(()=>window.api.save(""));await sync(one.page);await sync(two.page);
    assert.equal((await read(two.page)).state.entries.entry.versions.at(-1).content.body,"");
    for(const type of ["trash","restore","trash","delete"]){
      await one.page.evaluate(type=>window.api.lifecycle(type),type);await sync(one.page);await sync(two.page);
      const state=(await read(two.page)).state;
      if(type==="delete"){assert.deepEqual(state.entries,{});assert.ok(state.tombstones.entry);}
      else assert.equal(state.entries.entry.status,type==="trash"?"trashed":"active");
    }
  }finally{await one.context.close();await two.context.close();}
});
test("a failed acknowledgement transaction preserves pending work for receipt recovery",async()=>{
  await reset();const one=await device();
  try{
    await one.page.evaluate(()=>window.api.save());
    await one.page.route("**/rpc/circle_writing_apply",async route=>{
      const response=await route.fetch();await one.page.evaluate(()=>window.api.failCloudWrite());await route.fulfill({response});
    });
    await assert.rejects(sync(one.page));await one.page.evaluate(()=>window.restorePut());
    assert.equal(Object.keys((await read(one.page)).queue.pending).length,1);
    await one.page.unroute("**/rpc/circle_writing_apply");assert.equal((await sync(one.page)).pending,0);
    assert.equal(Object.keys((await read(one.page)).queue.acknowledgements).length,1);
  }finally{await one.context.close();}
});
test("late old-account upload responses cannot acknowledge the next account",async()=>{
  await reset();const one=await device();
  try{
    await one.page.evaluate(()=>window.api.save());
    let finish;
    const handled=new Promise(resolve=>{finish=resolve;});
    await one.page.route("**/rpc/circle_writing_apply",async route=>{
      try {
        const response=await route.fetch(),body=await response.body();
        await one.page.evaluate(id=>window.api.select(id),B);
        // Account switching aborts the browser request before the old reply arrives.
        await route.fulfill({status:response.status(),headers:response.headers(),body}).catch(()=>{});
      } finally {finish();}
    });
    await assert.rejects(sync(one.page),/account changed|AbortError/);await handled;
    assert.deepEqual((await read(one.page)).state.entries,{});
    await one.page.unroute("**/rpc/circle_writing_apply");await sync(one.page);
    assert.deepEqual((await read(one.page)).state.entries,{});
    await one.page.evaluate(id=>window.api.select(id),A);
    assert.equal(Object.keys((await read(one.page)).queue.pending).length,1);
    assert.equal((await sync(one.page)).pending,0);
  }finally{await one.context.close();}
});
test("an edit made while an upload is in flight stays pending and uploads next",async()=>{
  await reset();const one=await device();
  try{
    await one.page.evaluate(()=>window.api.save());
    await one.page.route("**/rpc/circle_writing_apply",async route=>{
      const response=await route.fetch();await one.page.evaluate(()=>window.api.save("Newer in-flight words"));await route.fulfill({response});
    },{times:1});
    assert.equal((await sync(one.page)).pending,1);
    assert.equal((await read(one.page)).state.entries.entry.versions.at(-1).content.body,"Newer in-flight words");
    assert.equal((await sync(one.page)).pending,0);
    assert.equal((await remote(db).inventory(""))[0].snapshot.entry.versions.at(-1).content.body,"Newer in-flight words");
  }finally{await one.context.close();}
});
test("two-device conflicts preserve both saved copies and local deletion scrubs the conflict",async()=>{
  await reset();const one=await device(),two=await device();
  try{
    await one.page.evaluate(()=>window.api.save());await sync(one.page);await sync(two.page);
    await one.page.evaluate(()=>window.api.save("First device"));await two.page.evaluate(()=>window.api.save("Second device"));
    await sync(one.page);assert.equal((await sync(two.page)).conflicts,1);
    const bundle=await read(two.page);assert.equal(bundle.state.entries.entry.versions.at(-1).content.body,"Second device");
    assert.equal(bundle.cloud.conflicts.entry.snapshot.entry.versions.at(-1).content.body,"First device");
    await two.page.evaluate(()=>window.api.lifecycle("trash"));await two.page.evaluate(()=>window.api.lifecycle("delete"));
    assert.deepEqual((await read(two.page)).cloud.conflicts,{});
    assert.equal((await sync(two.page)).pending,0);await sync(one.page);assert.deepEqual((await read(one.page)).state.entries,{});
  }finally{await one.context.close();await two.context.close();}
});
test("offline-entry identity alone cannot authorize a transport request",async()=>{
  await reset();const one=await device();
  try{
    await one.page.evaluate(()=>window.api.save());await one.page.evaluate(()=>window.api.authenticate(false));
    await assert.rejects(sync(one.page),/Sign in again/);
    assert.equal(Object.keys((await read(one.page)).queue.pending).length,1);
    assert.deepEqual(await remote(db).inventory(""),[]);
  }finally{await one.context.close();}
});
test("the enabled React runner syncs a local save without a manual transport call",async()=>{
  await reset();const one=await device();
  try{
    await one.page.evaluate(()=>{window.api.runner();return window.api.save();});
    await expect.poll(async()=>Object.keys((await read(one.page)).queue.acknowledgements).length).toBe(1);
    assert.equal((await remote(db).inventory("")).length,1);
  }finally{await one.context.close();}
});
