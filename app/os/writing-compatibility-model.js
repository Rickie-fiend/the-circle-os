import { assertWritingState, createWritingState, writingEvidence, WritingError } from "./writing-model.js";

// Pure read views only: no storage, account claiming, import, transport or AI calls.
const views = new WeakSet();
const noteIds = ["checkin-idle-title", "checkin-note"];
const memoryCollections = ["ledger", "tastes", "rhythms", "portrait", "curiosity"];
const existingKinds = new Map([
  ["note", "note"], ["thought", "thought"], ["deep-thought", "deep-thought"],
  ["athena-reading", "reading-answer"],
]);

function requireValue(condition, message, code = "invalid-compatibility") {
  if (!condition) throw new WritingError(code, message);
}

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function knownInstant(value) {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value ? value : null;
}

function existingAnswer(value) {
  requireValue(value && typeof value.questionId === "string" && value.questionId.length > 0
    && typeof value.answer === "string", "Existing writing needs its original ID and text.");
  const result = { questionId: value.questionId, answer: value.answer };
  for (const key of ["question", "kind", "source", "target", "answeredAt"]) {
    if (value[key] !== undefined) {
      requireValue(typeof value[key] === "string", "Existing writing metadata must remain text.");
      result[key] = value[key];
    }
  }
  return result;
}

