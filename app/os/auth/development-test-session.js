import { activateAccountScope, enableDevelopmentTestScope, getAccountScope } from "../account-scope.js";

export function isDevelopmentTestAccount(scope) {
  return scope.kind === "account" && /^dev-test-[0-9a-f-]{36}$/.test(scope.accountId);
}

export function openDevelopmentTestSession(fresh = false) {
  if (process.env.NODE_ENV !== "development") throw new Error("Test sessions are only available in development.");
  enableDevelopmentTestScope();
  const scope = getAccountScope();
  if (!fresh && isDevelopmentTestAccount(scope)) return scope;
  // A new owner means empty state through the existing storage engine. Old
  // test runs, real accounts and legacy data are never cleared or migrated.
  return activateAccountScope(`dev-test-${crypto.randomUUID()}`);
}
