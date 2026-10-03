import { extractRegistrableDomain } from "../extract/urls";
import { unrollShortener } from "./shortener";
import { calculateLookalikeScore } from "./lookalike";
import { checkDomainAge } from "./rdap";
import { Evidence } from "../types";
import { ResolvedOrg } from "../entity/resolve";

export interface UrlCheckResult {
  url: string;
  final_url: string;
  registrable_domain: string | null;
  is_official: boolean;
  lookalike_score: number;
  lookalike_reason: string;
  rdap_age_days: number | null;
  evidence: Evidence;
}

/**
 * Checks an extracted URL against the resolved organization's official domains.
 */
export async function checkUrl(
  rawUrl: string,
  org: ResolvedOrg | null,
  evidenceId: string
): Promise<UrlCheckResult> {
  // 1. Unroll shortener if applicable (HEAD only)
  const finalUrl = await unrollShortener(rawUrl);
  const domain = extractRegistrableDomain(finalUrl);

  const officialDomains = org?.official_domains || [];
  const orgName = org?.name || "the claimed organization";

  // Check if domain is official
  const isOfficial = domain !== null && officialDomains.some(
    od => domain.toLowerCase() === od.toLowerCase()
  );

  if (isOfficial) {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "url",
      status: "ok",
      text: `Link "${domain}" is an official ${orgName} domain.`,
      source: {
        url: finalUrl,
        rule_id: "RULE_OFFICIAL_DOMAIN",
      },
      meta: { domain, is_official: true },
    };

    return {
      url: rawUrl,
      final_url: finalUrl,
      registrable_domain: domain,
      is_official: true,
      lookalike_score: 0,
      lookalike_reason: "Official domain",
      rdap_age_days: null,
      evidence,
    };
  }

  // Not official domain -> check lookalike and RDAP age
  let lookalikeScore = 0;
  let lookalikeReason = "Not an official domain";

  if (domain && officialDomains.length > 0) {
    const lookalike = calculateLookalikeScore(domain, officialDomains[0], org?.name);
    lookalikeScore = lookalike.score;
    lookalikeReason = lookalike.reason;
  }

  // RDAP age check
  let rdapAgeDays: number | null = null;
  let rdapNote = "domain age unavailable";
  if (domain) {
    const rdap = await checkDomainAge(domain);
    if (rdap.status === "active" && rdap.age_days !== null) {
      rdapAgeDays = rdap.age_days;
      rdapNote = `registered ${rdap.age_days} days ago (RDAP)`;
    } else if (rdap.status === "not_registered") {
      rdapNote = "unregistered lookalike domain (RDAP)";
    }
  }

  const details = [
    `Link "${domain || rawUrl}" is NOT an official ${orgName} address`,
    lookalikeScore >= 0.7 ? `${lookalikeReason} (lookalike score ${lookalikeScore})` : null,
    rdapNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const evidence: Evidence = {
    id: evidenceId,
    kind: "url",
    status: "fail",
    text: details,
    source: {
      url: finalUrl,
      rule_id: lookalikeScore >= 0.7 ? "RULE_LOOKALIKE_DOMAIN" : "RULE_UNOFFICIAL_DOMAIN",
    },
    meta: {
      domain,
      is_official: false,
      lookalike_score: lookalikeScore,
      age_days: rdapAgeDays,
    },
  };

  return {
    url: rawUrl,
    final_url: finalUrl,
    registrable_domain: domain,
    is_official: false,
    lookalike_score: lookalikeScore,
    lookalike_reason: lookalikeReason,
    rdap_age_days: rdapAgeDays,
    evidence,
  };
}
