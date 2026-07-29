import type { CircleState } from "./circle-os-shell";

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

export async function readCircleState(state: CircleState) {
  if (!state.ai.profileId || !state.ai.token) return null;
  const response = await fetch(
    `${baseUrl(state)}/profiles/${encodeURIComponent(state.ai.profileId)}`,
    {
      headers: profileHeaders(state),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your profile is offline.",
    );
  }
  return data.state ?? null;
}

export async function syncCircleState(state: CircleState) {
  const creating = !state.ai.profileId || !state.ai.token;
  const url = creating
    ? `${baseUrl(state)}/profiles`
    : `${baseUrl(state)}/profiles/${encodeURIComponent(state.ai.profileId)}/sync`;
  const response = await fetch(url, {
    method: "POST",
    headers: creating
      ? { "Content-Type": "application/json" }
      : profileHeaders(state),
    body: JSON.stringify({ state: buildServerPayload(state) }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your profile is offline.",
    );
  }
  return {
    state: data.state,
    profileId: data.profileId || state.ai.profileId,
    accessKey: data.accessKey || state.ai.token,
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
