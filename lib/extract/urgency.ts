const URGENCY_PATTERNS = [
  /\bwithin\s+\d+\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/i,
  /\bimmediate(?:ly)?\s+(?:action|attention|response|payment|verification)\b/i,
  /\b(?:account|access|service)\s+(?:has\s+been\s+|is\s+|will\s+be\s+|was\s+)?(?:suspended|locked|restricted|blocked|frozen)\b/i,
  /\bfinal\s+(?:notice|warning|reminder)\b/i,
  /\b(?:arrest|warrant|legal\s+action|lawsuit|prosecution)\b/i,
  /\bunauthorized\s+(?:login|activity|transaction|charge)\b/i,
  /\bact\s+(?:now|immediately|urgently)\b/i,
  /\bexpires?\s+(?:today|soon|within\s+\d+\s*(?:hours?|hrs?))\b/i,
  /\bverify\s+(?:your\s+identity|immediately)\b/i,
];

export function extractUrgencyQuotes(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const found: string[] = [];
  for (const pattern of URGENCY_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      found.push(match[0]);
    }
  }

  return Array.from(new Set(found));
}
