import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "circle_os_admin";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const MIN_ADMIN_CODE_LENGTH = 16;

export function configuredAdminCode() {
  const code = process.env.CIRCLE_OS_ADMIN_CODE?.trim() || "";
  return code.length >= MIN_ADMIN_CODE_LENGTH ? code : "";
}

export function adminCodeMatches(candidate: string) {
  const expected = configuredAdminCode();
  const submitted = candidate.trim();
  if (!expected || !submitted || submitted.length > 256) return false;
  const left = createHash("sha256").update(submitted).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function adminAccessToken(
  code = configuredAdminCode(),
  issuedAt = Date.now(),
) {
  if (!code) return "";

  const issuedAtSeconds = Math.floor(issuedAt / 1000);
  const nonce = randomBytes(16).toString("hex");
  const payload = `${issuedAtSeconds}.${nonce}`;
  const signature = createHmac("sha256", code)
    .update(`circle-os-admin-session:v1:${payload}`)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function adminAccessTokenMatches(
  token: string | undefined,
  now = Date.now(),
) {
  const code = configuredAdminCode();
  if (!code || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d{10}$/.test(parts[0])) return false;
  if (!/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) {
    return false;
  }

  const issuedAtSeconds = Number(parts[0]);
  const nowSeconds = Math.floor(now / 1000);
  const ageSeconds = nowSeconds - issuedAtSeconds;
  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_TTL_SECONDS) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", code)
    .update(`circle-os-admin-session:v1:${payload}`)
    .digest();
  const actual = Buffer.from(parts[2], "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
