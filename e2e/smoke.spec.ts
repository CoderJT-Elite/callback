import { test, expect } from "@playwright/test";

test.describe("Callback E2E Test Suite", () => {
  test("loads landing page with header pitch and input elements", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Don't trust the number in the message");
    await expect(page.locator("textarea#message-input")).toBeVisible();
    await expect(page.getByRole("button", { name: /Check it/i })).toBeVisible();
  });

  test("renders verdict for Sample 1: Bank alert text", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Bank alert text/i }).click();

    // Verify verdict header renders
    await expect(page.locator("h2")).toContainText("DOESN'T MATCH THE REAL WELLS FARGO", {
      timeout: 10000,
    });
    await expect(page.locator("text=RULE_4_PHONE_MISMATCH")).toBeVisible();
  });

  test("renders verdict for Sample 2: Package delivery", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Package delivery/i }).click();

    await expect(page.locator("h2")).toContainText("DOESN'T MATCH THE REAL USPS", {
      timeout: 10000,
    });
    await expect(page.locator("text=RULE_3_STRONG_MISMATCH")).toBeVisible();
  });

  test("renders verdict for Sample 3: Recruiter job offer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Recruiter job offer/i }).click();

    await expect(page.locator("h2")).toContainText("DOESN'T MATCH THE REAL AMAZON", {
      timeout: 10000,
    });
    await expect(page.locator("text=RULE_3_STRONG_MISMATCH")).toBeVisible();
  });

  test("renders verdict for Sample 4: Real bank alert (Legitimate)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Real bank alert/i }).click();

    await expect(page.locator("h2")).toContainText("MATCHES THE REAL WELLS FARGO", {
      timeout: 10000,
    });
    await expect(page.locator("text=RULE_5_ALL_OFFICIAL_MATCH")).toBeVisible();
  });

  test("renders verdict for Sample 5: Screenshot sample", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Screenshot sample/i }).click();

    await expect(page.locator("h2")).toContainText("DOESN'T MATCH THE REAL USPS", {
      timeout: 10000,
    });
  });

  test("live paste check streams trace and renders receipt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    const input = page.locator("textarea#message-input");
    await input.fill(
      "USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery.xyz. Call 888-555-0142."
    );
    await page.getByRole("button", { name: /Check it/i }).click();

    // Check that live trace appears
    await expect(page.locator("text=Live Investigation Trace")).toBeVisible({ timeout: 10000 });

    // Check that final verdict is rendered
    await expect(page.locator("h2")).toContainText("DOESN'T MATCH THE REAL USPS", {
      timeout: 45000,
    });
  });

  test("responsive layout at 360px mobile width without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // No horizontal overflow
  });

  test("loads how-it-works page", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.locator("h1")).toContainText("How Callback Works");
    await expect(page.locator("svg[role=img]").first()).toBeVisible();
  });
});