async function existingRecord(answers, kind, id, content) {
  const original = [...answers].sort((left, right) => left.questionId.localeCompare(right.questionId));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({ kind, content, original })));
  const versionId = `existing_${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
  const prompt = original.find(answer => answer.questionId === id) || original[0];
  return {
    sourceSystem: "existing", id, versionId, kind, content,
    // answeredAt is a field's recorded edit time, not proof of when writing began.
    startedAt: null, attribution: { day: null, timeZone: null, occurrenceAt: null },
    lastRecordedAt: original.map(answer => knownInstant(answer.answeredAt)).filter(Boolean).sort().at(-1) || null,
    source: { questionId: prompt.questionId, ...(prompt.question !== undefined ? { question: prompt.question } : {}),
      ...(prompt.source !== undefined ? { source: prompt.source } : {}) },
    aliases: original.map(answer => ({ sourceId: answer.questionId, sourceType: answer.kind })),
    provenance: { answers: original },
  };
}

/** The caller supplies already-scoped snapshots. This is not authentication or an importer.
 * Explicit links are a read-only rehearsal of a separately reviewed mapping. Keep a link
 * when its target is trashed/deleted, so an old answer cannot become fallback evidence.
 */
export async function buildWritingCompatibilityView({ owner, writingState, existingWriting = null, links = [] }) {
  createWritingState(owner);
  assertWritingState(writingState, owner);
  // Capture all input before hashing yields; callers cannot change the view in flight.
  const state = structuredClone(writingState);
  const snapshot = structuredClone(existingWriting);
  const mapping = structuredClone(links);
  requireValue(snapshot === null || snapshot.owner === owner, "Existing writing belongs to another owner.", "owner-mismatch");
  requireValue(snapshot === null || Array.isArray(snapshot.answers), "Existing writing needs an answer snapshot.");
  requireValue(Array.isArray(mapping), "Compatibility links must be a list.");
  const linkedQuestions = new Map(), targets = new Map();
  for (const link of mapping) {
    requireValue(link && link.owner === owner, "A compatibility link belongs to another owner.", "owner-mismatch");
    requireValue(typeof link.questionId === "string" && link.questionId.length > 0
      && typeof link.entryId === "string"
      && (Object.hasOwn(state.entries, link.entryId) || Object.hasOwn(state.tombstones, link.entryId)), "A compatibility link needs a known target.");
    requireValue(!linkedQuestions.has(link.questionId) || linkedQuestions.get(link.questionId) === link.entryId, "Conflicting compatibility links.");
    linkedQuestions.set(link.questionId, link.entryId);
    const questions = targets.get(link.entryId) || new Set();
    questions.add(link.questionId); targets.set(link.entryId, questions);
    requireValue(questions.size === 1 || [...questions].every(id => noteIds.includes(id)), "Different existing entries cannot collapse into one writing source.");
  }

  const answers = new Map();
  for (const value of snapshot?.answers || []) {
    if (!existingKinds.has(value?.kind)) continue;
    const answer = existingAnswer(value), previous = answers.get(answer.questionId);
    requireValue(!previous || JSON.stringify(previous) === JSON.stringify(answer), "An existing ID has competing answers; review them before mapping.", "ambiguous-existing-writing");
    answers.set(answer.questionId, answer);
  }
  const existing = [];
  const note = noteIds.map(id => answers.get(id)).filter(Boolean);
  requireValue(note.every(answer => answer.kind === "note"), "An existing Note ID has a different kind.");
  if (note.length) {
    const content = { title: answers.get(noteIds[0])?.answer || "", body: answers.get(noteIds[1])?.answer || "", tags: [] };
    if (content.title.trim() || content.body.trim()) existing.push(await existingRecord(note, "note", "checkin-note", content));
  }
  for (const answer of answers.values()) {
    if (noteIds.includes(answer.questionId) || !answer.answer.trim()) continue;
    existing.push(await existingRecord([answer], existingKinds.get(answer.kind), answer.questionId, { title: "", body: answer.answer, tags: [] }));
  }

  const sources = writingEvidence(state).map(record => {
    const entry = state.entries[record.id];
    return { ...record, owner, sourceSystem: "writing", startedAt: entry.startedAt,
      lastRecordedAt: entry.versions.at(-1).savedAt,
      aliases: [{ sourceId: record.id, sourceType: record.kind }], provenance: null };
  });
  for (const record of existing) {
    const mapped = new Set(record.aliases.map(alias => linkedQuestions.get(alias.sourceId)).filter(Boolean));
    requireValue(mapped.size <= 1, "The existing Note fields map to different entries.");
    const target = state.entries[[...mapped][0]];
    requireValue(!target || target.kind === record.kind, "Existing writing cannot map to a different kind.");
    if (!mapped.size) sources.push({ ...record, owner });
  }

  const answered = new Map();
  const hasSavedWriting = { note: false, thoughts: false };
  let usageKnown = true, questionHistoryKnown = true, lastAnsweredQuestion = null;
  function remember(kind, source, answeredAt = null) {
    if (kind === "note") hasSavedWriting.note = true;
    if (kind === "thought" || kind === "deep-thought") hasSavedWriting.thoughts = true;
    if (kind === "deep-thought" && source?.questionId) {
      const question = { questionId: source.questionId, question: source.question ?? null };
      answered.set(JSON.stringify(question), question);
      if (knownInstant(answeredAt) && (!lastAnsweredQuestion || answeredAt > lastAnsweredQuestion.answeredAt)) {
        lastAnsweredQuestion = { ...question, answeredAt };
      }
    }
    if (kind === "deep-thought" && (!source?.questionId || !source?.question)) questionHistoryKnown = false;
  }
  // Trash retains answered status and saved-use metadata; no answer text enters this view.
  for (const entry of Object.values(state.entries)) remember(entry.kind, entry.source, entry.createdAt);
  for (const marker of Object.values(state.tombstones)) {
    if (marker.usage) remember(marker.usage.kind, marker.usage, marker.usage.answeredAt);
    else { usageKnown = false; questionHistoryKnown = false; }
  }
  for (const record of sources.filter(source => source.sourceSystem === "existing")) remember(record.kind, record.source, record.lastRecordedAt);
  const view = freeze({ owner, sources, answeredQuestions: [...answered.values()], hasSavedWriting,
    usageKnown, questionHistoryKnown, lastAnsweredQuestion });
  views.add(view);
  return view;
}

/** Select writing-derived context only. Unversioned legacy interpretation is withheld,
 * not upgraded to a current claim. Received prose is copied into a separate history view.
 * The provider must rebuild this view from current storage after each change/notification.
 */
export function selectWritingMemory({ owner, memory }, view) {
  requireValue(views.has(view), "Build the compatibility view before selecting memory.");
  requireValue(owner === view.owner, "Memory belongs to another owner.", "owner-mismatch");
  requireValue(memory && typeof memory === "object" && !Array.isArray(memory), "Memory needs a scoped snapshot.");
  const context = {}, excluded = [];
  const corrections = Array.isArray(memory.corrections) ? memory.corrections : [];
  const key = ref => JSON.stringify([ref.owner, ref.sourceSystem, ref.sourceType, ref.sourceId, ref.versionId]);
  const current = new Set(view.sources.flatMap(source => source.aliases.map(alias => key({ ...alias, owner, sourceSystem: source.sourceSystem, versionId: source.versionId }))));
  function reason(item) {
    if (!item || typeof item.id !== "string") return "invalid-item";
    if (item.status === "suppressed" || corrections.some(correction => correction?.action === "suppress" && correction.targetId === item.id)) return "suppressed";
    if (!Array.isArray(item.sourceRefs) || !item.sourceRefs.length) return "missing-sources";
    for (const ref of item.sourceRefs) {
      if (!ref || ref.owner !== owner || !["writing", "existing"].includes(ref.sourceSystem)
        || typeof ref.sourceType !== "string" || typeof ref.sourceId !== "string") return "invalid-source";
      if (typeof ref.versionId !== "string" || !ref.versionId) return "unversioned-source";
      if (corrections.some(correction => correction?.action === "forget" && correction.sourceId === ref.sourceId
        && (correction.owner === undefined || correction.owner === owner)
        && (correction.sourceSystem === undefined || correction.sourceSystem === ref.sourceSystem))) return "forgotten-source";
      if (!current.has(key(ref))) return "stale-or-excluded-source";
    }
    return null;
  }
  for (const collection of memoryCollections) {
    context[collection] = [];
    for (const item of Array.isArray(memory[collection]) ? memory[collection] : []) {
      const why = reason(item);
      if (why) excluded.push({ collection, id: typeof item?.id === "string" ? item.id : null, reason: why });
      else context[collection].push(structuredClone(item));
    }
  }
  return {
    owner, context, excluded,
    readings: { reading: structuredClone(memory.reading ?? null), editions: structuredClone(memory.editions ?? []) },
  };
}

/** Preserve the existing independent day/tool context; this gate authorizes only
 * writing. Mixed/unknown dependencies stay withheld rather than partly cited.
 */
export function writingConsumerMemory({ owner, memory }, view) {
  createWritingState(owner);
  const selected = view ? selectWritingMemory({ owner, memory }, view) : null;
  const otherTypes = new Set(["day", "time-block", "habit", "task", "protocol", "declaration", "chapter"]);
  const result = structuredClone(memory);
  for (const collection of memoryCollections) {
    const accepted = new Set((selected?.context[collection] || []).map(item => JSON.stringify(item)));
    result[collection] = (Array.isArray(memory[collection]) ? memory[collection] : []).filter(item => {
      if (accepted.has(JSON.stringify(item))) return true;
      return typeof item?.id === "string" && item.status !== "suppressed" && Array.isArray(item?.sourceRefs) && item.sourceRefs.length > 0
        && !memory.corrections?.some(correction => correction?.action === "suppress" && correction.targetId === item.id)
        && item.sourceRefs.every(ref => ref && otherTypes.has(ref.sourceType)
          && !Object.hasOwn(ref, "sourceSystem") && !Object.hasOwn(ref, "owner") && !Object.hasOwn(ref, "versionId")
          && !memory.corrections?.some(correction => correction?.action === "forget" && correction.sourceId === ref.sourceId));
    }).map(item => structuredClone(item));
  }
  return result;
}
