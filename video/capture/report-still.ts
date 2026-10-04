import { chromium } from "playwright";
import fs from "fs";
import path from "path";

// Captures the real /report page filled from the saved package-delivery example.
const BASE = process.env.BASE_URL || "http://localhost:3100";
const sample = JSON.parse(fs.readFileSync(path.resolve("data/samples/package-delivery.json"), "utf-8"));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  await page.goto(BASE + "/");
  await page.evaluate((s) => {
    sessionStorage.setItem(
      "callback_report_data",
      JSON.stringify({
        timestamp: "2026-10-03 (saved example)",
        verdict: s.result.verdict,
        evidences: s.result.evidences,
        extraction: s.result.extraction,
        inputText: s.input_text,
        officialChannel: s.result.verdict.official_channel,
      })
    );
  }, sample);
  await page.goto(BASE + "/report");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.resolve("video/assets/stills/10-incident-report-view.png") });
  await browser.close();
  console.log("saved report still");
})();
