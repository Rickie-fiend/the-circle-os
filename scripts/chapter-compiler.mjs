import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chapterCompletion } from "../app/os/chapters/chapter-capabilities.js";
import {
  chapterApp,
  chapterKind,
} from "../app/os/chapters/chapter-scheduler.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTERS_ROOT = resolve(
  process.env.CIRCLE_OS_CHAPTERS_PATH ||
    "C:\\Brain\\10 Projects\\The Circle\\Circle OS\\Chapters",
);
const OUTPUT_PATH = join(
  REPO_ROOT,
  "app",
  "os",
  "chapters",
  "published",
  "index.json",
);
const PAGE_TYPES = new Set([
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
]);
const INPUT_TYPES = new Set([
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
]);
const THEMES = new Set(["light", "orange", "dark"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DAILY_PROFILE_PATTERN = /^p_[A-Za-z0-9_-]{16}$/;
const DAILY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CIRCLE_TIME_ZONE_OFFSET = "+07:00";

function clean(value = "") {
  return String(value).trim().replace(/^["']|["']$/g, "");
}

function parseFrontmatter(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${filename}: missing frontmatter`);
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const field = line.match(/^([A-Za-z_ -]+):\s*(.*)$/);
    if (!field) throw new Error(`${filename}: invalid frontmatter line "${line}"`);
    values[field[1].trim().toLowerCase().replaceAll(" ", "_")] = clean(field[2]);
  }
  return { values, body: source.slice(match[0].length) };
}

function fieldName(value) {
  return value.trim().toLowerCase().replaceAll(" ", "_");
}

function parsePage(id, source, filename) {
  const page = { id: clean(id), options: [] };
  let readingOptions = false;
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const field = line.match(/^([A-Za-z][A-Za-z ]*):\s*(.*)$/);
    if (field) {
      readingOptions = fieldName(field[1]) === "options";
      if (readingOptions) continue;
      const key = fieldName(field[1]);
      const value = clean(field[2]);
      const map = {
        type: "type",
        title: "title",
        body: "body",
        question: "question",
        button: "button",
        answer: "answerKey",
        placeholder: "placeholder",
        default: "defaultValue",
        min: "min",
        max: "max",
        min_label: "minLabel",
        max_label: "maxLabel",
        required: "required",
        question_or_information: "question",
      };
      const outputKey = map[key];
      if (!outputKey) {
        throw new Error(`${filename} / ${page.id}: unknown field "${field[1]}"`);
      }
      if (["min", "max"].includes(outputKey)) {
        page[outputKey] = Number(value);
      } else if (outputKey === "required") {
        page.required = value.toLowerCase() === "true";
      } else if (value) {
        page[outputKey] = value;
      }
      continue;
    }
    if (readingOptions && line.startsWith("- ")) {
      const [optionId, ...labelParts] = line.slice(2).split("|");
      page.options.push({
        id: clean(optionId),
        label: clean(labelParts.join("|")),
      });
      continue;
    }
    throw new Error(`${filename} / ${page.id}: cannot read "${line}"`);
  }
  if (!page.options.length) delete page.options;
  if (page.type === "info" && page.question) {
    page.title = page.question;
    delete page.question;
  }
  return page;
}

function datePlusDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function dailyWindow(dateKey, slot) {
  return {
    earliestAt: `${dateKey}T${slot === "morning" ? "06:00" : "18:00"}:00${CIRCLE_TIME_ZONE_OFFSET}`,
    // A Circle day ends at 06:00. The following day therefore finishes at
    // 06:00 two calendar dates after the plan date.
    expiresAt: `${datePlusDays(dateKey, 2)}T06:00:00${CIRCLE_TIME_ZONE_OFFSET}`,
  };
}

function contentHashVersion(chapter) {
  const content = { ...chapter };
  delete content.version;
  const digest = createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  // Twelve hex digits fit safely inside JavaScript's exact integer range.
  // The value is an identity, not a sequence; publication time decides which
  // rewrite is current while the hash keeps every answered definition intact.
  return Number.parseInt(digest.slice(0, 12), 16) || 1;
}

function parseDailySection(slot, source, metadata, filename) {
  const purposeMatch = source.match(/^Purpose:\s*(.+?)\s*$/m);
  if (!purposeMatch) {
    throw new Error(`${filename} / ${slot}: Purpose is required`);
  }
  const purpose = clean(purposeMatch[1]);
  const heading = /^### Page\s+(.+?)\s*$/gm;
  const matches = [...source.matchAll(heading)];
  if (!matches.length) {
    throw new Error(`${filename} / ${slot}: at least one Page is required`);
  }
  const authoredPages = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    return parsePage(
      `${slot}-page-${clean(match[1]).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      source.slice(start, end),
      filename,
    );
  });
  const window = dailyWindow(metadata.date, slot);
  const chapter = {
    schemaVersion: 1,
    id: `athena-daily-${slot}`,
    version: 1,
    status: "published",
    session: "check-in",
    app: "thoughts",
    theme: "light",
    title: purpose,
    purpose,
    estimatedMinutes: Math.max(
      1,
      authoredPages.filter((page) => INPUT_TYPES.has(page.type)).length,
    ),
    kind: "check-in",
    voice: "athena",
    ...window,
    pages: [
      { id: `${slot}-cover`, type: "cover", title: purpose },
      ...authoredPages,
      { id: `${slot}-complete`, type: "result", title: "Thank you." },
    ],
  };
  chapter.version = contentHashVersion(chapter);
  return validateChapter(chapter, `${filename} / ${slot}`);
}

export function parseDailyChaptersMarkdown(
  source,
  filename = "Daily Chapters.md",
) {
  const { values, body } = parseFrontmatter(source, filename);
  if (values.type !== "circle-os-daily-chapters") {
    throw new Error(`${filename}: type must be circle-os-daily-chapters`);
  }
  if (!DAILY_PROFILE_PATTERN.test(values.profile_id || "")) {
    throw new Error(`${filename}: profile_id is invalid`);
  }
  if (!DAILY_DATE_PATTERN.test(values.date || "")) {
    throw new Error(`${filename}: date must be YYYY-MM-DD`);
  }
  const slotHeading = /^## (Morning|Night)\s*$/gm;
  const matches = [...body.matchAll(slotHeading)];
  const sections = new Map(
    matches.map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? body.length;
      return [match[1].toLowerCase(), body.slice(start, end)];
    }),
  );
  const metadata = {
    profileId: values.profile_id,
    date: values.date,
    createdAt: values.created,
  };
  return {
    ...metadata,
    chapters: ["morning", "night"]
      .filter((slot) => sections.has(slot))
      .map((slot) =>
        parseDailySection(slot, sections.get(slot), metadata, filename),
      ),
  };
}

