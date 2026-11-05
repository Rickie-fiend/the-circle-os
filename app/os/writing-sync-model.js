import { assertWritingState, WritingError } from "./writing-model.js";

function requireSync(value, message) {
  if (!value) throw new WritingError("sync-invalid", message);
}
function validId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value)
    && !["__proto__", "prototype", "constructor"].includes(value);
}
function fingerprint(value) { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function same(left, right) {
  const keys = Object.keys(left).sort();
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}
function validAck(ack, owner) {
  requireSync(ack && ack.owner === owner && validId(ack.operationId) && validId(ack.entryId)
    && fingerprint(ack.fingerprint) && Number.isSafeInteger(ack.generation) && ack.generation > 0
    && validId(ack.receiptId) && Number.isSafeInteger(ack.serverVersion) && ack.serverVersion > 0
    && Object.keys(ack).sort().join() === "entryId,fingerprint,generation,operationId,owner,receiptId,serverVersion",
  "Invalid writing sync acknowledgement.");
}

export function createWritingSyncState(owner) {
  requireSync(typeof owner === "string" && /^account:[A-Za-z0-9_-]{1,128}$/.test(owner), "Sync requires an account owner.");
  return { schemaVersion: 1, owner, nextSequence: 1, pending: {}, acknowledgements: {} };
}

/** The queue contains references and hashes only. Deleted text cannot survive here. */
export function assertWritingSyncState(state, owner = state?.owner) {
  createWritingSyncState(owner);
  requireSync(state && state.schemaVersion === 1 && state.owner === owner
    && Number.isSafeInteger(state.nextSequence) && state.nextSequence > 0
    && Object.keys(state).sort().join() === "acknowledgements,nextSequence,owner,pending,schemaVersion", "Invalid writing sync store.");
  const sequences = new Set(), receipts = new Set();
  for (const name of ["pending", "acknowledgements"]) {
    requireSync(state[name] && typeof state[name] === "object" && !Array.isArray(state[name]), "Invalid writing sync records.");
    for (const [id, record] of Object.entries(state[name])) {
      requireSync(validId(id) && record?.operationId === id && record.owner === owner
        && Number.isSafeInteger(record.sequence) && record.sequence > 0 && record.sequence < state.nextSequence
        && !sequences.has(record.sequence), "Invalid writing sync sequence.");
      sequences.add(record.sequence);
      if (name === "acknowledgements") {
        const ack = { ...record }; delete ack.sequence;
        validAck(ack, owner);
        requireSync(!receipts.has(ack.receiptId) && !state.pending[id], "Duplicate writing sync receipt.");
        receipts.add(ack.receiptId);
      } else {
        requireSync(validId(record.entryId) && fingerprint(record.fingerprint)
          && Number.isSafeInteger(record.generation) && record.generation > 0
          && ["saved", "trashed", "restored", "deleted"].includes(record.kind)
          && (record.versionId === null ? record.kind === "deleted" : validId(record.versionId))
          && (record.previousOperationId === null || validId(record.previousOperationId))
          && typeof record.recordedAt === "string" && Number.isFinite(Date.parse(record.recordedAt))
          && Object.keys(record).sort().join() === "entryId,fingerprint,generation,kind,operationId,owner,previousOperationId,recordedAt,sequence,versionId",
        "Invalid pending writing change.");
      }
    }
  }
  return state;
}

/** Called inside the same transaction as the accepted writing operation.
 * Existing receipts are never retroactively uploaded; inventory comes later.
 */
export function enqueueWritingChange(queue, before, result) {
  assertWritingSyncState(queue);
  assertWritingState(before, queue.owner);
  assertWritingState(result.state, queue.owner);
  const receipt = result.receipt;
  requireSync(receipt && same(result.state.receipts[receipt.operationId] || {}, receipt), "Missing local writing receipt.");
  if (before.receipts[receipt.operationId]) return queue;
  if (!["saved", "trashed", "restored", "deleted"].includes(receipt.outcome)) return queue;
  const previousGeneration = before.entries[receipt.entryId]?.generation || 0;
  if (receipt.generation === previousGeneration) return queue;
  requireSync(!queue.pending[receipt.operationId] && !queue.acknowledgements[receipt.operationId], "Writing sync operation ID was reused.");
  const previous = [...Object.values(queue.pending), ...Object.values(queue.acknowledgements)]
    .filter((record) => record.entryId === receipt.entryId).sort((a, b) => b.sequence - a.sequence)[0];
  const change = {
    owner: queue.owner, operationId: receipt.operationId, fingerprint: receipt.fingerprint,
    entryId: receipt.entryId, generation: receipt.generation, versionId: receipt.versionId,
    kind: receipt.outcome, sequence: queue.nextSequence, previousOperationId: previous?.operationId || null,
    recordedAt: receipt.at,
  };
  const next = { ...queue, nextSequence: queue.nextSequence + 1, pending: { ...queue.pending, [change.operationId]: change } };
  return assertWritingSyncState(next);
}

export function pendingWritingChanges(queue) {
  assertWritingSyncState(queue);
  return structuredClone(Object.values(queue.pending).sort((a, b) => a.sequence - b.sequence));
}

/** A future authenticated transport supplies exact receipts. This validates
 * receipt identity, not remote authorization. No clocks or broad watermarks.
 */
export function acknowledgeWritingChanges(original, acknowledgements) {
  assertWritingSyncState(original);
  requireSync(Array.isArray(acknowledgements), "Writing sync acknowledgements must be a list.");
  const queue = structuredClone(original);
  for (const ack of acknowledgements) {
    validAck(ack, queue.owner);
    const prior = queue.acknowledgements[ack.operationId];
    if (prior) {
      const receipt = { ...prior }; delete receipt.sequence;
      requireSync(same(receipt, ack), "Writing sync receipt changed on retry.");
      continue;
    }
    const pending = queue.pending[ack.operationId];
    requireSync(pending && pending.entryId === ack.entryId && pending.fingerprint === ack.fingerprint
      && pending.generation === ack.generation, "Writing sync acknowledgement does not match its pending change.");
    const records = Object.values(queue.acknowledgements).filter((r) => r.entryId === ack.entryId);
    requireSync(records.every((r) => r.sequence < pending.sequence ? r.serverVersion < ack.serverVersion : r.serverVersion > ack.serverVersion),
      "Writing server versions disagree with local change order.");
    queue.acknowledgements[ack.operationId] = { ...ack, sequence: pending.sequence };
    delete queue.pending[ack.operationId];
  }
  return assertWritingSyncState(queue);
}
