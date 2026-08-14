import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { readProfileChapterPublications } from "../local-ai/server.mjs";
import {
  HOURLY_CHAPTER_BUDGET,
  scheduleChapters,
} from "../app/os/chapters/chapter-scheduler.js";

const PROFILE_ID = "p_1234567890abcdef";

function dateKeyInBangkok(value = new Date()) {
  return new Date(value.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function moveDate(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function dailySource(dateKey, question = "What was different about that day?") {
  return `---
type: circle-os-daily-chapters
profile_id: ${PROFILE_ID}
date: ${dateKey}
created: ${dateKey}T06:15:00+07:00
---

# Daily Chapters

## Morning

Purpose: Help you notice one real change.

### Page 1
Type: single-choice
Question or Information: ${question}
Answer: morning-change
Options:
- yes | Something changed
- no | It felt the same

## Night

Purpose: Help you keep one real moment.

### Page 1
Type: short-text
Question or Information: What happened in that moment?
Answer: night-moment
`;
}

function budgetChapter(id) {
  return {
    schemaVersion: 1,
    id,
    version: 1,
    status: "published",
    session: "check-in",
    app: "note",
    theme: "light",
    title: id,
    purpose: id,
    estimatedMinutes: 1,
    pages: [
      { id: "cover", type: "cover", title: id },
      { id: "complete", type: "result", title: "Done" },
    ],
  };
}

test("the private daily deck hashes rewrites, expires stale plans, and keeps the hourly budget", () => {
  const vaultPath = mkdtempSync(join(tmpdir(), "circle-os-daily-deck-"));
  const profilePath = join(vaultPath, "Profiles", PROFILE_ID);
  const dailyPath = join(profilePath, "Daily Chapters.md");
  mkdirSync(profilePath, { recursive: true });
  const today = dateKeyInBangkok();

  try {
    writeFileSync(dailyPath, dailySource(today), "utf8");
    const first = readProfileChapterPublications(vaultPath, PROFILE_ID);
    assert.equal(first.length, 2);
    assert.deepEqual(first.map((item) => item.chapter.id), [
      "athena-daily-morning",
      "athena-daily-night",
    ]);
    assert.ok(first.every((item) => item.visibility === "private"));
    assert.ok(first.every((item) => item.audienceProfileId === PROFILE_ID));
    assert.ok(first.every((item) => item.source === "athena"));
    assert.ok(first.every((item) => item.delivery === "on-view"));
    assert.ok(first.every((item) => !("cooldownDays" in item.chapter)));
    assert.equal(first[0].chapter.earliestAt, `${today}T06:00:00+07:00`);
    assert.equal(first[1].chapter.earliestAt, `${today}T18:00:00+07:00`);
    assert.equal(
      first[0].chapter.expiresAt,
      `${moveDate(today, 2)}T06:00:00+07:00`,
    );

    const firstSource = readFileSync(dailyPath, "utf8");
    const rewrittenSource = dailySource(
      today,
      "What changed when you tried again?",
    );
    writeFileSync(
      dailyPath,
      rewrittenSource,
      "utf8",
    );
    const rewritten = readProfileChapterPublications(vaultPath, PROFILE_ID);
    assert.equal(rewritten[0].chapter.id, first[0].chapter.id);
    assert.notEqual(rewritten[0].chapter.version, first[0].chapter.version);
    assert.equal(
      first[0].chapter.pages[1].question,
      "What was different about that day?",
    );
    assert.equal(readFileSync(dailyPath, "utf8"), rewrittenSource);
    assert.notEqual(readFileSync(dailyPath, "utf8"), firstSource);

    const existing = Array.from({ length: HOURLY_CHAPTER_BUDGET }, (_, index) =>
      budgetChapter(`already-started-${index + 1}`),
    );
    const now = new Date(`${today}T19:00:00+07:00`);
    const runs = Object.fromEntries(
      existing.map((chapter) => [
        `${chapter.id}@${chapter.version}`,
        {
          status: "in-progress",
          startedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ]),
    );
    assert.deepEqual(
      scheduleChapters(
        [...existing, ...rewritten.map((item) => item.chapter)],
        runs,
        { now },
      ).filter((chapter) => chapter.id.startsWith("athena-daily-")),
      [],
    );

    writeFileSync(dailyPath, dailySource(moveDate(today, -3)), "utf8");
    assert.deepEqual(
      readProfileChapterPublications(vaultPath, PROFILE_ID),
      [],
    );
  } finally {
    rmSync(vaultPath, { recursive: true, force: true });
  }
});