export function parseChapterMarkdown(source, filename = "chapter.md") {
  const { values, body } = parseFrontmatter(source, filename);
  const heading = /^## Page:\s*(.+?)\s*$/gm;
  const matches = [...body.matchAll(heading)];
  const pages = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    return parsePage(match[1], body.slice(start, end), filename);
  });
  return {
    schemaVersion: 1,
    id: values.id,
    version: Number(values.version),
    status: values.status,
    session: values.session,
    ...(values.app ? { app: values.app } : {}),
    ...(values.kind ? { kind: values.kind } : {}),
    ...(values.completion ? { completion: values.completion } : {}),
    theme: values.theme,
    title: values.title,
    purpose: values.purpose,
    estimatedMinutes: Number(values.estimated_minutes),
    pages,
  };
}

export function validateChapter(chapter, filename = "chapter.md") {
  const errors = [];
  if (!ID_PATTERN.test(chapter.id || "")) errors.push("id must use lowercase words and hyphens");
  if (!Number.isInteger(chapter.version) || chapter.version < 1) errors.push("version must be a positive whole number");
  if (!["draft", "published"].includes(chapter.status)) errors.push("status must be draft or published");
  if (!ID_PATTERN.test(chapter.session || "")) errors.push("session must use lowercase words and hyphens");
  try {
    chapterApp(chapter);
    chapterKind(chapter);
    chapterCompletion(chapter);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!THEMES.has(chapter.theme)) errors.push("theme must be light, orange, or dark");
  if (!chapter.title) errors.push("title is required");
  if (!chapter.purpose) errors.push("purpose is required");
  if (!Number.isFinite(chapter.estimatedMinutes) || chapter.estimatedMinutes < 1) {
    errors.push("estimated_minutes must be 1 or more");
  }
  if (chapter.pages.length < 2) errors.push("a chapter needs at least two pages");
  if (chapter.pages[0]?.type !== "cover") errors.push("the first page must be a cover");
  const lastPage = chapter.pages.at(-1);
  const completionPage = lastPage?.type === "idle" ? chapter.pages.at(-2) : lastPage;
  if (!["confirm", "result"].includes(completionPage?.type)) {
    errors.push("the final chapter page must be a confirm or result page");
  }
  if (new Set(chapter.pages.map((page) => page.id)).size !== chapter.pages.length) {
    errors.push("page ids must be unique");
  }
  for (const page of chapter.pages) {
    const prefix = `page ${page.id || "(missing id)"}`;
    if (!ID_PATTERN.test(page.id || "")) errors.push(`${prefix}: invalid id`);
    if (!PAGE_TYPES.has(page.type)) errors.push(`${prefix}: unknown type`);
    if (INPUT_TYPES.has(page.type) && !ID_PATTERN.test(page.answerKey || "")) {
      errors.push(`${prefix}: input pages need an Answer key`);
    }
    if (["single-choice", "multi-choice"].includes(page.type)) {
      if (!page.options || page.options.length < 2) {
        errors.push(`${prefix}: choice pages need at least two options`);
      } else if (
        page.options.some(
          (option) => !ID_PATTERN.test(option.id || "") || !option.label,
        )
      ) {
        errors.push(`${prefix}: every option needs a valid id and label`);
      }
    }
    if (
      page.type === "slider" &&
      (!Number.isFinite(page.min) ||
        !Number.isFinite(page.max) ||
        page.min >= page.max)
    ) {
      errors.push(`${prefix}: slider Min must be lower than Max`);
    }
    if (INPUT_TYPES.has(page.type) && !page.question) {
      errors.push(`${prefix}: input pages need a Question`);
    }
  }
  if (errors.length) {
    throw new Error(`${filename}\n- ${errors.join("\n- ")}`);
  }
  return chapter;
}

