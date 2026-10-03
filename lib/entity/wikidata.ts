import { extractRegistrableDomain } from "../extract/urls";

export interface WikidataOrgResult {
  qid: string;
  name: string;
  description?: string;
  official_website: string | null;
  official_domain: string | null;
  is_org: boolean;
}

const USER_AGENT = "CallbackSecurityBot/1.0 (+https://github.com/CoderJT-Elite/callback)";

// Common Wikidata P31 items for organizations/companies/agencies
const VALID_ORG_P31 = new Set([
  "Q4830453", // business enterprise
  "Q783794",  // company
  "Q43229",   // organization
  "Q327333",  // government agency
  "Q2659904", // public enterprise
  "Q891723",  // public company
  "Q167037",  // corporation
  "Q6881511", // enterprise
  "Q1589009", // commercial organization
  "Q1334812", // agency
]);

/**
 * Queries the Wikidata API to resolve an organization and find its official website (P856).
 */
export async function resolveWikidataOrg(query: string): Promise<WikidataOrgResult | null> {
  if (!query || typeof query !== "string") return null;

  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query.trim()
    )}&language=en&format=json&limit=3`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const searchRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeout);

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    if (!searchData.search || searchData.search.length === 0) {
      return null;
    }

    const candidate = searchData.search[0];
    const qid = candidate.id;

    // Fetch entity claims
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&format=json&props=claims|labels|descriptions`;
    const entityRes = await fetch(entityUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!entityRes.ok) return null;
    const entityData = await entityRes.json();
    const entity = entityData.entities?.[qid];
    if (!entity) return null;

    const claims = entity.claims || {};
    const p856Claims = claims.P856 || [];
    const p31Claims = claims.P31 || [];

    // Check P31
    let isOrg = false;
    for (const claim of p31Claims) {
      const targetId = claim?.mainsnak?.datavalue?.value?.id;
      if (targetId && VALID_ORG_P31.has(targetId)) {
        isOrg = true;
        break;
      }
    }

    // Official website
    const websiteUrl = p856Claims[0]?.mainsnak?.datavalue?.value || null;
    const domain = websiteUrl ? extractRegistrableDomain(websiteUrl) : null;

    return {
      qid,
      name: candidate.label || query,
      description: candidate.description,
      official_website: websiteUrl,
      official_domain: domain,
      is_org: isOrg,
    };
  } catch {
    return null;
  }
}
