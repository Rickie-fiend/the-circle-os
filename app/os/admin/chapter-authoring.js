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

export const CHAPTER_CLASSIFICATIONS = [
  "Foundation",
  "Short",
  "Guided Learning",
  "Reflection",
  "Information",
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
    title: "",
    body: "",
    button: type === "cover" ? "Begin" : "Continue",
  };
  if (["single-choice", "multi-choice", "yes-no", "slider", "short-text", "long-text", "time"].includes(type)) {
    page.question = "";
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
  if (["short-text", "long-text"].includes(type)) page.placeholder = "Write here";
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
    appSpaces: ["check-in"],
    authorNotes: [],
    updatedAt: now,
    chapter: {
      schemaVersion: 1,
      id: "untitled-chapter",
      version: 1,
      status: "published",
      session: "check-in",
      theme: "light",
      title: "Untitled chapter",
      purpose: "Describe what this chapter helps the person understand or do.",
      estimatedMinutes: 3,
      pages: [
        {
          ...createChapterPage("cover", 0),
          id: "cover",
          title: "Untitled chapter",
          body: "A short invitation to begin.",
        },
        {
          ...createChapterPage("info", 1),
          id: "opening",
          title: "Start with one clear idea.",
          body: "Add the chapter content here.",
        },
        {
          ...createChapterPage("result", 2),
          id: "complete",
          title: "You completed this chapter.",
          body: "Carry one useful thought with you.",
          button: "Finish",
        },
        {
          ...createChapterPage("idle", 3),
          id: "idle",
          title: "Chapter complete",
          body: "Return whenever you want to review it.",
        },
      ],
    },
  };
}

export function duplicateChapterDraft(source, now = new Date().toISOString()) {
  const copy = structuredClone(source);
  copy.draftId = `draft-${Date.now()}`;
  copy.workflowStatus = "draft";
  copy.updatedAt = now;
  copy.chapter.id = `${source.chapter.id}-copy`;
  copy.chapter.title = `${source.chapter.title} copy`;
  copy.chapter.version = 1;
  return copy;
}

export function validateChapterDraft(draft) {
  const errors = [];
  const chapter = draft?.chapter;
  if (!chapter) return ["Chapter data is missing."];
  if (!ID_PATTERN.test(chapter.id || "")) errors.push("Chapter ID must use lowercase words and hyphens.");
  if (!Number.isInteger(chapter.version) || chapter.version < 1) errors.push("Version must be a positive whole number.");
  if (!ID_PATTERN.test(chapter.session || "")) errors.push("Session must use lowercase words and hyphens.");
  if (!chapter.title?.trim()) errors.push("Title is required.");
  if (!chapter.purpose?.trim()) errors.push("Purpose is required.");
  if (!Number.isInteger(chapter.estimatedMinutes) || chapter.estimatedMinutes < 1) errors.push("Estimated minutes must be a positive whole number.");
  if (!chapter.pages?.length) return [...errors, "The chapter needs pages."];
  if (chapter.pages[0]?.type !== "cover") errors.push("The first page must be a cover.");
  if (!["confirm", "result"].includes(chapter.pages.at(-2)?.type)) errors.push("The page before the idle app must be a confirm or result page.");
  if (chapter.pages.at(-1)?.type !== "idle") errors.push("The final page must be the idle app.");
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
  return {
    ...structuredClone(draft.chapter),
    status: "published",
  };
}
