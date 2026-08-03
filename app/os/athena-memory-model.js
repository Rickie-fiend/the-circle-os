export const ATHENA_MEMORY_VERSION = 1;

const GENERIC_TITLES = new Set([
  "a book",
  "a film",
  "a movie",
  "a show",
  "book",
  "film",
  "it",
  "movie",
  "something",
  "the book",
  "the film",
  "the movie",
  "the show",
  "this book",
  "this film",
  "this movie",
  "this show",
]);

function cleanText(value, maximum = 500) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maximum)
    : "";
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stableId(prefix, ...parts) {
  return `${prefix}-${stableHash(parts.join("|"))}`;
}

function normalizeSourceRef(value = {}) {
  const sourceId = cleanText(value.sourceId, 160);
  if (!sourceId) return null;
  return {
    sourceType: cleanText(value.sourceType, 40) || "thought",
    sourceId,
    capturedAt: cleanText(value.capturedAt, 80),
  };
}

function mergeSourceRefs(left = [], right = []) {
  const refs = new Map();
  for (const candidate of [...left, ...right]) {
    const ref = normalizeSourceRef(candidate);
    if (!ref) continue;
    refs.set(`${ref.sourceType}:${ref.sourceId}`, ref);
  }
  return [...refs.values()].sort((a, b) =>
    String(a.capturedAt).localeCompare(String(b.capturedAt)),
  );
}

function newer(left, right, key = "lastSeenAt") {
  return String(right?.[key] || "").localeCompare(String(left?.[key] || "")) >= 0
    ? right
    : left;
}

function mergeById(left = [], right = [], key = "lastSeenAt") {
  const values = new Map();
  for (const item of [...left, ...right]) {
    if (!item?.id) continue;
    const previous = values.get(item.id);
    const selected = previous ? newer(previous, item, key) : item;
    const sourceRefs = mergeSourceRefs(previous?.sourceRefs, item.sourceRefs);
    const stabilityOrder = ["moment", "emerging", "recurring", "enduring"];
    const evidenceStability = sourceRefs.length >= 6
      ? "enduring"
      : sourceRefs.length >= 3
        ? "recurring"
        : sourceRefs.length >= 2
          ? "emerging"
          : "moment";
    const statedStability = [previous?.stability, item.stability]
      .filter((value) => stabilityOrder.includes(value))
      .sort((a, b) => stabilityOrder.indexOf(b) - stabilityOrder.indexOf(a))[0];
    values.set(item.id, {
      ...selected,
      ...(sourceRefs.length
        ? {
            sourceRefs,
            stability:
              stabilityOrder.indexOf(statedStability) >
              stabilityOrder.indexOf(evidenceStability)
                ? statedStability
                : evidenceStability,
            firstSeenAt: [previous?.firstSeenAt, item.firstSeenAt]
              .filter(Boolean)
              .sort()[0] || null,
            lastSeenAt: [previous?.lastSeenAt, item.lastSeenAt]
              .filter(Boolean)
              .sort()
              .at(-1) || null,
          }
        : {}),
    });
  }
  return [...values.values()];
}

export function createAthenaMemory() {
  return {
    version: ATHENA_MEMORY_VERSION,
    updatedAt: null,
    lastPreparedAt: null,
    processedEvidenceIds: [],
    lowSignalEvidence: [],
    ledger: [],
    tastes: [],
    rhythms: [],
    portrait: [],
    curiosity: [],
    corrections: [],
  };
}

export function normalizeAthenaMemory(value) {
  const empty = createAthenaMemory();
  const memory = value && typeof value === "object" ? value : {};
  return {
    ...empty,
    ...memory,
    version: ATHENA_MEMORY_VERSION,
    processedEvidenceIds: unique(memory.processedEvidenceIds),
    lowSignalEvidence: Array.isArray(memory.lowSignalEvidence)
      ? memory.lowSignalEvidence.filter((item) => item?.sourceId)
      : [],
    ledger: Array.isArray(memory.ledger) ? memory.ledger.filter((item) => item?.id) : [],
    tastes: Array.isArray(memory.tastes) ? memory.tastes.filter((item) => item?.id) : [],
    rhythms: Array.isArray(memory.rhythms) ? memory.rhythms.filter((item) => item?.id) : [],
    portrait: Array.isArray(memory.portrait) ? memory.portrait.filter((item) => item?.id) : [],
    curiosity: Array.isArray(memory.curiosity) ? memory.curiosity.filter((item) => item?.id) : [],
    corrections: Array.isArray(memory.corrections)
      ? memory.corrections.filter((item) => item?.id)
      : [],
  };
}

