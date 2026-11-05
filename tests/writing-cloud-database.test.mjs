import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { A, B, asAccount, database, remote, fixture, save, commit, memoryStore } from "./helpers/writing-cloud.mjs";
import { writingUploadRequests, receiveWritingHeads, canonicalWriting, writingDigest } from "../app/os/writing-cloud-model.js";
import { syncAccountWriting } from "../app/os/writing-cloud-sync.js";

let db;
before(async () => { db = await database(); });
after(async () => { await db?.close(); });
const reset = async () => db.exec("truncate circle_private.writing_heads,circle_private.writing_receipts,circle_private.writing_conflicts");
const upload = async bundle => (await writingUploadRequests(bundle))[0];

test("own writes/reads work; other users cannot read heads, receipts or conflicts", async () => {
  await reset();
  const bundle = await save(), request = await upload(bundle);
  assert.equal((await remote(db).apply(request)).status, "accepted");
  assert.equal((await remote(db).inventory("")).length, 1);
  assert.equal((await remote(db).receipts(request.changes.map(c => c.operationId))).length, 1);
  assert.deepEqual(await remote(db, B).inventory(""), []);
  assert.deepEqual(await remote(db, B).receipts(request.changes.map(c => c.operationId)), []);
  for (const table of ["writing_heads", "writing_receipts", "writing_conflicts"]) {
    assert.deepEqual(await asAccount(db, B, async tx => (await tx.query(`select * from circle_private.${table}`)).rows), []);
  }
  const foreign = { ...request, owner: `account:${A}` };
  await assert.rejects(remote(db, B).apply(foreign), /Invalid writing request/);
  await remote(db, B).apply(request); // Same IDs belong to B, never A.
  assert.equal((await remote(db).inventory(""))[0].owner, `account:${A}`);
  assert.equal((await remote(db, B).inventory(""))[0].owner, `account:${B}`);
});

test("anonymous, missing identity and service-role RPC calls are denied; direct mutations are denied", async () => {
  await reset();
  const request = await upload(await save());
  for (const [who, role] of [[null,"anon"], [null,"authenticated"], [A,"service_role"]]) {
    for (const [name, argument] of [["circle_writing_apply",request], ["circle_writing_inventory",""], ["circle_writing_receipts",[]]]) {
      await assert.rejects(asAccount(db, who, tx => tx.query(`select public.${name}($1)`, [argument]), role), /permission denied|authenticated account/);
    }
  }
  for (const role of ["anon", "authenticated", "service_role"]) {
    await assert.rejects(asAccount(db, A, tx => tx.exec("delete from circle_private.writing_heads"), role), /permission denied/);
    await assert.rejects(asAccount(db, A, tx => tx.exec("insert into circle_private.writing_heads values ('11111111-1111-4111-8111-111111111111','forged',1,'{}')"), role), /permission denied/);
    await assert.rejects(asAccount(db, A, tx => tx.exec("update circle_private.writing_receipts set generation=999"), role), /permission denied/);
  }
  await db.exec(`update auth.users set email_confirmed_at=null where id='${B}'`);
  await assert.rejects(remote(db, B).inventory(""), /authenticated account/);
  await db.exec(`update auth.users set email_confirmed_at=now() where id='${B}'`);
});

test("retry returns exact receipts; changing payload/operation identity cannot mutate saved writing", async () => {
  await reset();
  const request = await upload(await save()), api = remote(db);
  const accepted = await api.apply(request);
  assert.deepEqual(await api.apply(request), accepted);
  for (const alter of [r => r.changes[0].fingerprint = "a".repeat(64),
    r => r.snapshot.entry.versions[0].content.body = "Reused ID with different words",
    r => r.entryId = "another-entry", r => r.requestId = "b".repeat(64)]) {
    const changed = structuredClone(request); alter(changed);
    await assert.rejects(api.apply(changed), /reused|Invalid writing request/);
  }
  assert.equal((await api.inventory(""))[0].snapshot.entry.versions[0].content.body, "Synthetic saved words");
});

test("two device edits preserve both copies and pause the competing upload", async () => {
  await reset();
  const api = remote(db), one = memoryStore(await save());
  await syncAccountWriting({ store: one, remote: api });
  const two = memoryStore();
  await syncAccountWriting({ store: two, remote: api });
  one.replace(await save(await one.read(), { body: "First device edit" }));
  two.replace(await save(await two.read(), { body: "Second device edit" }));
  await syncAccountWriting({ store: one, remote: api });
  const result = await syncAccountWriting({ store: two, remote: api });
  assert.equal(result.conflicts, 1); assert.equal(result.pending, 1);
  const second = await two.read();
  assert.equal(second.state.entries.entry.versions.at(-1).content.body, "Second device edit");
  assert.equal(second.cloud.conflicts.entry.snapshot.entry.versions.at(-1).content.body, "First device edit");
  await syncAccountWriting({ store: two, remote: api });
  assert.equal((await two.read()).cloud.conflicts.entry.serverVersion, 2);
});

