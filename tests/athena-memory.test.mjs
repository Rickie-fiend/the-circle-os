import assert from "node:assert/strict";
import test from "node:test";

import {
  ATHENA_EDITION_LIMIT,
  buildAthenaReading,
  buildAthenaReadingReplyPrompt,
  captureAthenaThought,
  createAthenaMemory,
  extractAthenaFacts,
  forgetAthenaEvidence,
  isLowSignalText,
  mergeAthenaMemory,
  recallAthenaLedger,
  serializeAthenaMemoryMarkdown,
  suppressAthenaObservation,
} from "../app/os/athena-memory-model.js";

test("an authored Reading question becomes one reply prompt", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-18T06:15:00.000Z",
    reading: {
      days: [{
        heading: "When the days start",
        paragraphs: [
          "Your recorded days began late.",
          "Is midnight still the life you want?",
        ],
      }],
      alive: [],
      shape: [],
    },
  });
  const prompt = buildAthenaReadingReplyPrompt(
    "days",
    reading.pages.days,
    reading.latestEditionId,
  );
  assert.equal(prompt.text, "Is midnight still the life you want?");
  assert.equal(prompt.target, "currentLife");
  assert.match(prompt.id, /^athena-reading-edition-/);
});

test("a Reading statement does not invent a reply prompt", () => {
  assert.equal(
    buildAthenaReadingReplyPrompt(
      "alive",
      [{ heading: "Moving", paragraphs: ["Walking held through the week."] }],
      "edition-one",
    ),
    null,
  );
});

test("builds Athena Reading from active source-linked memory", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-03T08:00:00.000Z",
    ledger: [
      {
        id: "film-perfect-days",
        kind: "film",
        label: "Perfect Days",
        state: "watched",
        statement: "Perfect Days was watched.",
        status: "active",
      },
    ],
    rhythms: [
      {
        id: "late-sleep",
        statement: "Sleep has recently begun late.",
        status: "active",
      },
    ],
    portrait: [
      {
        id: "suppressed-guess",
        statement: "This should stay hidden.",
        status: "suppressed",
      },
    ],
  });

  assert.equal(reading.ready, true);
  assert.equal(reading.updatedAt, "2026-08-03T08:00:00.000Z");
  assert.equal(reading.pages.days[0].text, "Sleep has recently begun late.");
  assert.match(reading.pages.alive[0].text, /Perfect Days was watched/);
  assert.equal(reading.pages.shape.length, 0);
});

test("an unauthored page keeps each observation as its own paragraph", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-12T08:00:00.000Z",
    rhythms: [
      { id: "walking", statement: "You walked on 13 of 14 days.", status: "active" },
      { id: "gym", statement: "The gym stopped after 6 August.", status: "active" },
    ],
  });

  assert.deepEqual(reading.pages.days[0].paragraphs, [
    "You walked on 13 of 14 days.",
    "The gym stopped after 6 August.",
  ]);
  assert.equal(reading.pages.days[0].authored, false);
});

test("Athena's authored prose replaces the derived observations", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-12T08:00:00.000Z",
    rhythms: [
      { id: "walking", statement: "You walked on 13 of 14 days.", status: "active" },
    ],
    reading: {
      days: [
        {
          heading: "The part that held",
          paragraphs: ["You walked on almost every day.", "Other things stopped."],
        },
      ],
    },
  });

  assert.equal(reading.pages.days.length, 1);
  assert.equal(reading.pages.days[0].heading, "The part that held");
  assert.equal(reading.pages.days[0].authored, true);
  assert.equal(reading.pages.days[0].paragraphs.length, 2);
  // A page she has not written still falls back rather than going blank.
  assert.equal(reading.pages.days[0].text.includes("13 of 14"), false);
});

test("a section with no heading or no words is not published", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-12T08:00:00.000Z",
    portrait: [{ id: "guess", statement: "A working guess.", status: "active" }],
    reading: { shape: [{ heading: "", paragraphs: ["orphaned"] }, { heading: "Empty", paragraphs: ["  "] }] },
  });

  assert.equal(reading.pages.shape[0].authored, false);
  assert.equal(reading.pages.shape[0].text, "A working guess.");
});

