import { describe, it, expect } from "vitest";
import { evaluateVerdictRules } from "../lib/verdict/rules";
import { calculateLookalikeScore } from "../lib/checks/lookalike";
import { checkEmail } from "../lib/checks/email";
import { checkPhone } from "../lib/checks/phone";
import { ResolvedOrg } from "../lib/entity/resolve";
import { Evidence, ClaimedSender } from "../lib/types";

const mockUspsOrg: ResolvedOrg = {
  id: "usps",
  name: "USPS",
  official_domains: ["usps.com"],
  contact_pages: ["https://www.usps.com/help/contact-us.htm"],
  source: "curated",
  source_note: "verified test data",
};

describe("P3 Verdict Rules: Rule 1 (No Org Resolved)", () => {
  it("returns CANT_VERIFY when no organization is resolved", () => {
    const sender: ClaimedSender = { name: "Unknown Shipping Entity", kind: "company", evidence_quote: "Unknown" };
    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: null,
      official_evidence: null,
      evidences: [],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("CANT_VERIFY");
    expect(verdict.rule_id).toBe("RULE_1_NO_ORG");
  });
});

describe("P3 Verdict Rules: Rule 2 (Personal Path)", () => {
  it("returns NO_ORGANIZATION_CLAIMED for person kind", () => {
    const sender: ClaimedSender = { name: "Mom", kind: "person", evidence_quote: "Mom" };
    const urgencyEvidence: Evidence = {
      id: "E1",
      kind: "urgency",
      status: "warn",
      text: "Contains urgency",
    };

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: null,
      official_evidence: null,
      evidences: [urgencyEvidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("NO_ORGANIZATION_CLAIMED");
    expect(verdict.rule_id).toBe("RULE_2_PERSONAL_PATH");
    expect(verdict.color).toBe("amber");
  });
});

describe("P3 Verdict Rules: Rule 3 (Strong Mismatches)", () => {
  it("flags DOESNT_MATCH on unofficial link", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const linkEvidence: Evidence = {
      id: "E1",
      kind: "url",
      status: "fail",
      text: "Link usps-redelivery.top is not an official usps.com address",
    };

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: null,
      evidences: [linkEvidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("DOESNT_MATCH");
    expect(verdict.rule_id).toBe("RULE_3_STRONG_MISMATCH");
    expect(verdict.color).toBe("red");
  });

  it("flags DOESNT_MATCH on freemail impersonation", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const emailCheck = checkEmail("usps-support@gmail.com", mockUspsOrg, "E1");

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: null,
      evidences: [emailCheck.evidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("DOESNT_MATCH");
    expect(verdict.rule_id).toBe("RULE_3_STRONG_MISMATCH");
  });

  it("flags DOESNT_MATCH on gift card demand", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const payEvidence: Evidence = {
      id: "E1",
      kind: "payment",
      status: "fail",
      text: "Demands gift card",
      meta: { method: "gift_card" },
    };

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: null,
      evidences: [payEvidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("DOESNT_MATCH");
    expect(verdict.rule_id).toBe("RULE_3_STRONG_MISMATCH");
  });
});

describe("P3 Verdict Rules: Rule 4 (Phone Mismatches)", () => {
  it("flags DOESNT_MATCH when phone is not listed on official page with known numbers", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const mockOfficial = {
      pages: [
        {
          url: "https://www.usps.com/help/contact-us.htm",
          phones: ["+18002758777"],
          text_excerpt: "Call 1-800-ASK-USPS (+18002758777)",
          is_snapshot: false,
          fetched_at: "2026-10-03",
        },
      ],
      all_phones: ["+18002758777"],
      source_note: "test",
    };

    const phoneCheck = checkPhone("+18885550142", mockOfficial, mockUspsOrg, "E1");
    expect(phoneCheck.status).toBe("not_listed");

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: mockOfficial,
      evidences: [phoneCheck.evidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("DOESNT_MATCH");
    expect(verdict.rule_id).toBe("RULE_4_PHONE_MISMATCH");
  });

  it("does not flag mismatch when official pages list no phone numbers", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const mockNoPhonePages = {
      pages: [
        {
          url: "https://www.usps.com/help/contact-us.htm",
          phones: [],
          text_excerpt: "Contact via email or web chat only",
          is_snapshot: false,
          fetched_at: "2026-10-03",
        },
      ],
      all_phones: [],
      source_note: "test",
    };

    const phoneCheck = checkPhone("+18885550142", mockNoPhonePages, mockUspsOrg, "E1");
    expect(phoneCheck.evidence.status).toBe("warn");

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: mockNoPhonePages,
      evidences: [phoneCheck.evidence],
      has_contact_points: true,
    });

    // Should be CANT_VERIFY / INCONCLUSIVE instead of mismatch
    expect(verdict.type).toBe("CANT_VERIFY");
    expect(verdict.rule_id).toBe("RULE_7_INCONCLUSIVE");
  });
});

describe("P3 Verdict Rules: Rule 5 (All Official Match)", () => {
  it("returns MATCHES when link and phone both match official records", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };
    const linkEvidence: Evidence = {
      id: "E1",
      kind: "url",
      status: "ok",
      text: "Link is official usps.com",
    };
    const phoneEvidence: Evidence = {
      id: "E2",
      kind: "phone",
      status: "ok",
      text: "Phone matches official support line",
    };

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: null,
      evidences: [linkEvidence, phoneEvidence],
      has_contact_points: true,
    });

    expect(verdict.type).toBe("MATCHES");
    expect(verdict.rule_id).toBe("RULE_5_ALL_OFFICIAL_MATCH");
    expect(verdict.color).toBe("green");
  });
});

describe("P3 Verdict Rules: Rule 6 (No Contact Points)", () => {
  it("returns CANT_VERIFY when message has no contact points at all", () => {
    const sender: ClaimedSender = { name: "USPS", kind: "government", evidence_quote: "USPS" };

    const verdict = evaluateVerdictRules({
      claimed_sender: sender,
      resolved_org: mockUspsOrg,
      official_evidence: null,
      evidences: [],
      has_contact_points: false,
    });

    expect(verdict.type).toBe("CANT_VERIFY");
    expect(verdict.rule_id).toBe("RULE_6_NO_CONTACT_POINTS");
  });
});

describe("P3 Lookalike Scoring", () => {
  it("gives high score for brand token in domain", () => {
    const res = calculateLookalikeScore("usps-redelivery.xyz", "usps.com", "USPS");
    expect(res.score).toBeGreaterThanOrEqual(0.7);
  });

  it("gives high score for homoglyph substitution", () => {
    const res = calculateLookalikeScore("wellsfarg0.com", "wellsfargo.com", "Wells Fargo");
    expect(res.score).toBeGreaterThanOrEqual(0.7);
  });

  it("gives low score for completely unrelated domain", () => {
    const res = calculateLookalikeScore("example-weather-today.com", "usps.com", "USPS");
    expect(res.score).toBeLessThan(0.7);
  });
});
