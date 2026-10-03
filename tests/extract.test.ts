import { describe, it, expect } from "vitest";
import { extractPhones } from "../lib/extract/phones";
import { extractUrls, extractRegistrableDomain } from "../lib/extract/urls";
import { extractEmails, isFreemail } from "../lib/extract/emails";
import { extractPayment } from "../lib/extract/payments";
import { extractUrgencyQuotes } from "../lib/extract/urgency";
import {
  deterministicExtract,
  mergeWithAntiHallucination,
  detectSenderFallback,
} from "../lib/extract/rescan";

describe("P1 Extraction: Phones", () => {
  it("extracts standard US 10-digit number with dashes", () => {
    const phones = extractPhones("Call us at 888-555-0142 today");
    expect(phones).toContain("+18885550142");
  });

  it("extracts US number formatted with parentheses and spaces", () => {
    const phones = extractPhones("Contact support: +1 (800) 555-0199 immediately");
    expect(phones).toContain("+18005550199");
  });

  it("extracts dots-separated phone numbers", () => {
    const phones = extractPhones("Direct line: 202.555.0183.");
    expect(phones).toContain("+12025550183");
  });

  it("extracts international UK phone number", () => {
    const phones = extractPhones("UK office: +44 20 7946 0991");
    expect(phones).toContain("+442079460991");
  });

  it("extracts international Canadian number", () => {
    const phones = extractPhones("Toronto branch: +1 416-555-0177");
    expect(phones).toContain("+14165550177");
  });

  it("ignores non-phone numbers like order IDs or dates", () => {
    const phones = extractPhones("Order #2026-10-03 or tracking 9400111899223198000000");
    expect(phones).toHaveLength(0);
  });
});

describe("P1 Extraction: URLs & Domains", () => {
  it("extracts full https URL", () => {
    const urls = extractUrls("Visit https://usps.com/help/contact-us.htm for details");
    expect(urls).toContain("https://usps.com/help/contact-us.htm");
  });

  it("extracts bare domain with path", () => {
    const urls = extractUrls("Track your package at usps-redelivery-help.top/track");
    expect(urls.some(u => u.includes("usps-redelivery-help.top/track"))).toBe(true);
  });

  it("strips trailing punctuation from bare domains", () => {
    const urls = extractUrls("Please check out wells-fargo-verify.xyz, or call us.");
    expect(urls.some(u => u.includes("wells-fargo-verify.xyz"))).toBe(true);
    expect(urls.some(u => u.endsWith("."))).toBe(false);
    expect(urls.some(u => u.endsWith(","))).toBe(false);
  });

  it("extracts registrable domain via tldts", () => {
    expect(extractRegistrableDomain("https://sub.portal.usps.com/help")).toBe("usps.com");
    expect(extractRegistrableDomain("usps-help.top")).toBe("usps-help.top");
    expect(extractRegistrableDomain("chase.co.uk")).toBe("chase.co.uk");
  });

  it("handles punycode domains", () => {
    const urls = extractUrls("Visit https://xn--pple-43d.com/login");
    expect(urls.length).toBeGreaterThan(0);
  });

  it("does not treat common non-URL phrases as domains", () => {
    const urls = extractUrls("We need e.g. some version 1.2 or file.txt for testing.");
    expect(urls).toHaveLength(0);
  });
});

describe("P1 Extraction: Emails", () => {
  it("extracts standard company email", () => {
    const emails = extractEmails("Email support@amazon.com for assistance");
    expect(emails).toContain("support@amazon.com");
  });

  it("extracts multiple emails and lowercases them", () => {
    const emails = extractEmails("Send to RECRUITER@GMAIL.COM or info@jobcorp.org.");
    expect(emails).toContain("recruiter@gmail.com");
    expect(emails).toContain("info@jobcorp.org");
  });

  it("identifies freemail domains correctly", () => {
    expect(isFreemail("recruiter@gmail.com")).toBe(true);
    expect(isFreemail("official@yahoo.com")).toBe(true);
    expect(isFreemail("support@usps.com")).toBe(false);
    expect(isFreemail("fraud@chase.com")).toBe(false);
  });
});

