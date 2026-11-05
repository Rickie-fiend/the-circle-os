import { assertWritingHead, canonicalWriting, writingDigest, writingSnapshot } from "./writing-cloud-model.js";
import { WritingError } from "./writing-model.js";

const requireChoice = (ok, message = "These copies changed. Review them again.") => {
  if (!ok) throw new WritingError("resolution-stale", message);
};
export function assertWritingChoice(request, owner) {
  requireChoice(request && Object.keys(request).sort().join() === "at,changes,choice,cloud,entryId,local,requestId,versionId");
  requireChoice(/^[a-f0-9]{64}$/.test(request.requestId) && /^[A-Za-z0-9_-]{1,128}$/.test(request.versionId)
    && !["__proto__", "constructor", "prototype"].includes(request.versionId)
    && ["local", "cloud"].includes(request.choice) && new Date(request.at).toISOString() === request.at);
  assertWritingHead(request.cloud, owner);
  assertWritingHead({ ...request.cloud, snapshot: request.local }, owner);
  requireChoice(request.cloud.entryId === request.entryId && request.local.entry && request.cloud.snapshot.entry);
  const local = request.local.entry, remote = request.cloud.snapshot.entry;
  requireChoice(local.kind === remote.kind && canonicalWriting(local.source) === canonicalWriting(remote.source)
    && local.createdAt === remote.createdAt && local.startedAt === remote.startedAt);
  for (const version of local.versions) {
    const shared = remote.versions.find(item => item.id === version.id);
    requireChoice(!shared || canonicalWriting(shared) === canonicalWriting(version), "A saved version changed. Your copies are kept.");
  }
  requireChoice(![...local.versions, ...remote.versions].some(v => v.id === request.versionId));
  requireChoice(Array.isArray(request.changes) && request.changes.length <= 1000);
  const ids = new Set(); let generation = 0;
  for (const change of request.changes) {
    requireChoice(change && Object.keys(change).sort().join() === "fingerprint,generation,operationId"
      && /^[A-Za-z0-9_-]{1,128}$/.test(change.operationId) && !["__proto__", "constructor", "prototype"].includes(change.operationId)
      && /^[a-f0-9]{64}$/.test(change.fingerprint) && Number.isSafeInteger(change.generation)
      && change.generation > generation && !ids.has(change.operationId));
    ids.add(change.operationId); generation = change.generation;
  }
  if (request.changes.length) requireChoice(generation === local.generation);
  return request;
}

/** Capture both reviewed saved histories; drafts never enter the request. */
export async function prepareWritingChoice(bundle, entryId, choice, at, versionId) {
  const cloud = bundle.cloud.conflicts[entryId];
  requireChoice(cloud && !bundle.cloud.choices?.[entryId]);
  const body = { entryId, local: writingSnapshot(bundle.state, entryId), cloud: structuredClone(cloud), choice, at, versionId,
    changes: Object.values(bundle.queue.pending).filter(item => item.entryId === entryId).sort((a,b) => a.sequence - b.sequence)
      .map(({ operationId, fingerprint, generation }) => ({ operationId, fingerprint, generation })) };
  const request = { ...body, requestId: await writingDigest(body) };
  assertWritingChoice(request, bundle.state.owner);
  requireChoice(new TextEncoder().encode(canonicalWriting(request)).length <= 1_000_000, "These copies are too large to sync. Both stay on this device.");
  return request;
}
export function queueWritingChoice(bundle, request) {
  assertWritingChoice(request, bundle.state.owner);
  requireChoice(canonicalWriting(writingSnapshot(bundle.state, request.entryId)) === canonicalWriting(request.local)
    && canonicalWriting(bundle.cloud.conflicts[request.entryId]) === canonicalWriting(request.cloud)
    && !bundle.cloud.choices?.[request.entryId]);
  const next = structuredClone(bundle);
  next.cloud.choices = { ...next.cloud.choices, [request.entryId]: request };
  return next;
}

/** The new current revision extends the cloud history. Branches stay unchanged in the resolution archive. */
export function resolvedWritingHead(request) {
  const head = structuredClone(request.cloud), entry = head.snapshot.entry;
  const selected = request.choice === "local" ? request.local.entry : entry;
  entry.generation = Math.max(entry.generation, request.local.entry.generation) + 1;
  entry.updatedAt = request.at; entry.status = selected.status;
  entry.versions.push({ ...structuredClone(selected.versions.at(-1)), id: request.versionId,
    sequence: entry.versions.length + 1, savedAt: request.at });
  entry.currentVersionId = request.versionId;
  head.serverVersion++;
  return head;
}

