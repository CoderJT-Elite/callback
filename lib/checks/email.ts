import { Evidence } from "../types";
import { isFreemail } from "../extract/emails";
import { extractRegistrableDomain } from "../extract/urls";
import { ResolvedOrg } from "../entity/resolve";

export interface EmailCheckResult {
  email: string;
  domain: string;
  is_official: boolean;
  is_freemail: boolean;
  evidence: Evidence;
}

export function checkEmail(
  email: string,
  org: ResolvedOrg | null,
  evidenceId: string
): EmailCheckResult {
  const parts = email.split("@");
  const emailDomain = (parts[1] || "").toLowerCase().trim();
  const regDomain = extractRegistrableDomain(emailDomain) || emailDomain;

  const officialDomains = org?.official_domains || [];
  const orgName = org?.name || "the claimed organization";

  const isOfficial = officialDomains.some(
    od => regDomain.toLowerCase() === od.toLowerCase()
  );

  const freemail = isFreemail(emailDomain);

  if (isOfficial) {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "email",
      status: "ok",
      text: `Email address "${email}" is on the official ${orgName} domain.`,
      source: { rule_id: "RULE_EMAIL_OFFICIAL" },
      meta: { email, domain: emailDomain, is_official: true },
    };
    return {
      email,
      domain: emailDomain,
      is_official: true,
      is_freemail: false,
      evidence,
    };
  }

  if (freemail) {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "email",
      status: "fail",
      text: `Sender uses a free consumer email address ("@${emailDomain}") while claiming to represent ${orgName}.`,
      source: { rule_id: "RULE_EMAIL_FREEMAIL" },
      meta: { email, domain: emailDomain, is_official: false, is_freemail: true },
    };
    return {
      email,
      domain: emailDomain,
      is_official: false,
      is_freemail: true,
      evidence,
    };
  }

  const evidence: Evidence = {
    id: evidenceId,
    kind: "email",
    status: "fail",
    text: `Email address "${email}" is NOT on official ${orgName} domain (${officialDomains.join(", ") || "none"}).`,
    source: { rule_id: "RULE_EMAIL_MISMATCH" },
    meta: { email, domain: emailDomain, is_official: false, is_freemail: false },
  };

  return {
    email,
    domain: emailDomain,
    is_official: false,
    is_freemail: false,
    evidence,
  };
}
