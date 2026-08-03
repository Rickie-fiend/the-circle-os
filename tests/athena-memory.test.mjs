import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAthenaReading,
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

const at = "2026-08-03T06:15:00.000Z";

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
