import type { CircleState } from "./circle-os-shell";

export function buildAiPayload(state: CircleState, reason: string) {
  return {
    reason,
    person: {
      name: state.profile.name,
      age: state.profile.age,
      dreamLifestyle: state.profile.vision.description,
    },
    profileCase: state.profile.profileCase,
    days: Object.values(state.days)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14),
  };
}

export async function requestProfileUpdate(
  state: CircleState,
  reason: string,
) {
  const baseUrl = state.ai.baseUrl.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Local AI is not connected.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (state.ai.token) {
    headers.Authorization = `Bearer ${state.ai.token}`;
  }
  const response = await fetch(`${baseUrl}/profile`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildAiPayload(state, reason)),
    signal: AbortSignal.timeout(120000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Local AI did not answer.",
    );
  }
  return data;
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
  if (!response.ok) throw new Error("Local AI could not be reached.");
  return response.json();
}
