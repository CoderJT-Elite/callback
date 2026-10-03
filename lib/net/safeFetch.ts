import dns from "dns/promises";
import net from "net";

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFError";
  }
}

/**
 * Checks whether an IP address is in a private, loopback, link-local,
 * CGNAT, multicast, or metadata address range.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (ip.toLowerCase().startsWith("::ffff:")) {
    const v4Part = ip.slice(7);
    if (net.isIPv4(v4Part)) {
      return isPrivateOrReservedIP(v4Part);
    }
  }

  const version = net.isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;

    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;

    // 100.64.0.0/10 (Shared Address / CGNAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;

    // 169.254.0.0/16 (Link Local & Cloud Metadata like AWS/GCP 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;

    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;

    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future use)
    if (b0 >= 240) return true;

    return false;
  }

  if (version === 6) {
    const lower = ip.toLowerCase();

    // Loopback ::1
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;

    // Unspecified ::
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;

    // Unique Local fc00::/7 (fc.. or fd..)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

    // Link-local fe80::/10 (fe8..., fe9..., fea..., feb...)
    if (/^fe[89ab]/i.test(lower)) return true;

    return false;
  }

  // Not a valid IP -> consider dangerous
  return true;
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRedirects?: number;
  maxSizeBytes?: number;
}

export interface SafeFetchResult {
  url: string;
  status: number;
  statusText: string;
  headers: Headers;
  text: () => Promise<string>;
  redirectChain: string[];
}

const DEFAULT_USER_AGENT =
  "CallbackSecurityBot/1.0 (+https://github.com/CoderJT-Elite/callback; ForgeHacks 2026)";

/**
 * SSRF-Safe Fetch:
 * - Only http: and https: protocols
 * - Ports 80 and 443 only
 * - DNS resolved first; rejects private, loopback, link-local, CGNAT, metadata ranges
 * - Manual redirect validation up to 5 hops
 * - Enforces timeout (default 3000ms)
 * - Enforces response size cap (default 1.5MB)
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 3000;
  const maxRedirects = options.maxRedirects ?? 5;
  const maxSizeBytes = options.maxSizeBytes ?? 1.5 * 1024 * 1024; // 1.5 MB

  let currentUrl = targetUrl;
  const redirectChain: string[] = [currentUrl];

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      throw new SSRFError(`Invalid URL format: ${currentUrl}`);
    }

    // 1. Protocol check
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new SSRFError(`Forbidden protocol: ${parsed.protocol}. Only http and https allowed.`);
    }

    // 2. Port check (only 80, 443, or default)
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : parsed.protocol === "https:"
      ? 443
      : 80;

    if (port !== 80 && port !== 443) {
      throw new SSRFError(`Forbidden port: ${port}. Only ports 80 and 443 allowed.`);
    }

    // 3. DNS resolution & IP verification
    const hostname = parsed.hostname;
    // Check if hostname is direct IP or resolve DNS
    if (net.isIP(hostname)) {
      if (isPrivateOrReservedIP(hostname)) {
        throw new SSRFError(`Blocked access to private/reserved IP: ${hostname}`);
      }
    } else {
      let addresses: Array<{ address: string; family: number }>;
      try {
        addresses = await dns.lookup(hostname, { all: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new SSRFError(`DNS lookup failed for ${hostname}: ${message}`);
      }

      if (!addresses || addresses.length === 0) {
        throw new SSRFError(`No DNS records found for ${hostname}`);
      }

      for (const addr of addresses) {
        if (isPrivateOrReservedIP(addr.address)) {
          throw new SSRFError(
            `DNS resolved ${hostname} to blocked private/reserved IP: ${addr.address}`
          );
        }
      }
    }

    // 4. Execute request with timeout and manual redirect handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        ...options,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...options.headers,
        },
      });

      // Handle Redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new SSRFError(`Redirect status ${response.status} missing Location header`);
        }

        // Resolve relative redirect against current URL
        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;
        redirectChain.push(currentUrl);

        if (hop === maxRedirects) {
          throw new SSRFError(`Exceeded maximum redirects of ${maxRedirects}`);
        }
        continue;
      }

      // Return wrapped result with body size enforcement
      return {
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        redirectChain,
        text: async () => {
          const reader = response.body?.getReader();
          if (!reader) {
            return response.text();
          }

          const chunks: Uint8Array[] = [];
          let totalBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalBytes += value.length;
              if (totalBytes > maxSizeBytes) {
                throw new SSRFError(`Response exceeded maximum size of ${maxSizeBytes} bytes`);
              }
              chunks.push(value);
            }
          }

          const decoder = new TextDecoder("utf-8");
          return chunks.map(c => decoder.decode(c, { stream: true })).join("") + decoder.decode();
        },
      };
    } catch (err: unknown) {
      if (err instanceof SSRFError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new SSRFError(`Request timed out after ${timeoutMs}ms`);
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new SSRFError(`Fetch failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new SSRFError(`Exceeded maximum redirects`);
}
