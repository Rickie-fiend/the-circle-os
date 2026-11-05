import * as writing from "../writing-model.js";
import * as queue from "../writing-sync-model.js";
import * as cloud from "../writing-cloud-model.js";
import { syncAccountWriting } from "../writing-cloud-sync.js";

const requireCheck = (value, message) => { if (!value) throw new Error(message); };
const same = (a, b) => cloud.canonicalWriting(a) === cloud.canonicalWriting(b);
function fixture(owner) {
  return { state: writing.createWritingState(owner), queue: queue.createWritingSyncState(owner), cloud: cloud.createWritingCloudState(owner) };
}
function store(initial) {
  let bundle = structuredClone(initial);
  return {
    read: async () => structuredClone(bundle),
    replace: value => { bundle = structuredClone(value); },
    update: async transform => { bundle = transform(structuredClone(bundle)); return structuredClone(bundle); },
    inventory: async () => {
      bundle.queue = await cloud.inventoryWritingChanges(bundle.state, bundle.queue, bundle.cloud);
      return structuredClone(bundle);
    },
  };
}
async function commit(bundle, command) {
  const operation = await writing.prepareWritingOperation({ owner: bundle.state.owner,
    at: new Date().toISOString(), operationId: crypto.randomUUID(), ...command });
  const result = writing.applyWritingOperation(bundle.state, operation);
  return { ...bundle, state: result.state, queue: queue.enqueueWritingChange(bundle.queue, bundle.state, result) };
}
async function save(bundle, entryId, body) {
  const at = new Date().toISOString(), entry = bundle.state.entries[entryId];
  const draft = { id: crypto.randomUUID(), entryId, kind: "note", source: null,
    startedAt: entry?.startedAt || at, baseGeneration: entry?.generation || 0,
    baseVersionId: entry?.currentVersionId || null,
    attribution: writing.writingAttribution(at, "Asia/Bangkok"),
    content: { title: "Synthetic hosted access check", body, tags: [] } };
  bundle = await commit(bundle, { type: "write-draft", draft, expectedDraftVersion: 0 });
  return commit(bundle, { type: "save", draft: { ...draft, version: 1 } });
}

export function validateWitness(value) {
  requireCheck(value && Object.keys(value).sort().join() === "entryId,operationIds,owner,serverVersion", "Invalid test witness.");
  requireCheck(/^hosted_[a-f0-9]{24}$/.test(value.entryId) && /^account:[a-f0-9-]{36}$/.test(value.owner)
    && Number.isSafeInteger(value.serverVersion) && value.serverVersion > 0
    && Array.isArray(value.operationIds) && value.operationIds.length > 0 && value.operationIds.length <= 30
    && value.operationIds.every(id => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)), "Invalid test witness.");
  return value;
}

