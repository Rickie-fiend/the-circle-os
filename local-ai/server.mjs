import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROFILE_SESSION_KEYS,
  applyProfileResult,
  normalizeState,
} from "../app/os/circle-os-model.js";

const root = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(root, "profile-schema.json"), "utf8"));
const defaultRules = {
  constitution: readFileSync(join(root, "rules", "constitution.md"), "utf8"),
  profileCase: readFileSync(join(root, "rules", "profile-case.md"), "utf8"),
};
const safeQuestions = [
  ["Which part of that Tuesday matters most to you?", "whatMatters"],
  ["When did you last feel most like yourself?", "whatMatters"],
  ["What drains you even when the day looks successful?", "currentLife"],
  ["What gives you energy without forcing yourself?", "personality"],
  ["Who do you feel most honest around?", "personality"],
  ["What do you want more of in an ordinary week?", "missionStatement"],
];

function text(value, maximum = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function confidence(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
}

function newest(left, right) {
  return String(left || "").localeCompare(String(right || "")) >= 0
    ? left
    : right;
}

function newerSession(serverSession, phoneSession) {
  if (!serverSession?.text && phoneSession?.text) return phoneSession;
  if (!phoneSession?.text) return serverSession;
  if (
    phoneSession.userEdited &&
    String(phoneSession.updatedAt || "").localeCompare(
      String(serverSession.updatedAt || ""),
    ) >= 0
  ) {
    return phoneSession;
  }
  return serverSession;
}

function mergeAnswers(serverAnswers = [], phoneAnswers = []) {
  const answers = new Map();
  for (const answer of [...serverAnswers, ...phoneAnswers]) {
    if (!answer?.questionId) continue;
    const current = answers.get(answer.questionId);
    if (
      !current ||
      String(answer.answeredAt || "").localeCompare(
        String(current.answeredAt || ""),
      ) >= 0
    ) {
      answers.set(answer.questionId, answer);
    }
  }
  return [...answers.values()].sort((a, b) =>
    String(a.answeredAt || "").localeCompare(String(b.answeredAt || "")),
  );
}

function mergeDays(serverDays, phoneDays) {
  const days = { ...serverDays };
  for (const [date, phoneDay] of Object.entries(phoneDays || {})) {
    const serverDay = serverDays?.[date];
    if (!serverDay) {
      days[date] = phoneDay;
      continue;
    }
    days[date] = {
      ...serverDay,
      ...phoneDay,
      mission: {
        ...phoneDay.mission,
        text: serverDay.mission?.text || phoneDay.mission?.text,
        why: serverDay.mission?.why || phoneDay.mission?.why,
        identity: serverDay.mission?.identity || phoneDay.mission?.identity,
        completed: Boolean(phoneDay.mission?.completed),
        completedAt: phoneDay.mission?.completedAt || null,
      },
    };
  }
  return days;
}

export function mergeClientState(serverValue, phoneValue) {
  const phone = normalizeState(phoneValue);
  if (!serverValue) {
    return {
      ...phone,
      ai: {
        ...phone.ai,
        baseUrl: "",
        token: "",
      },
      outbox: [],
    };
  }

  const server = normalizeState(serverValue);
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => [
      key,
      newerSession(
        server.profile.profileCase.sessions[key],
        phone.profile.profileCase.sessions[key],
      ),
    ]),
  );
  const visionCompletedAt = newest(
    server.profile.vision.completedAt,
    phone.profile.vision.completedAt,
  );
  const phoneHasNewerVision =
    visionCompletedAt === phone.profile.vision.completedAt;
  const answers = mergeAnswers(
    server.profile.profileCase.survey.answers,
    phone.profile.profileCase.survey.answers,
  );
  const phoneAnsweredNewQuestion =
    phone.profile.profileCase.survey.answers.length >
    server.profile.profileCase.survey.answers.length;

  return normalizeState({
    ...server,
    version: Math.max(server.version, phone.version),
    profile: {
      ...server.profile,
      name: phoneHasNewerVision ? phone.profile.name : server.profile.name,
      age: phoneHasNewerVision ? phone.profile.age : server.profile.age,
      identityFocus:
        phone.profile.identityFocus || server.profile.identityFocus,
      vision: {
        ...server.profile.vision,
        description: phoneHasNewerVision
          ? phone.profile.vision.description
          : server.profile.vision.description,
        preview: sessions.typicalTuesday.text,
        understanding: sessions.whatMatters.text,
        gap: sessions.gap.text,
        completedAt: visionCompletedAt,
      },
      profileCase: {
        ...server.profile.profileCase,
        sessions,
        survey: {
          ...server.profile.profileCase.survey,
          answers,
          nextQuestion: phoneAnsweredNewQuestion
            ? phone.profile.profileCase.survey.nextQuestion
            : server.profile.profileCase.survey.nextQuestion ??
              phone.profile.profileCase.survey.nextQuestion,
        },
      },
    },
    days: mergeDays(server.days, phone.days),
    ai: {
      ...server.ai,
      baseUrl: "",
      token: "",
    },
    outbox: [],
  });
}

