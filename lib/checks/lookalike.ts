import { distance } from "fastest-levenshtein";

const HOMOGLYPHS: Record<string, string> = {
  "0": "o",
  "1": "l",
  "l": "i",
  "rn": "m",
  "vv": "w",
  // Cyrillic homoglyphs commonly used in IDN homograph attacks
  "а": "a", // U+0430
  "с": "c", // U+0441
  "е": "e", // U+0435
  "о": "o", // U+043E
  "р": "p", // U+0440
  "ѕ": "s", // U+0455
  "і": "i", // U+0456
  "ј": "j", // U+0458
  "у": "y", // U+0443
  "х": "x", // U+0445
};

export function normalizeHomoglyphs(str: string): string {
  let normalized = str.toLowerCase();
  for (const [key, val] of Object.entries(HOMOGLYPHS)) {
    normalized = normalized.replaceAll(key, val);
  }
  return normalized;
}

export interface LookalikeResult {
  score: number; // 0 to 1
  reason: string;
}

/**
 * Calculates a lookalike score comparing an untrusted domain to an official brand or domain.
 * Looks for brand tokens, Levenshtein distance, homoglyph substitutions, and punycode.
 */
export function calculateLookalikeScore(
  untrustedDomain: string,
  officialDomain: string,
  brandName?: string
): LookalikeResult {
  const untrustedLabel = untrustedDomain.split(".")[0].toLowerCase();
  const officialLabel = officialDomain.split(".")[0].toLowerCase();

  // 1. If untrusted domain is punycode encoded (IDN homograph attack indicator)
  if (untrustedDomain.includes("xn--")) {
    return {
      score: 0.95,
      reason: `Punycode IDN domain detected (potential homograph impersonation)`,
    };
  }

  // 2. Direct token containment (e.g. "usps-help.top" contains "usps")
  const brandToken = (brandName || officialLabel).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (brandToken.length >= 3 && untrustedLabel.includes(brandToken)) {
    return {
      score: 0.85,
      reason: `Contains brand name token "${brandToken}" in domain "${untrustedDomain}"`,
    };
  }

  // 3. Homoglyph normalized match
  const normalizedUntrusted = normalizeHomoglyphs(untrustedLabel);
  const normalizedOfficial = normalizeHomoglyphs(officialLabel);

  if (normalizedUntrusted.includes(normalizedOfficial) || normalizedUntrusted === normalizedOfficial) {
    return {
      score: 0.9,
      reason: `Visual homoglyph / confusable match with official brand "${officialLabel}"`,
    };
  }

  // 4. Levenshtein edit distance similarity
  const maxLen = Math.max(untrustedLabel.length, officialLabel.length);
  const levDist = distance(untrustedLabel, officialLabel);
  const similarity = 1 - levDist / maxLen;

  if (similarity >= 0.75) {
    return {
      score: Math.round(similarity * 100) / 100,
      reason: `High typographical similarity (${Math.round(similarity * 100)}%) to "${officialLabel}"`,
    };
  }

  // 5. Homoglyph Levenshtein
  const homoglyphDist = distance(normalizedUntrusted, normalizedOfficial);
  const homoglyphSimilarity = 1 - homoglyphDist / Math.max(normalizedUntrusted.length, normalizedOfficial.length);
  if (homoglyphSimilarity >= 0.75) {
    return {
      score: Math.round(homoglyphSimilarity * 100) / 100,
      reason: `High visual similarity (${Math.round(homoglyphSimilarity * 100)}%) using confusable characters`,
    };
  }

  return {
    score: Math.max(0, Math.round(similarity * 100) / 100),
    reason: `Low lookalike similarity to official domain`,
  };
}