test("syncing memory without a reading never erases an authored one", () => {
  const authored = {
    updatedAt: "2026-08-12T06:00:00.000Z",
    reading: { shape: [{ heading: "Your shape", paragraphs: ["A working idea."] }] },
  };
  const fresherPhoneSync = { updatedAt: "2026-08-12T09:00:00.000Z" };

  const merged = mergeAthenaMemory(authored, fresherPhoneSync);

  assert.equal(merged.updatedAt, "2026-08-12T09:00:00.000Z");
  assert.equal(merged.reading.shape[0].paragraphs[0], "A working idea.");
});

const at = "2026-08-03T06:15:00.000Z";

test("a reading is published as a dated edition that survives the next one", () => {
  const july = {
    updatedAt: "2026-07-30T04:00:00.000Z",
    reading: { days: [{ heading: "The first week", paragraphs: ["You walked."] }] },
  };
  const august = {
    updatedAt: "2026-08-13T04:24:00.000Z",
    reading: { days: [{ heading: "What held", paragraphs: ["You walked anyway."] }] },
  };

  const reading = buildAthenaReading(mergeAthenaMemory(july, august));

  assert.equal(reading.editions.length, 2);
  assert.equal(reading.editions[0].publishedAt, "2026-08-13T04:24:00.000Z");
  assert.equal(reading.editions[0].pages.days[0].heading, "What held");
  assert.equal(reading.editions[1].pages.days[0].heading, "The first week");
  assert.equal(reading.latestEditionId, reading.editions[0].id);
});

test("a morning that says the same thing publishes nothing new", () => {
  const words = { days: [{ heading: "Your days", paragraphs: ["Walking held."] }] };
  const monday = { updatedAt: "2026-08-12T04:00:00.000Z", reading: words };
  const tuesday = { updatedAt: "2026-08-13T04:00:00.000Z", reading: words };

  const reading = buildAthenaReading(mergeAthenaMemory(monday, tuesday));

  assert.equal(reading.editions.length, 1);
  // The edition keeps the morning it was actually written, not the morning
  // Athena last checked and found nothing to add.
  assert.equal(reading.editions[0].publishedAt, "2026-08-12T04:00:00.000Z");
});

test("an edition already read on the phone is not lost to an older sync", () => {
  const phone = {
    updatedAt: "2026-08-13T04:00:00.000Z",
    reading: { shape: [{ heading: "A working guess", paragraphs: ["Newest."] }] },
  };
  const staleServer = {
    updatedAt: "2026-08-01T04:00:00.000Z",
    reading: { shape: [{ heading: "An older guess", paragraphs: ["Older."] }] },
  };

  const merged = buildAthenaReading(mergeAthenaMemory(phone, staleServer));

  assert.equal(merged.editions.length, 2);
  assert.deepEqual(
    merged.editions.map((edition) => edition.pages.shape[0].heading),
    ["A working guess", "An older guess"],
  );
});

test("only authored prose is published, never the derived fallback", () => {
  const reading = buildAthenaReading({
    updatedAt: "2026-08-13T04:00:00.000Z",
    rhythms: [{ id: "r1", statement: "You walked on 13 of 14 days." }],
  });

  // The page still reads, so the tab is never blank.
  assert.equal(reading.pages.days[0].authored, false);
  // But nothing was written, so there is no edition to claim as new.
  assert.equal(reading.editions.length, 0);
  assert.equal(reading.latestEditionId, null);
});

test("the phone carries a bounded archive, newest first", () => {
  const memory = {
    updatedAt: "2026-08-13T04:00:00.000Z",
    editions: Array.from({ length: ATHENA_EDITION_LIMIT + 20 }, (_, index) => ({
      id: `edition-${index}`,
      publishedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      days: [{ heading: `Day ${index}`, paragraphs: ["words"] }],
    })),
  };

  const reading = buildAthenaReading(memory);

  assert.equal(reading.editions.length, ATHENA_EDITION_LIMIT);
  assert.equal(reading.editions[0].pages.days[0].heading, `Day ${ATHENA_EDITION_LIMIT + 19}`);
});

test("captures a clearly named watched film without interpreting personality", () => {
  const memory = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-1",
    sourceType: "thought",
    capturedAt: at,
    text: "I watched Perfect Days. I loved how calm and small his life felt.",
  });
  assert.equal(memory.ledger.length, 1);
  assert.equal(memory.ledger[0].kind, "film");
  assert.equal(memory.ledger[0].label, "Perfect Days");
  assert.equal(memory.ledger[0].state, "watched");
  assert.deepEqual(memory.ledger[0].sourceRefs.map((ref) => ref.sourceId), ["thought-1"]);
  assert.equal(memory.portrait.length, 0);
  assert.equal(memory.tastes.length, 0);
});

