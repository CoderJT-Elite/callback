import { findCuratedOrg } from "./curated";
import { resolveWikidataOrg } from "./wikidata";
import { checkDomainAge } from "../checks/rdap";

export interface ResolvedOrg {
  id: string;
  name: string;
  wikidata_qid?: string;
  official_domains: string[];
  contact_pages: string[];
  source: "curated" | "wikidata" | "none";
  source_note: string;
}

const MIN_WIKIDATA_DOMAIN_AGE_DAYS = 365;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(inc|llc|corp|corporation|co|company|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The Wikidata label must contain the claimed name or vice versa (after normalization). */
export function labelMatches(label: string, claimed: string): boolean {
  const a = normalizeName(label);
  const b = normalizeName(claimed);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Resolves a claimed sender name to an organization and its official domains.
 * Prioritizes the hand-checked curated list, falls back to live Wikidata API.
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

  // 2. Wikidata lookup. Anyone can edit Wikidata (Citigroup's P856 pointed at a 45-day-old
  // unrelated domain on 2026-10-03), so only accept an organization whose label matches the
  // claimed name and whose P856 domain has been registered for at least a year.
  const wikidata = await resolveWikidataOrg(claimedName);
  if (wikidata && wikidata.official_domain && wikidata.is_org && labelMatches(wikidata.name, claimedName)) {
    const age = await checkDomainAge(wikidata.official_domain);
    if (age.status !== "active" || age.age_days === null || age.age_days < MIN_WIKIDATA_DOMAIN_AGE_DAYS) {
      return null;
    }
    return {
      id: `wikidata-${wikidata.qid}`,
      name: wikidata.name,
      wikidata_qid: wikidata.qid,
      official_domains: [wikidata.official_domain],
      contact_pages: wikidata.official_website ? [wikidata.official_website] : [],
      source: "wikidata",
      source_note: `domain from Wikidata P856 (${wikidata.qid}), fetched live; registered ${age.age_days} days ago (RDAP)`,
    };
  }

  return null;
}
