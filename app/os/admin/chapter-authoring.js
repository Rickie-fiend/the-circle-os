import { chapterCompletion } from "../chapters/chapter-capabilities.js";
import { chapterApp, chapterKind } from "../chapters/chapter-scheduler.js";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const CHAPTER_PAGE_TYPES = [
  "cover",
  "info",
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
  "confirm",
  "result",
  "idle",
];

/**
 * The category that marks a chapter as an App's first-use setup.
 *
 * Publishing a draft in this category makes it the App's setup chapter rather
 * than an ordinary delivery, so it stands in place of the compiled one and
 * finishing it seals that setup.
 */
export const FIRST_USE_CATEGORY = "First Time Use";

export const CHAPTER_CLASSIFICATIONS = [
  "Foundation",
  "Short",
  "Guided Learning",
  "Reflection",
  "Information",
];

export const FIRST_USE_APP_SPACES = [
  "check-in",
  "habit",
  "log",
  "thoughts",
  "vision",
  "reflection",
];

export function chapterSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function createChapterPage(type, index = 0) {
  const page = {
    id: `${type}-${index + 1}`,
    type,
    title: "Edit Here",
    body: "",
    button: type === "cover" ? "Begin" : "Continue",
  };
  if (["single-choice", "multi-choice", "yes-no", "slider", "short-text", "long-text", "time"].includes(type)) {
    page.question = "Edit Here";
    page.answerKey = `${type}-answer-${index + 1}`;
    page.required = true;
  }
  if (["single-choice", "multi-choice"].includes(type)) {
    page.options = [
      { id: "option-one", label: "Option one" },
      { id: "option-two", label: "Option two" },
    ];
  }
  if (type === "slider") {
    page.min = 1;
    page.max = 5;
    page.minLabel = "Low";
    page.maxLabel = "High";
  }
  if (["short-text", "long-text"].includes(type)) page.placeholder = "Edit Here";
  if (type === "idle") page.button = "";
  return page;
}

export function createChapterDraft(now = new Date().toISOString()) {
  return {
    draftId: `draft-${Date.now()}`,
    workflowStatus: "draft",
    category: "Personal Growth",
    classification: "Foundation",
    tags: [],
    appSpaces: ["thoughts"],
    authorNotes: [],
    updatedAt: now,
    chapter: {
      schemaVersion: 1,
      id: "untitled-chapter",
      version: 1,
      status: "published",
      session: "check-in",
      app: "thoughts",
      kind: "check-in",
      completion: "swipe",
      /* The default is the one the App actually uses.
       *
       * Every chapter in the ladder — day one, the week's setup, the Sunday
       * review, the Log's — is dark, because that is what a chapter given the
       * whole screen looks like here. A blank chapter opened light and had to
       * be changed every time before it looked like anything in the OS. Sai:
       * "the preview template must be the same standard we are using default."
       */
      theme: "dark",
      title: "Untitled chapter",
      purpose: "Describe what this chapter helps the person understand or do.",
      estimatedMinutes: 3,
      showPageNumbers: true,
      pages: [
        {
          ...createChapterPage("cover", 0),
          id: "cover",
          title: "Edit Here",
          body: "",
        },
        {
          ...createChapterPage("info", 1),
          id: "opening",
          title: "Edit Here",
          body: "",
        },
        {
          ...createChapterPage("result", 2),
          id: "complete",
          title: "Edit Here",
          body: "",
          button: "Finish",
        },
      ],
    },
  };
}

