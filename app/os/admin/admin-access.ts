import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "circle_os_admin";
const DEFAULT_ADMIN_CODE = "admin";

function configuredAdminCode() {
  return (process.env.CIRCLE_OS_ADMIN_CODE || DEFAULT_ADMIN_CODE).trim().toLowerCase();
}

export function adminAccessToken(code = configuredAdminCode()) {
  return code
    ? createHash("sha256").update(`circle-os-admin:${code}`).digest("hex")
    : "";
}

export function adminCodeMatches(candidate: string) {
  const expected = configuredAdminCode();
  candidate = candidate.trim().toLowerCase();
  if (!candidate || !expected) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
