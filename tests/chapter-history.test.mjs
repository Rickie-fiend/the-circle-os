import assert from "node:assert/strict";
import test from "node:test";
import { chapterHistory } from "../app/os/chapter-history.js";

const definition = { id: "old", version: 1, title: "Original chapter", pages: [{ id: "q", answerKey: "q", question: "Original question?" }] };
const answer = { pageId: "q", answerKey: "q", questionSnapshot: "Saved question?", displaySnapshot: "Saved choice label", value: "choice-id", answeredAt: "2020-01-01T01:00:00Z", changedAt: "2020-01-01T01:00:00Z" };
const run = { runId: "old@1", chapterId: "old", chapterVersion: 1, status: "completed", completedAt: "2020-01-01T01:00:00Z", answers: [answer] };

test("completed answer-bearing runs stay separate, newest first, without changing their source", () => {
  const runs = { "old@1": run, "old@1:repeat": { ...run, runId: "old@1:repeat", completedAt: "2020-02-01T01:00:00Z" }, draft: { ...run, status: "in-progress" }, empty: { ...run, answers: [] } };
  const before = structuredClone(runs), result = chapterHistory(runs, [definition]);
  assert.deepEqual(result.map(item => item.id), ["old@1:repeat", "old@1"]);
  assert.equal(result[0].answers[0].text, "Saved choice label");
  result[0].answers[0].text = "Read model mutation"; assert.deepEqual(runs, before);
});

test("saved question snapshots win; fallback uses only the exact original version", () => {
  assert.equal(chapterHistory({ x: run }, [definition])[0].answers[0].question, "Saved question?");
  const legacy = { ...run, answers: [{ ...answer, questionSnapshot: undefined }] };
  assert.equal(chapterHistory({ x: legacy }, [definition])[0].answers[0].question, "Original question?");
  const newer = { ...definition, version: 2, pages: [{ ...definition.pages[0], question: "Newer question?" }] };
  const result = chapterHistory({ x: legacy }, [newer])[0];
  assert.equal(result.title, "Chapter title unavailable"); assert.equal(result.answers[0].question, "Original question unavailable"); assert.equal(result.answers[0].text, "Saved choice label");
});

test("ambiguous original definitions never supply guessed questions", () => {
  const legacy = { ...run, answers: [{ ...answer, questionSnapshot: undefined }] };
  assert.equal(chapterHistory({ x: legacy }, [definition, { ...definition, title: "Conflicting title" }])[0].answers[0].question, "Original question unavailable");
  assert.equal(chapterHistory({ x: legacy }, [definition, structuredClone(definition)])[0].title, "Original chapter");
});

test("false, zero, arrays, blank answers and unknown completion dates remain honest", () => {
  const result = chapterHistory({ x: { ...run, completedAt: null, answers: [false, 0, ["a", "b"], ""].map((value, i) => ({ ...answer, pageId: "p"+i, answerKey: "k"+i, displaySnapshot: "", value })) } }, [definition])[0];
  assert.deepEqual(result.answers.map(item => item.text), ["false", "0", "a, b", ""]); assert.equal(result.completedAt, null);
  assert.deepEqual(chapterHistory({}, []), []);
});
