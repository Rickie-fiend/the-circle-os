import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(root, "profile-schema.json"), "utf8"));
const systemInstruction = [
  readFileSync(join(root, "rules", "constitution.md"), "utf8"),
  readFileSync(join(root, "rules", "profile-case.md"), "utf8"),
].join("\n\n");
const sessionKeys = [
  "typicalTuesday",
  "currentLife",
  "whatMatters",
  "gap",
  "missionStatement",
  "personality",
];
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

export function normalizeModelResult(value, answerCount = 0) {
  const raw = typeof value === "string"
    ? JSON.parse(value.replace(/^```(?:json)?\s*|\s*```$/g, ""))
    : value;
  const sessions = Object.fromEntries(
    sessionKeys.map((key) => [
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
    "Update the Profile Case from this phone-owned evidence.",
    "Do not copy user-edited session text into a different meaning.",
    "If evidence is missing, say so plainly.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}

function allowedOrigins() {
  const configured = process.env.CIRCLE_AI_ORIGINS ||
    [
      "https://the-circle-rebrand.saisaisainoung.chatgpt.site",
      "https://the-lemon-nu.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ].join(",");
  return new Set(configured.split(",").map((item) => item.trim()).filter(Boolean));
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
  ).trim().toLowerCase();
  return Boolean(
    (token && request.headers.authorization === `Bearer ${token}`) ||
      (expectedTailscaleUser && tailscaleUser === expectedTailscaleUser),
  );
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 250_000) throw new Error("Request is too large.");
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

async function generateProfile(input) {
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
        { role: "system", content: systemInstruction },
        { role: "user", content: buildPrompt(input) },
      ],
      options: {
        temperature: 0.25,
        num_predict: 1100,
      },
    }),
    signal: AbortSignal.timeout(90000),
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

export function createCircleAiServer() {
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
        json(response, 200, {
          ok: true,
          model: process.env.OLLAMA_MODEL || "qwen2.5:1.5b",
          storesData: false,
        }, origin);
        return;
      }
      if (request.method === "POST" && request.url === "/profile") {
        const input = await readBody(request);
        const result = await generateProfile(input);
        json(response, 200, result, origin);
        return;
      }
      json(response, 404, { error: "Not found." }, origin);
    } catch (error) {
      json(response, 503, {
        error: error instanceof Error ? error.message : "Local AI is offline.",
      }, origin);
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.CIRCLE_AI_PORT || 4317);
  if (!process.env.CIRCLE_AI_TOKEN) {
    throw new Error("CIRCLE_AI_TOKEN is required.");
  }
  createCircleAiServer().listen(port, "127.0.0.1", () => {
    console.log(`Circle OS local AI is ready on http://127.0.0.1:${port}`);
  });
}