const FIRST_USE_STARTERS = {
  "check-in": {
    title: "Your first check-in",
    purpose: "Help a new person pause, name how today feels, and choose what matters now.",
    theme: "light",
    estimatedMinutes: 2,
    pages: [
      { type: "cover", id: "cover", title: "Take one quiet moment.", body: "Notice how today feels before it moves on." },
      { type: "slider", id: "energy", question: "How much energy do you have?", answerKey: "first-energy", min: 1, max: 5, minLabel: "Low", maxLabel: "High", required: true },
      { type: "single-choice", id: "feeling", question: "How does today feel?", answerKey: "first-feeling", options: [{ id: "light", label: "Light" }, { id: "steady", label: "Steady" }, { id: "heavy", label: "Heavy" }], required: true },
      { type: "short-text", id: "focus", question: "What matters most right now?", answerKey: "first-focus", placeholder: "One honest thing", required: true },
      { type: "result", id: "complete", title: "You checked in.", body: "" },
    ],
  },
  habit: {
    title: "Build your first habit",
    purpose: "Turn one meaningful action into a small habit with a clear cue.",
    theme: "orange",
    estimatedMinutes: 3,
    pages: [
      { type: "cover", id: "cover", title: "Start with one small promise.", body: "Choose something that helps you feel like yourself." },
      { type: "short-text", id: "action", question: "What small action do you want to repeat?", answerKey: "habit-action", placeholder: "Walk for ten minutes", required: true },
      { type: "short-text", id: "cue", question: "When or where will you do it?", answerKey: "habit-cue", placeholder: "After breakfast", required: true },
      { type: "short-text", id: "meaning", question: "Why does this matter to you?", answerKey: "habit-meaning", placeholder: "It helps me...", required: true },
      { type: "result", id: "complete", title: "Your habit is ready.", body: "" },
    ],
  },
  log: {
    title: "Set up your day log",
    purpose: "Set the useful edges of a new person's ordinary day log.",
    theme: "dark",
    estimatedMinutes: 2,
    pages: [
      { type: "cover", id: "cover", title: "Make the log fit your life.", body: "Start with the hours your day normally holds." },
      { type: "time", id: "wake", question: "When do you usually wake up?", answerKey: "usual-wake", required: true },
      { type: "time", id: "sleep", question: "When do you usually go to sleep?", answerKey: "usual-sleep", required: true },
      { type: "result", id: "complete", title: "Your day is ready to notice.", body: "" },
    ],
  },
  thoughts: {
    title: "Meet your Thoughts app",
    purpose: "Show a new person that one free thought can become useful evidence without becoming a task.",
    theme: "dark",
    estimatedMinutes: 2,
    pages: [
      { type: "cover", id: "cover", title: "Some things just need somewhere to land.", body: "Thoughts keeps one honest sentence without turning it into homework." },
      { type: "info", id: "privacy", title: "Write what is true now.", body: "A thought becomes part of your private life record. You can keep it short." },
      { type: "long-text", id: "first-thought", question: "What is on your mind?", answerKey: "first-thought", placeholder: "Write freely", required: true },
      { type: "result", id: "complete", title: "Your thought has a place.", body: "" },
    ],
  },
  vision: {
    title: "Begin your Vision",
    purpose: "Help a new person describe one ordinary day in the life they want without forcing certainty.",
    theme: "light",
    estimatedMinutes: 4,
    pages: [
      { type: "cover", id: "cover", title: "Picture an ordinary Tuesday.", body: "Not a perfect day. A day that feels like your life." },
      { type: "long-text", id: "tuesday", question: "What happens from morning to night?", answerKey: "typical-tuesday", placeholder: "I wake up...", required: true },
      { type: "short-text", id: "sign", question: "What small part of that life matters most?", answerKey: "vision-sign", placeholder: "One clear sign", required: true },
      { type: "result", id: "complete", title: "Your Vision has a beginning.", body: "" },
    ],
  },
  reflection: {
    title: "Your first reflection",
    purpose: "Help a new person close the day with one hard thing, one good thing, and no judgment.",
    theme: "light",
    estimatedMinutes: 3,
    pages: [
      { type: "cover", id: "cover", title: "Let the finished day be honest.", body: "You only need to notice what was here." },
      { type: "single-choice", id: "shape", question: "How did today feel overall?", answerKey: "day-shape", options: [{ id: "light", label: "Light" }, { id: "mixed", label: "Mixed" }, { id: "heavy", label: "Heavy" }], required: true },
      { type: "short-text", id: "hard", question: "What felt hard today?", answerKey: "day-hard", placeholder: "One honest thing", required: true },
      { type: "short-text", id: "good", question: "What good thing happened?", answerKey: "day-good", placeholder: "Even something small", required: true },
      { type: "result", id: "complete", title: "Today can rest now.", body: "" },
    ],
  },
};

