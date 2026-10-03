import { describe, it, expect } from "vitest";
import { findCuratedOrg, getAllCuratedOrgs } from "../lib/entity/curated";
import { resolveOrganization } from "../lib/entity/resolve";
import { getSnapshotForOrg } from "../lib/official/snapshot";
import { gatherOfficialEvidence } from "../lib/official/pages";

describe("P2 Entity Resolution: Curated Orgs", () => {
  it("loads 25+ curated organizations", () => {
    const orgs = getAllCuratedOrgs();
    expect(orgs.length).toBeGreaterThanOrEqual(25);
  });

  it("finds USPS by direct name and aliases", () => {
    const byName = findCuratedOrg("USPS");
    expect(byName).not.toBeNull();
    expect(byName?.official_domains).toContain("usps.com");

    const byAlias = findCuratedOrg("United States Postal Service");
    expect(byAlias?.id).toBe("usps");

    const bySubstr = findCuratedOrg("USPS Tracking Alert");
    expect(bySubstr?.id).toBe("usps");
  });

  it("finds banks and tech companies by aliases", () => {
    expect(findCuratedOrg("Chase Bank")?.official_domains).toContain("chase.com");
    expect(findCuratedOrg("Wells Fargo")?.official_domains).toContain("wellsfargo.com");
    expect(findCuratedOrg("BofA")?.id).toBe("bank-of-america");
    expect(findCuratedOrg("Amazon Prime")?.id).toBe("amazon");
    expect(findCuratedOrg("iCloud")?.id).toBe("apple");
  });

  it("returns null for unknown entities", () => {
    expect(findCuratedOrg("Completely Fake Corporation 12345")).toBeNull();
  });
});

describe("P2 Entity Resolution: Orchestrator", () => {
  it("resolves curated organization cleanly", async () => {
    const resolved = await resolveOrganization("USPS");
    expect(resolved).not.toBeNull();
    expect(resolved?.name).toBe("USPS");
    expect(resolved?.official_domains).toContain("usps.com");
    expect(resolved?.source).toBe("curated");
  });
});

describe("P2 Official Evidence: Snapshots & Pages", () => {
  it("loads official snapshot for USPS with real extracted phones", () => {
    const snapshot = getSnapshotForOrg("usps");
    expect(snapshot).not.toBeNull();
    expect(snapshot?.org_id).toBe("usps");
    expect(snapshot?.official_domains).toContain("usps.com");

    const contactPage = snapshot?.contact_pages[0];
    expect(contactPage?.status).toBe(200);
    expect(contactPage?.phones.length).toBeGreaterThan(0);
    // Real USPS 1-800 number from their official help page
    expect(contactPage?.phones.some(p => p.includes("18002758777") || p.includes("1800"))).toBe(true);
  });

  it("loads official snapshot for Wells Fargo with real phones", () => {
    const snapshot = getSnapshotForOrg("wells-fargo");
    expect(snapshot).not.toBeNull();
    expect(snapshot?.contact_pages[0].phones.length).toBeGreaterThan(0);
  });

  it("gathers official evidence with snapshot fallback", async () => {
    const org = await resolveOrganization("USPS");
    expect(org).not.toBeNull();
    if (!org) return;

    const evidence = await gatherOfficialEvidence(org);
    expect(evidence.pages.length).toBeGreaterThan(0);
    expect(evidence.all_phones.length).toBeGreaterThan(0);
  });
});
