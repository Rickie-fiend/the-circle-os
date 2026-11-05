import { receiveWritingHeads, receiveWritingReceipts, receiveWritingUpload, writingUploadRequests } from "./writing-cloud-model.js";

/** Dependency-injected coordinator; IndexedDB and the authenticated RPC own effects. */
export async function syncAccountWriting({ store, remote, current = () => true }) {
  const check = () => { if (!current()) throw new Error("The writing account changed."); };
  check();
  let bundle = await store.read(); check();
  const ids = Object.keys(bundle.queue.pending);
  // Recover receipts before building a different upload after a lost response.
  for (let offset = 0; offset < ids.length; offset += 1000) {
    const receipts = await remote.receipts(ids.slice(offset, offset + 1000)); check();
    await store.update(latest => receiveWritingReceipts(latest, receipts)); check();
  }
  let cursor = "";
  for (;;) {
    const heads = await remote.inventory(cursor); check();
    if (!Array.isArray(heads) || heads.length > 50 || heads.some((head, index) =>
      typeof head.entryId !== "string" || head.entryId <= (index ? heads[index - 1].entryId : cursor))) throw new Error("Invalid writing inventory page.");
    if (heads.length) { await store.update(latest => receiveWritingHeads(latest, heads)); check(); }
    if (heads.length < 50) break;
    cursor = heads.at(-1).entryId;
  }
  bundle = await store.inventory(); check();
  const requests = await writingUploadRequests(bundle); check();
  for (const request of requests) {
    // A deletion or another tab's receipt may have invalidated this upload.
    const latest = await store.read(); check();
    const fresh = (await writingUploadRequests(latest)).find(candidate => candidate.entryId === request.entryId);
    if (fresh?.requestId !== request.requestId) continue;
    const result = await remote.apply(request); check();
    if (result?.status === "accepted" && Object.keys(result).sort().join() === "receipts,status") {
      await store.update(latest => receiveWritingUpload(latest, request, result.receipts));
    } else if (["conflict", "deleted"].includes(result?.status) && Object.keys(result).sort().join() === "head,status"
      && result.head?.entryId === request.entryId && (result.status !== "deleted" || result.head.snapshot?.tombstone)) {
      await store.update(latest => receiveWritingHeads(latest, [result.head], true));
    } else throw new Error("Invalid writing upload response.");
    check();
  }
  bundle = await store.read(); check();
  return { pending: Object.keys(bundle.queue.pending).length, conflicts: Object.keys(bundle.cloud.conflicts).length };
}