describe("P1 Extraction: Payments", () => {
  it("detects gift card payment requests", () => {
    const res = extractPayment("Buy an Apple Gift Card for $500 to clear your fee");
    expect(res.method).toBe("gift_card");
    expect(res.quote?.toLowerCase()).toContain("apple gift card");
  });

  it("detects crypto payment requests", () => {
    const res = extractPayment("Deposit $2000 in Bitcoin at the nearest crypto ATM");
    expect(res.method).toBe("crypto");
    expect(res.quote?.toLowerCase()).toContain("bitcoin");
  });

  it("detects P2P payment requests (Zelle / Cash App)", () => {
    const res = extractPayment("Send the money via Zelle to user@domain.com");
    expect(res.method).toBe("p2p");
    expect(res.quote?.toLowerCase()).toContain("zelle");
  });

  it("detects wire transfer requests", () => {
    const res = extractPayment("Complete a bank wire transfer to account 12345");
    expect(res.method).toBe("wire");
    expect(res.quote?.toLowerCase()).toContain("wire transfer");
  });

  it("detects credit/debit card fee requests", () => {
    const res = extractPayment("Pay a $1.99 redelivery fee with your credit card");
    expect(res.method).toBe("card");
    expect(res.quote).toBeTruthy();
  });

  it("returns null method when no payment is mentioned", () => {
    const res = extractPayment("Please verify your account login on our official portal.");
    expect(res.method).toBeNull();
    expect(res.quote).toBeNull();
  });
});

describe("P1 Extraction: Urgency", () => {
  it("extracts time-bound urgency quotes", () => {
    const quotes = extractUrgencyQuotes("Your account will be suspended within 24 hours.");
    expect(quotes.some(q => q.toLowerCase().includes("within 24 hours"))).toBe(true);
    expect(quotes.some(q => q.toLowerCase().includes("suspended"))).toBe(true);
  });

  it("extracts legal threats and warrant language", () => {
    const quotes = extractUrgencyQuotes("Immediate action required: a legal warrant has been issued.");
    expect(quotes.some(q => q.toLowerCase().includes("immediate action"))).toBe(true);
    expect(quotes.some(q => q.toLowerCase().includes("warrant"))).toBe(true);
  });
});

describe("P1 Extraction: Sender Fallback & Anti-Hallucination Merge", () => {
  it("detects organization sender in keyless fallback", () => {
    const sender = detectSenderFallback("USPS: Your package is waiting for delivery.");
    expect(sender.name).toBe("USPS");
    expect(sender.kind).toBe("government");
  });

  it("detects person sender in family emergency messages", () => {
    const sender = detectSenderFallback("Hey Mom, my phone broke, this is my new number.");
    expect(sender.name?.toLowerCase()).toBe("mom");
    expect(sender.kind).toBe("person");
  });

  it("deterministicExtract extracts all fields combined", () => {
    const text =
      "USPS Alert: Package tracking #9382 held. Pay $1.99 redelivery fee at usps-redelivery.top within 24 hours. Call 888-555-0142.";
    const result = deterministicExtract(text);

    expect(result.claimed_sender.name).toBe("USPS");
    expect(result.phones).toContain("+18885550142");
    expect(result.urls.some(u => u.includes("usps-redelivery.top"))).toBe(true);
    expect(result.urgency_quotes.length).toBeGreaterThan(0);
    expect(result.payment.method).toBe("card");
  });

  it("anti-hallucination drops hallucinated phone and invalid quote", () => {
    const sourceText = "Wells Fargo Alert: Call +1 (800) 555-0122 regarding account status.";
    const fakeLlmOutput = {
      claimed_sender: {
        name: "Wells Fargo",
        kind: "company" as const,
        evidence_quote: "Invented Quote Not In Text",
      },
      phones: ["+1 (800) 555-0122", "+1 (800) 999-9999"], // 999-9999 was hallucinated
      urls: ["https://fake-hallucination.com"],
      emails: ["hallucinated@bank.com"],
    };

    const merged = mergeWithAntiHallucination(fakeLlmOutput, sourceText);

    // Hallucinated phone dropped
    expect(merged.phones).toContain("+18005550122");
    expect(merged.phones).not.toContain("+18009999999");
    expect(merged.dropped_hallucinations?.phones).toContain("+1 (800) 999-9999");

    // Hallucinated URL and Email dropped
    expect(merged.urls).toHaveLength(0);
    expect(merged.dropped_hallucinations?.urls).toContain("https://fake-hallucination.com");
    expect(merged.emails).toHaveLength(0);
    expect(merged.dropped_hallucinations?.emails).toContain("hallucinated@bank.com");

    // Invalid quote flagged and dropped
    expect(merged.dropped_hallucinations?.invalid_sender_quote).toBe(true);
  });
});
