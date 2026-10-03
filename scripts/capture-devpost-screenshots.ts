import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function capture() {
  const outDir = path.resolve(process.cwd(), "docs/devpost");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // Test at 1280px (desktop) and 360px (mobile)
  const viewports = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 360, height: 740 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    console.log(`Capturing for ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto(`${BASE_URL}/`);

    // 0. Landing hero state
    await page.screenshot({
      path: path.join(outDir, `00-landing-${vp.name}.png`),
      fullPage: false,
    });

    // 1. Sample 1: Bank alert
    await page.getByRole("button", { name: /Bank alert text/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, `01-sample1-bank-alert-${vp.name}.png`),
      fullPage: true,
    });

    // 2. Sample 2: Package delivery
    await page.getByRole("button", { name: /Package delivery/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, `02-sample2-package-delivery-${vp.name}.png`),
      fullPage: true,
    });

    // 3. Sample 3: Recruiter job offer
    await page.getByRole("button", { name: /Recruiter job offer/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, `03-sample3-job-offer-${vp.name}.png`),
      fullPage: true,
    });

    // 4. Sample 4: Real bank alert
    await page.getByRole("button", { name: /Real bank alert/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, `04-sample4-legit-bank-${vp.name}.png`),
      fullPage: true,
    });

    // 5. Sample 5: Screenshot sample
    await page.getByRole("button", { name: /Screenshot sample/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, `05-sample5-screenshot-usps-${vp.name}.png`),
      fullPage: true,
    });

    // 6. Fresh pasted message
    const input = page.locator("textarea#message-input");
    await input.fill(
      "Apple Support: Your iCloud subscription has expired. Update billing immediately at support-appleid-verify.com to avoid data deletion."
    );
    await page.getByRole("button", { name: /Check it/i }).click();
    // Wait for receipt or trace completion
    await page.waitForSelector("h2", { timeout: 30000 });
    await page.screenshot({
      path: path.join(outDir, `06-fresh-paste-apple-${vp.name}.png`),
      fullPage: true,
    });

    // 7. How it works page
    await page.goto(`${BASE_URL}/how-it-works`);
    await page.screenshot({
      path: path.join(outDir, `07-how-it-works-${vp.name}.png`),
      fullPage: true,
    });

    await page.close();
  }

  await browser.close();
  console.log("All screenshots saved to docs/devpost/");
}

capture().catch(console.error);
