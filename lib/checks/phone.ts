import { Evidence } from "../types";
import { OfficialEvidenceResult } from "../official/pages";
import { ResolvedOrg } from "../entity/resolve";

export interface PhoneCheckResult {
  phone: string;
  is_listed: boolean;
  status: "listed_on_official" | "not_listed" | "no_official_pages";
  evidence: Evidence;
}

/**
 * Checks an extracted phone number against phones listed on the organization's official pages.
 */
export function checkPhone(
  phone: string,
  officialEvidence: OfficialEvidenceResult | null,
  org: ResolvedOrg | null,
  evidenceId: string
): PhoneCheckResult {
  const orgName = org?.name || "the claimed organization";

  if (!officialEvidence || officialEvidence.pages.length === 0) {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "phone",
      status: "warn",
      text: `Could not verify phone ${phone}: no official contact pages were available.`,
      source: { rule_id: "RULE_PHONE_NO_PAGES" },
      meta: { phone, is_listed: false },
    };
    return {
      phone,
      is_listed: false,
      status: "no_official_pages",
      evidence,
    };
  }

  const { all_phones, pages } = officialEvidence;

  // Exact E.164 match or national match
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const matchedPage = pages.find(page =>
    page.phones.some(p => {
      const cleanOfficial = p.replace(/[^\d+]/g, "");
      return cleanOfficial === cleanPhone || (cleanOfficial.length >= 10 && cleanPhone.endsWith(cleanOfficial.slice(-10)));
    })
  );

  if (matchedPage) {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "phone",
      status: "ok",
      text: `Phone ${phone} matches official ${orgName} support line.`,
      source: {
        url: matchedPage.url,
        snippet: matchedPage.text_excerpt.slice(0, 200),
        snapshot: matchedPage.is_snapshot,
        fetched_at: matchedPage.fetched_at,
        rule_id: "RULE_PHONE_MATCH",
      },
      meta: { phone, is_listed: true, url: matchedPage.url },
    };
    return {
      phone,
      is_listed: true,
      status: "listed_on_official",
      evidence,
    };
  }

  // If official pages exist and have phones listed, but this phone is NOT among them -> mismatch
  if (all_phones.length > 0) {
    const sampleOfficial = all_phones[0];
    const sourcePage = pages.find(p => p.phones.length > 0) || pages[0];

    const evidence: Evidence = {
      id: evidenceId,
      kind: "phone",
      status: "fail",
      text: `Phone ${phone} is NOT listed on official ${orgName} pages. (Official number: ${sampleOfficial})`,
      source: {
        url: sourcePage.url,
        snapshot: sourcePage.is_snapshot,
        fetched_at: sourcePage.fetched_at,
        rule_id: "RULE_PHONE_MISMATCH",
      },
      meta: { phone, is_listed: false, official_phone: sampleOfficial },
    };
    return {
      phone,
      is_listed: false,
      status: "not_listed",
      evidence,
    };
  }

  // Official pages loaded, but they don't publish any phone numbers -> amber warning
  const evidence: Evidence = {
    id: evidenceId,
    kind: "phone",
    status: "warn",
    text: `Could not confirm phone ${phone}: official ${orgName} pages do not publish phone numbers.`,
    source: {
      url: pages[0]?.url,
      snapshot: pages[0]?.is_snapshot,
      fetched_at: pages[0]?.fetched_at,
      rule_id: "RULE_PHONE_UNCONFIRMED",
    },
    meta: { phone, is_listed: false },
  };
  return {
    phone,
    is_listed: false,
    status: "not_listed",
    evidence,
  };
}