test("concurrent compare-and-set requests yield one acceptance and a durable owner-only conflict", async () => {
  await reset();
  const api = remote(db), first = await upload(await save()), second = await upload(await save(fixture(), { body: "Competing initial words" }));
  const [a,b] = await Promise.all([api.apply(first),api.apply(second)]);
  assert.deepEqual([a.status,b.status].sort(), ["accepted","conflict"]);
  const conflicts = await asAccount(db, A, async tx => (await tx.query("select * from circle_private.writing_conflicts")).rows);
  assert.equal(conflicts.length,1); assert.ok(conflicts[0].candidate.entry);
  assert.deepEqual(await api.apply(second), b);
  assert.deepEqual(await asAccount(db, B, async tx => (await tx.query("select * from circle_private.writing_conflicts")).rows), []);
});

test("lost response recovery retires exact operations before a newer edit uploads", async () => {
  await reset();
  const store = memoryStore(await save()), api = remote(db);
  let once = true;
  await assert.rejects(syncAccountWriting({ store, remote: { ...api, apply: async request => {
    const result = await api.apply(request); if (once) { once = false; throw new Error("Response lost"); } return result;
  } } }), /Response lost/);
  store.replace(await save(await store.read(), { body: "Edited after response loss" }));
  await syncAccountWriting({ store, remote: api });
  const result = await store.read();
  assert.equal(Object.keys(result.queue.pending).length,0);
  assert.equal(Object.keys(result.queue.acknowledgements).length,2);
  assert.equal((await api.inventory(""))[0].snapshot.entry.versions.at(-1).content.body,"Edited after response loss");
});

test("clearing, Trash and restore survive a second-device reload without drafts", async () => {
  await reset();
  const api = remote(db), one = memoryStore(await save());
  await syncAccountWriting({ store: one, remote: api });
  one.replace(await save(await one.read(), { body: "", title: "" }));
  await syncAccountWriting({ store: one, remote: api });
  const two = memoryStore(); await syncAccountWriting({ store: two, remote: api });
  assert.deepEqual((await two.read()).state.entries.entry.versions.at(-1).content, { title: "",body: "",tags: [] });
  for (const type of ["trash", "restore"]) {
    const bundle = await one.read();
    one.replace(await commit(bundle, { type, entryId: "entry", expectedGeneration: bundle.state.entries.entry.generation }));
    await syncAccountWriting({ store: one, remote: api }); await syncAccountWriting({ store: two, remote: api });
    assert.equal((await two.read()).state.entries.entry.status,type === "trash" ? "trashed" : "active");
  }
  assert.deepEqual((await two.read()).state.drafts,{});
});

test("permanent deletion scrubs cloud versions/conflicts and suppresses stale offline edits", async () => {
  await reset();
  const api = remote(db), one = memoryStore(await save());
  await syncAccountWriting({ store: one, remote: api });
  const two = memoryStore(); await syncAccountWriting({ store: two, remote: api });
  two.replace(await save(await two.read(), { body: "Stale offline writing" }));
  const stale = await upload(await two.read());
  // Force a server-side competing candidate to verify deletion scrubs it too.
  await api.apply({ ...stale, baseServerVersion: 0 });
  for (const type of ["trash", "delete"]) {
    const bundle = await one.read();
    one.replace(await commit(bundle,{ type,entryId:"entry",expectedGeneration:bundle.state.entries.entry.generation,confirmed:true }));
  }
  await syncAccountWriting({ store: one, remote: api });
  assert.equal((await api.apply(stale)).status,"deleted");
  await syncAccountWriting({ store: two, remote: api });
  const local = await two.read();
  assert.deepEqual(local.state.entries,{}); assert.deepEqual(local.state.drafts,{});
  assert.equal(Object.keys(local.queue.pending).length,0); assert.equal(Object.keys(local.cloud.suppressed).length,1);
  const rows = await db.query("select snapshot::text from circle_private.writing_heads union all select candidate::text from circle_private.writing_conflicts");
  assert.equal(JSON.stringify(rows.rows).includes("Synthetic saved words"),false);
  assert.equal(JSON.stringify(rows.rows).includes("Stale offline writing"),false);
  assert.equal(JSON.stringify(local).includes("Stale offline writing"),false);
});

test("initial inventory uploads pre-queue saved entries and tombstones without replaying drafts", async () => {
  await reset();
  let old = await save(); old.queue = fixture().queue;
  const store = memoryStore(old), api = remote(db);
  await syncAccountWriting({ store, remote: api });
  assert.equal((await api.inventory("")).length,1);
  assert.equal(Object.values((await store.read()).queue.acknowledgements)[0].operationId.startsWith("inventory_"),true);
  const fresh = memoryStore(); await syncAccountWriting({ store:fresh,remote:api });
  assert.deepEqual((await fresh.read()).state.entries,(await store.read()).state.entries);
  assert.deepEqual((await fresh.read()).state.drafts,{});
});

