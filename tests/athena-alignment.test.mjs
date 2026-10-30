import assert from "node:assert/strict";
import test from "node:test";

import {
  alignChain,
  latestDeclaration,
  readChain,
  serializeAlignmentMarkdown,
} from "../app/os/athena-alignment-model.js";
import { priceDays } from "../app/os/athena-pricing-model.js";
import {
  mergeAthenaMemory,
  normalizeAthenaMemory,
  serializeAthenaMemoryMarkdown,
} from "../app/os/athena-memory-model.js";

const state = (parts = {}) => ({
  habits: { identity: { text: "" }, definitions: {}, completions: {} },
  protocol: { runs: {} },
  goals: { items: {}, steps: {} },
  tasks: { items: {} },
  declarations: { records: {} },
  ...parts,
});

const days = (list) =>
  list.map(([date, blocks]) => ({
    date,
    timeBlocks: blocks.map(([start, end, activity]) => ({ start, end, activity })),
  }));

test("habits are read from definitions, and only the active ones", () => {
  const chain = readChain(
    state({
      habits: {
        identity: { text: "Being a Leader" },
        definitions: {
          a: { id: "a", status: "active", action: "Speak 1 min", identity: "I am a speaker" },
          b: { id: "b", status: "archived", action: "Old thing", identity: "" },
          c: { id: "c", status: "active", action: "", identity: "" },
        },
      },
    }),
  );
  assert.equal(chain.habits.length, 1);
  assert.equal(chain.habits[0].text, "Speak 1 min");
});

test("a habit is categorised by what it is, not by the cue that triggers it", () => {
  const chain = readChain(
    state({
      habits: {
        identity: { text: "x" },
        definitions: {
          a: {
            id: "a",
            status: "active",
            action: "Write 1 thing down after making coffee",
            identity: "I am self-aware",
          },
        },
      },
    }),
  );
  // "after making coffee" is when, not what. Filing this under meals was wrong.
  assert.equal(chain.habits[0].category, "stillness");
});

test("declared character leads the chain before Routine identity and Mission fallbacks", () => {
  const declared = readChain(
    state({
      habits: { identity: { text: "Being a Leader" }, definitions: {} },
      declarations: {
        records: {
          c: {
            id: "c",
            kind: "character",
            content: { mind: "Clear thinker", social: "Warm with people" },
            declaredAt: "2026-08-16",
          },
          m: {
            id: "m",
            kind: "missionStatement",
            content: { statement: "Live with kindness." },
            declaredAt: "2026-08-15",
          },
        },
      },
    }),
  );
  assert.equal(declared.character.text, "Mind: Clear thinker · Social: Warm with people");
  assert.equal(declared.character.source, "character");
  assert.equal(declared.character.standIn, false);

  const withHabit = readChain(state({ habits: { identity: { text: "Being a Leader" }, definitions: {} } }));
  assert.equal(withHabit.character.text, "Being a Leader");
  assert.equal(withHabit.character.source, "habit-identity");
  assert.equal(withHabit.character.standIn, true);

  const withMission = readChain(
    state({
      declarations: {
        records: {
          m: {
            id: "m",
            kind: "missionStatement",
            content: { statement: "Live with kindness." },
            declaredAt: "2026-08-15",
          },
        },
      },
    }),
  );
  assert.equal(withMission.character.source, "missionStatement");
  assert.equal(withMission.character.standIn, true);

  assert.equal(readChain(state()).character, null);
});

test("the newest unsuperseded Character is authoritative", () => {
  const chain = readChain(state({
    declarations: {
      records: {
        old: {
          id: "old", kind: "character", content: { mind: "Old words" },
          declaredAt: "2026-08-14",
        },
        current: {
          id: "current", kind: "character", content: { body: "Strong and rested" },
          declaredAt: "2026-08-15", supersedesId: "old",
        },
      },
    },
  }));
  assert.equal(chain.character.text, "Body: Strong and rested");
  assert.equal(chain.character.declaredAt, "2026-08-15");
  assert.equal(chain.character.standIn, false);
});

test("a week goal with no steps is a wish, and no goal at all is its own break", () => {
  const uncut = alignChain(
    readChain(
      state({
        goals: {
          items: { g: { id: "g", scope: "week", dateKey: "2026-W36", text: "Ship the deck" } },
          steps: {},
        },
      }),
    ),
    null,
  );
  assert.ok(uncut.breaks.some((b) => b.kind === "uncut"));

  const none = alignChain(readChain(state()), null);
  assert.ok(none.breaks.some((b) => b.kind === "absent"));
});

test("a step joins its goal to a Routine task, so the chain holds", () => {
  const chain = readChain(
    state({
      goals: {
        items: { g: { id: "g", scope: "week", dateKey: "2026-W36", text: "Ship the deck" } },
        steps: { s: { id: "s", goalId: "g", taskId: "t", dateKey: "2026-09-06" } },
      },
      tasks: { items: { t: { id: "t", text: "Write one line", status: "open" } } },
    }),
  );
  const alignment = alignChain(chain, null);
  assert.ok(!alignment.breaks.some((b) => b.kind === "uncut"));
  assert.ok(!alignment.breaks.some((b) => b.kind === "unlinked"));
});

