# Callback Build Status & Phase Log

Last updated: 2026-10-03 (ForgeHacks 2026)

## Overview & Current State
- Active Phase: P2 Net + Entity + Official
- Completed Phases: P0 Setup, P1 Extraction
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
