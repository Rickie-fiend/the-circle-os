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
    lastEvidenceAt: null,
    preparedEvidenceRevision: 0,
    processedEvidenceIds: [],
    lowSignalEvidence: [],
    ledger: [],
    tastes: [],
    rhythms: [],
    portrait: [],
    curiosity: [],
    corrections: [],
    reading: createAthenaReadingDraft(),
    editions: [],
    pricing: null,
  };
}

/**
 * What the recorded days cost, computed by `athena-pricing-model.js`.
 *
 * Kept shape-only here so memory does not depend on the pricing rules: the
 * numbers are arithmetic and belong with the days, the words belong here.
 */
export function normalizeAthenaPricing(value) {
  if (!value || typeof value !== "object") return null;
  const categories = (Array.isArray(value.categories) ? value.categories : [])
    .filter((category) => category?.id && Number(category.blocks) > 0);
  if (!categories.length) return null;
  return { ...value, categories };
}

/**
 * How many editions travel with the synced memory.
 *
 * The vault keeps every edition Athena has ever written; this is only how far
 * back the phone can read without the server. Roughly two months of mornings.
 */
export const ATHENA_EDITION_LIMIT = 60;

/** Athena's authored prose, one group of sections for each Reading page. */
export function createAthenaReadingDraft() {
  return { cover: "", days: [], alive: [], shape: [] };
}

const READING_PAGES = ["days", "alive", "shape"];
const READING_TARGETS = {
  days: "currentLife",
  alive: "whatMatters",
  shape: "personality",
};

export function buildAthenaReadingReplyPrompt(page, sections, editionId = null) {
  if (!READING_TARGETS[page] || !Array.isArray(sections)) return null;
  const paragraphs = sections.flatMap((section) =>
    Array.isArray(section?.paragraphs) && section.paragraphs.length
      ? section.paragraphs
      : [section?.text],
  );
  const text = [...paragraphs]
    .reverse()
    .map((paragraph) => cleanText(paragraph, 1_200))
    .find((paragraph) => /\?\s*$/.test(paragraph));
  if (!text) return null;
  return {
    id: `athena-reading-${cleanText(editionId, 120) || "live"}-${page}`,
    text,
    target: READING_TARGETS[page],
  };
}

/**
 * The words of a reading, reduced to one stable key.
 *
 * An edition is identified by what it says rather than by the morning it was
 * prepared. Athena prepares every day whether or not the evidence moved, so
 * keying on the date would publish the same words over and over and the tab
 * would claim something new on a day when nothing was. Keying on the words
 * means a quiet morning publishes nothing, which is the honest outcome.
 */
function readingContentKey(reading) {
  return stableHash(
    JSON.stringify(
      [
        reading.cover || "",
        ...READING_PAGES.map((page) =>
          (reading[page] || []).map((section) => [
            section.heading,
            section.paragraphs,
          ]),
        ),
      ],
    ),
  );
}

function readingHasWords(reading) {
  return Boolean(reading.cover) ||
    READING_PAGES.some((page) => (reading[page] || []).length > 0);
}

function normalizeAthenaEdition(value) {
  const edition = value && typeof value === "object" ? value : {};
  const reading = normalizeAthenaReading(edition);
  if (!readingHasWords(reading)) return null;
  const id = cleanText(edition.id, 80) || `edition-${readingContentKey(reading)}`;
  return { id, publishedAt: cleanText(edition.publishedAt, 80) || null, ...reading };
}

/**
 * The edition this memory's current reading represents.
 *
 * Only Athena's authored prose is published. The derived observations that
 * stand in for a page she has not written are a fallback for display, not a
 * publication: they change whenever the evidence does, and would mint an
 * edition out of nothing being said.
 */
function mintAthenaEdition(reading, publishedAt) {
  if (!readingHasWords(reading)) return null;
  return {
    id: `edition-${readingContentKey(reading)}`,
    publishedAt: cleanText(publishedAt, 80) || null,
    ...reading,
  };
}

/**
 * Newest first. An edition is immutable, so two copies of one id differ only in
 * how much of its history each side saw; the earlier publication date is the
 * true one.
 */
