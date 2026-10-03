import { safeFetch } from "../net/safeFetch";
import { extractRegistrableDomain } from "../extract/urls";

const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "t.ly",
]);

export function isShortener(url: string): boolean {
  const domain = extractRegistrableDomain(url);
  return domain ? KNOWN_SHORTENERS.has(domain.toLowerCase()) : false;
}

/**
 * Unrolls a shortener URL using safeFetch HEAD request (max 5 hops).
 * Never downloads full page bodies.
 */
export async function unrollShortener(url: string): Promise<string> {
  if (!isShortener(url)) {
    return url;
  }

  try {
    const res = await safeFetch(url, {
      method: "HEAD",
      timeoutMs: 3000,
      maxRedirects: 5,
    });
    return res.url;
  } catch {
    // If HEAD fails or is blocked, return original URL
    return url;
  }
}
