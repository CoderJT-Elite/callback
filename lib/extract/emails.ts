/**
 * Extracts and normalizes email addresses from text.
 */
export function extractEmails(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
  const matches = text.match(emailPattern) || [];
  const results = new Set<string>();

  for (const raw of matches) {
    const cleaned = raw.trim().toLowerCase();
    results.add(cleaned);
  }

  return Array.from(results);
}

/**
 * Checks if a domain is a known consumer/free email provider.
 */
export const KNOWN_FREEMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

export function isFreemail(emailOrDomain: string): boolean {
  let domain = emailOrDomain.toLowerCase().trim();
  if (domain.includes("@")) {
    domain = domain.split("@")[1];
  }
  return KNOWN_FREEMAIL_DOMAINS.has(domain);
}
