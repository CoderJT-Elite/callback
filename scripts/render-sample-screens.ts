import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const SAMPLE_TEXT = `USPS Notification: Parcel shipment on hold. Update billing information at usps-address-update.xyz to schedule redelivery. Ref #84920`;

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample Screenshot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body {
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .phone {
      width: 380px;
      height: 640px;
      background: #ffffff;
      border-radius: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 8px solid #1e293b;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .notch {
      width: 140px;
      height: 24px;
      background: #1e293b;
      margin: 0 auto;
      border-bottom-left-radius: 14px;
      border-bottom-right-radius: 14px;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }
    .watermark {
      position: absolute;
      top: 36px;
      right: 16px;
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
      border: 1px solid #dc2626;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 3px 8px;
      border-radius: 6px;
      z-index: 20;
    }
    .header {
      padding: 45px 20px 15px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }
    .sender-avatar {
      width: 44px;
      height: 44px;
      background: #cbd5e1;
      border-radius: 50%;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #475569;
      font-weight: 600;
    }
    .sender-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .sender-number {
      font-size: 12px;
      color: #64748b;
    }
    .chat-body {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 12px;
      background: #ffffff;
    }
    .timestamp {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .bubble {
      background: #e2e8f0;
      color: #0f172a;
      padding: 14px 16px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      max-width: 90%;
      font-size: 14px;
      line-height: 1.45;
    }
    .link {
      color: #0284c7;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="phone">
    <div class="notch"></div>
    <div class="watermark">SAMPLE</div>
    <div class="header">
      <div class="sender-avatar">?</div>
      <div class="sender-name">Unknown Sender</div>
      <div class="sender-number">+1 (888) 555-0199</div>
    </div>
    <div class="chat-body">
      <div class="timestamp">Today 2:41 PM</div>
      <div class="bubble">
        USPS Notification: Parcel shipment on hold. Update billing information at <span class="link">usps-address-update.xyz</span> to schedule redelivery. Ref #84920
      </div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const screensDir = path.resolve(process.cwd(), "data", "samples", "screens");
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  const publicSamplesDir = path.resolve(process.cwd(), "public", "samples");
  if (!fs.existsSync(publicSamplesDir)) {
    fs.mkdirSync(publicSamplesDir, { recursive: true });
  }

  console.log("Launching headless browser to render sample screenshot...");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 500, height: 750 } });

  await page.setContent(HTML_TEMPLATE);
  await page.waitForTimeout(500);

  const phoneElement = await page.$(".phone");
  if (phoneElement) {
    const outPath1 = path.join(screensDir, "sample-screenshot.png");
    const outPath2 = path.join(publicSamplesDir, "sample-screenshot.png");

    await phoneElement.screenshot({ path: outPath1 });
    await phoneElement.screenshot({ path: outPath2 });

    console.log(`Rendered sample screenshot to:\n  - ${outPath1}\n  - ${outPath2}`);
  }

  await browser.close();
}

main().catch(err => {
  console.error("Failed to render sample screenshot:", err);
  process.exit(1);
});
