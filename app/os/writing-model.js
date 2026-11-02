// Local writing contracts. Nothing here imports profiles, sends evidence or calls AI.
export const WRITING_SCHEMA_VERSION = 1;
const kinds = new Set(["note", "thought", "deep-thought", "reading-answer"]);
const preparedOperations = new WeakSet();
const reserved = new Set(["__proto__", "prototype", "constructor"]);

export class WritingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "WritingError";
    this.code = code;
  }
}

function requireValue(condition, message, code = "invalid") {
  if (!condition) throw new WritingError(code, message);
}

function id(value) {
  requireValue(typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) && !reserved.has(value), "Invalid writing ID.");
  return value;
}

function instant(value) {
  requireValue(typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, "A valid canonical UTC recording time is required.");
  return value;
}

function integer(value, minimum = 0) {
  requireValue(Number.isSafeInteger(value) && value >= minimum, "Invalid writing revision.");
  return value;
}

function zone(value) {
  requireValue(typeof value === "string" && value.length > 0 && !/^[+-]/.test(value), "A named timezone is required.");
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); }
  catch { throw new WritingError("invalid", "The writing timezone is not supported."); }
  return value;
}

function attribution(value) {
  requireValue(value && typeof value === "object", "Writing needs an attributed day.");
  const day = value.day;
  requireValue(typeof day === "string" && /^\d{4}-\d\d-\d\d$/.test(day) && Number.isFinite(Date.parse(`${day}T00:00:00Z`)) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day, "Invalid writing day.");
  return { day, timeZone: zone(value.timeZone), occurrenceAt: value.occurrenceAt == null ? null : instant(value.occurrenceAt) };
}

/** Use local wall-clock time, including on DST days, rather than subtracting six elapsed hours. */
export function writingAttribution(at, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: zone(timeZone), year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant(at))).map(part => [part.type, part.value]));
  const date = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  if (Number(parts.hour) < 6) date.setUTCDate(date.getUTCDate() - 1);
  return { day: date.toISOString().slice(0, 10), timeZone, occurrenceAt: null };
}

function content(value, kind) {
  requireValue(value && typeof value.title === "string" && typeof value.body === "string", "Writing needs title and body strings.");
  requireValue(kind === "note" || value.title === "", "Thoughts and answers do not have titles.");
  requireValue(Array.isArray(value.tags) && value.tags.every(tag => typeof tag === "string"), "Invalid writing tags.");
  return { title: value.title.trim(), body: value.body, tags: [...new Set(value.tags.map(tag => tag.trim()).filter(Boolean))].sort() };
}

function source(value) {
  requireValue(value === null || (value && typeof value === "object" && !Array.isArray(value)), "Invalid writing source.");
  if (value === null) return null;
  const result = {};
  const fields = ["questionId", "question", "source", "readingId", "editionId"];
  requireValue(Object.keys(value).every(key => fields.includes(key)), "Unknown writing source field.");
  for (const key of fields) if (value[key] !== undefined) {
    requireValue(typeof value[key] === "string", "Writing source values must be text.");
    result[key] = value[key];
  }
  return result;
}

function base(value) {
  return { baseVersionId: value.baseVersionId === null ? null : id(value.baseVersionId), baseGeneration: integer(value.baseGeneration) };
}

