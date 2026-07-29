import type { CircleState } from "./circle-os-shell";

function connection(state: CircleState) {
  const baseUrl = state.ai.baseUrl.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("Your computer is not connected.");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (state.ai.token) {
    headers.Authorization = `Bearer ${state.ai.token}`;
  }
  return { baseUrl, headers };
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
  const { baseUrl, headers } = connection(state);
  const response = await fetch(`${baseUrl}/state`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your computer is offline.",
    );
  }
  return data.state ?? null;
}

export async function syncCircleState(state: CircleState) {
  const { baseUrl, headers } = connection(state);
  const response = await fetch(`${baseUrl}/sync`, {
    method: "POST",
    headers,
    body: JSON.stringify({ state: buildServerPayload(state) }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Your computer is offline.",
    );
  }
  return data.state;
}

export async function checkLocalAi(baseUrl: string, token: string) {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, "");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${cleanUrl}/health`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Your computer could not be reached.");
  return response.json();
}
