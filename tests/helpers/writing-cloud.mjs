import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import * as writing from "../../app/os/writing-model.js";
import * as sync from "../../app/os/writing-sync-model.js";
import * as cloud from "../../app/os/writing-cloud-model.js";

export const A = "11111111-1111-4111-8111-111111111111";
export const B = "22222222-2222-4222-8222-222222222222";
export const at = "2026-11-05T03:00:00.000Z";
export async function database() {
  const db = await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key, email_confirmed_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
    grant usage on schema auth to anon,authenticated,service_role;
    insert into auth.users(id) values ('${A}'),('${B}');`);
  await db.exec(await readFile(new URL("../../supabase/migrations/202611050001_account_writing.sql", import.meta.url), "utf8"));
  return db;
}
export async function asAccount(db, account, work, role = "authenticated") {
  if (!["authenticated", "anon", "service_role"].includes(role)) throw new Error("Invalid test role");
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [account || "", role]);
    return work(tx);
  });
}
export function remote(db, account = A) {
  const rpc = (name, arg) => asAccount(db, account, async tx =>
    (await tx.query(`select public.${name}($1) as result`, [arg])).rows[0].result);
  return {
    inventory: cursor => rpc("circle_writing_inventory", cursor),
    receipts: ids => rpc("circle_writing_receipts", ids),
    apply: request => rpc("circle_writing_apply", request),
  };
}
export function fixture(account = A) {
  const owner = `account:${account}`;
  return { state: writing.createWritingState(owner), queue: sync.createWritingSyncState(owner), cloud: cloud.createWritingCloudState(owner) };
}
export async function commit(bundle, command) {
  const prepared = await writing.prepareWritingOperation({ owner: bundle.state.owner, at, operationId: crypto.randomUUID(), ...command });
  const result = writing.applyWritingOperation(bundle.state, prepared);
  return { ...bundle, state: result.state, queue: sync.enqueueWritingChange(bundle.queue, bundle.state, result) };
}
export async function save(bundle = fixture(), { entryId = "entry", body = "Synthetic saved words", title = "Synthetic", kind = "note" } = {}) {
  const entry = bundle.state.entries[entryId];
  const draft = { id: crypto.randomUUID(), entryId, kind, source: entry?.source || null,
    startedAt: entry?.startedAt || at, baseGeneration: entry?.generation || 0, baseVersionId: entry?.currentVersionId || null,
    attribution: writing.writingAttribution(at, "Asia/Bangkok"), content: { title: kind === "note" ? title : "", body, tags: [] } };
  bundle = await commit(bundle, { type: "write-draft", draft, expectedDraftVersion: 0 });
  return commit(bundle, { type: "save", draft: { ...draft, version: 1 } });
}
export function memoryStore(initial = fixture()) {
  let value = structuredClone(initial);
  return {
    read: async () => structuredClone(value),
    update: async transform => { value = transform(structuredClone(value)); return structuredClone(value); },
    inventory: async () => { value.queue = await cloud.inventoryWritingChanges(value.state, value.queue, value.cloud); return structuredClone(value); },
    replace: next => { value = next; },
  };
}