export function createFirstUseChapterDraft(appSpace, now = new Date().toISOString()) {
  const starter = FIRST_USE_STARTERS[appSpace];
  if (!starter) throw new Error(`Unknown first-use app space: ${appSpace}`);
  const draft = createChapterDraft(now);
  draft.draftId = `starter-${appSpace}-${Date.now()}`;
  draft.category = FIRST_USE_CATEGORY;
  draft.classification = "Foundation";
  draft.tags = ["first-time-use", appSpace];
  const app = ["check-in", "reflection"].includes(appSpace) ? "note" : appSpace;
  draft.appSpaces = [app];
  draft.chapter = {
    schemaVersion: 1,
    id: `first-${appSpace}`,
    version: 1,
    status: "published",
    session: appSpace,
    app,
    kind: appSpace === "habit" ? "lesson" : "check-in",
    completion: "swipe",
    theme: starter.theme,
    title: starter.title,
    purpose: starter.purpose,
    estimatedMinutes: starter.estimatedMinutes,
    pages: starter.pages.map((page, index) => ({
      ...createChapterPage(page.type, index),
      ...structuredClone(page),
    })),
  };
  return draft;
}

export function chapterDefinitionToDraft(chapter, now = new Date().toISOString()) {
  const foundation = ["habit-building", "log-setup"].includes(chapter.id);
  return {
    draftId: `published-${chapter.id}-v${chapter.version}`,
    workflowStatus: "published",
    category: foundation ? FIRST_USE_CATEGORY : "Published Library",
    classification: foundation ? "Foundation" : chapter.id.startsWith("profile-spark-") ? "Short" : "Reflection",
    tags: [chapter.session, chapter.id],
    appSpaces: [chapter.app || chapterApp(chapter)],
    authorNotes: [],
    updatedAt: now,
    chapter: structuredClone(chapter),
  };
}

export function createNextVersionDraft(source, now = new Date().toISOString()) {
  const copy = structuredClone(source);
  copy.draftId = `draft-${source.chapter.id}-v${source.chapter.version + 1}-${Date.now()}`;
  copy.workflowStatus = "draft";
  copy.updatedAt = now;
  copy.chapter.version = source.chapter.version + 1;
  if (copy.chapter.pages.at(-1)?.type === "idle") copy.chapter.pages.pop();
  copy.chapter.app = source.chapter.app || chapterApp(source.chapter);
  copy.chapter.kind = source.chapter.kind || chapterKind(source.chapter);
  copy.chapter.completion = "swipe";
  if (["confirm", "result"].includes(copy.chapter.pages.at(-1)?.type)) {
    copy.chapter.pages.at(-1).body = "";
  }
  return copy;
}

export function duplicateChapterDraft(source, now = new Date().toISOString()) {
  const copy = structuredClone(source);
  copy.draftId = `draft-${Date.now()}`;
  copy.workflowStatus = "draft";
  copy.updatedAt = now;
  copy.chapter.id = `${source.chapter.id}-copy`;
  copy.chapter.title = `${source.chapter.title} copy`;
  copy.chapter.version = 1;
  copy.chapter.app = source.chapter.app || chapterApp(source.chapter);
  copy.chapter.kind = source.chapter.kind || chapterKind(source.chapter);
  copy.chapter.completion = copy.chapter.pages.at(-1)?.type === "idle" ? "dwell" : "swipe";
  return copy;
}

