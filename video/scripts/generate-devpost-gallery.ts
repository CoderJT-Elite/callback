import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const OUT_DIR = path.resolve(process.cwd(), "docs/devpost/gallery");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}


async function focusResult(page: import("playwright").Page) {
  await page.evaluate(() => document.querySelector("article")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
}

async function run() {
  console.log("=== Generating Devpost Gallery Images ===");
  const browser = await chromium.launch();

  // 1. Capture 5 site-based 1600x900 images
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2, // Retinal clarity
  });

  // Image 1: Hero / Landing
  console.log("1. Capturing 01-hero-landing-1600x900.png...");
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(OUT_DIR, "01-hero-landing-1600x900.png"),
  });

  // Image 2: Mismatch Verdict
  console.log("2. Capturing 02-mismatch-verdict-1600x900.png...");
  await page.getByRole("button", { name: /Package delivery/i }).click();
  await page.waitForTimeout(2500);
  await focusResult(page);
  await page.screenshot({
    path: path.join(OUT_DIR, "02-mismatch-verdict-1600x900.png"),
  });

  // Image 3: Match Verdict
  console.log("3. Capturing 03-match-verdict-1600x900.png...");
  await page.getByRole("button", { name: /Real bank alert/i }).click();
  await page.waitForTimeout(2500);
  await focusResult(page);
  await page.screenshot({
    path: path.join(OUT_DIR, "03-match-verdict-1600x900.png"),
  });

  // Image 4: Incident Response
  console.log("4. Capturing 04-incident-response-1600x900.png...");
  // Click first sample again to get a mismatch verdict
  await page.getByRole("button", { name: /Bank alert text/i }).click();
  await page.waitForTimeout(2000);
  // Look for incident response accordion/button
  const incidentBtn = page.getByRole("button", { name: /Already clicked, replied or paid/i });
  if (await incidentBtn.isVisible()) {
    await incidentBtn.click();
    await page.waitForTimeout(1000);
    await incidentBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 360));
    await page.waitForTimeout(300);
  }
  await page.screenshot({
    path: path.join(OUT_DIR, "04-incident-response-1600x900.png"),
  });

  // Image 5: How It Decides
  console.log("5. Capturing 05-how-it-decides-1600x900.png...");
  await page.goto(`${BASE_URL}/how-it-works`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: path.join(OUT_DIR, "05-how-it-decides-1600x900.png"),
  });

  // 6. Generate 3:2 Thumbnail (1200x800) using real brand identity HTML
  console.log("6. Generating thumbnail-3x2.png (1200x800)...");
  const thumbPage = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
  });

  const iconBase64 = fs.readFileSync(path.resolve(process.cwd(), "app/icon.svg"), "utf-8");
  const iconDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(iconBase64)}`;

  const thumbnailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');
      :root {
        --paper: #F3EEE4;
        --sheet: #FBF8F1;
        --ink: #1C1A17;
        --muted: #6B655A;
        --rule: #D9D1C1;
        --stamp-red: #C23B22;
        --pine: #1F6A4B;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 800px;
        background: var(--paper);
        color: var(--ink);
        font-family: 'IBM Plex Sans', sans-serif;
        padding: 56px 64px;
        position: relative;
        overflow: hidden;
      }
      .bg-grid {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(to right, rgba(217, 209, 193, 0.35) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(217, 209, 193, 0.35) 1px, transparent 1px);
        background-size: 32px 32px;
        pointer-events: none;
      }
      .top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--ink);
        padding-bottom: 24px;
        position: relative;
        z-index: 2;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .brand img {
        width: 44px;
        height: 44px;
      }
      .brand h1 {
        font-family: 'Newsreader', serif;
        font-size: 40px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .track-badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        border: 1.5px solid var(--ink);
        padding: 6px 16px;
        background: var(--sheet);
      }
      .main-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 48px;
        margin-top: 40px;
        position: relative;
        z-index: 2;
      }
      .headline {
        font-family: 'Newsreader', serif;
        font-size: 54px;
        line-height: 1.08;
        font-weight: 600;
        letter-spacing: -0.03em;
        margin-bottom: 24px;
      }
      .subhead {
        font-size: 21px;
        line-height: 1.45;
        color: var(--muted);
        margin-bottom: 32px;
      }
      .stat-strip {
        display: flex;
        gap: 24px;
        border-top: 1.5px solid var(--rule);
        padding-top: 24px;
      }
      .stat-item {
        flex: 1;
      }
      .stat-val {
        font-family: 'Newsreader', serif;
        font-size: 36px;
        font-weight: 600;
        color: var(--stamp-red);
      }
      .stat-lbl {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px;
        color: var(--muted);
        margin-top: 4px;
      }
      .card-preview {
        background: var(--sheet);
        border: 2px solid var(--ink);
        padding: 32px;
        box-shadow: 6px 6px 0px rgba(28, 26, 23, 0.08);
        position: relative;
      }
      .card-stamp {
        position: absolute;
        top: -30px;
        right: 20px;
        border: 3.5px solid var(--stamp-red);
        color: var(--stamp-red);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 22px;
        font-weight: 700;
        padding: 8px 18px;
        letter-spacing: 0.08em;
        transform: rotate(-7deg);
        background: rgba(251, 248, 241, 0.95);
      }
      .card-title {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        color: var(--muted);
        letter-spacing: 0.08em;
        margin-bottom: 12px;
      }
      .card-msg {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 15px;
        border-left: 4px solid var(--stamp-red);
        padding-left: 14px;
        margin-bottom: 24px;
        line-height: 1.4;
      }
      .ledger {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-top: 1.5px solid var(--rule);
        padding-top: 18px;
      }
      .ledger-row {
        display: flex;
        justify-content: space-between;
      }
      .row-err { color: var(--stamp-red); }
      .row-ok { color: var(--pine); font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="bg-grid"></div>
    <div class="top-row">
      <div class="brand">
        <img src="${iconDataUri}" alt="Callback" />
        <h1>Callback</h1>
      </div>
      <div class="track-badge">FORGEHACKS 2026 · CYBERSECURITY</div>
    </div>
    <div class="main-grid">
      <div>
        <h2 class="headline">Don't trust the number in the message. Callback finds the real one.</h2>
        <p class="subhead">Checks suspicious texts, emails, and screenshots against official directories with deterministic receipts.</p>
        <div class="stat-strip">
          <div class="stat-item">
            <div class="stat-val">$3.5B</div>
            <div class="stat-lbl">FTC imposter scam losses, 2025</div>
          </div>
          <div class="stat-item">
            <div class="stat-val" style="color: var(--pine);">0 of 15</div>
            <div class="stat-lbl">legit test messages flagged (synthetic)</div>
          </div>
          <div class="stat-item">
            <div class="stat-val" style="color: var(--ink);">7 Rules</div>
            <div class="stat-lbl">AI never decides verdict</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card-preview">
          <div class="card-stamp">DOESN'T MATCH</div>
          <div class="card-title">INCOMING TEXT · CLAIMED SENDER: USPS</div>
          <div class="card-msg">"USPS: Your package #US9402283 could not be delivered. Pay $1.99 redelivery fee within 24 hours at usps-redelivery-notice.xyz"</div>
          <div class="ledger">
            <div class="ledger-row row-err">
              <span>[E1] Link: usps-redelivery-notice.xyz</span>
              <span>✗ NOT OFFICIAL</span>
            </div>
            <div class="ledger-row row-err">
              <span>[E2] Payment demand: $1.99 fee</span>
              <span>! FLAGGED</span>
            </div>
            <div class="ledger-row row-ok">
              <span>Real USPS: usps.com · 1-800-275-8777</span>
              <span>✓ DO THIS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await thumbPage.setContent(thumbnailHtml);
  await thumbPage.screenshot({
    path: path.join(OUT_DIR, "thumbnail-3x2.png"),
  });
  console.log("  ✓ Created thumbnail-3x2.png");

  // 7. Generate Cover Art (1600x900)
  console.log("7. Generating cover-art.png (1600x900)...");
  const coverPage = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
  });

  const coverHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');
      :root {
        --paper: #F3EEE4;
        --sheet: #FBF8F1;
        --ink: #1C1A17;
        --muted: #6B655A;
        --rule: #D9D1C1;
        --stamp-red: #C23B22;
        --pine: #1F6A4B;
        --ochre: #96640A;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1600px;
        height: 900px;
        background: var(--paper);
        color: var(--ink);
        font-family: 'IBM Plex Sans', sans-serif;
        padding: 64px 80px;
        position: relative;
        overflow: hidden;
      }
      .bg-grid {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(to right, rgba(217, 209, 193, 0.35) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(217, 209, 193, 0.35) 1px, transparent 1px);
        background-size: 32px 32px;
        pointer-events: none;
      }
      .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2.5px solid var(--ink);
        padding-bottom: 28px;
        position: relative;
        z-index: 2;
      }
      .brand-lockup {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .brand-lockup img {
        width: 52px;
        height: 52px;
      }
      .brand-title {
        font-family: 'Newsreader', serif;
        font-size: 48px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .brand-meta {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 15px;
        font-weight: 600;
        border: 1.5px solid var(--ink);
        padding: 8px 20px;
        background: var(--sheet);
        display: flex;
        gap: 16px;
      }
      .content-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 64px;
        margin-top: 56px;
        position: relative;
        z-index: 2;
      }
      .headline {
        font-family: 'Newsreader', serif;
        font-size: 64px;
        line-height: 1.05;
        font-weight: 600;
        letter-spacing: -0.03em;
        margin-bottom: 24px;
      }
      .subhead {
        font-size: 24px;
        line-height: 1.45;
        color: var(--muted);
        margin-bottom: 40px;
      }
      .badges-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 40px;
      }
      .badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        background: var(--sheet);
        border: 1px solid var(--rule);
        padding: 6px 14px;
      }
      .footer-strip {
        border-top: 1.5px solid var(--rule);
        padding-top: 28px;
        display: flex;
        gap: 36px;
      }
      .stat-block {
        flex: 1;
      }
      .stat-big {
        font-family: 'Newsreader', serif;
        font-size: 42px;
        font-weight: 600;
        color: var(--stamp-red);
      }
      .stat-desc {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        color: var(--muted);
        margin-top: 6px;
        line-height: 1.35;
      }
      .receipt-panel {
        background: var(--sheet);
        border: 2px solid var(--ink);
        padding: 36px;
        box-shadow: 8px 8px 0px rgba(28, 26, 23, 0.08);
        position: relative;
      }
      .stamp-overlay {
        position: absolute;
        top: -40px;
        right: 28px;
        border: 4px solid var(--stamp-red);
        color: var(--stamp-red);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 26px;
        font-weight: 700;
        padding: 10px 24px;
        letter-spacing: 0.08em;
        transform: rotate(-6deg);
        background: rgba(251, 248, 241, 0.96);
      }
      .receipt-tag {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: var(--muted);
        margin-bottom: 16px;
        letter-spacing: 0.05em;
      }
      .msg-box {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 17px;
        border-left: 5px solid var(--stamp-red);
        padding-left: 18px;
        margin-bottom: 28px;
        line-height: 1.45;
      }
      .ledger-list {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-top: 1.5px solid var(--rule);
        padding-top: 24px;
      }
      .ledger-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .entry-bad { color: var(--stamp-red); }
      .entry-good { color: var(--pine); font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="bg-grid"></div>
    <div class="header-bar">
      <div class="brand-lockup">
        <img src="${iconDataUri}" alt="Callback" />
        <div class="brand-title">Callback</div>
      </div>
      <div class="brand-meta">
        <span>FORGEHACKS 2026</span>
        <span>·</span>
        <span>CYBERSECURITY TRACK</span>
      </div>
    </div>
    <div class="content-grid">
      <div>
        <h1 class="headline">Don't trust the number in the message. Callback finds the real one.</h1>
        <p class="subhead">Checks a message's phone, link and email against the sender's real contact channels, and shows the evidence.</p>
        <div class="badges-row">
          <div class="badge">✓ Fixed 7-Rule Engine</div>
          <div class="badge">✓ 27 Curated US Institutions</div>
          <div class="badge">✓ SSRF-Safe Network Fetch</div>
          <div class="badge">✓ Gemini Cited Explanations [E1]</div>
          <div class="badge">✓ Multimodal Screenshot Reading</div>
        </div>
        <div class="footer-strip">
          <div class="stat-block">
            <div class="stat-big">$3.5 Billion</div>
            <div class="stat-desc">FTC imposter scam losses, 2025</div>
          </div>
          <div class="stat-block">
            <div class="stat-big" style="color: var(--pine);">0 of 15</div>
            <div class="stat-desc">legit test messages flagged (our synthetic set)</div>
          </div>
          <div class="stat-block">
            <div class="stat-big" style="color: var(--ink);">7 rules</div>
            <div class="stat-desc">decide the verdict. The AI never does</div>
          </div>
        </div>
      </div>
      <div>
        <div class="receipt-panel">
          <div class="stamp-overlay">DOESN'T MATCH</div>
          <div class="receipt-tag">SUSPICIOUS SMS · CLAIMED SENDER: USPS</div>
          <div class="msg-box">
            "USPS: Your package #US9402283 could not be delivered. Pay $1.99 redelivery fee within 24 hours at usps-redelivery-notice.xyz"
          </div>
          <div class="ledger-list">
            <div class="ledger-entry entry-bad">
              <span>[E1] Link: usps-redelivery-notice.xyz</span>
              <span>✗ NOT OFFICIAL</span>
            </div>
            <div class="ledger-entry entry-bad">
              <span>[E2] Payment demand: $1.99 fee</span>
              <span>! FLAGGED</span>
            </div>
            <div class="ledger-entry entry-good">
              <span>Real USPS: usps.com · 1-800-275-8777</span>
              <span>✓ DO THIS INSTEAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await coverPage.setContent(coverHtml);
  await coverPage.screenshot({
    path: path.join(OUT_DIR, "cover-art.png"),
  });
  // Also copy to docs/devpost/cover-art.png and cover-art-raw.png to overwrite legacy tech/glow images
  fs.copyFileSync(path.join(OUT_DIR, "cover-art.png"), path.resolve(process.cwd(), "docs/devpost/cover-art.png"));
  fs.copyFileSync(path.join(OUT_DIR, "cover-art.png"), path.resolve(process.cwd(), "docs/devpost/cover-art-raw.png"));
  console.log("  ✓ Created cover-art.png and replaced legacy docs/devpost/cover-art.png");

  await browser.close();
  console.log("=== All Devpost Gallery Assets Successfully Generated! ===");
}

run().catch(console.error);