test("does not guess a title from vague movie or plot language", () => {
  assert.deepEqual(extractAthenaFacts({
    sourceId: "thought-2",
    capturedAt: at,
    text: "I watched this movie and it was about a lonely driver.",
  }), []);
  assert.deepEqual(extractAthenaFacts({
    sourceId: "thought-3",
    capturedAt: at,
    text: "The movie was about a lonely driver who found a friend.",
  }), []);
});

test("marks gibberish as low signal but keeps it represented as raw evidence", () => {
  assert.equal(isLowSignalText("asdf qwer zxcv"), true);
  const memory = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-test",
    capturedAt: at,
    text: "asdf qwer zxcv",
  });
  assert.equal(memory.ledger.length, 0);
  assert.equal(memory.lowSignalEvidence[0].sourceId, "thought-test");
  assert.ok(memory.processedEvidenceIds.includes("thought-test"));
});

test("merges repeated clear facts and raises evidence without duplicating the fact", () => {
  let first = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-a",
    capturedAt: "2026-08-01T10:00:00.000Z",
    text: "I watched Perfect Days.",
  });
  const second = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-b",
    capturedAt: "2026-08-02T10:00:00.000Z",
    text: "I rewatched Perfect Days.",
  });
  first = mergeAthenaMemory(first, second);
  assert.equal(first.ledger.length, 1);
  assert.equal(first.ledger[0].stability, "emerging");
  assert.equal(first.ledger[0].firstSeenAt, "2026-08-01T10:00:00.000Z");
  assert.equal(first.ledger[0].lastSeenAt, "2026-08-02T10:00:00.000Z");
  assert.deepEqual(
    first.ledger[0].sourceRefs.map((ref) => ref.sourceId).sort(),
    ["thought-a", "thought-b"],
  );
});

test("forgetting removes only the selected evidence and exclusively derived facts", () => {
  let memory = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-a",
    capturedAt: at,
    text: "I watched Perfect Days.",
  });
  memory = mergeAthenaMemory(memory, captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-b",
    capturedAt: "2026-08-04T06:15:00.000Z",
    text: "I rewatched Perfect Days.",
  }));
  memory = forgetAthenaEvidence(memory, "thought-a");
  assert.equal(memory.ledger.length, 1);
  assert.deepEqual(memory.ledger[0].sourceRefs.map((ref) => ref.sourceId), ["thought-b"]);
  memory = forgetAthenaEvidence(memory, "thought-b");
  assert.equal(memory.ledger.length, 0);
});

test("a correction can suppress an interpretation without deleting raw evidence", () => {
  const memory = suppressAthenaObservation({
    ...createAthenaMemory(),
    portrait: [{
      id: "portrait-1",
      statement: "Quiet places may matter right now.",
      confidence: 0.55,
      stability: "emerging",
      sourceRefs: [{ sourceId: "thought-1", sourceType: "thought", capturedAt: at }],
      firstSeenAt: at,
      lastSeenAt: at,
      status: "active",
    }],
  }, "portrait-1", "That is wrong.");
  assert.equal(memory.portrait[0].status, "suppressed");
  assert.equal(memory.portrait[0].sourceRefs[0].sourceId, "thought-1");
  assert.equal(memory.corrections[0].action, "suppress");
});

test("writes a readable, source-counted Obsidian projection", () => {
  const memory = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-1",
    capturedAt: at,
    text: "I finished reading Four Thousand Weeks.",
  });
  const markdown = serializeAthenaMemoryMarkdown(memory, "p_test");
  assert.match(markdown, /# Athena Memory/);
  assert.match(markdown, /book: Four Thousand Weeks — read \(1 source\)/);
  assert.match(markdown, /profile_id: p_test/);
});

test("recalls only active ledger facts of the requested kind", () => {
  const memory = captureAthenaThought(createAthenaMemory(), {
    sourceId: "thought-film",
    capturedAt: at,
    text: "I watched Perfect Days.",
  });
  assert.deepEqual(recallAthenaLedger(memory, "film").map((item) => item.label), [
    "Perfect Days",
  ]);
  assert.deepEqual(recallAthenaLedger(memory, "book"), []);
});