test("server validation rejects malformed snapshots and saved-version rewrites atomically", async () => {
  await reset();
  const bundle = await save(), request = await upload(bundle), api = remote(db);
  for (const alter of [r => r.snapshot.entry.versions[0].attribution.timeZone = "Made/Up",
    r => r.snapshot.entry.status = "deleted", r => r.snapshot.drafts = {},
    r => r.snapshot.entry.versions[0].sequence = 2,
    r => r.snapshot.entry.versions[0].content.tags = [false], r => r.changes.push(r.changes[0])]) {
    const invalid = structuredClone(request); alter(invalid);
    await assert.rejects(api.apply(invalid), /Invalid/);
    assert.deepEqual(await api.inventory(""),[]);
  }
  await api.apply(request);
  let changed = await save(bundle, { body:"Next" });
  changed.cloud.heads.entry = { serverVersion:1,signature:"unused" };
  const rewrite = await upload(changed); rewrite.changes.shift(); rewrite.snapshot.entry.versions[0].content.body="Rewrite";
  await assert.rejects(api.apply(rewrite), /Saved writing version changed/);
  assert.equal((await api.receipts(rewrite.changes.map(c=>c.operationId))).length,0);
  assert.equal((await api.inventory(""))[0].serverVersion,1);
});

test("inventory pagination and immutable remote version guards fail closed", async () => {
  await reset();
  const heads = [];
  for (let index=0;index<3;index++) {
    const bundle = await save(fixture(), {entryId:`entry-${index}`}); await remote(db).apply(await upload(bundle));
  }
  const page = await asAccount(db,A,async tx => (await tx.query("select public.circle_writing_inventory('',2) as result")).rows[0].result);
  assert.equal(page.length,2); heads.push(...page);
  const last = await remote(db).inventory(page.at(-1).entryId); assert.equal(last.length,1);
  let bundle = receiveWritingHeads(fixture(),heads);
  const altered = structuredClone(heads[0]); altered.snapshot.entry.versions[0].content.body="Changed immutable version";
  assert.throws(()=>receiveWritingHeads(bundle,[altered]),/changed content/);
  const lower = {...heads[0],serverVersion:0}; assert.throws(()=>receiveWritingHeads(bundle,[lower]),/Invalid remote/);
  const wrongOwner = {...heads[0],owner:`account:${B}`}; assert.throws(()=>receiveWritingHeads(bundle,[wrongOwner]),/Invalid remote/);
  assert.equal(await writingDigest({b:1,a:2}), await writingDigest({a:2,b:1}));
  assert.equal(canonicalWriting(bundle).includes("undefined"),false);
});
test("nulls and unknown nested fields cannot bypass SQL validation", async () => {
  await reset();
  const request=await upload(await save());
  const paths=[...["id","kind","status","generation","currentVersionId","startedAt","createdAt","updatedAt","versions"].map(key=>["snapshot","entry",key]),
    ...["id","sequence","savedAt","content","attribution"].map(key=>["snapshot","entry","versions",0,key]),
    ...["title","body","tags"].map(key=>["snapshot","entry","versions",0,"content",key]),
    ...["day","timeZone"].map(key=>["snapshot","entry","versions",0,"attribution",key]),
    ...["operationId","fingerprint","generation"].map(key=>["changes",0,key]),
    ["entryId"],["requestId"],["baseServerVersion"]];
  for(const path of paths){
    const invalid=structuredClone(request);let object=invalid;
    for(const key of path.slice(0,-1))object=object[key];object[path.at(-1)]=null;
    await assert.rejects(remote(db).apply(invalid),undefined,path.join("."));
  }
  const hidden=structuredClone(request);hidden.snapshot.entry.versions[0].draft="Private unsent words";
  await assert.rejects(remote(db).apply(hidden),/Invalid/);
  assert.deepEqual(await remote(db).inventory(""),[]);
});
test("all writing kinds preserve Unicode, attribution and saved history through SQL",async()=>{
  await reset();const api=remote(db);
  for(const kind of ["note","thought","deep-thought","reading-answer"]){
    const store=memoryStore(await save(fixture(),{entryId:`entry-${kind}`,kind,body:"မြန်မာ — English 🌱"}));
    await syncAccountWriting({store,remote:api});
  }
  const recovered=memoryStore();await syncAccountWriting({store:recovered,remote:api});
  const state=(await recovered.read()).state;assert.equal(Object.keys(state.entries).length,4);
  for(const entry of Object.values(state.entries)){
    assert.equal(entry.versions[0].content.body,"မြန်မာ — English 🌱");
    assert.equal(entry.versions[0].attribution.day,"2026-11-05");
    assert.equal(entry.versions[0].attribution.timeZone,"Asia/Bangkok");
  }
});
test("initial deleted-entry inventory sends no removed text and creates a terminal marker",async()=>{
  await reset();let bundle=await save();
  for(const type of ["trash","delete"])bundle=await commit(bundle,{type,entryId:"entry",expectedGeneration:bundle.state.entries.entry.generation,confirmed:true});
  bundle.queue=fixture().queue;
  const store=memoryStore(bundle),api=remote(db);await syncAccountWriting({store,remote:api});
  const [head]=await api.inventory("");assert.equal(head.snapshot.entry,null);assert.ok(head.snapshot.tombstone);
  assert.equal(JSON.stringify(head).includes("Synthetic saved words"),false);
  assert.equal(Object.keys((await store.read()).queue.pending).length,0);
});
