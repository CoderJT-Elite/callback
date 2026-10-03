import * as cheerio from "cheerio";
import { safeFetch } from "../net/safeFetch";
import { extractPhones } from "../extract/phones";
import { getSnapshotForOrg } from "./snapshot";
import { ResolvedOrg } from "../entity/resolve";

export interface OfficialPageResult {
  url: string;
  phones: string[];
  text_excerpt: string;
  is_snapshot: boolean;
  fetched_at: string;
}

export interface OfficialEvidenceResult {
  pages: OfficialPageResult[];
  all_phones: string[];
  source_note: string;
}

/**
 * Extracts visible text from an HTML document.
 */
export function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, svg, header").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Gathers official contact page evidence for an organization.
 * Tries live fetch first (2.5s timeout); falls back to pre-recorded snapshot.
 */
export async function gatherOfficialEvidence(org: ResolvedOrg): Promise<OfficialEvidenceResult> {
  const pagesToFetch = org.contact_pages.length > 0
    ? org.contact_pages
    : org.official_domains.map(d => `https://${d}/contact`);

  const results: OfficialPageResult[] = [];
  const snapshot = getSnapshotForOrg(org.id);

  // Parallel live fetch with 2500ms timeout
  const fetchPromises = pagesToFetch.map(async (url) => {
    try {
      const res = await safeFetch(url, { timeoutMs: 2500 });
      if (res.status >= 200 && res.status < 400) {
        const html = await res.text();
        const text = extractVisibleText(html);
        const phones = extractPhones(text);
        const excerpt = text.slice(0, 1000);

        return {
          url,
          phones,
          text_excerpt: excerpt,
          is_snapshot: false,
          fetched_at: new Date().toISOString().split("T")[0],
        };
      }
    } catch {
      // Live fetch failed/timed out, will check snapshot below
    }
    return null;
  });

  const liveResults = await Promise.all(fetchPromises);

  for (let i = 0; i < pagesToFetch.length; i++) {
    const live = liveResults[i];
    if (live) {
      results.push(live);
    } else if (snapshot) {
      // Find matching snapshot page
      const snapPage = snapshot.contact_pages.find(p => p.url === pagesToFetch[i]) || snapshot.contact_pages[0];
      if (snapPage) {
        results.push({
          url: snapPage.url,
          phones: snapPage.phones,
          text_excerpt: snapPage.text_excerpt,
          is_snapshot: true,
          fetched_at: snapPage.fetched_at,
        });
      }
    }
  }

  // If live fetch completely failed and we have a snapshot with pages not yet in results
  if (results.length === 0 && snapshot) {
    for (const snapPage of snapshot.contact_pages) {
      results.push({
        url: snapPage.url,
        phones: snapPage.phones,
        text_excerpt: snapPage.text_excerpt,
        is_snapshot: true,
        fetched_at: snapPage.fetched_at,
      });
    }
  }

  const allPhones = Array.from(new Set(results.flatMap(r => r.phones)));
  const isAnySnapshot = results.some(r => r.is_snapshot);
  const sourceNote = isAnySnapshot
    ? `Snapshot contact pages (fetched ${results[0]?.fetched_at || "2026-10-03"})`
    : `Live contact pages fetched ${new Date().toISOString().split("T")[0]}`;

  return {
    pages: results,
    all_phones: allPhones,
    source_note: sourceNote,
  };
}
