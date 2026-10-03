import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN_DIR = "C:/Users/natuj/.gemini/build agent/brain/19e0bef4-accf-4416-b8d2-ea2af7415521";

const ASSETS = {
  logo: path.join(BRAIN_DIR, "logo_mark_1791064377497.jpg"),
  hero: path.join(BRAIN_DIR, "hero_illustration_1791064393506.jpg"),
  og: path.join(BRAIN_DIR, "og_background_1791064407005.jpg"),
  devpost: path.join(BRAIN_DIR, "devpost_cover_1791064420942.jpg"),
};

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Helper to convert local image to base64 data url
  const toDataUrl = (filePath: string) => {
    const buf = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  };

  const logoData = toDataUrl(ASSETS.logo);
  const heroData = toDataUrl(ASSETS.hero);
  const ogData = toDataUrl(ASSETS.og);
  const devpostData = toDataUrl(ASSETS.devpost);

  // 1. Process Logo -> app/icon.png (512x512) and app/apple-icon.png (180x180) and public/logo.png
  console.log("Processing logo icons...");
  await page.setContent(`
    <html>
      <body style="margin:0;padding:0;background:transparent;">
        <canvas id="c512" width="512" height="512"></canvas>
        <canvas id="c180" width="180" height="180"></canvas>
        <canvas id="c64" width="64" height="64"></canvas>
        <img id="logo" src="${logoData}" style="display:none;" />
      </body>
    </html>
  `);

  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const img = document.getElementById("logo") as HTMLImageElement;
      img.onload = () => {
        const c512 = document.getElementById("c512") as HTMLCanvasElement;
        const ctx512 = c512.getContext("2d")!;
        ctx512.drawImage(img, 0, 0, 512, 512);

        const c180 = document.getElementById("c180") as HTMLCanvasElement;
        const ctx180 = c180.getContext("2d")!;
        ctx180.drawImage(img, 0, 0, 180, 180);

        const c64 = document.getElementById("c64") as HTMLCanvasElement;
        const ctx64 = c64.getContext("2d")!;
        ctx64.drawImage(img, 0, 0, 64, 64);

        resolve();
      };
      if (img.complete) img.onload!(new Event("load"));
    });
  });

  const b512 = await page.locator("#c512").screenshot();
  fs.writeFileSync(path.resolve("app/icon.png"), b512);
  fs.writeFileSync(path.resolve("public/logo.png"), b512);

  const b180 = await page.locator("#c180").screenshot();
  fs.writeFileSync(path.resolve("app/apple-icon.png"), b180);

  const b64 = await page.locator("#c64").screenshot();
  fs.writeFileSync(path.resolve("public/favicon.ico"), b64);

  // 2. Process Hero Illustration -> public/hero-illustration.png (1600x900)
  console.log("Processing hero illustration...");
  await page.setContent(`
    <html>
      <body style="margin:0;padding:0;">
        <canvas id="heroCanvas" width="1600" height="900"></canvas>
        <img id="hero" src="${heroData}" style="display:none;" />
      </body>
    </html>
  `);

  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const img = document.getElementById("hero") as HTMLImageElement;
      img.onload = () => {
        const c = document.getElementById("heroCanvas") as HTMLCanvasElement;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 1600, 900);
        resolve();
      };
      if (img.complete) img.onload!(new Event("load"));
    });
  });

  const heroPng = await page.locator("#heroCanvas").screenshot();
  fs.writeFileSync(path.resolve("public/hero-illustration.png"), heroPng);

  // 3. Process OG Image -> app/opengraph-image.png (1200x630) with crisp composite typography
  console.log("Compositing Open Graph image (1200x630)...");
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body { width: 1200px; height: 630px; position: relative; overflow: hidden; background: #090d16; }
          .bg { position: absolute; inset: 0; width: 1200px; height: 630px; object-fit: cover; opacity: 0.45; }
          .overlay {
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(9, 13, 22, 0.95) 0%, rgba(9, 13, 22, 0.75) 55%, rgba(6, 78, 59, 0.4) 100%);
            display: flex; flex-direction: column; justify-content: space-between; padding: 60px 80px;
          }
          .top { display: flex; align-items: center; gap: 16px; }
          .logo-img { width: 56px; height: 56px; border-radius: 12px; background: white; padding: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
          .brand { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .badge { font-size: 14px; font-weight: 700; color: #10b981; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 4px 12px; border-radius: 999px; margin-left: auto; font-family: monospace; }
          .center { max-width: 900px; }
          .headline { font-size: 52px; font-weight: 900; color: #ffffff; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 20px; }
          .highlight { color: #34d399; }
          .subhead { font-size: 22px; color: #94a3b8; line-height: 1.45; }
          .footer { display: flex; align-items: center; gap: 32px; font-family: monospace; font-size: 15px; color: #64748b; }
          .pill { color: #e2e8f0; font-weight: 600; display: flex; align-items: center; gap: 8px; }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
        </style>
      </head>
      <body>
        <img class="bg" src="${ogData}" />
        <div class="overlay">
          <div class="top">
            <img class="logo-img" src="${logoData}" />
            <span class="brand">Callback</span>
            <span class="badge">ForgeHacks 2026 · AI + Security</span>
          </div>
          <div class="center">
            <h1 class="headline">Don't trust the number in the message. <span class="highlight">Callback finds the real one.</span></h1>
            <p class="subhead">Deterministic imposter scam verification with Wikidata P856 records and official directory receipts.</p>
          </div>
          <div class="footer">
            <div class="pill"><div class="dot"></div>Deterministic Verdict Rules</div>
            <div>·</div>
            <div class="pill">Wikidata P856 Public Suffix Math</div>
            <div>·</div>
            <div class="pill">Cited Evidence Receipts</div>
          </div>
        </div>
      </body>
    </html>
  `);

  const ogPng = await page.screenshot();
  fs.writeFileSync(path.resolve("app/opengraph-image.png"), ogPng);
  fs.writeFileSync(path.resolve("public/og-background.png"), fs.readFileSync(ASSETS.og));

  // 4. Process Devpost Cover Art -> docs/devpost/cover-art.png (1500x1000, 3:2)
  console.log("Compositing Devpost Cover Art (1500x1000)...");
  await page.setViewportSize({ width: 1500, height: 1000 });
  const sample1Receipt = toDataUrl(path.resolve("docs/devpost/01-sample1-bank-alert-desktop.png"));

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body { width: 1500px; height: 1000px; position: relative; overflow: hidden; background: #0b1120; }
          .bg { position: absolute; inset: 0; width: 1500px; height: 1000px; object-fit: cover; opacity: 0.35; }
          .overlay {
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(11, 17, 32, 0.94) 0%, rgba(11, 17, 32, 0.78) 50%, rgba(15, 23, 42, 0.9) 100%);
            display: flex; flex-direction: column; justify-content: space-between; padding: 70px 90px;
          }
          .header { display: flex; align-items: center; justify-content: space-between; }
          .logo-box { display: flex; align-items: center; gap: 20px; }
          .logo-img { width: 64px; height: 64px; border-radius: 14px; background: white; padding: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          .title { font-size: 38px; font-weight: 800; color: #ffffff; }
          .tag { font-size: 16px; font-weight: 700; color: #34d399; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); padding: 8px 18px; border-radius: 999px; font-family: monospace; }
          .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-top: 20px; }
          .hero-text h1 { font-size: 56px; font-weight: 900; color: #ffffff; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 24px; }
          .hero-text .cyan { color: #38bdf8; }
          .hero-text .emerald { color: #34d399; }
          .hero-text p { font-size: 22px; color: #94a3b8; line-height: 1.5; margin-bottom: 30px; }
          .pills { display: flex; flex-wrap: wrap; gap: 12px; }
          .pill { font-size: 14px; font-weight: 600; font-family: monospace; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; padding: 6px 14px; border-radius: 8px; }
          .screenshot-card {
            border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255,255,255,0.15); transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
          }
          .screenshot-card img { width: 100%; height: auto; display: block; }
          .footer { font-family: monospace; font-size: 16px; color: #64748b; }
        </style>
      </head>
      <body>
        <img class="bg" src="${devpostData}" />
        <div class="overlay">
          <div class="header">
            <div class="logo-box">
              <img class="logo-img" src="${logoData}" />
              <span class="title">Callback</span>
            </div>
            <span class="tag">ForgeHacks 2026 Submission</span>
          </div>

          <div class="main-grid">
            <div class="hero-text">
              <h1>Don't trust the number. <br/><span class="emerald">Callback</span> finds the <span class="cyan">real one.</span></h1>
              <p>Checks suspicious texts, emails, and screenshots against official directories and Wikidata P856 records with deterministic receipts.</p>
              <div class="pills">
                <span class="pill">✓ Deterministic Rules 1-7</span>
                <span class="pill">✓ 27 Curated Orgs</span>
                <span class="pill">✓ SSFR-Protected Fetch</span>
                <span class="pill">✓ Gemini Cited Explanations</span>
                <span class="pill">✓ Incident Response Toolkit</span>
              </div>
            </div>
            <div class="screenshot-card">
              <img src="${sample1Receipt}" />
            </div>
          </div>

          <div class="footer">
            Callback Imposter Verification Engine · Built for ForgeHacks 2026 (AI + Cybersecurity Track)
          </div>
        </div>
      </body>
    </html>
  `);

  const devpostPng = await page.screenshot();
  fs.writeFileSync(path.resolve("docs/devpost/cover-art.png"), devpostPng);
  fs.writeFileSync(path.resolve("docs/devpost/cover-art-raw.png"), fs.readFileSync(ASSETS.devpost));

  await browser.close();
  console.log("All image assets processed and saved successfully!");
}

main().catch(console.error);