export function receiveWritingChoice(bundle, request, result) {
  assertWritingChoice(request, bundle.state.owner);
  requireChoice(canonicalWriting(bundle.cloud.choices?.[request.entryId]) === canonicalWriting(request));
  requireChoice(result && Object.keys(result).sort().join() === "head,requestId,status");
  assertWritingHead(result.head, bundle.state.owner);
  requireChoice(result.requestId === request.requestId && result.head.entryId === request.entryId);
  const next = structuredClone(bundle);
  delete next.cloud.choices[request.entryId];
  if (result.status === "resolved") {
    requireChoice(canonicalWriting(result.head) === canonicalWriting(resolvedWritingHead(request)), "The sync reply did not match your choice. Your copies are kept.");
    next.cloud.resolved = { ...next.cloud.resolved, [request.requestId]: { request, head: result.head } };
    next.cloud.settled = { ...next.cloud.settled };
    for (const change of request.changes) {
      const pending = next.queue.pending[change.operationId];
      requireChoice(!pending || canonicalWriting({ operationId: pending.operationId, fingerprint: pending.fingerprint, generation: pending.generation }) === canonicalWriting(change));
      if (pending) {
        delete next.queue.pending[change.operationId];
        next.cloud.settled[change.operationId] = { entryId: request.entryId, fingerprint: change.fingerprint, resolutionId: request.requestId };
      }
    }
    const local = writingSnapshot(next.state, request.entryId);
    const newerHead = (next.cloud.heads[request.entryId]?.serverVersion || 0) > result.head.serverVersion;
    if (!newerHead && canonicalWriting(local) === canonicalWriting(request.local)) {
      next.state.entries[request.entryId] = result.head.snapshot.entry;
      delete next.cloud.conflicts[request.entryId];
    } else if (!newerHead && local.entry) next.cloud.conflicts[request.entryId] = result.head;
    // A later local permanent deletion must never recover archived bodies.
    if (local.tombstone) delete next.cloud.resolved[request.requestId];
    if (!newerHead) next.cloud.heads[request.entryId] = { serverVersion: result.head.serverVersion,
      signature: canonicalWriting({ generation: result.head.snapshot.entry.generation, status: result.head.snapshot.entry.status,
        versions: result.head.snapshot.entry.versions.map(v => v.id) }) };
  } else {
    requireChoice((result.status === "changed" && result.head.snapshot.entry) || (result.status === "deleted" && result.head.snapshot.tombstone));
    // Receipt/head handling remains with the shared engine, including deletion.
  }
  return next;
}

export function writingSyncLabel(bundle, { enabled, online, error, running } = {}) {
  if (!enabled) return "Saved on this device";
  if (Object.keys(bundle.cloud.conflicts).length || Object.keys(bundle.cloud.choices || {}).length) return "Review copies";
  if (error) return "Could not sync";
  if (Object.keys(bundle.queue.pending).length || Object.values(bundle.state.entries).some(entry => !bundle.cloud.heads[entry.id]))
    return online && running ? "Syncing" : "Waiting to sync";
  return "Synced";
}

export function receiveWritingResolutionHistory(bundle, records) {
  requireChoice(Array.isArray(records) && records.length <= 50);
  const next = structuredClone(bundle);
  for (const record of records) {
    requireChoice(record && Object.keys(record).sort().join() === "head,request");
    assertWritingChoice(record.request, next.state.owner); assertWritingHead(record.head, next.state.owner);
    requireChoice(canonicalWriting(record.head) === canonicalWriting(resolvedWritingHead(record.request)));
    const previous = next.cloud.resolved?.[record.request.requestId];
    requireChoice(!previous || canonicalWriting(previous) === canonicalWriting(record), "A kept history changed. Your saved copies are kept.");
    if (next.state.tombstones[record.request.entryId]) continue;
    next.cloud.resolved = { ...next.cloud.resolved, [record.request.requestId]: structuredClone(record) };
  }
  return next;
}
