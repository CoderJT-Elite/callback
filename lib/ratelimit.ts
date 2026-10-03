interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_TOKENS = 8;

const ipMap = new Map<string, RateLimitRecord>();

/**
 * In-memory token bucket rate limiter (8 checks per 10 minutes per IP).
 * Best effort on serverless.
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = ipMap.get(ip) || { tokens: MAX_TOKENS, lastRefill: now };

  // Refill tokens based on elapsed time
  const elapsed = now - record.lastRefill;
  if (elapsed >= WINDOW_MS) {
    record.tokens = MAX_TOKENS;
    record.lastRefill = now;
  } else {
    const refillTokens = Math.floor((elapsed / WINDOW_MS) * MAX_TOKENS);
    if (refillTokens > 0) {
      record.tokens = Math.min(MAX_TOKENS, record.tokens + refillTokens);
      record.lastRefill = now;
    }
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    ipMap.set(ip, record);
    return { allowed: true, remaining: record.tokens };
  }

  const retryAfterSec = Math.ceil((WINDOW_MS - elapsed) / 1000);
  return { allowed: false, remaining: 0, retryAfterSec };
}
