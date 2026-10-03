import { test, expect } from "@playwright/test";

test("smoke test loads home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Callback");
});
