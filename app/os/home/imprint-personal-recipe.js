// Bounded prototype only. These inputs are supplied explicitly, never read from a profile.
export const PERSONAL_IMPRINT_BASE_HASH = "b9b45f97d25edc1562f4be6e715a3f075b980ee329801db43f5ff16c9310e289";
export const PERSONAL_IMPRINT_LIMITS = Object.freeze({ width: .06, balance: .04, bend: 24, lean: .025, height: .06, spacing: 18, depth: .08, phase: Math.PI * 2 });

export class ImprintInputError extends Error {
  constructor(field, message) { super(message); this.name = "ImprintInputError"; this.field = field; }
}

function text(value, field, optional = false) {
  const result = typeof value === "string" ? value.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase() : "";
  if (!result && !optional) throw new ImprintInputError(field, `Add ${field} to make the sample form.`);
  return result;
}

function choices(value, field) {
  if (!Array.isArray(value) || !value.length) throw new ImprintInputError(field, `Choose ${field} to make the sample form.`);
  return [...new Set(value.map(item => text(item, field)))].sort();
}

const ordered = values => values.map(value => JSON.stringify(value)).sort().map(value => JSON.parse(value));

export function normalizePersonalImprintInput(input) {
  const name = text(input?.name, "a name"), birthday = text(input?.birthday, "a birthday");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? new Date(`${birthday}T00:00:00Z`) : null;
  if (!date || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== birthday || birthday.startsWith("0000")) throw new ImprintInputError("birthday", "Use a real birthday in YYYY-MM-DD form.");
  const answers = input?.answers || {}, pastEffort = answers.pastEffort;
  if (!["reported", "nothing-comes-to-mind"].includes(pastEffort?.kind)) throw new ImprintInputError("past experiences", "Choose reported experiences or Nothing comes to mind.");
  const items = pastEffort.items ?? [];
  if (!Array.isArray(items) || (pastEffort.kind === "reported" ? !items.length : items.length > 0)) throw new ImprintInputError("past experiences", "Use the experiences you supplied, or Nothing comes to mind.");
  const experiences = ordered(items.map(item => {
    const status = text(item?.status, "experience status");
    if (!["still-doing", "finished", "stopped"].includes(status)) throw new ImprintInputError("experience status", "Choose Still doing it, Finished or Stopped.");
    return { category: text(item.category, "experience category"), description: text(item.description, "experience description"), status };
  }));
  if (!Array.isArray(answers.wantedChanges) || !answers.wantedChanges.length) throw new ImprintInputError("wanted changes", "Choose a wanted change or Not sure yet.");
  const wantedChanges = ordered([...new Map(answers.wantedChanges.map(item => {
    const value = { choice: text(item?.choice, "wanted change"), detail: text(item?.detail, "wanted change detail", true) };
    return [JSON.stringify(value), value];
  })).values()]);
  let primaryFocus = text(answers.primaryFocus, "primary focus", true);
  if (wantedChanges.length === 1) primaryFocus = wantedChanges[0].choice;
  if (!wantedChanges.some(item => item.choice === primaryFocus)) throw new ImprintInputError("primary focus", "Choose a focus from your wanted changes.");
  const time = (value, field) => {
    const result = text(value, field);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(result)) throw new ImprintInputError(field, `Use a real ${field} in HH:MM form.`);
    return result;
  };
  const habit = answers.habit;
  const kind = text(habit?.kind, "habit start or keep choice");
  if (!["start", "keep"].includes(kind)) throw new ImprintInputError("habit", "Choose Start or Keep for the sample habit.");
  return {
    name, birthday,
    situations: choices(answers.situations, "current situations"), lifeNow: text(answers.lifeNow, "life right now"),
    pastEffort: { kind: pastEffort.kind, items: experiences }, wantedChanges, primaryFocus,
    wake: time(answers.wake, "wake-up time"), bed: time(answers.bed, "bedtime"),
    habit: { kind, wording: text(habit.wording, "habit wording"), cue: { choice: text(habit.cue?.choice, "habit cue"), detail: text(habit.cue?.detail, "habit cue detail", true) } },
  };
}

export async function createPersonalImprintRecipe(input) {
  const normalized = normalizePersonalImprintInput(input);
  const bytes = new TextEncoder().encode(JSON.stringify(normalized));
  const digest = new DataView(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  const limits = PERSONAL_IMPRINT_LIMITS, parameters = {};
  for (const [index, key] of Object.keys(limits).entries()) {
    const value = digest.getUint32(index * 4, false) / 0xffffffff;
    parameters[key] = Number((key === "phase" ? value * limits[key] : (value * 2 - 1) * limits[key]).toFixed(8));
  }
  // No source text, birthday or input digest is retained in a drawing recipe.
  return Object.freeze({ version: 1, normalizationVersion: 1, baseGeometryHash: PERSONAL_IMPRINT_BASE_HASH, parameters: Object.freeze(parameters) });
}

export function validatePersonalImprintRecipe(recipe) {
  if (recipe?.version !== 1 || recipe.normalizationVersion !== 1 || recipe.baseGeometryHash !== PERSONAL_IMPRINT_BASE_HASH) throw new Error("This sample recipe needs its original supported base and version.");
  if (Object.keys(recipe).sort().join() !== "baseGeometryHash,normalizationVersion,parameters,version") throw new Error("A sample drawing recipe may contain only its version, base and numeric parameters.");
  if (Object.keys(recipe.parameters ?? {}).sort().join() !== Object.keys(PERSONAL_IMPRINT_LIMITS).sort().join()) throw new Error("The sample shape controls are incomplete.");
  for (const [key, limit] of Object.entries(PERSONAL_IMPRINT_LIMITS)) {
    const value = recipe.parameters[key];
    if (!Number.isFinite(value) || Math.abs(value) > limit + 1e-8 || key === "phase" && value < 0) throw new Error("The sample shape is outside its approved variation limits.");
  }
  return recipe;
}

export async function retainPersonalImprintRecipe(existing, input) {
  return existing == null ? createPersonalImprintRecipe(input) : validatePersonalImprintRecipe(existing);
}