function collectAthenaEditions(candidates) {
  const editions = new Map();
  for (const candidate of candidates) {
    const edition = candidate && candidate.id ? candidate : null;
    if (!edition) continue;
    const previous = editions.get(edition.id);
    if (!previous) {
      editions.set(edition.id, edition);
      continue;
    }
    const publishedAt = [previous.publishedAt, edition.publishedAt]
      .filter(Boolean)
      .sort()[0] || null;
    editions.set(edition.id, { ...previous, publishedAt });
  }
  return [...editions.values()]
    .sort((left, right) => {
      const order = String(right.publishedAt || "").localeCompare(
        String(left.publishedAt || ""),
      );
      return order || String(left.id).localeCompare(String(right.id));
    })
    .slice(0, ATHENA_EDITION_LIMIT);
}

function normalizeReadingSection(value) {
  const heading = cleanText(value?.heading, 80);
  const paragraphs = (Array.isArray(value?.paragraphs)
    ? value.paragraphs
    : [value?.text]
  )
    .map((paragraph) => cleanText(paragraph, 1_200))
    .filter(Boolean);
  if (!heading || !paragraphs.length) return null;
  return { heading, paragraphs };
}

export function normalizeAthenaReading(value) {
  const reading = value && typeof value === "object" ? value : {};
  const normalized = createAthenaReadingDraft();
  normalized.cover = cleanText(reading.cover, 240);
  for (const page of READING_PAGES) {
    normalized[page] = (Array.isArray(reading[page]) ? reading[page] : [])
      .map(normalizeReadingSection)
      .filter(Boolean);
  }
  return normalized;
}

export function normalizeAthenaMemory(value) {
  const empty = createAthenaMemory();
  const memory = value && typeof value === "object" ? value : {};
  const reading = normalizeAthenaReading(memory.reading);
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
    reading,
    pricing: normalizeAthenaPricing(memory.pricing),
    editions: collectAthenaEditions([
      ...(Array.isArray(memory.editions) ? memory.editions : []).map(
        normalizeAthenaEdition,
      ),
      mintAthenaEdition(reading, memory.updatedAt),
    ]),
  };
}

function activeAthenaItems(items) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => item && item.status !== "suppressed",
  );
}

function observationText(item) {
  return cleanText(
    item?.statement ||
      (item?.label
        ? `${item.label}${item.state ? ` — ${item.state}` : ""}.`
        : ""),
    1_200,
  );
}

/**
 * Falls back to raw observations when Athena has not authored this page yet.
 * Each observation stands as its own paragraph so an unauthored page still
 * reads as a list of separate noticings rather than one run-on paragraph.
 */
function readingSection(heading, items) {
  const paragraphs = activeAthenaItems(items).map(observationText).filter(Boolean);
  return paragraphs.length
    ? { heading, text: paragraphs.join(" "), paragraphs, authored: false }
    : null;
}

function authoredSections(reading, page) {
  return (reading[page] || []).map((section) => ({
    heading: section.heading,
    text: section.paragraphs.join(" "),
    paragraphs: section.paragraphs,
    authored: true,
  }));
}

/**
 * @param {...({ heading: string, text: string } | null)} sections
 * @returns {Array<{ heading: string, text: string }>}
 */
function compactReadingSections(...sections) {
  return sections.filter(Boolean);
}

/**
 * Projects Athena's private, source-linked memory into the readable blog.
 * Raw evidence remains untouched; suppressed observations never appear.
 */
