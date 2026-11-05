import { assertWritingState, createWritingState, WritingError } from "./writing-model.js";
import { acknowledgeWritingChanges, assertWritingSyncState, pendingWritingChanges } from "./writing-sync-model.js";

export function canonicalWriting(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalWriting).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalWriting(value[key])}`).join(",")}}`;
}
export async function writingDigest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalWriting(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
function requireCloud(value, message) {
  if (!value) throw new WritingError("cloud-invalid", message);
}
function validId(id) { return typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id) && !["__proto__", "prototype", "constructor"].includes(id); }
function keys(value, expected) { return value && Object.keys(value).sort().join() === expected.sort().join(); }
export function createWritingCloudState(owner) {
  assertWritingSyncState({ schemaVersion: 1, owner, nextSequence: 1, pending: {}, acknowledgements: {} });
  return { schemaVersion: 1, owner, heads: {}, conflicts: {}, suppressed: {} };
}
export function assertWritingCloudState(cloud, owner = cloud?.owner) {
  createWritingCloudState(owner);
  requireCloud(keys(cloud, ["schemaVersion", "owner", "heads", "conflicts", "suppressed"]) && cloud.schemaVersion === 1 && cloud.owner === owner, "Invalid cloud writing store.");
  for (const name of ["heads", "conflicts", "suppressed"]) {
    requireCloud(cloud[name] && typeof cloud[name] === "object" && !Array.isArray(cloud[name]), "Invalid cloud writing records.");
    for (const id of Object.keys(cloud[name])) requireCloud(validId(id), "Invalid cloud writing ID.");
  }
  for (const head of Object.values(cloud.heads)) requireCloud(keys(head, ["serverVersion", "signature"]) &&
    Number.isSafeInteger(head.serverVersion) && head.serverVersion > 0 && typeof head.signature === "string", "Invalid cloud writing baseline.");
  for (const [id, head] of Object.entries(cloud.conflicts)) { assertWritingHead(head, owner); requireCloud(id === head.entryId, "Invalid conflict entry."); }
  for (const value of Object.values(cloud.suppressed)) requireCloud(keys(value, ["entryId", "fingerprint"]) && validId(value.entryId) && /^[a-f0-9]{64}$/.test(value.fingerprint), "Invalid deletion suppression.");
  return cloud;
}
export function writingSnapshot(state, entryId) {
  return structuredClone({ entry: state.entries[entryId] || null, tombstone: state.tombstones[entryId] || null });
}
function snapshotIdentity(snapshot) {
  const entry = snapshot.entry;
  return canonicalWriting(entry ? { generation: entry.generation, status: entry.status,
    versions: entry.versions.map(version => version.id) } : snapshot.tombstone);
}
export function assertWritingHead(head, owner) {
  requireCloud(keys(head, ["owner", "entryId", "serverVersion", "snapshot"]) && head.owner === owner && validId(head.entryId)
    && Number.isSafeInteger(head.serverVersion) && head.serverVersion > 0, "Invalid remote writing head.");
  const snapshot = head.snapshot;
  requireCloud(keys(snapshot, ["entry", "tombstone"]) && Boolean(snapshot.entry) !== Boolean(snapshot.tombstone), "Invalid remote writing snapshot.");
  const state = createWritingState(owner);
  if (snapshot.entry) state.entries[head.entryId] = snapshot.entry;
  else state.tombstones[head.entryId] = snapshot.tombstone;
  assertWritingState(state, owner);
  // Reject extra fields, including accidental draft/answer copies on tombstones.
  const item = snapshot.entry || snapshot.tombstone;
  requireCloud(snapshot.entry ? keys(item, ["id", "kind", "source", "startedAt", "createdAt", "updatedAt", "status", "generation", "currentVersionId", "versions"])
    : keys(item, item.usage ? ["id", "generation", "deletedAt", "usage"] : ["id", "generation", "deletedAt"]), "Unknown remote writing fields.");
  if (snapshot.entry) for (const version of item.versions) {
    requireCloud(keys(version, ["id", "sequence", "content", "attribution", "savedAt"]) && keys(version.content, ["title", "body", "tags"])
      && keys(version.attribution, ["day", "timeZone", "occurrenceAt"]), "Unknown remote version fields.");
  }
  return head;
}

/** Inventory only account-owned saved entries; never replay local draft receipts. */
export async function inventoryWritingChanges(state, queue, cloud) {
  assertWritingState(state, queue.owner); assertWritingSyncState(queue); assertWritingCloudState(cloud, queue.owner);
  const next = structuredClone(queue);
  const tracked = new Set([...Object.values(next.pending), ...Object.values(next.acknowledgements)].map(change => change.entryId));
  for (const entryId of [...Object.keys(state.entries), ...Object.keys(state.tombstones)].sort()) {
    if (tracked.has(entryId) || cloud.heads[entryId] || cloud.conflicts[entryId]) continue;
    const snapshot = writingSnapshot(state, entryId);
    const fingerprint = await writingDigest(snapshot);
    const item = snapshot.entry || snapshot.tombstone;
    const operationId = `inventory_${fingerprint}`;
    requireCloud(!next.pending[operationId] && !next.acknowledgements[operationId], "Inventory identity collision.");
    next.pending[operationId] = { owner: queue.owner, operationId, fingerprint, entryId,
      generation: item.generation, versionId: snapshot.entry?.currentVersionId || null,
      kind: snapshot.tombstone ? "deleted" : snapshot.entry.status === "trashed" ? "trashed" : "saved",
      sequence: next.nextSequence++, previousOperationId: null,
      recordedAt: snapshot.tombstone?.deletedAt || snapshot.entry.updatedAt };
  }
  return assertWritingSyncState(next);
}

