import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import curatedOrgsData from "../data/curated-orgs.json";
import { CuratedOrg, SnapshotData } from "../lib/types";
import { extractPhones } from "../lib/extract/phones";

const curatedOrgs: CuratedOrg[] = curatedOrgsData as CuratedOrg[];
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 CallbackBot/1.0 (+https://github.com/CoderJT-Elite/callback)";

async function fetchPage(url: string): Promise<{ status: number; text: string; phones: string[] }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    const status = res.status;
    if (status >= 200 && status < 400) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $("script, style, noscript, nav, footer, svg, header").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      const phones = extractPhones(text);
      return { status, text, phones };
    }
    return { status, text: "", phones: [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Fetch error for ${url}: ${msg}`);
    return { status: 0, text: "", phones: [] };
  }
}

async function main() {
  const dateStr = "2026-10-03";
  const snapshotsDir = path.resolve(process.cwd(), "data", "snapshots");
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  console.log(`Building snapshots for ${curatedOrgs.length} curated organizations...`);
  const reportRows: Array<{ org: string; url: string; status: number; phonesFound: number }> = [];

  for (const org of curatedOrgs) {
    console.log(`Processing ${org.name} (${org.id})...`);
    const pageSnapshots = [];

    for (const pageUrl of org.contact_pages) {
      const { status, text, phones } = await fetchPage(pageUrl);
      const excerpt = text.slice(0, 1500);

      pageSnapshots.push({
        url: pageUrl,
        fetched_at: dateStr,
        status,
        text_excerpt: excerpt,
        phones,
      });

      reportRows.push({
        org: org.name,
        url: pageUrl,
        status,
        phonesFound: phones.length,
      });
    }

    const snapshotData: SnapshotData = {
      org_id: org.id,
      org_name: org.name,
      official_domains: org.official_domains,
      contact_pages: pageSnapshots,
    };

    const outPath = path.join(snapshotsDir, `${org.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(snapshotData, null, 2), "utf8");
  }

  console.log("\n--- SNAPSHOT REPORT TABLE ---");
  console.table(reportRows);
  console.log(`Snapshots written to ${snapshotsDir}`);
}

main().catch(err => {
  console.error("Snapshot generation failed:", err);
  process.exit(1);
});
