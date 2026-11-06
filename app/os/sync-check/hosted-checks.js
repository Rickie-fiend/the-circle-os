import * as writing from "../writing-model.js";
import * as queue from "../writing-sync-model.js";
import * as cloud from "../writing-cloud-model.js";
import { syncAccountWriting } from "../writing-cloud-sync.js";
import { prepareWritingChoice, queueWritingChoice } from "../writing-conflict-model.js";

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
  requireCheck(value && Object.keys(value).sort().join() === "archive,entryId,operationIds,owner,serverVersion", "Invalid test witness.");
  requireCheck(/^hosted_[a-f0-9]{24}$/.test(value.entryId) && /^account:[a-f0-9-]{36}$/.test(value.owner)
    && Number.isSafeInteger(value.serverVersion) && value.serverVersion > 0
    && Array.isArray(value.operationIds) && value.operationIds.length > 0 && value.operationIds.length <= 30
    && value.operationIds.every(id => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id))
    && value.archive && Object.keys(value.archive).sort().join() === "requestId,serverVersion"
    && /^[a-f0-9]{64}$/.test(value.archive.requestId)
    && Number.isSafeInteger(value.archive.serverVersion) && value.archive.serverVersion > 0, "Invalid test witness.");
  return value;
}

async function history(remote) {
  const result = [];
  let cursor = "";
  for (;;) {
    const page = await remote.resolutions(cursor);
    requireCheck(Array.isArray(page) && page.length <= 50, "Invalid archive page.");
    if (!page.length) return result;
    const next = page.at(-1).request.requestId;
    requireCheck(next > cursor, "Archive paging did not advance.");
    result.push(...page); cursor = next;
  }
}
async function choice(device, entryId, direction) {
  const request = await prepareWritingChoice(await device.read(), entryId, direction, new Date().toISOString(), `v_${crypto.randomUUID()}`);
  await device.update(bundle => queueWritingChoice(bundle, request));
  return request;
}
async function expectRejected(work, message) {
  let rejected = false;
  try { await work(); } catch (error) { rejected = /reused|Invalid writing choice|\(400\)/i.test(error.message); }
  requireCheck(rejected, message);
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
    requireCheck(!(await remote.inventory(`${entryId}_archiv`)).some(h => h.entryId === `${entryId}_archive`), "Other-account live archive head was visible.");
    requireCheck(!(await history(remote)).some(r => r.request.requestId === witness.archive.requestId || r.request.entryId === `${entryId}_archive`), "Other-account live archive was visible.");
    report("PASS: other account's head, exact receipts and live resolution history are hidden");
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

  const reviewed = await choice(two, entryId, "local");
  // Advance the hosted head after review, before submitting the choice.
  one.replace(await save(await one.read(), entryId, "Synthetic changed cloud review"));
  await syncAccountWriting({ store: one, remote: api });
  requireCheck((await api.resolve(reviewed)).status === "changed", "A stale reviewed choice overwrote the cloud.");
  await syncAccountWriting({ store: two, remote: api });
  requireCheck(!Object.keys((await two.read()).cloud.choices).length, "Changed review remained queued.");
  report("PASS: stale reviewed cloud choice requires a fresh review");

  const localChoice = await choice(two, entryId, "local");
  const original = await two.read();
  let lostChoice = false;
  try {
    await syncAccountWriting({ store: two, remote: { ...api, resolve: async request => {
      await api.resolve(request); throw new Error("Synthetic choice response loss");
    } } });
  } catch (error) { lostChoice = error.message === "Synthetic choice response loss"; }
  requireCheck(lostChoice, "Resolution response loss was not exercised.");
  // Reload the captured bundle, retaining the stable request, then make a newer edit.
  const reloaded = store(await two.read());
  reloaded.replace(await save(await reloaded.read(), entryId, "Synthetic newer choice edit"));
  await syncAccountWriting({ store: reloaded, remote: api });
  const recovered = await reloaded.read();
  requireCheck(recovered.state.entries[entryId].versions.at(-1).content.body === "Synthetic newer choice edit"
    && recovered.cloud.conflicts[entryId] && Object.keys(recovered.queue.pending).length === 1
    && same(recovered.cloud.resolved[localChoice.requestId].request, original.cloud.choices[entryId]), "Choice recovery lost newer writing or original copies.");
  const exact = await api.resolve(localChoice);
  requireCheck(same(await api.resolve(localChoice), exact), "Choice retry changed its original result.");
  await expectRejected(() => api.resolve({ ...localChoice, choice: "cloud" }), "Changed request reused a resolution ID.");
  if (witness) {
    const foreign = structuredClone(localChoice); foreign.cloud.owner = witness.owner;
    await expectRejected(() => api.resolve(foreign), "A foreign owner was accepted by resolution.");
  }
  const recoveredDevice = store(fixture(owner)); await syncAccountWriting({ store: recoveredDevice, remote: api });
  requireCheck(same((await recoveredDevice.read()).cloud.resolved[localChoice.requestId], recovered.cloud.resolved[localChoice.requestId]), "Fresh device did not recover retained histories.");
  report("PASS: local choice, exact retry, changed-retry denial, response-loss reload and newer-edit preservation");

  const cloudChoice = await choice(reloaded, entryId, "cloud");
  await syncAccountWriting({ store: reloaded, remote: api });
  requireCheck((await reloaded.read()).state.entries[entryId].versions.at(-1).content.body === "Synthetic device two"
    && Object.keys((await reloaded.read()).queue.pending).length === 0, "Cloud choice did not settle the reviewed copy.");
  requireCheck((await history(api)).some(r => same(r.request, cloudChoice)), "Owner resolution history omitted a choice.");
  // Refresh device one before lifecycle changes; it must not use a stale generation.
  await syncAccountWriting({ store: one, remote: api });
  report("PASS: cloud choice and fresh-device retained-history recovery");

  for (const type of ["trash", "restore", "trash", "delete"]) {
    bundle = await one.read();
    one.replace(await commit(bundle, { type, entryId, expectedGeneration: bundle.state.entries[entryId].generation, confirmed: true }));
    await syncAccountWriting({ store: one, remote: api });
    if (type !== "delete") requireCheck((await heads())[0].snapshot.entry.status === (type === "restore" ? "active" : "trashed"), "Lifecycle state differed.");
  }
  requireCheck((await api.apply(stale)).status === "deleted", "Deleted writing was restored by a stale upload.");
  requireCheck((await api.resolve(localChoice)).status === "deleted" && (await api.resolve(cloudChoice)).status === "deleted", "An old choice restored deleted writing.");
  requireCheck(!(await history(api)).some(r => r.request.entryId === entryId), "Deleted history remained readable.");
  await syncAccountWriting({ store: two, remote: api });
  bundle = await two.read();
  requireCheck(!bundle.state.entries[entryId] && Object.keys(bundle.queue.pending).length === 0
    && !JSON.stringify(bundle).includes("Synthetic device two"), "Deleted writing remained in the competing local store.");
  const head = (await heads())[0];
  requireCheck(head.owner === owner && head.snapshot.entry === null && Boolean(head.snapshot.tombstone), "Deletion did not leave an owner-scoped tombstone.");
  report("PASS: Trash, restore, terminal deletion and stale-device suppression");
  // Keep a separate live archive until the second account has tested isolation.
  const archiveId = `${entryId}_archive`, archiveOne = store(await save(fixture(owner), archiveId, "Synthetic archive base"));
  const archiveApi = { ...remote, inventory: async cursor => cursor ? [] : (await remote.inventory(`${entryId}_archiv`)).filter(h => h.entryId === archiveId) };
  await syncAccountWriting({ store: archiveOne, remote: archiveApi });
  const archiveTwo = store(fixture(owner)); await syncAccountWriting({ store: archiveTwo, remote: archiveApi });
  archiveOne.replace(await save(await archiveOne.read(), archiveId, "Synthetic archive cloud"));
  archiveTwo.replace(await save(await archiveTwo.read(), archiveId, "Synthetic archive device"));
  await syncAccountWriting({ store: archiveOne, remote: archiveApi }); await syncAccountWriting({ store: archiveTwo, remote: archiveApi });
  const archiveChoice = await choice(archiveTwo, archiveId, "local");
  await syncAccountWriting({ store: archiveTwo, remote: archiveApi });
  const archiveHead = (await archiveApi.inventory(""))[0];
  report("PASS: live synthetic archive ready for other-account isolation and cleanup recheck");
  const final = await one.read();
  return validateWitness({ owner, entryId, serverVersion: head.serverVersion,
    operationIds: Object.keys(final.queue.acknowledgements), archive: { requestId: archiveChoice.requestId, serverVersion: archiveHead.serverVersion } });
}