export function validateChapterDraft(draft) {
  const errors = [];
  const chapter = draft?.chapter;
  if (!chapter) return ["Chapter data is missing."];
  if (!ID_PATTERN.test(chapter.id || "")) errors.push("Chapter ID must use lowercase words and hyphens.");
  if (!Number.isInteger(chapter.version) || chapter.version < 1) errors.push("Version must be a positive whole number.");
  if (!ID_PATTERN.test(chapter.session || "")) errors.push("Session must use lowercase words and hyphens.");
  const capabilityDefinition = {
    ...chapter,
    app: draft.appSpaces?.[0] || chapter.app,
  };
  try {
    chapterApp(capabilityDefinition);
    chapterKind(capabilityDefinition);
    chapterCompletion(capabilityDefinition);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!chapter.title?.trim()) errors.push("Title is required.");
  if (!chapter.purpose?.trim()) errors.push("Purpose is required.");
  if (!Number.isInteger(chapter.estimatedMinutes) || chapter.estimatedMinutes < 1) errors.push("Estimated minutes must be a positive whole number.");
  if (!chapter.pages?.length) return [...errors, "The chapter needs pages."];
  if (chapter.pages[0]?.type !== "cover") errors.push("The first page must be a cover.");
  const finalPage = chapter.pages.at(-1);
  const legacyIdle = finalPage?.type === "idle";
  const completionPage = legacyIdle ? chapter.pages.at(-2) : finalPage;
  if (!["confirm", "result"].includes(completionPage?.type)) errors.push("The final chapter page must be a confirm or result page.");
  if (legacyIdle && draft.workflowStatus !== "published") errors.push("Idle is a legacy app page. New chapter drafts must end on Result or Confirm.");
  if (!legacyIdle && completionPage?.body?.trim()) errors.push("The final Result or Confirm page must leave its Sub Body empty.");
  const ids = chapter.pages.map((page) => page.id);
  if (new Set(ids).size !== ids.length) errors.push("Every page needs a unique ID.");
  chapter.pages.forEach((page, index) => {
    const label = `Page ${index + 1}`;
    if (!ID_PATTERN.test(page.id || "")) errors.push(`${label} ID must use lowercase words and hyphens.`);
    if (!CHAPTER_PAGE_TYPES.includes(page.type)) errors.push(`${label} has an unsupported type.`);
    const input = ["single-choice", "multi-choice", "yes-no", "slider", "short-text", "long-text", "time"].includes(page.type);
    if (input && !page.question?.trim()) errors.push(`${label} needs a question.`);
    if (input && !ID_PATTERN.test(page.answerKey || "")) errors.push(`${label} needs a valid answer key.`);
    if (["single-choice", "multi-choice"].includes(page.type) && (!page.options || page.options.length < 2)) errors.push(`${label} needs at least two options.`);
    if (page.type === "slider" && (!Number.isFinite(page.min) || !Number.isFinite(page.max) || page.min >= page.max)) errors.push(`${label} slider minimum must be lower than its maximum.`);
  });
  if (draft.authorNotes?.some((note) => !note.resolved)) errors.push("Resolve every author note before marking this chapter ready.");
  return errors;
}

function line(label, value) {
  return value === undefined || value === null || value === "" ? "" : `${label}: ${String(value).replace(/\r?\n/g, " ")}`;
}

export function chapterDraftToMarkdown(draft) {
  const chapter = draft.chapter;
  const frontmatter = [
    "---",
    line("id", chapter.id),
    line("version", chapter.version),
    line("status", draft.workflowStatus === "published" ? "published" : "draft"),
    line("session", chapter.session),
    line("App", chapter.app || draft.appSpaces?.[0]),
    line("Kind", chapter.kind),
    line("Completion", chapter.completion),
    line("theme", chapter.theme),
    line("title", chapter.title),
    line("purpose", chapter.purpose),
    line("estimated_minutes", chapter.estimatedMinutes),
    line("category", draft.category),
    line("classification", draft.classification),
    line("tags", draft.tags?.join(", ")),
    line("app_spaces", draft.appSpaces?.join(", ")),
    "---",
  ].filter(Boolean);
  const pages = chapter.pages.map((page) => {
    const fields = [
      `## Page: ${page.id}`,
      line("Type", page.type),
      line("Title", page.title),
      line("Body", page.body),
      line("Question", page.question),
      line("Why", page.why),
      line("Button", page.button),
      line("Answer", page.answerKey),
      line("Placeholder", page.placeholder),
      line("Default", Array.isArray(page.defaultValue) ? page.defaultValue.join(", ") : page.defaultValue),
      line("Min", page.min),
      line("Max", page.max),
      line("Min label", page.minLabel),
      line("Max label", page.maxLabel),
      page.required === undefined ? "" : line("Required", page.required),
    ].filter(Boolean);
    if (page.options?.length) {
      fields.push("Options:", ...page.options.map((option) => `- ${option.id} | ${option.label}`));
    }
    return fields.join("\n");
  });
  return `${frontmatter.join("\n")}\n\n${pages.join("\n\n")}\n`;
}

export function chapterDraftToPreview(draft) {
  const preview = {
    ...structuredClone(draft.chapter),
    status: "published",
  };
  if (preview.pages.at(-1)?.type === "idle") preview.pages.pop();
  preview.app = draft.appSpaces?.[0] || preview.app;
  preview.kind ||= "check-in";
  preview.completion = "swipe";
  if (["confirm", "result"].includes(preview.pages.at(-1)?.type)) {
    preview.pages.at(-1).body = "";
  }
  return preview;
}
