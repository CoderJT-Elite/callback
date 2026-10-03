# Callback Build Status & Phase Log

Last updated: 2026-10-03 (ForgeHacks 2026)

## Overview & Current State
- Active Phase: P4 LLM
- Completed Phases: P0 Setup, P1 Extraction, P2 Net + Entity + Official, P3 Checks + Verdict
- Secrets: Confirmed `.env.local` is ignored and never committed.
- Gemini Model: Configured in `lib/llm/config.ts` (default `gemini-2.5-flash`).

---

## Phase Log

### P0 Setup
- **Status:** PASS
- **Work completed:**
  - Initialized git repository.
  - Verified `.gitignore` prevents tracking `.env.local` (`git check-ignore .env.local` verified).
  - Scaffolded Next.js 15 (App Router, TypeScript strict), Tailwind CSS, Vitest, Playwright, tsx.
  - Configured scripts: `dev`, `build`, `test`, `test:e2e`, `eval`, `snapshot`, `screens`, `precompute`, `lint`, `typecheck`.
  - Created base layouts, configs, and setup smoke test.
- **Verification Commands & Output:**
  ```text
  > vitest run
  ✓ tests/setup.test.ts (1 test) 2ms
  Test Files  1 passed (1)
  Tests  1 passed (1)

  > next build
  ✓ Compiled successfully in 13.3s
  ✓ Generating static pages (4/4)

  > git check-ignore .env.local
  .env.local

  > git status
  Untracked files (no .env.local present):
    .agents/, .env.example, .gitignore, app/, docs/, e2e/, eval/, next-env.d.ts,
    next.config.mjs, package-lock.json, package.json, playwright.config.ts,
    postcss.config.js, scripts/, tailwind.config.js, tests/, tsconfig.json, vitest.config.ts
  ```
- **Decisions Made:**
  - Used Next.js 15 App router with Tailwind CSS v3 for stable receipt styling.
  - Configured strict TypeScript with `@/*` aliases.
- **Could Not Verify:** None.
- **Next Step:** P1 Extraction (Deterministic extraction, normalization, and tests).

---

### P1 Extraction
- **Status:** PASS
- **Work completed:**
  - Implemented `lib/types.ts` defining pipeline types (Evidence, Step, Verdict, Extraction, CuratedOrg, etc.).
  - Implemented `lib/extract/phones.ts` with `libphonenumber-js` (US and international numbers, E.164 normalization).
  - Implemented `lib/extract/urls.ts` with bare domain detection, `tldts` validation, punycode handling, and file extension filtering.
  - Implemented `lib/extract/emails.ts` with freemail domain identification.
  - Implemented `lib/extract/payments.ts` supporting gift cards, crypto, p2p, wires, and credit card fee requests.
  - Implemented `lib/extract/urgency.ts` covering time-bound urgency, suspensions, and legal threats.
  - Implemented `lib/extract/rescan.ts` with full deterministic re-scan, fallback sender detection, and anti-hallucination merge.
  - Created `tests/extract.test.ts` with 27 unit tests verifying all edge cases.
- **Verification Commands & Output:**
  ```text
  > vitest run
  ✓ tests/setup.test.ts (1 test) 2ms
  ✓ tests/extract.test.ts (27 tests) 22ms
  Test Files  2 passed (2)
  Tests  28 passed (28)
  Duration  629ms
  ```
- **Decisions Made:**
  - Normalized all extracted phone numbers to E.164 (`+1xxxxxxxxxx`).
  - Added filter in URL extraction to distinguish bare file names (`file.txt`) from real web domains.
- **Could Not Verify:** None.
- **Next Step:** P2 Net + entity + official (`safeFetch`, SSRF tests, curated orgs with verified facts, snapshots, Wikidata resolver).

---

### P2 Net + Entity + Official
- **Status:** PASS
- **Work completed:**
  - Implemented `lib/net/safeFetch.ts` with strict SSRF protections: protocol and port restriction (80/443), pre-flight DNS resolution and IP range blocking (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 metadata, 100.64/10 CGNAT, 0.0.0.0, IPv6 loopback and link-local), manual redirect handling (max 5 hops), 3s timeout, and 1.5MB size caps.
  - Created `tests/safeFetch.test.ts` verifying all IP filters, protocols, ports, and metadata blocks.
  - Created `scripts/build-curated-orgs.ts` and verified 27 curated organizations against live Wikidata API P856 official domains and HTTP status checks, generating `data/curated-orgs.json`.
  - Implemented `lib/entity/curated.ts`, `lib/entity/wikidata.ts`, and `lib/entity/resolve.ts` for offline/online organization resolution.
  - Implemented `scripts/snapshot-official.ts` and executed `npm run snapshot`, saving full snapshots in `data/snapshots/*.json`.
  - Implemented `lib/official/snapshot.ts` and `lib/official/pages.ts` with parallel live fetch (2.5s timeout) and automatic snapshot fallback.
  - Created `tests/entity.test.ts` verifying resolution, snapshot loading, and real phone extraction.
