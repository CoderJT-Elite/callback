# Callback: Imposter Scam Verification Engine

## Inspiration
According to the Federal Trade Commission (FTC), imposter scams remain the #1 reported fraud category, costing consumers over $2.7 billion in reported losses in 2023. Phishing and smishing tactics exploit fear and artificial urgency, tricking people into calling fake support numbers or clicking lookalike links contained right inside the message. Existing AI tools often fail because general-purpose LLMs hallucinate answers or invent fake facts. We built **Callback** to flip the paradigm: never trust contact details inside a message—find the real ones from sources the scammer cannot control.

## What it does
Callback checks suspicious text messages, emails, and screenshots. It:
1. Identifies the claimed organization or brand.
2. Resolves official channels from independent public directories (curated build-time records and Wikidata P856 official website properties).
3. Compares links, phones, and emails using deterministic rules (Levenshtein lookalike distance, RDAP domain registration age, and public suffix math).
4. Issues an auditable verdict receipt (`MATCHES` or `DOESN'T MATCH`) with verified evidence citations (`[E1]`, `[E2]`).
5. Provides an immediate incident response toolkit with pre-filled FTC/IC3 fraud summaries and printable PDF reports.

## How we built it
- **Full-Stack Framework:** Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v3.
- **Verification Engine:** Pure deterministic TypeScript rule engine (Rules 1–7) evaluating public suffix lookups (`tldts`), E.164 phone normalization (`libphonenumber-js`), and safe network fetches.
- **Multimodal AI:** Google Gemini (`gemini-3.8-flash`) via `@google/genai` for vision-based screenshot reading and plain-English explanation synthesis.
- **Defensive Networking:** Custom SSRF protection rejecting RFC1918 private ranges, AWS/GCP metadata endpoints, and non-standard ports. URLs inside messages are queried strictly via HTTP HEAD—never downloading untrusted page bodies.
- **Testing & Evals:** 64 Vitest unit tests, 18 Playwright end-to-end tests across desktop and mobile Chrome, and an automated 50-item evaluation harness (`npm run eval`).

## Challenges we overcame
- **Preventing AI Hallucinations:** LLMs frequently invent phone numbers. We enforced a strict anti-hallucination substring merge: any extracted contact point not present in the raw input is dropped.
- **API Quota Resilience:** When external LLM rate limits or 503 spikes occur, Callback gracefully degrades to deterministic regex extractors and template explanations without crashing.
- **SSRF Safety:** Ensuring users cannot probe private internal networks through crafted URLs by enforcing pre-lookup DNS IP validation.

## Accomplishments
- **100% Deterministic Verdicts:** The verdict is decided strictly by rule code—the LLM never decides whether a message is fraudulent.
- **Lighthouse Performance:** 98 Performance and 95 Accessibility on localhost.
- **Zero Secrets Tracked:** Environment keys are guarded and never exposed to client browsers.

## What we learned
Deterministic code grounded in authoritative knowledge graphs (Wikidata P856) is infinitely more reliable for fraud detection than open-ended generative text. AI shines when transcribing messy screenshots or summarizing verified receipts—not deciding the verdict.

## What's next
- Native mobile SMS filtering extension (iOS CallKit and Android SMS spam filter).
- Expanding the curated institution directory beyond 27 US brands to international telecommunications and banking portals.

---

### What Works / What Doesn't (Submission Block)
- **Works:** Instant replay on standard samples, 27 curated US brands, lookalike domain scoring, RDAP domain age checks, incident reporting toolkit, mobile responsiveness.
- **Doesn't:** Brands lacking Wikidata P856 records result in honest `CAN'T VERIFY` abstentions; official websites with aggressive Cloudflare/Akamai bot blockers fall back to build-time snapshots; personal impersonation texts receive situational advice rather than brand matches.
