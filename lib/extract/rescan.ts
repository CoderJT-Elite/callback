import { Extraction, ClaimedSender } from "../types";
import { extractPhones } from "./phones";
import { extractUrls } from "./urls";
import { extractEmails } from "./emails";
import { extractPayment } from "./payments";
import { extractUrgencyQuotes } from "./urgency";

// Common organizations to detect in keyless / fallback mode
const COMMON_ORG_PATTERNS: Array<{ name: string; kind: ClaimedSender["kind"]; patterns: RegExp[] }> = [
  {
    name: "USPS",
    kind: "government",
    patterns: [/\busps\b/i, /\bunited states postal service\b/i, /\bpostal service\b/i],
  },
  {
    name: "UPS",
    kind: "company",
    patterns: [/\bups\b/i, /\bunited parcel service\b/i],
  },
  {
    name: "FedEx",
    kind: "company",
    patterns: [/\bfedex\b/i, /\bfederal express\b/i],
  },
  {
    name: "DHL",
    kind: "company",
    patterns: [/\bdhl\b/i],
  },
  {
    name: "Amazon",
    kind: "company",
    patterns: [/\bamazon\b/i],
  },
  {
    name: "Apple",
    kind: "company",
    patterns: [/\bapple\b/i, /\bicloud\b/i],
  },
  {
    name: "PayPal",
    kind: "company",
    patterns: [/\bpaypal\b/i],
  },
  {
    name: "Netflix",
    kind: "company",
    patterns: [/\bnetflix\b/i],
  },
  {
    name: "Chase",
    kind: "company",
    patterns: [/\bchase(?:\s+bank)?\b/i, /\bjpmorgan\b/i],
  },
  {
    name: "Bank of America",
    kind: "company",
    patterns: [/\bbank of america\b/i, /\bbofa\b/i],
  },
  {
    name: "Wells Fargo",
    kind: "company",
    patterns: [/\bwells fargo\b/i],
  },
  {
    name: "Internal Revenue Service",
    kind: "government",
    patterns: [/\birs\b/i, /\binternal revenue service\b/i],
  },
  {
    name: "Social Security Administration",
    kind: "government",
    patterns: [/\bssa\b/i, /\bsocial security(?:\s+administration)?\b/i],
  },
  {
    name: "E-ZPass",
    kind: "government",
    patterns: [/\be-?zpass\b/i, /\btoll(?:s)?\s+(?:services?|enforcement|violation)\b/i],
  },
  {
    name: "Geek Squad",
    kind: "company",
    patterns: [/\bgeek squad\b/i, /\bbest buy\b/i],
  },
];

/**
 * Deterministic sender detection for keyless fallback.
 */
export function detectSenderFallback(text: string): ClaimedSender {
  // Check for person patterns (e.g. "Hi Mom, I lost my phone", "Hey Dad, new number")
  const personMatch = text.match(/\b(?:mom|dad|grandma|grandpa|son|daughter|boss)\b/i);
  if (personMatch) {
    return {
      name: personMatch[0],
      kind: "person",
      evidence_quote: personMatch[0],
    };
  }

  // Check known organization patterns
  for (const org of COMMON_ORG_PATTERNS) {
    for (const pattern of org.patterns) {
      const match = pattern.exec(text);
      if (match) {
        return {
          name: org.name,
          kind: org.kind,
          evidence_quote: match[0],
        };
      }
    }
  }

  return {
    name: null,
    kind: "unknown",
    evidence_quote: null,
  };
}

/**
 * Deterministic full re-scan over message text.
 */
export function deterministicExtract(text: string): Extraction {
  const phones = extractPhones(text);
  const urls = extractUrls(text);
  const emails = extractEmails(text);
  const payment = extractPayment(text);
  const urgency_quotes = extractUrgencyQuotes(text);
  const claimed_sender = detectSenderFallback(text);

  return {
    claimed_sender,
    asks: [],
    urgency_quotes,
    payment,
    phones,
    urls,
    emails,
    handles: [],
  };
}