export function mergeAthenaMemory(leftValue, rightValue) {
  const left = normalizeAthenaMemory(leftValue);
  const right = normalizeAthenaMemory(rightValue);
  const freshest = newer(left, right, "updatedAt");
  return normalizeAthenaMemory({
    ...freshest,
    updatedAt:
      String(left.updatedAt || "").localeCompare(String(right.updatedAt || "")) >= 0
        ? left.updatedAt
        : right.updatedAt,
    lastPreparedAt:
      String(left.lastPreparedAt || "").localeCompare(String(right.lastPreparedAt || "")) >= 0
        ? left.lastPreparedAt
        : right.lastPreparedAt,
    processedEvidenceIds: unique([
      ...left.processedEvidenceIds,
      ...right.processedEvidenceIds,
    ]),
    lowSignalEvidence: mergeById(
      left.lowSignalEvidence.map((item) => ({
        ...item,
        id: item.id || `low-${item.sourceId}`,
      })),
      right.lowSignalEvidence.map((item) => ({
        ...item,
        id: item.id || `low-${item.sourceId}`,
      })),
      "capturedAt",
    ),
    ledger: mergeById(left.ledger, right.ledger),
    tastes: mergeById(left.tastes, right.tastes),
    rhythms: mergeById(left.rhythms, right.rhythms),
    portrait: mergeById(left.portrait, right.portrait),
    curiosity: mergeById(left.curiosity, right.curiosity, "updatedAt"),
    corrections: mergeById(left.corrections, right.corrections, "createdAt"),
  });
}

export function isLowSignalText(value) {
  const text = cleanText(value, 2_000);
  if (!text) return true;
  if (/\b(?:asdf|qwer|zxcv|hjkl|sdfg|wert|xcvb)\b/i.test(text)) return true;
  const letters = (text.match(/[a-z]/gi) || []).length;
  if (letters < 3) return true;
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  if (!words.length) return true;
  const usefulWords = words.filter((word) => /[aeiouy]/.test(word));
  const uniqueWords = new Set(words);
  if (words.length >= 3 && usefulWords.length / words.length < 0.45) return true;
  if (words.length >= 5 && uniqueWords.size <= 2) return true;
  if (/^(.)\1{4,}$/i.test(text.replace(/\s/g, ""))) return true;
  return false;
}

function cleanTitle(value) {
  const title = cleanText(value, 120)
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+(?:and|because|which|that|about|where|while|but)\s+.*$/i, "")
    .replace(/\s+(?:today|tonight|yesterday|last night)$/i, "")
    .replace(/[,:;.!?]+$/g, "")
    .trim();
  if (!title || GENERIC_TITLES.has(title.toLowerCase())) return "";
  if (title.split(/\s+/).length > 12) return "";
  return title;
}

function ledgerFact(kind, label, state, sourceRef) {
  const firstSeenAt = sourceRef.capturedAt || null;
  return {
    id: stableId("fact", kind, label.toLowerCase(), state),
    kind,
    label,
    state,
    statement: `${label} — ${state}`,
    confidence: 0.98,
    stability: "moment",
    firstSeenAt,
    lastSeenAt: firstSeenAt,
    sourceRefs: [sourceRef],
    status: "active",
  };
}

export function extractAthenaFacts({
  sourceId,
  text,
  capturedAt = new Date().toISOString(),
  sourceType = "thought",
}) {
  const value = cleanText(text, 2_000);
  const ref = normalizeSourceRef({ sourceId, sourceType, capturedAt });
  if (!ref || !value || isLowSignalText(value)) return [];
  const facts = [];
  const patterns = [
    {
      kind: "film",
      state: "watched",
      regex: /\b(?:i\s+)?(?:just\s+)?(?:re)?watched\s+(?:the\s+(?:movie|film)\s+)?["“']?([^.!?\n]{1,160})/gi,
    },
    {
      kind: "book",
      state: "read",
      regex: /\b(?:i\s+)?(?:just\s+)?(?:finished\s+reading|read)\s+(?:the\s+book\s+)?["“']?([^.!?\n]{1,160})/gi,
    },
    {
      kind: "book",
      state: "started",
      regex: /\b(?:i\s+)?(?:just\s+)?started\s+reading\s+(?:the\s+book\s+)?["“']?([^.!?\n]{1,160})/gi,
    },
    {
      kind: "music",
      state: "listened",
      regex: /\b(?:i\s+)?(?:just\s+)?listened\s+to\s+["“']?([^.!?\n]{1,160})/gi,
    },
    {
      kind: "place",
      state: "visited",
      regex: /\b(?:i\s+)?(?:just\s+)?visited\s+["“']?([^.!?\n]{1,160})/gi,
    },
  ];

  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern.regex)) {
      const label = cleanTitle(match[1]);
      if (label) facts.push(ledgerFact(pattern.kind, label, pattern.state, ref));
    }
  }
  return mergeById([], facts);
}

export function recallAthenaLedger(memoryValue, kind) {
  const memory = normalizeAthenaMemory(memoryValue);
  const requestedKind = cleanText(kind, 40).toLowerCase();
  return memory.ledger
    .filter((item) =>
      item?.status !== "suppressed" &&
      (!requestedKind || String(item.kind || "").toLowerCase() === requestedKind),
    )
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      label: item.label,
      state: item.state,
      lastSeenAt: item.lastSeenAt || null,
    }));
}

