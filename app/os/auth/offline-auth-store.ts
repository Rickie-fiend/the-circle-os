import type { OfflineProof } from "./offline-proof";

export type LocalAuth = { epoch: string; proof: OfflineProof | null };
// Separate from account evidence: this record selects whether local entry is allowed.
export async function localAuth(prefix: string, update?: { proof: OfflineProof | null; expected?: string | null }): Promise<LocalAuth | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(prefix + ":durable-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("auth");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Could not open saved sign-in on this device. Try again."));
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("auth", update ? "readwrite" : "readonly", { durability: "strict" });
      let value: LocalAuth | null = null;
      let failure: Error | null = null;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(failure || new Error("Could not save sign-in on this device. Try again."));
      tx.onerror = () => {};
      const request = tx.objectStore("auth").get("current");
      request.onsuccess = () => {
        const row = request.result;
        if (row !== undefined && (!row || typeof row.epoch !== "string" || !Object.hasOwn(row, "proof")) && !(update?.proof === null && update.expected === undefined)) {
          failure = new Error("Saved sign-in could not be read. Connect and sign in again."); tx.abort(); return;
        }
        value = row || null;
        if (update) {
          if (update.expected !== undefined && update.expected !== (value?.epoch ?? null)) {
            failure = new Error("The account changed. Please sign in again."); failure.name = "AuthScopeChanged"; tx.abort(); return;
          }
          value = { epoch: crypto.randomUUID(), proof: update.proof };
          tx.objectStore("auth").put(value, "current");
        }
      };
    });
  } finally { db.close(); }
}
