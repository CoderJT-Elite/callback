import { chromium, Browser, BrowserContext, Page } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const VIDEO_DIR = path.resolve(import.meta.dirname, "..");
const CLIPS_DIR = path.join(VIDEO_DIR, "assets", "clips");
const STILLS_DIR = path.join(VIDEO_DIR, "assets", "stills");

fs.mkdirSync(CLIPS_DIR, { recursive: true });
fs.mkdirSync(STILLS_DIR, { recursive: true });

async function injectCursor(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      if (document.getElementById("playwright-cursor")) return;
      const cursor = document.createElement("div");
      cursor.id = "playwright-cursor";
      cursor.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 18px; height: 18px;
        border-radius: 50%;
        background: rgba(194, 59, 34, 0.75);
        border: 2px solid #1C1A17;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: transform 0.08s ease-out, background 0.15s ease;
      `;
      document.body.appendChild(cursor);

      window.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      });
      window.addEventListener("mousedown", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(0.75)";
        cursor.style.background = "rgba(31, 106, 75, 0.9)";
      });
      window.addEventListener("mouseup", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(1)";
        cursor.style.background = "rgba(194, 59, 34, 0.75)";
      });
    });
  });
}

async function smoothMoveAndClick(page: Page, selector: string) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  await locator.waitFor({ state: "visible", timeout: 10000 });
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click();
    return;
  }

  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;

  // Smooth steps
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.waitForTimeout(100);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

async function humanType(page: Page, selector: string, text: string) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  await page.waitForTimeout(200);
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * 20) + 15 });
  }
  await page.waitForTimeout(300);
}

async function runCapture() {
  console.log(`[Capture] Starting real site capture against ${BASE_URL}...`);
  const browser = await chromium.launch();

  // 1. Desktop Landscape 1920x1080 Session
  console.log("[Capture] 1. Recording 1920x1080 master flow...");
  const tempRecordDir = path.join(CLIPS_DIR, "raw_desktop");
  fs.mkdirSync(tempRecordDir, { recursive: true });

  const contextDesktop = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: tempRecordDir,
      size: { width: 1920, height: 1080 },
    },
    colorScheme: "light",
  });

  const page = await contextDesktop.newPage();
  await injectCursor(page);

  // Navigate home
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(STILLS_DIR, "01-landing-hero-1920.png") });

  // Sample 1: Package delivery (USPS Scam)
  console.log("[Capture] Clicking Package delivery (USPS sample)...");
  await smoothMoveAndClick(page, "button:has-text('Package delivery')");
  await page.waitForSelector("article", { timeout: 15000 });
  await page.waitForTimeout(2500); // hold >= 2s on verdict
  await page.screenshot({ path: path.join(STILLS_DIR, "02-sample-usps-mismatch.png") });

  // Sample 2: Real bank alert (Legit match)
  console.log("[Capture] Clicking Real bank alert (Wells Fargo match)...");
  await smoothMoveAndClick(page, "button:has-text('Real bank alert')");
  await page.waitForSelector("article", { timeout: 15000 });
  await page.waitForTimeout(2500); // hold >= 2s on verdict
  await page.screenshot({ path: path.join(STILLS_DIR, "03-sample-bank-matches.png") });

  // Sample 3: Screenshot sample
  console.log("[Capture] Clicking Screenshot sample...");
  await smoothMoveAndClick(page, "button:has-text('Screenshot sample')");
  await page.waitForSelector("article", { timeout: 15000 });
  await page.waitForTimeout(2500); // hold >= 2s
  await page.screenshot({ path: path.join(STILLS_DIR, "04-sample-screenshot.png") });

  // Sample 4: Recruiter job offer
  console.log("[Capture] Clicking Recruiter job offer...");
  await smoothMoveAndClick(page, "button:has-text('Recruiter job offer')");
  await page.waitForSelector("article", { timeout: 15000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(STILLS_DIR, "05-sample-recruiter.png") });

  // Sample 5: Bank alert text
  console.log("[Capture] Clicking Bank alert text...");
  await smoothMoveAndClick(page, "button:has-text('Bank alert text')");
  await page.waitForSelector("article", { timeout: 15000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(STILLS_DIR, "06-sample-bank-alert.png") });

  // Incident Panel interaction
  console.log("[Capture] Interacting with Incident Response panel...");
  const incidentButton = page.locator("button:has-text('Already clicked, replied or paid?')").first();
  if (await incidentButton.isVisible()) {
    await smoothMoveAndClick(page, "button:has-text('Already clicked, replied or paid?')");
    await page.waitForTimeout(800);
  }
  // Click credit/debit card action if visible
  const cardOption = page.locator("label:has-text('Credit or debit card')").first();
  if (await cardOption.isVisible()) {
    await cardOption.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(STILLS_DIR, "07-incident-panel.png") });

  // Live paste check (synthetic, no real personal data)
  console.log("[Capture] Performing live paste check...");
  const textarea = page.locator("textarea#message-input");
  await textarea.scrollIntoViewIfNeeded();
  await textarea.fill("");
  await humanType(
    page,
    "textarea#message-input",
    "USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery-notice.xyz to avoid return."
  );
  await page.waitForTimeout(500);
  await smoothMoveAndClick(page, "button:has-text('Check it')");
  // Wait for trace / receipt
  try {
    await page.waitForSelector("article", { timeout: 25000 });
  } catch (err) {
    console.warn("[Capture] Live check waited up to timeout");
  }
  await page.waitForTimeout(3000); // hold >= 2s
  await page.screenshot({ path: path.join(STILLS_DIR, "08-live-paste-verdict.png") });

  // Navigate to /how-it-works
  console.log("[Capture] Capturing /how-it-works...");
  await page.goto(`${BASE_URL}/how-it-works`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(STILLS_DIR, "09-how-it-works.png"), fullPage: true });

  // Navigate to /report view
  console.log("[Capture] Capturing /report view...");
  await page.goto(`${BASE_URL}/report`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(STILLS_DIR, "10-incident-report-view.png"), fullPage: true });

  // Dark mode test
  console.log("[Capture] Capturing dark mode...");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(STILLS_DIR, "11-dark-mode-landing.png") });

  const videoPathDesktop = await page.video()?.path();
  await contextDesktop.close();

  if (videoPathDesktop && fs.existsSync(videoPathDesktop)) {
    const dest = path.join(CLIPS_DIR, "desktop-1920x1080.webm");
    fs.copyFileSync(videoPathDesktop, dest);
    console.log(`[Capture] Saved master desktop recording to ${dest}`);
  }

  // 2. Vertical 1080x1920 Session
  console.log("[Capture] 2. Recording 1080x1920 portrait cut...");
  const tempRecordDirVert = path.join(CLIPS_DIR, "raw_vertical");
  fs.mkdirSync(tempRecordDirVert, { recursive: true });

  const contextVertical = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: {
      dir: tempRecordDirVert,
      size: { width: 1080, height: 1920 },
    },
    colorScheme: "light",
  });

  const pageVert = await contextVertical.newPage();
  await injectCursor(pageVert);
  await pageVert.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await pageVert.waitForTimeout(1000);

  // Click Package delivery sample
  await smoothMoveAndClick(pageVert, "button:has-text('Package delivery')");
  await pageVert.waitForSelector("article", { timeout: 15000 });
  await pageVert.waitForTimeout(3000);
  await pageVert.screenshot({ path: path.join(STILLS_DIR, "12-vertical-mismatch-verdict.png") });

  // Click Real bank alert
  await smoothMoveAndClick(pageVert, "button:has-text('Real bank alert')");
  await pageVert.waitForSelector("article", { timeout: 15000 });
  await pageVert.waitForTimeout(3000);

  const videoPathVert = await pageVert.video()?.path();
  await contextVertical.close();

  if (videoPathVert && fs.existsSync(videoPathVert)) {
    const destVert = path.join(CLIPS_DIR, "vertical-1080x1920.webm");
    fs.copyFileSync(videoPathVert, destVert);
    console.log(`[Capture] Saved vertical recording to ${destVert}`);
  }

  // 3. Mobile 360x740 Screenshots
  console.log("[Capture] 3. Mobile viewport stills (360x740)...");
  const contextMobile = await browser.newContext({
    viewport: { width: 360, height: 740 },
    colorScheme: "light",
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(STILLS_DIR, "13-mobile-360-landing.png") });

  const pkgButton = pageMobile.locator("button:has-text('Package delivery')").first();
  await pkgButton.scrollIntoViewIfNeeded();
  await pkgButton.click();
  try {
    await pageMobile.waitForSelector("article", { timeout: 15000 });
    await pageMobile.waitForTimeout(2500);
    await pageMobile.screenshot({ path: path.join(STILLS_DIR, "14-mobile-360-verdict.png") });
  } catch (err) {
    console.warn("[Capture] Mobile article selector timed out, taking fallback screenshot");
    await pageMobile.screenshot({ path: path.join(STILLS_DIR, "14-mobile-360-verdict.png") });
  }

  await contextMobile.close();
  await browser.close();

  // Clean up raw recording temp folders
  try {
    fs.rmSync(tempRecordDir, { recursive: true, force: true });
    fs.rmSync(tempRecordDirVert, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }

  console.log(`[Capture] Complete! All clips saved to ${CLIPS_DIR} and stills to ${STILLS_DIR}`);
}

runCapture().catch((err) => {
  console.error("[Capture Error]", err);
  process.exit(1);
});