export async function verifyOwnWitness(remote, witness, owner, other) {
  validateWitness(witness);
  requireCheck(witness.owner === owner, "Return to the original account.");
  if (other) {
    validateWitness(other);
    requireCheck(other.owner !== owner && other.entryId === witness.entryId, "Use the other account's matching witness.");
    requireCheck((await remote.receipts(other.operationIds)).length === 0
      && !(await history(remote)).some(r => r.request.requestId === other.archive.requestId), "Other-account records were visible during recheck.");
  }
  const head = (await remote.inventory(witness.entryId.slice(0, -1))).find(h => h.entryId === witness.entryId);
  requireCheck(head?.owner === owner && head.serverVersion === witness.serverVersion
    && head.snapshot.entry === null && Boolean(head.snapshot.tombstone), "Other-account run changed the original head.");
  requireCheck((await remote.receipts(witness.operationIds)).length === witness.operationIds.length, "Original receipts changed.");
  const archiveId = `${witness.entryId}_archive`;
  const api = { ...remote, inventory: async cursor => cursor ? [] : (await remote.inventory(`${witness.entryId}_archiv`)).filter(h => h.entryId === archiveId) };
  const archiveHead = (await api.inventory(""))[0];
  requireCheck(archiveHead?.owner === owner, "Original archive owner changed.");
  if (archiveHead.snapshot.tombstone) {
    requireCheck(archiveHead.serverVersion === witness.archive.serverVersion + 2 && !(await history(remote)).some(r => r.request.entryId === archiveId), "Archive cleanup differs.");
    return;
  }
  requireCheck(archiveHead.serverVersion === witness.archive.serverVersion, "Other account changed the live archive head.");
  const archive = (await history(remote)).find(r => r.request.requestId === witness.archive.requestId);
  requireCheck(archive && same(archive.head, archiveHead), "Original live archive changed.");
  const device = store(fixture(owner)); await syncAccountWriting({ store: device, remote: api });
  for (const type of ["trash", "delete"]) {
    const bundle = await device.read();
    device.replace(await commit(bundle, { type, entryId: archiveId, expectedGeneration: bundle.state.entries[archiveId].generation, confirmed: true }));
    await syncAccountWriting({ store: device, remote: api });
  }
  requireCheck((await api.resolve(archive.request)).status === "deleted" && !(await history(remote)).some(r => r.request.entryId === archiveId), "Archive cleanup or replay suppression failed.");
}
