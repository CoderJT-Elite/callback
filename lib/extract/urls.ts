import { parse, getDomain } from "tldts";

/**
 * Extracts and normalizes URLs and bare domains from text.
 * Automatically handles scheme addition (defaults to https://) and punycode decoding.
 */
export function extractUrls(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const results = new Set<string>();

  // Pattern matches explicit schemes or bare domains with paths/extensions
  // Avoids matching emails or file extensions without valid TLD
  const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`]*)?/gi;

  const matches = text.match(urlPattern) || [];

  for (const raw of matches) {
    let candidate = raw.trim();

    // Clean trailing punctuation commonly attached in text (e.g. "Visit usps-help.top.", "Click here: usps-help.top)")
    candidate = candidate.replace(/[.,;:!?)]+$/, "");

    // Skip if it looks like an email address (preceded by @)
    const atIndex = text.indexOf(candidate);
    if (atIndex > 0 && text[atIndex - 1] === "@") {
      continue;
    }

    // Ensure scheme for standard parsing
    const hasScheme = /^https?:\/\//i.test(candidate);
    const parseUrl = hasScheme ? candidate : `https://${candidate}`;

    try {
      const parsedUrl = new URL(parseUrl);
      const hostname = parsedUrl.hostname;

      // Validate hostname via tldts
      const parsedTld = parse(hostname);
      const COMMON_FILE_EXTENSIONS = new Set(["txt", "png", "jpg", "jpeg", "gif", "pdf", "doc", "docx", "json", "csv", "zip"]);
      if (!hasScheme && !candidate.includes("/") && parsedTld.publicSuffix && COMMON_FILE_EXTENSIONS.has(parsedTld.publicSuffix.toLowerCase())) {
        continue;
      }
      if (parsedTld.isIcann || parsedTld.isPrivate || (parsedTld.publicSuffix && parsedTld.domain)) {
        // Punycode decode for display if necessary
        let decodedHostname = hostname;
        try {
          // Native URL decode handles punycode or decodeURI
          decodedHostname = decodeURIComponent(hostname);
        } catch {
          // Keep raw if decode fails
        }

        // Normalize URL string
        const normalized = hasScheme
          ? candidate
          : `https://${candidate}`;

        results.add(normalized);
      }
    } catch {
      // Not a valid URL
    }
  }

  return Array.from(results);
}

/**
 * Extracts the registrable domain (e.g., 'usps.com' from 'sub.usps.com/path')
 */
export function extractRegistrableDomain(urlOrHostname: string): string | null {
  try {
    let hostname = urlOrHostname;
    if (hostname.includes("://")) {
      hostname = new URL(hostname).hostname;
    } else {
      hostname = hostname.split("/")[0].split(":")[0];
    }
    return getDomain(hostname);
  } catch {
    return null;
  }
}
