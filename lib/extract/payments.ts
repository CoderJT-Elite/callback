import { PaymentExtraction, PaymentMethod } from "../types";

interface PaymentMatcher {
  method: PaymentMethod;
  patterns: RegExp[];
}

const PAYMENT_MATCHERS: PaymentMatcher[] = [
  {
    method: "gift_card",
    patterns: [
      /\b(?:apple|google play|steam|target|walmart|amazon|vanilla|razer|ebay)\s+gift\s*cards?\b/i,
      /\bgift\s*cards?\b/i,
      /\b(?:moneypak|reloadit|green\s*dot)\b/i,
    ],
  },
  {
    method: "crypto",
    patterns: [
      /\b(?:bitcoin|btc|ethereum|eth|usdt|tether|dogecoin|crypto|cryptocurrency)\b/i,
      /\bcrypto\s*atm\b/i,
      /\b(?:bitcoin|crypto)\s*(?:machine|depot|wallet)\b/i,
    ],
  },
  {
    method: "p2p",
    patterns: [
      /\b(?:zelle|venmo|cash\s*app|cashapp)\b/i,
      /\bpaypal\s*(?:friends\s*(?:&|and)\s*family)\b/i,
    ],
  },
  {
    method: "wire",
    patterns: [
      /\b(?:western\s*union|moneygram)\b/i,
      /\bwire\s*transfer\b/i,
      /\bbank\s*wire\b/i,
    ],
  },
  {
    method: "card",
    patterns: [
      /\b(?:credit|debit)\s*card\b/i,
      /\b(?:card\s*details|card\s*number|cvv|cvc|expiration\s*date)\b/i,
      /\bpay\s*(?:a\s*)?(?:\$\d+(?:\.\d{2})?|\d+\s*dollars?)\s*(?:redelivery|processing|fee|handling)\b/i,
    ],
  },
];

export function extractPayment(text: string): PaymentExtraction {
  if (!text || typeof text !== "string") {
    return { method: null, quote: null };
  }

  for (const { method, patterns } of PAYMENT_MATCHERS) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return {
          method,
          quote: match[0],
        };
      }
    }
  }

  return { method: null, quote: null };
}
