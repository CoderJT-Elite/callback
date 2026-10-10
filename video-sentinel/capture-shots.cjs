// Full-page screenshots of the live app (saved examples), 1500 px wide, used as the "screen window" shots.
// Run from the repo root:  node video-sentinel/capture-shots.cjs [baseUrl]
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(__dirname, "..", "node_modules", "@playwright", "test"));

const BASE = process.argv[2] || "https://callback-lac.vercel.app";
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });

// Rectangles [x, y, w, h] of the parts of the page the video highlights, in screenshot pixels (page coordinates).
async function rects(page) {
  return page.evaluate(() => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; };
    const trace = [...document.querySelectorAll('section[aria-label="Investigation trace"] ol > li')];
    const art = document.querySelector("#result article");
    const evSec = [...document.querySelectorAll("#result section")].find((x) => /What we checked/.test(x.textContent || ""));
    const btn = [...document.querySelectorAll("button")].find((b) => /check it/i.test(b.textContent || ""));
    return {
      msg: R(document.querySelector("textarea")), btn: R(btn), thumb: R(document.querySelector('img[alt*="creenshot"], img[src^="blob:"], img[src^="data:"]')),
      trace: trace.map(R), traceDetail: trace.map((li) => R(li.querySelector("p"))), traceTitle: trace.map((li) => R(li.querySelector("span + div > span"))),
      card: R(art), head: R(document.querySelector("#result article > div:nth-child(2)")), stamp: R(art && art.querySelector(".stamp")), h2: R(document.querySelector("#result h2")),
      dothis: R(document.querySelector("#result section.border-pine")),
      ev: evSec ? [...evSec.querySelectorAll("ol > li")].map(R) : [],
    };
  });
}

async function sample(page, name) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name }).first().click();
  await page.getByRole("button", { name: /check it/i }).first().click();
  await page.waitForSelector("#result h2", { timeout: 60000 });
  await page.waitForTimeout(2500);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const shots = [
    ["Package delivery", "scam.png"],
    ["Real bank alert", "genuine.png"],
    ["Screenshot sample", "image.png"],
  ];
  const boxes = {};
  for (const [name, file] of shots) {
    await sample(page, name);
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    boxes[file.replace(".png", "")] = await rects(page);
    console.log("wrote", file);
  }
  fs.writeFileSync(path.join(__dirname, "boxes.js"), "window.BOXES = " + JSON.stringify(boxes, null, 1) + ";" + String.fromCharCode(10));
  console.log("wrote boxes.js");
  await page.goto(BASE + "/how-it-works", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "how.png"), fullPage: true });
  console.log("wrote how.png");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