function draftInput(value) {
  requireValue(value && kinds.has(value.kind), "Invalid writing kind.");
  return {
    id: id(value.id), entryId: id(value.entryId), kind: value.kind, ...base(value),
    startedAt: instant(value.startedAt), attribution: attribution(value.attribution),
    content: content(value.content, value.kind), source: source(value.source),
  };
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function same(left, right) { return canonical(left) === canonical(right); }

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

/** Hash before opening IndexedDB: awaiting crypto inside a transaction can close it. */
export async function prepareWritingOperation(input) {
  requireValue(input && typeof input.owner === "string" && /^(legacy|account:[A-Za-z0-9_-]{1,128})$/.test(input.owner), "Invalid writing owner.");
  requireValue(typeof input.operationId === "string" && input.operationId.length <= 96, "Invalid writing operation ID.");
  const command = { owner: input.owner, operationId: id(input.operationId), at: instant(input.at), type: input.type };
  if (input.type === "write-draft") {
    command.draft = draftInput(input.draft);
    command.expectedDraftVersion = integer(input.expectedDraftVersion);
  } else if (input.type === "save") {
    command.draft = { ...draftInput(input.draft), version: integer(input.draft.version, 1) };
  } else if (input.type === "discard-draft") {
    command.draftId = id(input.draftId);
    command.expectedDraftVersion = integer(input.expectedDraftVersion, 1);
  } else if (["trash", "restore", "delete"].includes(input.type)) {
    command.entryId = id(input.entryId);
    command.expectedGeneration = integer(input.expectedGeneration, 1);
    if (input.type === "delete") {
      requireValue(input.confirmed === true, "Confirm permanent deletion before continuing.");
      command.confirmed = true;
    }
  } else throw new WritingError("invalid", "Unknown writing operation.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(command)));
  const prepared = freeze({ command, fingerprint: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("") });
  preparedOperations.add(prepared);
  return prepared;
}

export function createWritingState(owner) {
  requireValue(typeof owner === "string" && /^(legacy|account:[A-Za-z0-9_-]{1,128})$/.test(owner), "Invalid writing owner.");
  return { schemaVersion: WRITING_SCHEMA_VERSION, owner, entries: {}, drafts: {}, receipts: {}, tombstones: {} };
}

/** Fail closed on unfamiliar/corrupt storage; never silently reset a person's writing. */
export function assertWritingState(state, owner = state?.owner) {
  requireValue(state && state.schemaVersion === WRITING_SCHEMA_VERSION, "The writing store version is not supported.");
  createWritingState(owner);
  requireValue(state.owner === owner, "This writing belongs to another account.", "owner-mismatch");
  for (const name of ["entries", "drafts", "receipts", "tombstones"]) {
    const records = state[name];
    requireValue(records && typeof records === "object" && !Array.isArray(records), "Invalid writing store.");
    Object.keys(records).forEach(id);
  }
  for (const [key, entry] of Object.entries(state.entries)) {
    requireValue(entry && entry.id === key && kinds.has(entry.kind) && ["active", "trashed"].includes(entry.status) && !state.tombstones[key], "Invalid saved writing.");
    integer(entry.generation, 1); instant(entry.startedAt); instant(entry.createdAt); instant(entry.updatedAt); source(entry.source);
    requireValue(Array.isArray(entry.versions) && entry.versions.length > 0, "Saved writing has no versions.");
    const ids = new Set();
    for (const [index, version] of entry.versions.entries()) {
      id(version.id); instant(version.savedAt); content(version.content, entry.kind); attribution(version.attribution);
      requireValue(version.sequence === index + 1 && !ids.has(version.id), "Invalid saved writing version."); ids.add(version.id);
    }
    requireValue(entry.currentVersionId === entry.versions.at(-1).id, "Invalid current writing version.");
  }
  for (const [key, draft] of Object.entries(state.drafts)) {
    requireValue(draft && draft.id === key && kinds.has(draft.kind) && ["active", "saved", "discarded"].includes(draft.status) && !state.tombstones[draft.entryId], "Invalid writing draft.");
    id(draft.entryId); integer(draft.version, 1); base(draft); instant(draft.startedAt); instant(draft.updatedAt); attribution(draft.attribution); source(draft.source);
    if (draft.savedFrom) base(draft.savedFrom);
    if (draft.status === "active") content(draft.content, draft.kind);
    else requireValue(draft.content === null, "A closed draft still contains text.");
  }
  for (const [key, receipt] of Object.entries(state.receipts)) {
    requireValue(receipt && receipt.operationId === key && /^[a-f0-9]{64}$/.test(receipt.fingerprint) && ["drafted", "saved", "unchanged", "discarded", "conflict", "trashed", "restored", "deleted"].includes(receipt.outcome), "Invalid local writing receipt.");
    id(receipt.entryId); instant(receipt.at); integer(receipt.generation); if (receipt.draftId !== null) id(receipt.draftId);
    if (receipt.versionId !== null) id(receipt.versionId); if (receipt.draftVersion !== null) integer(receipt.draftVersion, 1);
  }
  for (const [key, tombstone] of Object.entries(state.tombstones)) {
    requireValue(tombstone && tombstone.id === key, "Invalid writing deletion marker."); integer(tombstone.generation, 1); instant(tombstone.deletedAt);
  }
  return state;
}

function currentVersion(entry) { return entry?.versions.at(-1); }

function ensureNotDeleted(state, entryId) {
  requireValue(!state.tombstones[entryId], "This writing was permanently deleted.", "deleted");
}

function matchSource(entry, draft) {
  requireValue(entry.kind === draft.kind && entry.startedAt === draft.startedAt && same(entry.source, draft.source), "The original writing source cannot be replaced.");
}

function matchingBase(draft, entry) {
  return entry ? draft.baseVersionId === entry.currentVersionId && draft.baseGeneration === entry.generation : draft.baseVersionId === null && draft.baseGeneration === 0;
}

function rebase(draft, from, entry) {
  if (!same(base(draft), base(from))) return draft;
  return { ...draft, baseVersionId: entry.currentVersionId, baseGeneration: entry.generation, savedFrom: base(from) };
}

/** Returns a new state; conflict candidates remain durable drafts, outside evidence/history. */
export function applyWritingOperation(original, prepared) {
  requireValue(preparedOperations.has(prepared), "Prepare the writing operation before applying it.");
  const { command, fingerprint } = prepared;
  assertWritingState(original, command.owner);
  const previous = original.receipts[command.operationId];
  if (previous) {
    requireValue(previous.fingerprint === fingerprint, "This operation ID was already used for different writing.", "operation-reused");
    return { state: original, receipt: structuredClone(previous) };
  }
  const state = structuredClone(original);
  const input = command.draft;
  const entryId = input?.entryId || command.entryId || state.drafts[command.draftId]?.entryId;
  requireValue(Boolean(entryId), "The writing draft does not exist.");
  ensureNotDeleted(state, entryId);
  let entry = state.entries[entryId];
  const receipt = {
    operationId: command.operationId, fingerprint, entryId, outcome: "unchanged", at: command.at,
    versionId: entry?.currentVersionId || null, generation: entry?.generation || 0,
    draftId: input?.id || command.draftId || null, draftVersion: null,
  };
  function conflict(candidate = null) {
    receipt.outcome = "conflict";
    if (candidate) {
      const existing = state.drafts[candidate.id];
      if (existing?.status === "active" && same(draftInput(existing), draftInput(candidate))) {
        receipt.draftId = existing.id; receipt.draftVersion = existing.version;
        return;
      }
      const draftId = `conflict_${command.operationId}`;
      requireValue(!state.drafts[draftId], "The conflict draft ID is already in use.");
      state.drafts[draftId] = { ...candidate, id: draftId, version: 1, status: "active", updatedAt: command.at };
      receipt.draftId = draftId; receipt.draftVersion = 1;
    }
  }
  if (command.type === "write-draft") {
    if (entry) matchSource(entry, input);
    const existing = state.drafts[input.id];
    if (existing) {
      matchSource(existing, input);
      requireValue(existing.entryId === entryId, "A draft cannot change its entry.");
      requireValue(existing.status !== "discarded", "This draft was discarded. Start a new draft.", "draft-closed");
    }
    if ((existing?.version || 0) !== command.expectedDraftVersion) conflict(input);
    else {
      let next = { ...input, version: (existing?.version || 0) + 1, status: "active", updatedAt: command.at };
      // An edit written while its own earlier Save commits can safely follow that Save.
      if (existing?.savedFrom && same(base(input), existing.savedFrom)) next = { ...next, ...base(existing), savedFrom: existing.savedFrom };
      state.drafts[input.id] = next;
      receipt.outcome = "drafted"; receipt.draftVersion = next.version;
    }
  } else if (command.type === "save") {
    const existing = state.drafts[input.id];
    requireValue(existing && existing.entryId === entryId && existing.status !== "discarded", "The draft is no longer available.", "draft-closed");
    matchSource(existing, input);
    requireValue(input.content.title.trim() || input.content.body.trim(), "Write something before saving.");
    requireValue(existing.version >= input.version, "The requested draft revision does not exist.");
    if (existing.version === input.version) requireValue(existing.status === "active" && same(existing.content, input.content) && same(existing.attribution, input.attribution), "The saved snapshot does not match its draft.");
    if (entry) matchSource(entry, input);
    if ((entry && entry.status !== "active") || !matchingBase(input, entry)) conflict(input);
    else {
      const prior = currentVersion(entry);
      const unchanged = prior && same(prior.content, input.content) && same(prior.attribution, input.attribution);
      if (!entry) entry = {
        id: entryId, kind: input.kind, source: input.source, startedAt: input.startedAt,
        createdAt: command.at, updatedAt: command.at, status: "active", generation: 0,
        currentVersionId: "", versions: [],
      };
      if (!unchanged) {
        const version = { id: `v_${command.operationId}`, sequence: entry.versions.length + 1, content: input.content, attribution: input.attribution, savedAt: command.at };
        entry.versions.push(version); entry.currentVersionId = version.id;
        entry.generation++; entry.updatedAt = command.at;
      }
      state.entries[entryId] = entry;
      let pending = rebase(existing, input, entry);
      if (existing.version === input.version) pending = { ...pending, status: "saved", content: null };
      state.drafts[input.id] = pending;
      receipt.outcome = unchanged ? "unchanged" : "saved";
      receipt.versionId = entry.currentVersionId; receipt.generation = entry.generation; receipt.draftVersion = pending.version;
    }
  } else if (command.type === "discard-draft") {
    const existing = state.drafts[command.draftId];
    requireValue(existing && existing.status === "active", "The draft is no longer available.", "draft-closed");
    if (existing.version !== command.expectedDraftVersion) conflict();
    else {
      state.drafts[existing.id] = { ...existing, content: null, status: "discarded", version: existing.version + 1, updatedAt: command.at };
      receipt.outcome = "discarded"; receipt.draftVersion = existing.version + 1;
    }
  } else {
    requireValue(Boolean(entry), "The saved entry does not exist.");
    if (entry.generation !== command.expectedGeneration) conflict();
    else {
      if (command.type === "delete") {
        requireValue(entry.status === "trashed", "Move writing to Trash before deleting it forever.");
        state.tombstones[entryId] = { id: entryId, deletedAt: command.at, generation: entry.generation + 1 };
        delete state.entries[entryId];
        for (const [key, draft] of Object.entries(state.drafts)) if (draft.entryId === entryId) delete state.drafts[key];
        receipt.outcome = "deleted"; receipt.versionId = null; receipt.generation = entry.generation + 1;
      } else {
        const status = command.type === "trash" ? "trashed" : "active";
        if (entry.status !== status) { entry.status = status; entry.generation++; entry.updatedAt = command.at; }
        receipt.outcome = command.type === "trash" ? "trashed" : "restored";
        receipt.generation = entry.generation;
      }
    }
  }
  state.receipts[command.operationId] = receipt;
  return { state, receipt: structuredClone(receipt) };
}

export function writingDrafts(state) {
  assertWritingState(state);
  return structuredClone(Object.values(state.drafts).filter(draft => draft.status === "active" && state.entries[draft.entryId]?.status !== "trashed"));
}

export function writingHistory(state, { status = "active", kind, day } = {}) {
  assertWritingState(state);
  requireValue(["active", "trashed"].includes(status), "Invalid history state.");
  return Object.values(state.entries).filter(entry => entry.status === status && (!kind || entry.kind === kind))
    .map(entry => {
      const version = currentVersion(entry);
      return structuredClone({ id: entry.id, kind: entry.kind, status: entry.status, generation: entry.generation, source: entry.source,
        startedAt: entry.startedAt, createdAt: entry.createdAt, updatedAt: entry.updatedAt, versionId: version.id,
        content: version.content, attribution: version.attribution, title: entry.kind === "note" ? version.content.title || "Untitled" : null });
    }).filter(entry => !day || entry.attribution.day === day)
    .sort((a, b) => b.attribution.day.localeCompare(a.attribution.day) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export function writingVersions(state, entryId) {
  assertWritingState(state); id(entryId);
  return structuredClone(state.entries[entryId]?.versions || []).reverse();
}

/** This selector supplies source versions only; existing Athena integration is a later slice. */
export function writingEvidence(state) {
  return writingHistory(state).map(({ id, kind, versionId, content, attribution, source }) => ({ id, kind, versionId, content, attribution, source }));
}
