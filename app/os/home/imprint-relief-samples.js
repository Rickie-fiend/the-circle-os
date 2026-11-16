import { loopImprintSamples } from "./imprint-loop-samples.js";
import { createReliefImprintRecipe } from "./imprint-relief-recipe.js";

export const reliefImprintSamples = loopImprintSamples.map(sample => structuredClone(sample));

// Select by family before inspecting any geometry; never discard a failed shape.
export async function reliefValidationSamples() {
  const counts = { sweep: 0, return: 0, curl: 0 }, samples = [];
  for (let index = 0; Object.values(counts).some(count => count < 10); index++) {
    if (index >= 500) throw new Error("The fixed validation population did not cover every family.");
    const sample = structuredClone(loopImprintSamples[index % loopImprintSamples.length]);
    sample.id = `case-${String(index).padStart(3, "0")}`;
    sample.label = `Fictional case ${index}`;
    sample.input.name = index % 2 ? `Synthetic ${index}` : `စမ်းသပ် ${index}`;
    if (index % 3 === 0) sample.input.answers.pastEffort = { kind: "nothing-comes-to-mind", items: [] };
    if (index % 4 === 0) {
      sample.input.answers.wantedChanges = [{ choice: "not-sure-yet", detail: "" }];
      sample.input.answers.primaryFocus = "not-sure-yet";
    }
    if (index % 5 === 0) sample.input.answers.habit.wording = "တစ်မျက်နှာ ဖတ်ပါ";
    const recipe = await createReliefImprintRecipe(sample.input), family = recipe.course.family;
    if (counts[family] === 10) continue;
    counts[family]++;
    samples.push({ ...sample, family });
  }
  return samples;
}