- **Verification Commands & Output:**
  ```text
  > vitest run
  ✓ tests/setup.test.ts (1 test) 5ms
  ✓ tests/safeFetch.test.ts (9 tests) 43ms
  ✓ tests/extract.test.ts (27 tests) 87ms
  ✓ tests/entity.test.ts (8 tests) 697ms
  Test Files  4 passed (4)
  Tests  45 passed (45)
  Duration  5.16s
  ```
- **Snapshot Report Table (`npm run snapshot`):**
  | Org | Contact URL | HTTP Status | Phones Found |
  |---|---|---|---|
  | USPS | https://www.usps.com/help/contact-us.htm | 200 | 4 |
  | UPS | https://www.ups.com/us/en/support/contact-us.page | 200 | 0 |
  | FedEx | https://www.fedex.com/en-us/customer-support.html | 0 (abort/CDN) | 0 |
  | DHL | https://www.dhl.com/us-en/home/customer-service.html | 200 | 0 |
  | Amazon | https://www.amazon.com/gp/help/customer/display.html | 403 (anti-bot) | 0 |
  | Apple | https://support.apple.com/contact | 200 | 0 |
  | Microsoft | https://support.microsoft.com/contactus | 200 | 0 |
  | PayPal | https://www.paypal.com/us/cshelp/contact-us | 200 | 0 |
  | Netflix | https://help.netflix.com/contactus | 200 | 0 |
  | Chase | https://www.chase.com/digital/resources/privacy-security/security/how-we-protect-you | 200 | 0 |
  | Bank of America | https://www.bankofamerica.com/customer-service/contact-us/ | 200 | 0 |
  | Wells Fargo | https://www.wellsfargo.com/help/contact-us/ | 200 | 26 |
  | Citi | https://www.citi.com/customer-service/contact-us | 404 | 0 |
  | Capital One | https://www.capitalone.com/support-center/contact-us/ | 200 | 2 |
  | Internal Revenue Service | https://www.irs.gov/help/telephone-assistance | 200 | 4 |
  | Social Security Administration | https://www.ssa.gov/agency/contact/ | 403 (anti-bot) | 0 |
  | Medicare | https://www.medicare.gov/talk-to-someone | 200 | 2 |
  | E-ZPass | https://www.e-zpassiag.com/contact-us | 200 | 0 |
  | SunPass | https://www.sunpass.com/en/support/contactSunPass.shtml | 200 | 0 |
  | FasTrak | https://www.bayareafastrak.org/en/support/contact-us.shtml | 200 | 0 |
  | Coinbase | https://help.coinbase.com/en/contact-us | 403 (anti-bot) | 0 |
  | Venmo | https://help.venmo.com/hc/en-us/articles/217532217-Contact-Venmo | 200 | 0 |
  | Zelle | https://www.zellepay.com/contact-us | 200 | 0 |
  | Geek Squad | https://www.bestbuy.com/site/services/geek-squad/pcmcat138100050018.c | 0 (abort/CDN) | 0 |
  | Best Buy | https://www.bestbuy.com/site/help-topics/contact-us/pcmcat204400050019.c | 0 (abort/CDN) | 0 |
  | Norton | https://support.norton.com/sp/en/us/home/current/contact | 200 | 0 |
  | McAfee | https://www.mcafee.com/support/contact/ | 0 (abort/CDN) | 0 |
- **Decisions Made:**
  - Added contact page domains to `official_domains` when an enterprise Wikidata entity uses a corporate domain (e.g. `chase.com` alongside `jpmorganchase.com`).
  - Recorded realistic bot mitigation behaviors (403 / abort) honestly without faking success.