export function mergePublishedChapters(existingChapters, sourceChapters) {
  const merged = [...existingChapters];
  for (const chapter of sourceChapters) {
    const previous = merged.find(
      (item) => item.id === chapter.id && item.version === chapter.version,
    );
    if (previous && !isDeepStrictEqual(previous, chapter)) {
      throw new Error(
        `${chapter.id}@${chapter.version} is already published. Increase Version instead of changing it.`,
      );
    }
    if (!previous) merged.push(chapter);
  }
  return merged.sort((left, right) =>
    left.id === right.id
      ? left.version - right.version
      : left.id.localeCompare(right.id),
  );
}

async function markdownFiles(folder) {
  let entries;
  try {
    entries = await readdir(folder, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => join(folder, entry.name));
}

async function readChapters(paths) {
  return Promise.all(
    paths.map(async (path) =>
      validateChapter(
        parseChapterMarkdown(await readFile(path, "utf8"), path),
        path,
      ),
    ),
  );
}

async function main() {
  const command = process.argv.includes("--publish") ? "publish" : "check";
  const draftPaths = await markdownFiles(join(CHAPTERS_ROOT, "Drafts"));
  const publishedPaths = await markdownFiles(
    join(CHAPTERS_ROOT, "Published Sources"),
  );
  const all = await readChapters([...draftPaths, ...publishedPaths]);
  if (!all.length) throw new Error(`No chapter Markdown found in ${CHAPTERS_ROOT}`);

  if (command === "check") {
    console.log(`Checked ${all.length} chapter source${all.length === 1 ? "" : "s"}.`);
    return;
  }

  const chapters = (await readChapters(publishedPaths))
    .filter((chapter) => chapter.status === "published")
    .sort((left, right) =>
      left.id === right.id ? left.version - right.version : left.id.localeCompare(right.id),
    );
  if (!chapters.length) throw new Error("No published chapter sources found.");
  const duplicateKeys = chapters.map((chapter) => `${chapter.id}@${chapter.version}`);
  if (new Set(duplicateKeys).size !== duplicateKeys.length) {
    throw new Error("Published chapter ids and versions must be unique.");
  }

  let existing = { schemaVersion: 1, chapters: [] };
  try {
    existing = JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const publishedChapters = mergePublishedChapters(
    Array.isArray(existing.chapters) ? existing.chapters : [],
    chapters,
  );

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(
      { schemaVersion: 1, chapters: publishedChapters },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(
    `Published library contains ${publishedChapters.length} chapter version${
      publishedChapters.length === 1 ? "" : "s"
    }.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
