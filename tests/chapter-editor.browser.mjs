import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { chromium, expect } from "@playwright/test";

// Run against an isolated local server configured with this synthetic admin
// code. Never use the owner's browser profile, password, or profile server.
const baseURL = "http://localhost:3217";
const testCode = "isolated-chapter-editor-test-only";

for (const width of [390, 360]) {
  test(`chapter page removal, selection, and local save at ${width}px`, async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await context.route("**/*", (route) => {
        if (new URL(route.request().url()).origin !== baseURL) return route.abort();
        return route.continue();
      });
      const payload = `${Math.floor(Date.now() / 1000)}.${"0".repeat(32)}`;
      const signature = createHmac("sha256", testCode).update(`circle-os-admin-session:v1:${payload}`).digest("hex");
      await context.addCookies([{ name: "circle_os_admin", value: `${payload}.${signature}`, url: baseURL, httpOnly: true, sameSite: "Strict" }]);
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseURL}/os/admin`);
      await page.getByRole("button", { name: "Blank chapter", exact: true }).click();
      const strip = page.locator(".os-admin-preview-pages");
      const remove = page.getByRole("button", { name: "Remove page", exact: true });
      const pageId = page.getByLabel("Page ID", { exact: true });
      await expect(strip.getByRole("button")).toHaveCount(3);
      await expect(remove).toBeDisabled();
      await strip.getByRole("button").last().click();
      await expect(remove).toBeDisabled();

      await page.getByRole("button", { name: "Add page", exact: true }).click();
      await expect(strip.getByRole("button")).toHaveCount(4);
      await expect(strip.locator('[aria-pressed="true"]')).toHaveText("3Info");
      const addedId = await pageId.inputValue();
      await expect(remove).toBeEnabled();
      assert.ok((await remove.boundingBox()).height >= 44);
      page.once("dialog", (dialog) => dialog.dismiss());
      await remove.click();
      await expect(strip.getByRole("button")).toHaveCount(4);
      await expect(pageId).toHaveValue(addedId);

      page.once("dialog", (dialog) => dialog.accept());
      await remove.click();
      await expect(strip.getByRole("button")).toHaveCount(3);
      await expect(strip.locator('[aria-pressed="true"]')).toHaveText("2Info");
      const previousId = await pageId.inputValue();
      assert.notEqual(previousId, addedId);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
      await page.reload();
      await page.getByRole("combobox", { name: /^Source/ }).selectOption("draft");
      await page.locator(".os-admin-library-app > summary").click();
      await page.locator(".os-admin-library-group > summary").click();
      await page.locator(".os-admin-draft-open").first().click();
      await expect(strip.getByRole("button")).toHaveCount(3);
      await strip.getByRole("button").nth(1).click();
      await expect(pageId).toHaveValue(previousId);

      // Delete an earlier page, then add again: the new ID must not collide
      // with a surviving page whose number came from the old page count.
      await page.getByRole("button", { name: "Add page", exact: true }).click();
      const survivingId = await pageId.inputValue();
      await strip.getByRole("button").nth(1).click();
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Delete page", exact: true }).click();
      await expect(strip.locator('[aria-pressed="true"]')).toHaveText("1Cover");
      await expect(remove).toBeDisabled();
      await page.getByRole("button", { name: "Add page", exact: true }).click();
      assert.notEqual(await pageId.inputValue(), survivingId);
      await expect(strip.locator('[aria-pressed="true"]')).toHaveText("3Info");
      page.once("dialog", (dialog) => dialog.accept());
      await remove.click();
      page.once("dialog", (dialog) => dialog.accept());
      await remove.click();
      await expect(strip.getByRole("button")).toHaveCount(2);
      await expect(remove).toBeDisabled();
      await strip.getByRole("button").last().click();
      await expect(remove).toBeDisabled();
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
      await browser.close();
    }
  });
}