export function buildAthenaReading(memoryValue) {
  const memory = normalizeAthenaMemory(memoryValue);
  // Athena's own prose wins. Derived observations are the honest fallback for a
  // page she has not written yet, so a profile never loses its existing reading.
  const authored = (page, ...derived) => {
    const written = authoredSections(memory.reading, page);
    return written.length ? written : compactReadingSections(...derived);
  };
  const pages = {
    days: authored("days", readingSection("Recent rhythm", memory.rhythms)),
    alive: authored(
      "alive",
      readingSection("What seems to matter", memory.tastes),
      readingSection("What Athena remembers", memory.ledger),
    ),
    shape: authored("shape", readingSection("A working guess", memory.portrait)),
  };

  // Every edition Athena has published, newest first. `pages` stays the live
  // view, because it still falls back to derived observations for a page she
  // has not written; an edition only ever holds prose she actually wrote.
  const editions = memory.editions.map((edition) => ({
    id: edition.id,
    publishedAt: edition.publishedAt,
    cover: edition.cover,
    pages: Object.fromEntries(
      READING_PAGES.map((page) => [page, authoredSections(edition, page)]),
    ),
  }));

  return {
    updatedAt: memory.updatedAt || null,
    contentUpdatedAt: memory.updatedAt || null,
    preparedAt: memory.lastPreparedAt || null,
    lastEvidenceAt: memory.lastEvidenceAt || null,
    preparedEvidenceRevision: Number(memory.preparedEvidenceRevision || 0),
    ready: Object.values(pages).some((sections) => sections.length > 0),
    cover: memory.reading.cover,
    pages,
    editions,
    latestEditionId: editions[0]?.id || null,
    publishedAt: editions[0]?.publishedAt || null,
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
    lastEvidenceAt:
      String(left.lastEvidenceAt || "").localeCompare(String(right.lastEvidenceAt || "")) >= 0
        ? left.lastEvidenceAt
        : right.lastEvidenceAt,
    preparedEvidenceRevision: Math.max(
      Number(left.preparedEvidenceRevision || 0),
      Number(right.preparedEvidenceRevision || 0),
    ),
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
    // Only the morning preparation authors prose. The phone syncs memory without
    // it, so never let an empty side erase a reading the other side still holds.
    reading: readingWeight(freshest.reading)
      ? freshest.reading
      : readingWeight(left.reading) >= readingWeight(right.reading)
        ? left.reading
        : right.reading,
    // Pricing is arithmetic over the days, so the side that has seen more days
    // wins rather than the side that merely saved last.
    pricing:
      (right.pricing?.recordedDays || 0) >= (left.pricing?.recordedDays || 0)
        ? right.pricing || left.pricing
        : left.pricing,
    // Editions are immutable and each side may hold ones the other never saw.
    // A merge is a union: a past edition is never lost because a phone synced
    // from a copy that predates it.
    editions: [...left.editions, ...right.editions],
  });
}

function readingWeight(reading) {
  return READING_PAGES.reduce(
    (total, page) => total + (reading?.[page]?.length || 0),
    reading?.cover ? 1 : 0,
  );
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
    lastEvidenceAt: capturedAt,
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
last_evidence: ${memory.lastEvidenceAt || ""}
prepared_evidence_revision: ${Number(memory.preparedEvidenceRevision || 0)}
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

## What the days cost

${serializeMemoryPricing(memory.pricing)}

## Reading

${serializeAthenaReading(memory.reading)}
`;
}

function serializeMemoryPricing(pricing) {
  if (!pricing?.categories?.length) return "Not priced yet.";
  const head = `Over ${pricing.recordedDays} recorded days (${pricing.from} to ${pricing.to}), ${pricing.recordedHours} hours logged, about ${pricing.hoursLoggedPerDay} a day. Categories overlap, so shares do not add to 100.`;
  const rows = pricing.categories.map((category) => {
    const change =
      category.changePerDay === null || category.changePerDay === 0
        ? ""
        : `, ${category.changePerDay > 0 ? "up" : "down"} ${Math.abs(category.changePerDay)}h a day`;
    return `- ${category.label} — ${category.hours}h, ${category.share}% of logged time, ${category.hoursPerRecordedDay}h a day, on ${category.daysPresent} of ${pricing.recordedDays} days${change}`;
  });
  return [head, "", ...rows].join("\n");
}

const READING_PAGE_TITLES = {
  days: "Your days",
  alive: "What feels alive",
  shape: "Your shape",
};

function serializeAthenaReading(reading) {
  const pages = READING_PAGES.filter((page) => reading[page]?.length);
  if (!reading.cover && !pages.length) return "Athena has not written a reading yet.";
  return [
    ...(reading.cover ? ["### Cover", reading.cover] : []),
    ...pages.map((page) =>
      [
        `### ${READING_PAGE_TITLES[page]}`,
        ...reading[page].map((section) =>
          [`**${section.heading}**`, ...section.paragraphs].join("\n\n"),
        ),
      ].join("\n\n"),
    ),
  ]
    .join("\n\n");
}