export function captureAthenaThought(memoryValue, evidence) {
  const memory = normalizeAthenaMemory(memoryValue);
  const sourceId = cleanText(evidence?.sourceId, 160);
  if (!sourceId || memory.processedEvidenceIds.includes(sourceId)) return memory;
  const capturedAt = cleanText(evidence?.capturedAt, 80) || new Date().toISOString();
  const text = cleanText(evidence?.text, 2_000);
  const sourceType = cleanText(evidence?.sourceType, 40) || "thought";
  const lowSignal = isLowSignalText(text);
  const facts = lowSignal
    ? []
    : extractAthenaFacts({ sourceId, text, capturedAt, sourceType });
  return normalizeAthenaMemory({
    ...memory,
    updatedAt: capturedAt,
    processedEvidenceIds: [...memory.processedEvidenceIds, sourceId],
    lowSignalEvidence: lowSignal
      ? [
          ...memory.lowSignalEvidence,
          {
            id: `low-${sourceId}`,
            sourceId,
            sourceType,
            capturedAt,
            reason: "No clear meaning yet.",
          },
        ]
      : memory.lowSignalEvidence,
    ledger: mergeById(memory.ledger, facts),
  });
}

function removeSourceRefs(items, sourceId) {
  return items
    .map((item) => ({
      ...item,
      sourceRefs: (item.sourceRefs || []).filter((ref) => ref.sourceId !== sourceId),
    }))
    .filter((item) => !Array.isArray(item.sourceRefs) || item.sourceRefs.length > 0);
}

export function forgetAthenaEvidence(memoryValue, sourceId) {
  const memory = normalizeAthenaMemory(memoryValue);
  const cleanId = cleanText(sourceId, 160);
  if (!cleanId) return memory;
  const timestamp = new Date().toISOString();
  return normalizeAthenaMemory({
    ...memory,
    updatedAt: timestamp,
    processedEvidenceIds: memory.processedEvidenceIds.filter((id) => id !== cleanId),
    lowSignalEvidence: memory.lowSignalEvidence.filter((item) => item.sourceId !== cleanId),
    ledger: removeSourceRefs(memory.ledger, cleanId),
    tastes: removeSourceRefs(memory.tastes, cleanId),
    rhythms: removeSourceRefs(memory.rhythms, cleanId),
    portrait: removeSourceRefs(memory.portrait, cleanId),
    curiosity: removeSourceRefs(memory.curiosity, cleanId),
    corrections: [
      ...memory.corrections,
      {
        id: stableId("correction", "forget", cleanId),
        action: "forget",
        sourceId: cleanId,
        createdAt: timestamp,
      },
    ],
  });
}

export function suppressAthenaObservation(memoryValue, observationId, note = "") {
  const memory = normalizeAthenaMemory(memoryValue);
  const timestamp = new Date().toISOString();
  const suppress = (items) =>
    items.map((item) =>
      item.id === observationId
        ? { ...item, status: "suppressed", updatedAt: timestamp }
        : item,
    );
  return normalizeAthenaMemory({
    ...memory,
    updatedAt: timestamp,
    tastes: suppress(memory.tastes),
    rhythms: suppress(memory.rhythms),
    portrait: suppress(memory.portrait),
    corrections: [
      ...memory.corrections,
      {
        id: stableId("correction", "suppress", observationId),
        action: "suppress",
        targetId: observationId,
        note: cleanText(note, 500),
        createdAt: timestamp,
      },
    ],
  });
}

function markdownList(items, render, fallback = "Nothing clear yet.") {
  const visible = items.filter((item) => item.status !== "suppressed");
  return visible.length ? visible.map(render).join("\n") : fallback;
}

export function serializeAthenaMemoryMarkdown(memoryValue, profileId = "") {
  const memory = normalizeAthenaMemory(memoryValue);
  const evidenceCount = (item) => item.sourceRefs?.length || 0;
  return `---
type: circle-os-athena-memory
profile_id: ${profileId}
updated: ${memory.updatedAt || ""}
last_prepared: ${memory.lastPreparedAt || ""}
---

# Athena Memory

This is Athena's source-linked working memory. It is not a score or a final truth.

## Life Ledger

${markdownList(memory.ledger, (item) => `- ${item.kind}: ${item.label} — ${item.state} (${evidenceCount(item)} source${evidenceCount(item) === 1 ? "" : "s"})`)}

## Taste Map

${markdownList(memory.tastes, (item) => `- ${item.statement} (${item.stability || "emerging"}; ${evidenceCount(item)} sources)`)}

## Rhythm Map

${markdownList(memory.rhythms, (item) => `- ${item.statement} (${item.stability || "emerging"}; ${evidenceCount(item)} sources)`)}

## Inner Portrait

${markdownList(memory.portrait, (item) => `- ${item.statement} (${item.stability || "emerging"}; confidence ${Number(item.confidence || 0).toFixed(2)})`)}

## Curiosity Queue

${markdownList(memory.curiosity, (item) => `- ${item.question || item.statement}`)}

## Corrections

${memory.corrections.length ? memory.corrections.map((item) => `- ${item.action}: ${item.note || item.targetId || item.sourceId || "recorded"}`).join("\n") : "No corrections yet."}
`;
}