/** Synthetic evidence stays in memory; this never opens the person's writing store. */
export async function runHostedChecks({ owner, remote, witness, report = () => {} }) {
  const entryId = witness ? validateWitness(witness).entryId : `hosted_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const heads = async () => (await remote.inventory(entryId.slice(0, -1))).filter(h => h.entryId === entryId);
  const api = { ...remote, inventory: async cursor => cursor ? [] : heads() };
  requireCheck((await heads()).length === 0, "This account already has this test entry; start a fresh run.");
  if (witness) {
    requireCheck(owner !== witness.owner, "Use the second account in the other window.");
    requireCheck((await remote.receipts(witness.operationIds)).length === 0, "Other-account receipts were visible.");
    report("PASS: other account's head and exact receipts are hidden");
  }
  const one = store(await save(fixture(owner), entryId, "Synthetic first save"));
  const first = (await cloud.writingUploadRequests(await one.read()))[0];
  const accepted = await api.apply(first);
  requireCheck(accepted.status === "accepted" && same(await api.apply(first), accepted), "Exact retry changed receipts.");
  requireCheck(same(await api.receipts(first.changes.map(c => c.operationId)), accepted.receipts), "Receipt recovery differed.");
  await one.update(bundle => cloud.receiveWritingUpload(bundle, first, accepted.receipts));
  requireCheck((await heads())[0]?.owner === owner, "Saved head has the wrong owner.");
  report("PASS: own save, inventory, exact retry and receipt recovery");

  const changed = structuredClone(first); changed.snapshot.entry.versions[0].content.body = "Synthetic reused identity";
  let rejected = false;
  try { await api.apply(changed); } catch (error) { rejected = /reused|\(400\)/i.test(error.message); }
  requireCheck(rejected, "Changed retry was not rejected with a request error.");
  report("PASS: changed payload cannot reuse an accepted operation");

  one.replace(await save(await one.read(), entryId, "Synthetic lost response"));
  let lost = false;
  try {
    await syncAccountWriting({ store: one, remote: { ...api, apply: async request => {
      await api.apply(request);
      one.replace(await save(await one.read(), entryId, "Synthetic newer local edit"));
      throw new Error("Synthetic response loss");
    } } });
  } catch (error) { lost = error.message === "Synthetic response loss"; }
  requireCheck(lost, "Response loss was not exercised.");
  await syncAccountWriting({ store: one, remote: api });
  let bundle = await one.read();
  requireCheck(Object.keys(bundle.queue.pending).length === 0 && bundle.state.entries[entryId].versions.length === 3
    && bundle.state.entries[entryId].versions.at(-1).content.body === "Synthetic newer local edit", "Receipt recovery lost the newer edit.");
  report("PASS: accepted response loss recovers before uploading a newer local edit");

  const two = store(fixture(owner)); await syncAccountWriting({ store: two, remote: api });
  one.replace(await save(await one.read(), entryId, "Synthetic device one"));
  two.replace(await save(await two.read(), entryId, "Synthetic device two"));
  const stale = (await cloud.writingUploadRequests(await two.read()))[0];
  await syncAccountWriting({ store: one, remote: api });
  requireCheck((await api.apply(stale)).status === "conflict", "Stale server base did not preserve a conflict.");
  const conflict = await syncAccountWriting({ store: two, remote: api });
  bundle = await two.read();
  requireCheck(conflict.conflicts === 1 && conflict.pending === 1
    && bundle.state.entries[entryId].versions.at(-1).content.body === "Synthetic device two"
    && bundle.cloud.conflicts[entryId].snapshot.entry.versions.at(-1).content.body === "Synthetic device one", "Competing copies were lost.");
  report("PASS: competing saved copies remain and that entry pauses");

  for (const type of ["trash", "restore", "trash", "delete"]) {
    bundle = await one.read();
    one.replace(await commit(bundle, { type, entryId, expectedGeneration: bundle.state.entries[entryId].generation, confirmed: true }));
    await syncAccountWriting({ store: one, remote: api });
    if (type !== "delete") requireCheck((await heads())[0].snapshot.entry.status === (type === "restore" ? "active" : "trashed"), "Lifecycle state differed.");
  }
  requireCheck((await api.apply(stale)).status === "deleted", "Deleted writing was restored by a stale upload.");
  await syncAccountWriting({ store: two, remote: api });
  bundle = await two.read();
  requireCheck(!bundle.state.entries[entryId] && Object.keys(bundle.queue.pending).length === 0
    && !JSON.stringify(bundle).includes("Synthetic device two"), "Deleted writing remained in the competing local store.");
  const head = (await heads())[0];
  requireCheck(head.owner === owner && head.snapshot.entry === null && Boolean(head.snapshot.tombstone), "Deletion did not leave an owner-scoped tombstone.");
  report("PASS: Trash, restore, terminal deletion and stale-device suppression");
  const final = await one.read();
  return validateWitness({ owner, entryId, serverVersion: head.serverVersion,
    operationIds: Object.keys(final.queue.acknowledgements) });
}

export async function verifyOwnWitness(remote, witness, owner) {
  validateWitness(witness);
  requireCheck(witness.owner === owner, "Return to the original account.");
  const head = (await remote.inventory(witness.entryId.slice(0, -1))).find(h => h.entryId === witness.entryId);
  requireCheck(head?.owner === owner && head.serverVersion === witness.serverVersion
    && head.snapshot.entry === null && Boolean(head.snapshot.tombstone), "Other-account run changed the original head.");
  requireCheck((await remote.receipts(witness.operationIds)).length === witness.operationIds.length, "Original receipts changed.");
}
