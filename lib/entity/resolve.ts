import { findCuratedOrg } from "./curated";
import { resolveWikidataOrg } from "./wikidata";

export interface ResolvedOrg {
  id: string;
  name: string;
  wikidata_qid?: string;
  official_domains: string[];
  contact_pages: string[];
  source: "curated" | "wikidata" | "none";
  source_note: string;
}

/**
 * Resolves a claimed sender name to an organization and its official domains.
 * Prioritizes the verified curated database, falls back to live Wikidata API.
 * Never uses links from within the message.
 */
export async function resolveOrganization(claimedName: string | null): Promise<ResolvedOrg | null> {
  if (!claimedName || typeof claimedName !== "string") return null;

  // 1. Curated list lookup
  const curated = findCuratedOrg(claimedName);
  if (curated) {
    return {
      id: curated.id,
      name: curated.name,
      wikidata_qid: curated.wikidata,
      official_domains: curated.official_domains,
      contact_pages: curated.contact_pages,
      source: "curated",
      source_note: curated.source_notes,
    };
  }

  // 2. Wikidata lookup
  const wikidata = await resolveWikidataOrg(claimedName);
  if (wikidata && wikidata.official_domain) {
    return {
      id: `wikidata-${wikidata.qid}`,
      name: wikidata.name,
      wikidata_qid: wikidata.qid,
      official_domains: [wikidata.official_domain],
      contact_pages: wikidata.official_website ? [wikidata.official_website] : [],
      source: "wikidata",
      source_note: `domains from Wikidata P856 (${wikidata.qid}) fetched live`,
    };
  }

  return null;
}