/**
 * Anti-hallucination merge between LLM output and deterministic re-scan.
 * Rules:
 * - Keep LLM phone, url or email ONLY if it appears in the source text after normalization.
 * - Add anything deterministic re-scan found that the LLM missed.
 * - claimed_sender.evidence_quote MUST be a real substring of the message text; otherwise drop to null / unknown.
 * - Keep track of dropped hallucinated items.
 */
export function mergeWithAntiHallucination(
  llmExtraction: Partial<Extraction>,
  sourceText: string
): Extraction {
  const deterministic = deterministicExtract(sourceText);
  const dropped = {
    phones: [] as string[],
    urls: [] as string[],
    emails: [] as string[],
    invalid_sender_quote: false,
  };

  // 1. Validate claimed_sender
  let sender: ClaimedSender = {
    name: null,
    kind: "unknown",
    evidence_quote: null,
  };

  if (llmExtraction.claimed_sender?.evidence_quote) {
    const quote = llmExtraction.claimed_sender.evidence_quote;
    if (sourceText.includes(quote)) {
      sender = {
        name: llmExtraction.claimed_sender.name || null,
        kind: llmExtraction.claimed_sender.kind || "unknown",
        evidence_quote: quote,
      };
    } else {
      dropped.invalid_sender_quote = true;
      // Fallback to deterministic detection
      sender = deterministic.claimed_sender;
    }
  } else if (llmExtraction.claimed_sender?.name) {
    // If name provided without valid quote, see if deterministic matched
    sender = deterministic.claimed_sender.name ? deterministic.claimed_sender : {
      name: llmExtraction.claimed_sender.name,
      kind: llmExtraction.claimed_sender.kind || "unknown",
      evidence_quote: null,
    };
  } else {
    sender = deterministic.claimed_sender;
  }

  // 2. Validate phones
  const validPhones = new Set<string>(deterministic.phones);
  if (Array.isArray(llmExtraction.phones)) {
    for (const phone of llmExtraction.phones) {
      // Normalize and test
      const normalizedMatches = extractPhones(phone);
      if (normalizedMatches.length > 0 && normalizedMatches.some(p => deterministic.phones.includes(p))) {
        validPhones.add(normalizedMatches[0]);
      } else {
        dropped.phones.push(phone);
      }
    }
  }

  // 3. Validate URLs
  const validUrls = new Set<string>(deterministic.urls);
  if (Array.isArray(llmExtraction.urls)) {
    for (const url of llmExtraction.urls) {
      // Check if URL or its domain appears in source text
      const cleanUrl = url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      if (sourceText.toLowerCase().includes(cleanUrl.toLowerCase()) || deterministic.urls.some(u => u.includes(cleanUrl))) {
        validUrls.add(url);
      } else {
        dropped.urls.push(url);
      }
    }
  }

  // 4. Validate Emails
  const validEmails = new Set<string>(deterministic.emails);
  if (Array.isArray(llmExtraction.emails)) {
    for (const email of llmExtraction.emails) {
      if (sourceText.toLowerCase().includes(email.toLowerCase().trim())) {
        validEmails.add(email.toLowerCase().trim());
      } else {
        dropped.emails.push(email);
      }
    }
  }

  // 5. Payment & Urgency
  const payment = llmExtraction.payment?.method
    ? llmExtraction.payment
    : deterministic.payment;

  const urgencyQuotes = Array.from(
    new Set([...(llmExtraction.urgency_quotes || []), ...deterministic.urgency_quotes])
  ).filter(q => sourceText.includes(q));

  return {
    claimed_sender: sender,
    asks: llmExtraction.asks || [],
    urgency_quotes: urgencyQuotes,
    payment,
    phones: Array.from(validPhones),
    urls: Array.from(validUrls),
    emails: Array.from(validEmails),
    handles: llmExtraction.handles || [],
    is_screenshot_text: llmExtraction.is_screenshot_text || null,
    dropped_hallucinations: dropped,
  };
}
