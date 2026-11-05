import { receiveWritingHeads, receiveWritingReceipts, receiveWritingUpload, writingUploadRequests } from "./writing-cloud-model.js";
import { receiveWritingChoice, receiveWritingResolutionHistory } from "./writing-conflict-model.js";

/** Dependency-injected coordinator; IndexedDB and the authenticated RPC own effects. */
export async function syncAccountWriting({ store, remote, current = () => true }) {
  const check = () => { if (!current()) throw new Error("The writing account changed."); };
  check();
  let bundle = await store.read(); check();
  // Durable choices retry before inventory. A lost reply must not become another choice.
  for (const request of Object.values(bundle.cloud.choices || {})) {
    const latest = await store.read(); check();
    if (!latest.cloud.choices?.[request.entryId]) continue;
    if (!remote.resolve) throw new Error("Writing conflict resolution is unavailable. Both copies are kept.");
    const result = await remote.resolve(request); check();
    await store.update(current => {
      if (!current.cloud.choices?.[request.entryId]) return current;
      const next = receiveWritingChoice(current, request, result);
      return result.status === "resolved" ? next : receiveWritingHeads(next, [result.head], true);
    }); check();
  }
  bundle = await store.read(); check();
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
  if (remote.resolutions) {
    let cursor = "";
    for (;;) {
      const records = await remote.resolutions(cursor); check();
      if (!Array.isArray(records) || records.length > 50 || records.some((item,index) =>
        typeof item?.request?.requestId !== "string" || item.request.requestId <= (index ? records[index-1].request.requestId : cursor)))
        throw new Error("Invalid writing history page.");
      if (records.length) { await store.update(latest => receiveWritingResolutionHistory(latest, records)); check(); }
      if (records.length < 50) break;
      cursor = records.at(-1).request.requestId;
    }
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