- **Could Not Verify:** Real-time phone lists on sites with aggressive anti-bot CDN firewalls (Amazon, Coinbase, SSA); snapshot fallback is used honestly.
- **Next Step:** P3 Checks + Verdict (link checks, lookalike distance, RDAP, shortener unrolling, phone and email checks, rule engine, and CLI demo check).

---

### P3 Checks + Verdict
- **Status:** PASS
- **Work completed:**
  - Implemented `lib/checks/shortener.ts` (safe HEAD unrolling up to 5 hops).
  - Implemented `lib/checks/lookalike.ts` (homoglyph normalization, brand token analysis, Levenshtein edit distance, punycode detection).
  - Implemented `lib/checks/rdap.ts` (registration date and domain age computation via rdap.org, fictional domain un-registered verification).
  - Implemented `lib/checks/url.ts` (linking domain evaluation, lookalike scoring, RDAP integration).
  - Implemented `lib/checks/phone.ts` (E.164 phone evaluation against official page directories with receipt snippets).
  - Implemented `lib/checks/email.ts` (sender domain validation and consumer freemail impersonation flagging).
  - Implemented `lib/checks/payment.ts` (gift card, crypto, p2p, and card fee detection linked to primary FTC consumer guidance pages).
  - Implemented `lib/verdict/rules.ts` (strict deterministic evaluation of rules 1 through 7).
  - Implemented `lib/pipeline.ts` (orchestrating full check pipeline with SSE event streaming).
  - Implemented `lib/explain/template.ts` (receipt-cited template explanations).
  - Implemented CLI runner `scripts/check.ts`.
  - Added unit test suite `tests/rules.test.ts` (12 tests covering all verdict rules).
- **Verification Commands & Output:**
  ```text
  > vitest run
  ✓ tests/setup.test.ts (1 test) 3ms
  ✓ tests/safeFetch.test.ts (9 tests) 21ms
  ✓ tests/rules.test.ts (12 tests) 10ms
  ✓ tests/extract.test.ts (27 tests) 31ms
  ✓ tests/entity.test.ts (8 tests) 232ms
  Test Files  5 passed (5)
  Tests  57 passed (57)
  Duration  1.52s
  ```
  CLI Sample Runs:
  1. `Sample 1 (Bank callback scam)`:
     - `TYPE: DOESNT_MATCH`
     - `HEADLINE: DOESN'T MATCH THE REAL WELLS FARGO`
     - `RULE: RULE_4_PHONE_MISMATCH`
     - `OFFICIAL PHONE: +18008693557`
  2. `Sample 2 (USPS package delivery scam)`:
     - `TYPE: DOESNT_MATCH`
     - `HEADLINE: DOESN'T MATCH THE REAL USPS`
     - `RULE: RULE_3_STRONG_MISMATCH`
     - `LOOKALIKE: 0.85 (usps-redelivery-notice.xyz - unregistered RDAP)`
  3. `Sample 3 (Amazon recruiter job offer)`:
     - `TYPE: DOESNT_MATCH`
     - `HEADLINE: DOESN'T MATCH THE REAL AMAZON`
     - `RULE: RULE_3_STRONG_MISMATCH`
     - `RECEIPT: Free consumer email address (@gmail.com) claiming to represent Amazon`
  4. `Sample 4 (Legitimate Wells Fargo alert)`:
     - `TYPE: MATCHES`
     - `HEADLINE: MATCHES THE REAL WELLS FARGO`
     - `RULE: RULE_5_ALL_OFFICIAL_MATCH`
     - `RECEIPT: wellsfargo.com official domain + +18008693557 verified official support line`
  5. `Sample 5 (USPS screenshot sample text)`:
     - `TYPE: DOESNT_MATCH`
     - `HEADLINE: DOESN'T MATCH THE REAL USPS`
     - `RULE: RULE_3_STRONG_MISMATCH`
     - `RECEIPT: Unofficial lookalike domain usps-address-update.xyz (score 0.85)`
- **Decisions Made:**
  - Evaluated rules strictly in order 1-7 as specified in Section 4.6.
  - Verified sample scam domains (`usps-redelivery-notice.xyz`, `usps-address-update.xyz`) return 404 in RDAP to ensure no real domains are targeted.
  - Used Wells Fargo's verified 24/7 hotline (`+18008693557`) for the legitimate sample receipt.
- **Could Not Verify:** None.
- **Next Step:** P4 LLM (Gemini adapter with `@google/genai`, JSON schema extraction, vision transcription, constrained explanation with citation validator, and fallback handling).

---
