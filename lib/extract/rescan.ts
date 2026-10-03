import { Extraction, ClaimedSender } from "../types";
import { extractPhones } from "./phones";
import { extractUrls } from "./urls";
import { extractEmails } from "./emails";
import { extractPayment } from "./payments";
import { extractUrgencyQuotes } from "./urgency";

import { getAllCuratedOrgs } from "../entity/curated";

const GOVERNMENT_IDS = new Set(["usps", "irs", "ssa", "medicare"]);

const PERSON_PATTERN =
  /\b(?:mom|mum|mommy|mama|dad|daddy|papa|grandma|grandpa|granny|grandson|granddaughter|nephew|niece|son|daughter|boss)\b|\bnew (?:phone )?number\b/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Patterns for every curated organization name and alias. Single words match only as written
 * or in all caps ("Chase"/"CHASE", not "chase", which is usually a verb; "Apple", not "apple").
 * Multi-word names match case-insensitively.
 */
const ORG_PATTERNS: Array<{ name: string; kind: ClaimedSender["kind"]; pattern: RegExp }> =
  getAllCuratedOrgs().flatMap(org =>
    [org.name, ...org.aliases].flatMap(alias => {
      const kind: ClaimedSender["kind"] = GOVERNMENT_IDS.has(org.id) ? "government" : "company";
      const escaped = escapeRegExp(alias);
      const pattern = /\s/.test(alias)
        ? new RegExp(`\\b${escaped}\\b`, "i")
        : new RegExp(`\\b(?:${escaped}|${escapeRegExp(alias.toUpperCase())})\\b`);
      return [{ name: org.name, kind, pattern }];
    })
  );

/**
 * Deterministic sender detection for keyless fallback: the curated dictionary (name and alias,
 * word-boundary), earliest mention wins; family/new-number wording means the personal path.
 */
export function detectSenderFallback(text: string): ClaimedSender {
  let best: { name: string; kind: ClaimedSender["kind"]; quote: string; index: number } | null = null;
  for (const org of ORG_PATTERNS) {
    const match = org.pattern.exec(text);
    if (!match) continue;
    if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.quote.length)) {
      best = { name: org.name, kind: org.kind, quote: match[0], index: match.index };
    }
  }

  const personMatch = text.match(PERSON_PATTERN);
  if (personMatch && (!best || (personMatch.index ?? 0) < best.index)) {
    return { name: personMatch[0], kind: "person", evidence_quote: personMatch[0] };
  }

  if (best) {
    return { name: best.name, kind: best.kind, evidence_quote: best.quote };
  }

  return { name: null, kind: "unknown", evidence_quote: null };
}

/** "https://www.x.com/a/" and "x.com/a" are the same link; keep the first spelling seen. */
function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter(u => {
    const key = u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Deterministic full re-scan over message text.
 */
export function deterministicExtract(text: string): Extraction {
  const phones = extractPhones(text);
  const urls = dedupeUrls(extractUrls(text));
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
    urls: dedupeUrls(Array.from(validUrls)),
    emails: Array.from(validEmails),
    handles: llmExtraction.handles || [],
    is_screenshot_text: llmExtraction.is_screenshot_text || null,
    dropped_hallucinations: dropped,
  };
}