/** Server deletion is terminal. Other competing saved copies stay separate. */
export function receiveWritingHeads(original, heads, forceConflict = false) {
  const { state, queue, cloud } = structuredClone(original);
  assertWritingState(state, queue.owner); assertWritingSyncState(queue); assertWritingCloudState(cloud, queue.owner);
  requireCloud(Array.isArray(heads), "Invalid writing inventory.");
  const seen = new Set();
  for (const head of heads) {
    assertWritingHead(head, queue.owner);
    const id = head.entryId, prior = cloud.heads[id], signature = snapshotIdentity(head.snapshot);
    requireCloud(!seen.has(id), "Duplicate writing inventory head."); seen.add(id);
    requireCloud(!prior || head.serverVersion >= prior.serverVersion, "Remote writing version moved backwards.");
    requireCloud(!prior || head.serverVersion !== prior.serverVersion || prior.signature === signature, "Remote writing version changed content.");
    const local = writingSnapshot(state, id), localSignature = snapshotIdentity(local);
    const ownReceipt = Object.values(queue.acknowledgements).some(receipt =>
      receipt.entryId === id && receipt.serverVersion === head.serverVersion);
    if (local.entry && head.snapshot.entry) {
      const remote = head.snapshot.entry;
      requireCloud(local.entry.kind === remote.kind && canonicalWriting(local.entry.source) === canonicalWriting(remote.source)
        && local.entry.startedAt === remote.startedAt && local.entry.createdAt === remote.createdAt, "Remote writing replaced its original source.");
      for (const version of local.entry.versions) {
        const shared = remote.versions.find(candidate => candidate.id === version.id);
        requireCloud(!shared || canonicalWriting(shared) === canonicalWriting(version), "Remote saved version changed content.");
      }
    }
    const pending = Object.values(queue.pending).filter(change => change.entryId === id);
    if (head.snapshot.tombstone) {
      delete state.entries[id];
      for (const [key, draft] of Object.entries(state.drafts)) if (draft.entryId === id) delete state.drafts[key];
      state.tombstones[id] = head.snapshot.tombstone;
      for (const change of pending) {
        cloud.suppressed[change.operationId] = { entryId: id, fingerprint: change.fingerprint };
        delete queue.pending[change.operationId];
      }
      delete cloud.conflicts[id];
    } else if (local.tombstone) {
      // Never restore a local permanent deletion from an older active server copy.
      delete cloud.conflicts[id];
    } else if (localSignature !== signature && (forceConflict || (local.entry &&
      (!ownReceipt && (!prior || (prior.serverVersion !== head.serverVersion && (pending.length || localSignature !== prior.signature))))))) {
      cloud.conflicts[id] = head;
    } else if (!local.entry || (!pending.length && (!prior || localSignature === prior.signature))) {
      state.entries[id] = head.snapshot.entry;
      delete cloud.conflicts[id];
    } else if (localSignature === signature) delete cloud.conflicts[id];
    // Only version/lifecycle identity is retained in the baseline, never text.
    cloud.heads[id] = { serverVersion: head.serverVersion, signature };
  }
  return { state: assertWritingState(state, queue.owner), queue: assertWritingSyncState(queue), cloud: assertWritingCloudState(cloud, queue.owner) };
}

export async function writingUploadRequests({ state, queue, cloud }) {
  assertWritingState(state, queue.owner); assertWritingSyncState(queue); assertWritingCloudState(cloud, queue.owner);
  const groups = new Map();
  for (const change of pendingWritingChanges(queue)) {
    if (!groups.has(change.entryId)) groups.set(change.entryId, []);
    groups.get(change.entryId).push(change);
  }
  const requests = [];
  for (const [entryId, changes] of groups) {
    const snapshot = writingSnapshot(state, entryId), item = snapshot.entry || snapshot.tombstone;
    if (cloud.conflicts[entryId] && !snapshot.tombstone) continue;
    requireCloud(item && changes.at(-1).generation === item.generation, "Writing queue does not cover its current snapshot.");
    const body = { entryId, baseServerVersion: cloud.heads[entryId]?.serverVersion || 0, snapshot,
      changes: changes.map(({ operationId, fingerprint, generation }) => ({ operationId, fingerprint, generation })) };
    requireCloud(changes.length <= 1000 && new TextEncoder().encode(canonicalWriting(body)).length <= 1_000_000, "Writing upload is too large; saved data remains on this device.");
    requests.push({ ...body, requestId: await writingDigest(body) });
  }
  return requests;
}

export function receiveWritingReceipts(bundle, receipts) {
  return { ...bundle, queue: acknowledgeWritingChanges(bundle.queue, receipts) };
}
export function receiveWritingUpload(bundle, request, receipts) {
  requireCloud(Array.isArray(receipts) && receipts.length === request.changes.length &&
    receipts.every((receipt, index) => receipt.operationId === request.changes[index].operationId), "Incomplete upload acknowledgement.");
  const next = receiveWritingReceipts(structuredClone(bundle), receipts);
  const serverVersion = Math.max(...receipts.map(receipt => receipt.serverVersion));
  const prior = next.cloud.heads[request.entryId];
  if (!prior || serverVersion > prior.serverVersion) next.cloud.heads[request.entryId] = {
    serverVersion, signature: snapshotIdentity(request.snapshot),
  };
  return next;
}
