// Entirely fictional review fixtures. No account/profile access.
export const personalImprintSamples = [
  { id: "mira", label: "Mira", description: "An uncertain starting point", input: {
    name: "Mira", birthday: "2002-04-17", answers: {
      situations: ["looking-for-work"], lifeNow: "not-sure-yet", pastEffort: { kind: "nothing-comes-to-mind", items: [] },
      wantedChanges: [{ choice: "not-sure-yet" }], wake: "08:00", bed: "23:30",
      habit: { kind: "start", wording: "Take a short walk", cue: { choice: "after-lunch" } },
    },
  } },
  { id: "arun", label: "Arun", description: "Several reported experiences", input: {
    name: "Arun", birthday: "1989-11-06", answers: {
      situations: ["working-for-someone", "caring-for-family"], lifeNow: "working-toward-something",
      pastEffort: { kind: "reported", items: [
        { category: "learning", description: "Learning to draw", status: "still-doing" },
        { category: "making", description: "Made a small photo book", status: "finished" },
        { category: "exercise", description: "Tried swimming lessons", status: "stopped" },
      ] },
      wantedChanges: [{ choice: "learn", detail: "Drawing people" }, { choice: "relationships" }], primaryFocus: "learn", wake: "06:30", bed: "22:30",
      habit: { kind: "keep", wording: "Read one page", cue: { choice: "before-bed" } },
    },
  } },
  { id: "lin", label: "Lin", description: "A different daily rhythm", input: {
    name: "Lin", birthday: "1996-07-23", answers: {
      situations: ["studying", "working-for-myself"], lifeNow: "starting-again",
      pastEffort: { kind: "reported", items: [{ category: "helping", description: "Helped a neighbour learn to read", status: "finished" }] },
      wantedChanges: [{ choice: "work-toward", detail: "Make a short film" }], wake: "09:00", bed: "01:00",
      habit: { kind: "start", wording: "Do a few push-ups", cue: { choice: "another-time", detail: "After I get home" } },
    },
  } },
];

export function reorderSampleInput(input) {
  const value = structuredClone(input);
  value.answers.situations.reverse();
  value.answers.pastEffort.items?.reverse();
  value.answers.wantedChanges.reverse();
  return value;
}

export function correctedSampleInput(input) {
  const value = structuredClone(input);
  value.name = `${value.name} corrected`;
  value.birthday = "1990-01-01";
  value.answers.habit.wording = "A corrected habit";
  return value;
}
