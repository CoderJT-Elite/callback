import { findPhoneNumbersInText, parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Extracts phone numbers from text and normalizes them to E.164 format.
 * Defaults to 'US' region for numbers without country code.
 */
export function extractPhones(text: string, defaultCountry = "US" as const): string[] {
  if (!text || typeof text !== "string") return [];

  const found = findPhoneNumbersInText(text, { defaultCountry });
  const results = new Set<string>();

  for (const item of found) {
    if (item.number && item.number.isValid()) {
      results.add(item.number.number); // E.164 format, e.g. +18885550142
    }
  }

  // Also check for raw regex matches like 1-800-xxx-xxxx or +1 (xxx) xxx-xxxx that might be embedded in tricky punctuation
  const phonePattern = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\b/g;
  let match: RegExpExecArray | null;
  while ((match = phonePattern.exec(text)) !== null) {
    const raw = match[0].trim();
    const parsed = parsePhoneNumberFromString(raw, defaultCountry);
    if (parsed && parsed.isValid()) {
      results.add(parsed.number);
    }
  }

  return Array.from(results);
}