test("only open tasks can be adrift; a completed one is history", () => {
  const chain = readChain(
    state({ tasks: { items: { t: { id: "t", text: "Eat healthy", status: "completed" } } } }),
  );
  assert.equal(chain.tasks.length, 0);
  assert.ok(!alignChain(chain, null).breaks.some((b) => b.kind === "unlinked"));
});

test("an ended protocol claims no hours and is not asked to serve a goal", () => {
  const chain = readChain(
    state({
      protocol: {
        runs: {
          r: {
            id: "r",
            name: "Monk Mode",
            status: "ended",
            goalId: null,
            items: { i: { id: "i", text: "Read 1 chapter", status: "active" } },
          },
        },
      },
    }),
  );
  const pricing = priceDays(days([["2026-09-01", [["09:00", "10:00", "Read a book"]]]]));
  const alignment = alignChain(chain, pricing);

  assert.ok(!alignment.breaks.some((b) => b.level === "protocol"));
  assert.ok(
    alignment.unclaimed.some((item) => item.id === "reading"),
    "an ended protocol must not keep claiming reading hours",
  );
});

test("a term that forbids a thing never claims the hours of that thing", () => {
  const chain = readChain(
    state({
      protocol: {
        runs: {
          r: {
            id: "r",
            name: "Reset",
            status: "open",
            goalId: "g",
            items: { i: { id: "i", text: "No smoking", status: "active" } },
          },
        },
      },
    }),
  );
  const pricing = priceDays(days([["2026-09-01", [["19:00", "20:00", "Smoke"]]]]));
  const alignment = alignChain(chain, pricing);

  assert.ok(
    alignment.unclaimed.some((item) => item.id === "smoking"),
    "'No smoking' must not claim the smoking hours it forbids",
  );
});

test("sleep, meals and upkeep are never counted as unclaimed", () => {
  const pricing = priceDays(
    days([
      [
        "2026-09-01",
        [
          ["08:00", "09:00", "Sleep"],
          ["12:00", "13:00", "Lunch"],
          ["13:00", "14:00", "Shower"],
          ["19:00", "20:00", "Walk"],
        ],
      ],
    ]),
  );
  const ids = alignChain(readChain(state()), pricing).unclaimed.map((item) => item.id);
  assert.deepEqual(ids, ["walking"]);
});

test("memory carries the chain and a phone sync cannot erase it", () => {
  const alignment = alignChain(readChain(state({ habits: { identity: { text: "Being a Leader" }, definitions: {} } })), null);
  const memory = normalizeAthenaMemory({ updatedAt: "2026-09-06T06:00:00.000Z", alignment });

  assert.equal(memory.alignment.levels.character, true);
  assert.match(serializeAthenaMemoryMarkdown(memory, "p_test"), /The chain of why/);

  const merged = mergeAthenaMemory(memory, { updatedAt: "2026-09-07T06:00:00.000Z" });
  assert.equal(merged.alignment.levels.character, true);
});

test("serialized alignment distinguishes declared Character from a fallback", () => {
  const declared = alignChain(readChain(state({
    declarations: {
      records: {
        c: {
          id: "c", kind: "character", content: { spirit: "Calm" },
          declaredAt: "2026-08-15",
        },
      },
    },
  })), null);
  assert.match(serializeAlignmentMarkdown(declared), /Spirit: Calm \(declared character\)/);
  assert.doesNotMatch(serializeAlignmentMarkdown(declared), /stand-in/);
  assert.match(
    serializeAthenaMemoryMarkdown(
      normalizeAthenaMemory({ updatedAt: "2026-09-06T06:00:00.000Z", alignment: declared }),
      "p_test",
    ),
    /Spirit: Calm \(declared character\)/,
  );

  const fallback = alignChain(readChain(state({
    habits: { identity: { text: "Builder" }, definitions: {} },
  })), null);
  assert.match(serializeAlignmentMarkdown(fallback), /Builder \(stand-in, from habit-identity\)/);

  const legacyFallback = { ...fallback, characterStandIn: undefined };
  assert.match(
    serializeAlignmentMarkdown(legacyFallback),
    /Builder \(stand-in, from habit-identity\)/,
  );
  assert.match(
    serializeAthenaMemoryMarkdown(
      normalizeAthenaMemory({
        updatedAt: "2026-09-06T06:00:00.000Z",
        alignment: legacyFallback,
      }),
      "p_test",
    ),
    /Builder \(stand-in, from habit-identity\)/,
  );
});

test("the newest declaration wins and superseded ones are not read", () => {
  const withBoth = state({
    declarations: {
      records: {
        old: { id: "old", kind: "vision", content: { life: "old" }, declaredAt: "2026-08-14" },
        new: {
          id: "new",
          kind: "vision",
          content: { life: "new" },
          declaredAt: "2026-08-15",
          supersedesId: "old",
        },
      },
    },
  });
  assert.equal(latestDeclaration(withBoth, "vision").content.life, "new");
  assert.equal(latestDeclaration(withBoth, "missionStatement"), null);
});

test("an empty profile reads as a chain with nothing in it, not an error", () => {
  const alignment = alignChain(readChain({}), null);
  assert.equal(alignment.levels.habits, 0);
  assert.match(serializeAlignmentMarkdown(alignment), /not named/);
});
