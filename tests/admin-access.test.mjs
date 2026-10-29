import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import ts from "typescript";

let adminAccess;
const originalAdminCode = process.env.CIRCLE_OS_ADMIN_CODE;

before(async () => {
  const source = readFileSync(
    new URL("../app/os/admin/admin-access.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  adminAccess = await import(moduleUrl);
});

function withAdminCode(code, run) {
  if (code === undefined) delete process.env.CIRCLE_OS_ADMIN_CODE;
  else process.env.CIRCLE_OS_ADMIN_CODE = code;

  try {
    return run();
  } finally {
    if (originalAdminCode === undefined) {
      delete process.env.CIRCLE_OS_ADMIN_CODE;
    } else {
      process.env.CIRCLE_OS_ADMIN_CODE = originalAdminCode;
    }
  }
}

function newAdminCode() {
  return randomBytes(32).toString("base64url");
}

test("admin access stays disabled without a sufficiently long server code", () => {
  withAdminCode(undefined, () => {
    assert.equal(adminAccess.configuredAdminCode(), "");
    assert.equal(adminAccess.adminCodeMatches("admin"), false);
    assert.equal(adminAccess.adminAccessToken(), "");
    assert.equal(adminAccess.adminAccessTokenMatches("forged"), false);
  });

  withAdminCode("too-short", () => {
    assert.equal(adminAccess.configuredAdminCode(), "");
    assert.equal(adminAccess.adminCodeMatches("too-short"), false);
  });
});

test("admin password matching is exact and case-sensitive", () => {
  const code = newAdminCode();
  withAdminCode(code, () => {
    assert.equal(adminAccess.configuredAdminCode(), code);
    assert.equal(adminAccess.adminCodeMatches(code), true);
    assert.equal(adminAccess.adminCodeMatches(`${code}x`), false);
    assert.equal(adminAccess.adminCodeMatches(code.toUpperCase()), false);
  });
});

test("admin session tokens are signed, time-limited, and tied to the password", () => {
  const code = newAdminCode();
  const now = Date.now();
  withAdminCode(code, () => {
    const token = adminAccess.adminAccessToken(code, now);
    assert.equal(adminAccess.adminAccessTokenMatches(token, now), true);
    assert.equal(adminAccess.adminAccessTokenMatches(`${token}x`, now), false);
    assert.equal(
      adminAccess.adminAccessTokenMatches(
        token,
        now + (adminAccess.ADMIN_SESSION_TTL_SECONDS + 1) * 1000,
      ),
      false,
    );
    assert.equal(
      adminAccess.adminAccessTokenMatches(token, now - 1000),
      false,
    );
  });

  withAdminCode(newAdminCode(), () => {
    assert.equal(adminAccess.adminAccessTokenMatches(
      adminAccess.adminAccessToken(code, now),
      now,
    ), false);
  });
});
