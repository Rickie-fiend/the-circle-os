// The Thoughts box used to say "What are your thoughts?" every time, which is a
// closed door with a label on it. These rotate by the hour, so opening the app
// four times in a day is four different invitations. Deep Thoughts asks for
// effort; this one must never feel like work.

export const THOUGHT_PROMPTS = Object.freeze([
  "Say it badly. Nobody is marking it.",
  "Beautiful day?",
  "What is taking up the most room in your head?",
  "Anything you have not said out loud yet?",
  "Send your thoughts here.",
  "What are you avoiding?",
  "Something small that happened.",
  "What is funny right now?",
  "The unedited version.",
  "What do you keep coming back to?",
  "Anything annoying you?",
  "One sentence about right now.",
  "What would you tell a friend about today?",
  "Something you noticed.",
  "What is the feeling, before you explain it?",
  "Type the thing you almost typed.",
  "What is going well?",
  "Say the petty thing.",
  "What are you looking forward to?",
  "Nothing important. Just a thought.",
  "What is on your mind this hour?",
  "Something true, however small.",
  "What surprised you?",
  "Anything you want to remember about today?",
]);

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function short(value, maximum = 48) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > maximum ? "" : clean;
}

// An identity is stored the way it is shown elsewhere, capitalised: "A person
// who builds in the morning". Dropped into the middle of a sentence that reads
// as "would A person", so an opening article is lowered. Anything else may be a
// name and is left exactly as the person wrote it.
function midSentence(value) {
  return /^(a|an|the) /i.test(value)
    ? value[0].toLowerCase() + value.slice(1)
    : value;
}

// A prompt that names today's own mission or identity beats a generic one, so
// those go first when they exist and are short enough to read as a placeholder.
function personalPrompts(state, dateKey) {
  const prompts = [];
  const identity = short(state?.profile?.identityFocus);
  const mission = short(state?.days?.[dateKey]?.mission?.text);
  if (identity && identity.toLowerCase() !== "yourself") {
    prompts.push(`What would ${midSentence(identity)} say about today?`);
  }
  if (mission && mission !== "Do one small thing that feels like you.") {
    prompts.push(`How did "${mission}" actually go?`);
  }
  return prompts;
}

export function selectThoughtPrompt(state, dateKey, now = new Date()) {
  const moment = now instanceof Date ? now : new Date(now);
  const hour = Number.isNaN(moment.getTime()) ? 0 : moment.getHours();
  const personal = personalPrompts(state, dateKey);
  const pool = [...personal, ...THOUGHT_PROMPTS];
  // Hashing the day with the hour keeps one prompt still for a whole hour, and
  // stops the same hour of every day showing the same line.
  return pool[hashText(`${dateKey}:${hour}`) % pool.length];
}
