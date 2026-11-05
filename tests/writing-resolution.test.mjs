import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { A, B, at, database, remote, save, commit, memoryStore, asAccount, fixture } from "./helpers/writing-cloud.mjs";
import { syncAccountWriting } from "../app/os/writing-cloud-sync.js";
import { canonicalWriting, assertWritingCloudState } from "../app/os/writing-cloud-model.js";
import { prepareWritingChoice, queueWritingChoice, receiveWritingChoice, resolvedWritingHead, writingSyncLabel } from "../app/os/writing-conflict-model.js";

let db;
before(async () => { db = await database(); });
after(async () => { await db?.close(); });
async function conflict() {
  await db.exec("truncate circle_private.writing_heads,circle_private.writing_receipts,circle_private.writing_conflicts,circle_private.writing_resolutions");
  const api = remote(db), one = memoryStore(await save()), two = memoryStore();
  await syncAccountWriting({ store: one, remote: api }); await syncAccountWriting({ store: two, remote: api });
  one.replace(await save(await one.read(), { body: "Cloud branch" }));
  two.replace(await save(await two.read(), { body: "Device branch" }));
  await syncAccountWriting({ store: one, remote: api }); await syncAccountWriting({ store: two, remote: api });
  return { api, one, two };
}
async function choose(store, choice = "local") {
  const bundle = await store.read();
  const request = await prepareWritingChoice(bundle, "entry", choice, at, `v_${crypto.randomUUID()}`);
  await store.update(current => queueWritingChoice(current, request));
  return request;
}
for (const choice of ["local", "cloud"]) test(`${choice} choice adds a current revision and preserves both original histories`, async () => {
  const { api, two } = await conflict(), before = await two.read(), request = await choose(two, choice);
  await syncAccountWriting({ store: two, remote: api });
  const next = await two.read(), head = (await api.inventory(""))[0];
  assert.equal(head.snapshot.entry.versions.at(-1).content.body, choice === "local" ? "Device branch" : "Cloud branch");
  assert.deepEqual(head.snapshot.entry.versions.slice(0,-1), before.cloud.conflicts.entry.snapshot.entry.versions);
  assert.deepEqual(next.cloud.resolved[request.requestId].request.local.entry, before.state.entries.entry);
  assert.deepEqual(next.cloud.resolved[request.requestId].request.cloud, before.cloud.conflicts.entry);
  assert.deepEqual(next.cloud.conflicts, {}); assert.deepEqual(next.queue.pending, {});
  assert.equal(Object.keys(next.cloud.settled).length, 1);
  assert.equal(writingSyncLabel(next, { enabled: true }), "Synced");
  assertWritingCloudState(next.cloud);
  assert.deepEqual((await asAccount(db, A, tx => tx.query("select request_body from circle_private.writing_resolutions"))).rows[0].request_body, request);
  assert.deepEqual(await asAccount(db, B, async tx => (await tx.query("select * from circle_private.writing_resolutions")).rows), []);
  assert.deepEqual((await api.resolve(request)).head, head);
  const fresh=memoryStore(); await syncAccountWriting({store:fresh,remote:api});
  assert.deepEqual((await fresh.read()).cloud.resolved,next.cloud.resolved,"a new device recovers both kept histories");
  assert.deepEqual(await remote(db,B).resolutions(""),[]);
});
test("changed retry is rejected; missing identity, anon, service role and foreign owners cannot resolve", async () => {
  const { api, two } = await conflict(), request = await choose(two);
  await api.resolve(request);
  await assert.rejects(api.resolve({ ...request, choice: "cloud" }), /ID reused/);
  await assert.rejects(remote(db, B).resolve(request), /Invalid writing choice/);
  for (const [id, role] of [[null,"anon"],[null,"authenticated"],[A,"service_role"]]) {
    await assert.rejects(asAccount(db,id,tx=>tx.query("select public.circle_writing_resolve($1)",[request]),role), /permission denied|authenticated account/);
    await assert.rejects(asAccount(db,id,tx=>tx.query("select public.circle_writing_resolution_history('',50)"),role), /permission denied|authenticated account/);
  }
  await assert.rejects(asAccount(db,A,tx=>tx.exec("delete from circle_private.writing_resolutions")),/permission denied/);
});
test("lost resolution response retries exactly after reload; newer local edits remain a conflict", async () => {
  const { api, two } = await conflict(), request = await choose(two);
  await assert.rejects(syncAccountWriting({ store: two, remote: { ...api, resolve: async r => { await api.resolve(r); throw new Error("lost reply"); } } }),/lost reply/);
  const persisted = await two.read();
  const reloaded = memoryStore(persisted);
  reloaded.replace(await save(await reloaded.read(), { body: "Typed after response loss" }));
  await syncAccountWriting({ store: reloaded, remote: api });
  const next = await reloaded.read();
  assert.equal(next.state.entries.entry.versions.at(-1).content.body,"Typed after response loss");
  assert.equal(next.cloud.conflicts.entry.snapshot.entry.versions.at(-1).content.body,"Device branch");
  assert.equal(Object.keys(next.queue.pending).length,1);
  assert.equal(Object.keys(next.cloud.resolved).length,1);
  assert.deepEqual(next.cloud.resolved[request.requestId].request,persisted.cloud.choices.entry);
});
test("local and remote changes during review require a fresh choice", async () => {
  const { api, one, two } = await conflict(), before = await two.read();
  const request = await prepareWritingChoice(before,"entry","cloud",at,"fresh-version");
  const edited = await save(before,{body:"Changed while reviewing"});
  assert.throws(()=>queueWritingChoice(edited,request),/changed/);
  await two.update(current=>queueWritingChoice(current,request));
  one.replace(await save(await one.read(),{body:"Cloud changed while reviewing"}));
  await syncAccountWriting({store:one,remote:api});
  await syncAccountWriting({store:two,remote:api});
  const next=await two.read();
  assert.deepEqual(next.cloud.choices,{}); assert.equal(Object.keys(next.cloud.resolved || {}).length,0);
  assert.equal(next.cloud.conflicts.entry.snapshot.entry.versions.at(-1).content.body,"Cloud changed while reviewing");
  assert.equal(next.state.entries.entry.versions.at(-1).content.body,"Device branch");
});
test("resolution then deletion scrubs server archives and local copies; old choice cannot restore text", async () => {
  const { api, two }=await conflict(), request=await choose(two);
  await syncAccountWriting({store:two,remote:api});
  let next=await two.read();
  for(const type of ["trash","delete"]) next=await commit(next,{type,entryId:"entry",expectedGeneration:next.state.entries.entry.generation,confirmed:true});
  two.replace(next); await syncAccountWriting({store:two,remote:api});
  assert.equal((await api.resolve(request)).status,"deleted");
  const rows=await db.query("select request_body,result_head from circle_private.writing_resolutions");
  assert.deepEqual(rows.rows,[{request_body:null,result_head:null}]);
  const local=await two.read(); assert.equal(canonicalWriting(local).includes("Device branch"),false);
  assert.equal(canonicalWriting(local).includes("Cloud branch"),false);
});
test("Trash choice retains the chosen lifecycle; neither history is renumbered", async () => {
  const {api,two}=await conflict();
  let bundle=await two.read();
  bundle=await commit(bundle,{type:"trash",entryId:"entry",expectedGeneration:bundle.state.entries.entry.generation});two.replace(bundle);
  await choose(two);await syncAccountWriting({store:two,remote:api});
  assert.equal((await two.read()).state.entries.entry.status,"trashed");
});
test("invalid replies, modified history, oversized requests and duplicate choices preserve state",async()=>{
  const {api,two}=await conflict(), before=await two.read(), request=await choose(two), queued=await two.read();
  assert.throws(()=>queueWritingChoice(queued,request),/changed/);
  const bad=structuredClone(request);bad.local.entry.versions[0].content.body="Changed immutable words";
  await assert.rejects(api.resolve(bad),/version changed/);
  const reply={status:"resolved",requestId:request.requestId,head:resolvedWritingHead(request)};reply.head.snapshot.entry.versions.at(-1).content.body="Wrong response";
  assert.throws(()=>receiveWritingChoice(queued,request,reply),/did not match/);
  assert.deepEqual(await two.read(),queued);
  const large=structuredClone(before);large.state.entries.entry.versions.at(-1).content.body="x".repeat(1_000_001);
  await assert.rejects(prepareWritingChoice(large,"entry","local",at,"large-version"),/too large/);
});
test("late old-account responses cannot publish a resolution",async()=>{
  const {api,two}=await conflict();await choose(two);let current=true;
  await assert.rejects(syncAccountWriting({store:two,current:()=>current,remote:{...api,resolve:async request=>{const result=await api.resolve(request);current=false;return result;}}}),/account changed/);
  assert.equal(Object.keys((await two.read()).cloud.resolved || {}).length,0);
  assert.equal(Object.keys((await two.read()).cloud.choices).length,1);
});
test("sync labels distinguish activation, pending, failure and conflicts",async()=>{
  const {two}=await conflict(), bundle=await two.read();
  assert.equal(writingSyncLabel(bundle,{enabled:false}),"Saved on this device");
  assert.equal(writingSyncLabel(bundle,{enabled:true,error:true}),"Review copies");
  bundle.cloud.conflicts={};
  assert.equal(writingSyncLabel(bundle,{enabled:true,error:true}),"Could not sync");
  assert.equal(writingSyncLabel(bundle,{enabled:true,online:false}),"Waiting to sync");
});
test("every writing kind keeps its source, Unicode and original Circle attribution through a choice",async()=>{
  await db.exec("truncate circle_private.writing_heads,circle_private.writing_receipts,circle_private.writing_conflicts,circle_private.writing_resolutions");
  const api=remote(db);
  for(const kind of ["note","thought","deep-thought","reading-answer"]){
    const entryId=`source-${kind}`, source={questionId:`question-${kind}`,question:"မေးခွန်း — English",editionId:"dated-reading"};
    const one=memoryStore(await save(fixture(),{entryId,kind,source})),two=memoryStore();
    await syncAccountWriting({store:one,remote:api});await syncAccountWriting({store:two,remote:api});
    one.replace(await save(await one.read(),{entryId,kind,body:"Cloud words"}));
    two.replace(await save(await two.read(),{entryId,kind,body:"မြန်မာ — English 🌱"}));
    await syncAccountWriting({store:one,remote:api});await syncAccountWriting({store:two,remote:api});
    const before=await two.read(),request=await prepareWritingChoice(before,entryId,"local","2026-11-06T00:10:00.000Z",`choice-${kind}`);
    await two.update(current=>queueWritingChoice(current,request));await syncAccountWriting({store:two,remote:api});
    const entry=(await two.read()).state.entries[entryId];
    assert.deepEqual(entry.source,source);assert.equal(entry.kind,kind);assert.equal(entry.versions.at(-1).content.body,"မြန်မာ — English 🌱");
    assert.deepEqual(entry.versions.at(-1).attribution,before.state.entries[entryId].versions.at(-1).attribution);
    assert.equal(entry.versions.at(-1).attribution.day,"2026-11-05");
  }
});
