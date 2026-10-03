import { describe, it, expect } from "vitest";
import { findCuratedOrg } from "../lib/entity/curated";
import { labelMatches } from "../lib/entity/resolve";
import { detectSenderFallback } from "../lib/extract/rescan";
import { checkUrl } from "../lib/checks/url";
import { checkEmail } from "../lib/checks/email";
import { LlmExtractionSchema } from "../lib/llm/schemas";
import { runPipeline } from "../lib/pipeline";

describe("Curated official domains (hand-checked, not blind Wikidata P856)", () => {
  it("uses Citi's real domains and never the Wikidata P856 value citibnqa.com", () => {
    const citi = findCuratedOrg("Citi")!;
    expect(citi.official_domains).toContain("citi.com");
    expect(citi.official_domains).not.toContain("citibnqa.com");
  });

  it("lists the consumer domains for Medicare, Zelle and Norton", () => {
    expect(findCuratedOrg("Medicare")!.official_domains).toContain("medicare.gov");
    expect(findCuratedOrg("Zelle")!.official_domains).toEqual(expect.arrayContaining(["zelle.com", "zellepay.com"]));
    expect(findCuratedOrg("Norton")!.official_domains).toContain("norton.com");
  });

  it("points Chase at a contact page that publishes phone numbers", () => {
    expect(findCuratedOrg("Chase")!.contact_pages[0]).toBe("https://www.chase.com/digital/customer-service");
  });
});

describe("Wikidata label guard", () => {
  it("accepts close label matches and rejects unrelated ones", () => {
    expect(labelMatches("The Toll Roads", "Toll Roads")).toBe(true);
    expect(labelMatches("Citigroup Inc.", "Citigroup")).toBe(true);
    expect(labelMatches("Chase Utley", "Bank Alert")).toBe(false);
  });
});

describe("Keyless sender detection from the curated dictionary", () => {
  it("finds curated names that were missing before", () => {
    expect(detectSenderFallback("Citi Alert: A purchase of $54.20 was made.").name).toBe("Citi");
    expect(detectSenderFallback("Medicare: Your new summary notice is ready.").name).toBe("Medicare");
    expect(detectSenderFallback("Zelle: You received $40 from Sam.").name).toBe("Zelle");
  });

  it("does not treat lowercase verbs or fruit as brands", () => {
    expect(detectSenderFallback("Don't chase the bus, I'll drive you.").name).toBeNull();
    expect(detectSenderFallback("Can you grab an apple on the way?").name).toBeNull();
  });

  it("routes family and new-number messages to the personal path", () => {
    expect(detectSenderFallback("Hi Mum, I dropped my phone, send $300 by Zelle").kind).toBe("person");
    expect(detectSenderFallback("Hey it's me, this is my new number").kind).toBe("person");
  });
});

describe("No organization identified: report links and emails, don't accuse", () => {
  it("marks a link amber when there is no organization to compare against", async () => {
    const res = await checkUrl("https://www.medicare.gov/", null, "E1");
    expect(res.evidence.status).toBe("warn");
    expect(res.evidence.text).not.toMatch(/NOT an official/);
  });

  it("marks an email amber when there is no organization to compare against", () => {
    const res = checkEmail("someone@gmail.com", null, "E1");
    expect(res.evidence.status).toBe("warn");
  });
});

describe("LLM extraction schema tolerates nulls", () => {
  it("accepts payment: null and claimed_sender: null", () => {
    const parsed = LlmExtractionSchema.safeParse({
      claimed_sender: null,
      asks: [],
      urgency_quotes: [],
      payment: null,
      phones: [],
      urls: ["medicare.gov"],
      emails: [],
      handles: [],
      is_screenshot_text: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payment).toEqual({ method: null, quote: null });
      expect(parsed.data.claimed_sender.kind).toBe("unknown");
    }
  });
});

describe("Pipeline regressions (keyless)", () => {
  it("a genuine Citi alert linking to citi.com is not flagged red", async () => {
    const r = await runPipeline(
      "Citi Alert: A purchase of $54.20 was made on your card ending 1234. View details at citi.com.",
      { skipLLM: true }
    );
    expect(r.verdict.type).not.toBe("DOESNT_MATCH");
  }, 20000);

  it("a Chase callback scam with an unlisted number doesn't match", async () => {
    const r = await runPipeline("Chase: Your account is on hold. Call 1-833-555-0199 immediately.", { skipLLM: true });
    expect(r.verdict.type).toBe("DOESNT_MATCH");
    expect(r.verdict.rule_id).toBe("RULE_4_PHONE_MISMATCH");
  }, 20000);
});
