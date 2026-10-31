import type { CircleState } from "./circle-os-shell";
import { assertAccountScope, type AccountScope } from "./account-scope";
import type {
  ChapterDefinition,
  ChapterPublication,
} from "./chapters/chapter-types";

async function legacyFetch(scope: AccountScope, url: string, options: RequestInit) {
  assertAccountScope(scope);
  if (scope.kind !== "legacy") throw new Error("Account sync is not connected yet.");
  const response = await fetch(url, {
    ...options,
    signal: options.signal ? AbortSignal.any([scope.signal, options.signal]) : scope.signal,
  });
  assertAccountScope(scope);
  return response;
}

function baseUrl(state: CircleState) {
  const value = state.ai.baseUrl.trim().replace(/\/+$/, "");
  if (!value) throw new Error("The Circle server is not connected.");
  return value;
}

function profileHeaders(state: CircleState) {
  if (!state.ai.token) throw new Error("This profile is not connected.");
  return {
    Authorization: `Bearer ${state.ai.token}`,
    "Content-Type": "application/json",
  };
}

export function buildServerPayload(state: CircleState) {
  return {
    ...state,
    ai: {
      ...state.ai,
      baseUrl: "",
      token: "",
    },
  };
}

export async function readCircleState(state: CircleState, scope: AccountScope) {
  assertAccountScope(scope);
  if (!state.ai.profileId || !state.ai.token) return null;
  const response = await legacyFetch(scope,
    `${baseUrl(state)}/profiles/${encodeURIComponent(state.ai.profileId)}`,
    {
      headers: profileHeaders(state),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your profile is offline.",
    );
  }
  return {
    state: data.state ?? null,
    chapterPublications: await readProfileChapterPublications({
      baseUrl: state.ai.baseUrl,
      profileId: state.ai.profileId,
      token: state.ai.token,
    }, scope),
  };
}

export async function syncCircleState(state: CircleState, scope: AccountScope) {
  const creating = !state.ai.profileId || !state.ai.token;
  const url = creating
    ? `${baseUrl(state)}/profiles`
    : `${baseUrl(state)}/profiles/${encodeURIComponent(state.ai.profileId)}/sync`;
  const response = await legacyFetch(scope, url, {
    method: "POST",
    headers: creating
      ? { "Content-Type": "application/json" }
      : profileHeaders(state),
    body: JSON.stringify({ state: buildServerPayload(state) }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your profile is offline.",
    );
  }
  const profileId = data.profileId || state.ai.profileId;
  const accessKey = data.accessKey || state.ai.token;
  return {
    state: data.state,
    profileId,
    accessKey,
    chapterPublications: await readProfileChapterPublications({
      baseUrl: state.ai.baseUrl,
      profileId,
      token: accessKey,
    }, scope),
    acknowledgedEvidenceRevision: Number(
      data.acknowledgedEvidenceRevision || 0,
    ),
    acknowledgedOutboxIds: Array.isArray(data.acknowledgedOutboxIds)
      ? data.acknowledgedOutboxIds
      : [],
  };
}

async function readProfileChapterPublications(connection: {
  baseUrl: string;
  profileId: string;
  token: string;
}, scope: AccountScope) {
  assertAccountScope(scope);
  if (!connection.profileId || !connection.token) return [];
  const cleanUrl = connection.baseUrl.trim().replace(/\/+$/, "");
  if (!cleanUrl) return [];
  const response = await legacyFetch(scope,
    `${cleanUrl}/profiles/${encodeURIComponent(connection.profileId)}/chapters`,
    {
      headers: {
        Authorization: `Bearer ${connection.token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Daily chapters are offline.",
    );
  }
  return Array.isArray(data.publications)
    ? (data.publications as ChapterPublication[])
    : [];
}

export async function recoverCircleProfile(
  address: string,
  profileId: string,
  scope: AccountScope,
) {
  const cleanUrl = address.trim().replace(/\/+$/, "");
  if (!cleanUrl) throw new Error("The Circle server is not connected.");
  const response = await legacyFetch(scope, `${cleanUrl}/profiles/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId: profileId.trim() }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "That recovery code was not found.",
    );
  }
  return {
    state: data.state as CircleState,
    profileId: data.profileId as string,
    accessKey: data.accessKey as string,
    chapterPublications: await readProfileChapterPublications({
      baseUrl: cleanUrl,
      profileId: data.profileId as string,
      token: data.accessKey as string,
    }, scope),
  };
}

export async function checkLocalAi(address: string) {
  const cleanUrl = address.trim().replace(/\/+$/, "");
  const response = await fetch(`${cleanUrl}/health`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("The Circle server could not be reached.");
  return response.json();
}

type CircleAiConnection = Pick<
  CircleState["ai"],
  "baseUrl" | "profileId" | "token"
>;

export async function readPublicChapters(connection: CircleAiConnection, scope: AccountScope) {
  assertAccountScope(scope);
  if (!connection.profileId || !connection.token) return [];
  const cleanUrl = connection.baseUrl.trim().replace(/\/+$/, "");
  if (!cleanUrl) return [];
  const response = await legacyFetch(scope, `${cleanUrl}/chapters/public`, {
    headers: {
      Authorization: `Bearer ${connection.token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Public chapters are offline.",
    );
  }
  return Array.isArray(data.chapters)
    ? (data.chapters as ChapterDefinition[])
    : [];
}

export async function publishPublicChapter(
  state: CircleState,
  chapter: ChapterDefinition,
  source: string,
  scope: AccountScope,
) {
  if (!state.ai.profileId || !state.ai.token) {
    throw new Error("Connect Circle OS before publishing for everyone.");
  }
  const response = await legacyFetch(scope, `${baseUrl(state)}/chapters/publish`, {
    method: "POST",
    headers: profileHeaders(state),
    body: JSON.stringify({ chapter, source }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  assertAccountScope(scope);
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "The chapter was not published.",
    );
  }
  return data.chapter as ChapterDefinition;
}