export function normalizeModelResult(value, answerCount = 0) {
  const raw =
    typeof value === "string"
      ? JSON.parse(value.replace(/^```(?:json)?\s*|\s*```$/g, ""))
      : value;
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => [
      key,
      {
        text:
          key === "personality" && answerCount < 6
            ? ""
            : text(raw?.sessions?.[key]?.text),
        confidence: confidence(raw?.sessions?.[key]?.confidence),
      },
    ]),
  );
  const safeQuestion = safeQuestions[answerCount];
  const nextQuestion = safeQuestion
    ? {
        id: `profile-question-${answerCount + 1}`,
        text: safeQuestion[0],
        target: safeQuestion[1],
      }
    : null;

  return {
    sessions,
    nextQuestion,
    dailyMission:
      text(raw?.dailyMission, 120) || "Notice one moment that feels like you.",
  };
}

export function guardProfileEvidence(result, input) {
  const recordedDays = Object.values(input?.days || {}).filter(
    (day) =>
      (Array.isArray(day?.checkIns) && day.checkIns.length) ||
      (Array.isArray(day?.timeBlocks) && day.timeBlocks.length),
  );
  if (recordedDays.length === 0) {
    result.sessions.currentLife = {
      text: "There is not enough of your real life recorded yet.",
      confidence: 0,
    };
    result.sessions.gap = {
      text:
        "Your dream is described, but your current days are not recorded yet. " +
        "The real gap will become clearer as you log ordinary days.",
      confidence: 0,
    };
  } else if (recordedDays.length === 1) {
    result.sessions.currentLife.confidence = Math.min(
      result.sessions.currentLife.confidence,
      0.3,
    );
    result.sessions.gap.confidence = Math.min(
      result.sessions.gap.confidence,
      0.25,
    );
  }
  return result;
}

export function buildPrompt(input) {
  return [
    "Update the Profile Case from this person's recorded evidence.",
    "Do not copy user-edited session text into a different meaning.",
    "If evidence is missing, say so plainly.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}

function markdownText(value, fallback = "Not enough evidence yet.") {
  return text(value, 10_000) || fallback;
}

export function serializeProfileMarkdown(value) {
  const state = normalizeState(value);
  const profile = state.profile;
  const sessions = profile.profileCase.sessions;
  const answers = profile.profileCase.survey.answers;
  const answerLines = answers.length
    ? answers
        .map(
          (answer) =>
            `### ${markdownText(answer.question, "Question")}\n\n${markdownText(
              answer.answer,
              "No answer.",
            )}`,
        )
        .join("\n\n")
    : "No questions answered yet.";
  return `---
type: circle-os-profile
updated: ${profile.profileCase.updatedAt || new Date().toISOString()}
---

# ${markdownText(profile.name, "Circle OS Profile")}

Age: ${profile.age ?? "Not added"}

## Typical Tuesday

${markdownText(sessions.typicalTuesday.text, profile.vision.description)}

## Current Life

${markdownText(sessions.currentLife.text)}

## What Matters

${markdownText(sessions.whatMatters.text)}

## The Gap

${markdownText(sessions.gap.text)}

## Mission Statement

${markdownText(sessions.missionStatement.text)}

## Personality

${markdownText(
    sessions.personality.text,
    `Answer ${Math.max(0, 6 - answers.length)} more questions to build this.`,
  )}

## Check-in Answers

${answerLines}
`;
}

function formatCheckIns(day) {
  if (!day.checkIns?.length) return "Nothing recorded.";
  return day.checkIns
    .map(
      (checkIn) =>
        `- ${checkIn.period}: energy ${checkIn.energy ?? "not recorded"}${
          checkIn.mood ? `, mood ${checkIn.mood}` : ""
        }`,
    )
    .join("\n");
}

function formatTimeBlocks(day) {
  if (!day.timeBlocks?.length) return "Nothing recorded.";
  return day.timeBlocks
    .map((block) => {
      const moments = (block.moments || [])
        .map((moment) => `\n  - ${markdownText(moment, "")}`)
        .join("");
      return `- ${block.start}-${block.end}: ${markdownText(
        block.title || block.activity,
        "Untitled",
      )}${moments}`;
    })
    .join("\n");
}

export function serializeDayMarkdown(day) {
  return `---
type: circle-os-day
date: ${day.date}
---

# ${day.date}

## Check-in

${formatCheckIns(day)}

## Mission

${markdownText(day.mission?.text, "No mission yet.")}

${day.mission?.completed ? "Completed." : "Not completed."}

## Day

${formatTimeBlocks(day)}
`;
}

function resolveVaultPath(options = {}) {
  return (
    options.vaultPath ||
    process.env.CIRCLE_OS_VAULT_PATH ||
    "C:\\Brain\\10 Projects\\The Circle\\Circle OS"
  );
}

function ensureVault(vaultPath) {
  mkdirSync(join(vaultPath, "Days"), { recursive: true });
  mkdirSync(join(vaultPath, "Rules"), { recursive: true });
  const rules = [
    ["constitution.md", defaultRules.constitution],
    ["profile-case.md", defaultRules.profileCase],
  ];
  for (const [filename, content] of rules) {
    const target = join(vaultPath, "Rules", filename);
    if (!existsSync(target)) writeFileSync(target, content, "utf8");
  }
}

function readState(vaultPath) {
  const statePath = join(vaultPath, "State.json");
  if (!existsSync(statePath)) return null;
  return normalizeState(JSON.parse(readFileSync(statePath, "utf8")));
}

function writeAtomic(path, content) {
  const temporary = `${path}.new`;
  writeFileSync(temporary, content, "utf8");
  renameSync(temporary, path);
}

function saveState(vaultPath, value) {
  ensureVault(vaultPath);
  const state = normalizeState(value);
  writeAtomic(
    join(vaultPath, "State.json"),
    `${JSON.stringify(state, null, 2)}\n`,
  );
  writeAtomic(join(vaultPath, "Profile.md"), serializeProfileMarkdown(state));
  for (const day of Object.values(state.days)) {
    writeAtomic(
      join(vaultPath, "Days", `${day.date}.md`),
      serializeDayMarkdown(day),
    );
  }
  return state;
}

function loadSystemInstruction(vaultPath) {
  ensureVault(vaultPath);
  return [
    readFileSync(join(vaultPath, "Rules", "constitution.md"), "utf8"),
    readFileSync(join(vaultPath, "Rules", "profile-case.md"), "utf8"),
  ].join("\n\n");
}

function allowedOrigins() {
  const configured =
    process.env.CIRCLE_AI_ORIGINS ||
    [
      "https://the-circle-rebrand.saisaisainoung.chatgpt.site",
      "https://the-lemon-nu.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ].join(",");
  return new Set(
    configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Private-Network": "true",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

function json(response, status, body, origin) {
  response.writeHead(status, corsHeaders(origin));
  response.end(JSON.stringify(body));
}

function authorized(request) {
  const token = process.env.CIRCLE_AI_TOKEN;
  const expectedTailscaleUser =
    process.env.CIRCLE_AI_TAILSCALE_USER?.trim().toLowerCase();
  const tailscaleUser = String(
    request.headers["tailscale-user-login"] || "",
  )
    .trim()
    .toLowerCase();
  return Boolean(
    (token && request.headers.authorization === `Bearer ${token}`) ||
      (expectedTailscaleUser && tailscaleUser === expectedTailscaleUser),
  );
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 500_000) throw new Error("Request is too large.");
  }
  return JSON.parse(body || "{}");
}

async function ollamaHealth() {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434")
    .replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/api/tags`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("Ollama is offline.");
  return true;
}

async function generateProfile(input, vaultPath) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434")
    .replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: schema,
      messages: [
        {
          role: "system",
          content: loadSystemInstruction(vaultPath),
        },
        { role: "user", content: buildPrompt(input) },
      ],
      options: {
        temperature: 0.2,
        num_predict: 650,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(text(data.error) || "Ollama could not update the profile.");
  }
  const content = text(data.message?.content || data.response, 20_000);
  const answerCount = Array.isArray(input?.profileCase?.survey?.answers)
    ? input.profileCase.survey.answers.length
    : 0;
  return guardProfileEvidence(
    normalizeModelResult(content, answerCount),
    input,
  );
}

export function createCircleAiServer(options = {}) {
  const vaultPath = resolveVaultPath(options);
  const generate = options.generateProfile || generateProfile;
  ensureVault(vaultPath);
  let state = readState(vaultPath);
  let profileDirty = Boolean(
    state?.profile?.vision?.completedAt &&
      ["waiting", "thinking"].includes(state.profile.profileCase.status),
  );
  let profileRunning = false;
  let retryTimer = null;

  function publicState() {
    if (!state) return null;
    return {
      ...state,
      ai: {
        ...state.ai,
        baseUrl: "",
        token: "",
      },
      outbox: [],
    };
  }

  function scheduleProfile() {
    profileDirty = true;
    if (state) {
      state = saveState(vaultPath, {
        ...state,
        ai: { ...state.ai, status: "thinking", lastError: "" },
        profile: {
          ...state.profile,
          profileCase: {
            ...state.profile.profileCase,
            status: "thinking",
          },
        },
        outbox: [],
      });
    }
    queueMicrotask(runProfileJobs);
  }

  async function runProfileJobs() {
    if (profileRunning || !profileDirty || !state) return;
    profileRunning = true;
    profileDirty = false;
    const snapshot = structuredClone(state);
    try {
      const result = await generate(
        {
          reason: "saved-life-update",
          person: {
            name: snapshot.profile.name,
            age: snapshot.profile.age,
            dreamLifestyle: snapshot.profile.vision.description,
          },
          profileCase: snapshot.profile.profileCase,
          days: Object.values(snapshot.days)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14),
        },
        vaultPath,
      );
      state = applyProfileResult(state, result, "server-profile-job");
      state.outbox = [];
      state = saveState(vaultPath, state);
    } catch (error) {
      state = saveState(vaultPath, {
        ...state,
        ai: {
          ...state.ai,
          status: "offline",
          lastError:
            error instanceof Error ? error.message : "Local AI is offline.",
        },
        profile: {
          ...state.profile,
          profileCase: {
            ...state.profile.profileCase,
            status: "waiting",
          },
        },
        outbox: [],
      });
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          scheduleProfile();
        }, 30_000);
      }
    } finally {
      profileRunning = false;
      if (profileDirty) queueMicrotask(runProfileJobs);
    }
  }

  if (profileDirty) queueMicrotask(runProfileJobs);

  return createServer(async (request, response) => {
    const origin = request.headers.origin || "";
    if (origin && !allowedOrigins().has(origin)) {
      json(response, 403, { error: "This app is not allowed." }, origin);
      return;
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders(origin));
      response.end();
      return;
    }
    if (!authorized(request)) {
      json(response, 401, { error: "Wrong key." }, origin);
      return;
    }
    try {
      if (request.method === "GET" && request.url === "/health") {
        await ollamaHealth();
        json(
          response,
          200,
          {
            ok: true,
            model: process.env.OLLAMA_MODEL || "qwen2.5:1.5b",
            storesData: true,
          },
          origin,
        );
        return;
      }
      if (request.method === "GET" && request.url === "/state") {
        json(response, 200, { state: publicState() }, origin);
        return;
      }
      if (request.method === "POST" && request.url === "/sync") {
        const input = await readBody(request);
        const shouldUpdateProfile = Boolean(input?.state?.outbox?.length);
        state = saveState(vaultPath, mergeClientState(state, input.state));
        const profileStillWaiting =
          state.profile.vision.completedAt &&
          ["waiting", "thinking"].includes(state.profile.profileCase.status);
        if (shouldUpdateProfile || profileStillWaiting) {
          scheduleProfile();
        }
        json(response, 200, { state: publicState() }, origin);
        return;
      }
      if (request.method === "POST" && request.url === "/profile") {
        const input = await readBody(request);
        const result = await generate(input, vaultPath);
        json(response, 200, result, origin);
        return;
      }
      json(response, 404, { error: "Not found." }, origin);
    } catch (error) {
      json(
        response,
        503,
        {
          error:
            error instanceof Error ? error.message : "Local AI is offline.",
        },
        origin,
      );
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.CIRCLE_AI_PORT || 4317);
  if (!process.env.CIRCLE_AI_TOKEN) {
    throw new Error("CIRCLE_AI_TOKEN is required.");
  }
  createCircleAiServer().listen(port, "127.0.0.1", () => {
    console.log(`Circle OS is ready on http://127.0.0.1:${port}`);
  });
}
