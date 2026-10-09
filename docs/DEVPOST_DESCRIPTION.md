# Callback: find the real number before you call the fake one

**Tagline:** Verifies suspicious texts, emails, and screenshots against official directories with deterministic receipts.

**Track:** Cybersecurity  
**Team:** John Tewolde (Solo, high school senior)  
**Repository:** https://github.com/CoderJT-Elite/callback (Public)  
**Live Demo:** https://callback-lac.vercel.app  

---

## Inspiration
Imposter scams were the most reported fraud category in 2025: nearly **1 in 3** fraud reports to the FTC, representing **$3.5 billion** in reported losses (Source: Federal Trade Commission, June 2026). Some of the costliest incidents start with an urgent message pretending to be a bank fraud department, a courier, or a government agency.

Every imposter scam relies on the victim using the contact channel provided inside the fraudulent message—either calling the spoofed phone number, clicking a phishing link, or replying directly. The standard security advice is simple: *"Always look up the organization independently and call the number you find."* But in reality, under the stress of an urgent alert, almost nobody takes the time to look up official directories manually. AI-written scams make this far worse: they are grammatically flawless and contextually fluent, eliminating traditional spelling errors and awkward phrasing.

Instead of asking an LLM to guess whether a message "sounds like a scam", **Callback** programmatically verifies whether the contact channels in the message actually belong to the claimed organization using sources the sender cannot control.

---

## What It Does
Paste a suspicious text or email, or drop a screenshot. Callback runs a six-step check:

1. **Claims Extraction:** Gemini (`gemini-3.5-flash-lite`) extracts the claimed organization, phone numbers, links, emails, and payment cues into strict JSON schema format. Every extracted entity is re-validated with local regexes; any hallucinated entity not present in the original input is immediately dropped.
2. **Independent Directory Lookup:** Callback looks up official domains and verified contact pages from a curated, hand-checked registry of 27 commonly impersonated US organizations (financial institutions, couriers, government agencies, tech utilities). For unlisted entities, it queries Wikidata (property P856) with strict validation guards (blocking freshly registered domains under 365 days old).
3. **Deterministic Channel Verification:**
   - **Links:** Evaluates domain identity, lookalike score, subdomain spoofing, and RDAP registration age. Links in messages are never opened—only safe HEAD requests with SSRF protections that block private and cloud metadata IP ranges.
   - **Phone Numbers:** Normalizes through `libphonenumber-js` and verifies against the organization's official published contact directory.
   - **Emails:** Checks whether the sending domain matches official domains or uses a freemail provider (Gmail, Hotmail, etc.).
   - **Payment Demands:** Flags irreversible payment requests (cryptocurrency, gift cards, wire transfers, Zelle urgency).
4. **Deterministic 7-Rule Verdict Engine:** The verdict is never decided by an AI. A fixed 7-rule engine calculates the verdict: `DOESN'T MATCH` (displaying the official number to call instead), `MATCHES`, `CAN'T VERIFY`, or `NO ORGANIZATION CLAIMED`.
5. **Cited Explanations:** Gemini drafts a plain-English explanation of the findings. Every single explanation sentence must explicitly cite a verified evidence tag (e.g. `[E1]`, `[E2]`) or it is stripped by our post-processing evidence validator.
6. **Incident Response Toolkit:** If the user already clicked, replied, or sent money, Callback offers structured recovery checklists tailored to the payment method and generates a downloadable incident summary (`.txt`) ready to submit to ReportFraud.ftc.gov and IC3.gov.

---

## How We Built It
- **Frontend & App Framework:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS. Designed with a clean editorial aesthetic (Newsreader serif, IBM Plex Sans, IBM Plex Mono, warm archival paper `#F3EEE4`, and rubber-stamp verdicts).
- **Verification Engine:** Pure TypeScript deterministic rule engine (`lib/verdict/rules.ts`) executing rules 1 through 7 with strict short-circuit logic.
- **SSRF-Guarded Network Security:** Custom `lib/net/safeFetch.ts` enforcing `HEAD` requests only, blocking loopback (`127.0.0.1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local addresses, and AWS/GCP cloud metadata IP (`169.254.169.254`) across all redirects.
- **Multimodal AI Integration:** Google Gemini (`gemini-3.5-flash-lite`) configured with structured JSON schemas. If the Gemini API key is missing or quota is exhausted, the engine cleanly degrades to offline deterministic mode and notes this in the trace.
- **Testing & Verification:** Comprehensive automated test suite with Vitest (unit tests for rules, extractors, and safe fetch) and Playwright (end-to-end browser and screenshot capture).
- **Video Production:** Animated demo video engineered entirely in code using **HyperFrames** (GSAP timelines, programmatic motion graphics, deterministic frame rendering).

---

## Challenges We Ran Into
- **Unreliable "Official" Web Data:** During early testing, we discovered that open community databases like Wikidata contained a 45-day-old malicious lookalike domain listed under Citigroup's official record. Trusting open data blindly would have marked real Citi fraud alerts as scams while legitimizing fake domains. We solved this by creating a hand-checked registry of 27 top US institutions and enforcing strict RDAP age guards (requiring Wikidata domains to be registered for >365 days).
- **Defensive Contact Pages:** Major targets like Amazon, SSA, and Coinbase aggressively hide direct phone numbers behind interactive help centers or block automated HTTP crawlers with bot protection. Instead of guessing or making assumptions, Callback follows an honest fallback: if a phone number cannot be independently confirmed on the official site, it returns `CAN'T VERIFY` rather than asserting false confidence.
- **Hallucination Control in AI Explanations:** Free-form AI explanations can say things the evidence doesn't support. We added an evidence-tag parser: every sentence produced by the LLM must cite an evidence code like `[E1]`; any sentence lacking a valid citation is discarded. In testing, 74 of 80 generated explanation sentences were preserved while 5 uncited claims were eliminated.

---

## Accomplishments & What We Learned
We conducted a controlled evaluation comparing **Gemini Alone** against **Callback** across 35 synthetic test messages (20 scams across multiple vectors, 15 authentic security alerts and transactional messages, all written by us and labeled synthetic):

| Evaluation Metric | Gemini Alone (`gemini-3.5-flash-lite`) | Callback (Rules + Directory + Gemini) |
|---|:---:|:---:|
| **Scam Detection** | 20 / 20 (100%) | 15 / 20 (75%) |
| **False Alarms on Legit Messages** | 1 / 15 (6.7% false positive) | **0 / 15 (0.0% false positive)** |
| **Evidence shown with the verdict** | None | A numbered check with its source for every verdict |
| **Cited Explanation Sentences Kept** | N/A | **92.5%** (74 of 80 sentences kept, 5 uncited dropped) |
| **Abstention on Ambiguity** | 0% (always guesses) | **28.6%** (honestly answered "Can't verify") |

*Source: `eval/results/summary.md` (synthetic benchmark).*

**Key Takeaway:** On our small synthetic set, plain Gemini caught more scams than Callback but also called one legitimate message a scam and showed no evidence. Callback caught fewer, accused no legitimate message, and said "can't verify" when it wasn't sure. For someone deciding which number to call, we think the evidence matters more than a confident guess. This is 35 messages we wrote, so it is a demonstration, not a measurement of real-world accuracy.

---

## What Works / What Doesn't (Honest Boundaries)
Per the ForgeHacks rubric (*"A half-working project is okay. Overstating it isn't"*), here are our explicit system boundaries:

### What Works:
- Real-time paste analysis for text, SMS, and email.
- Multimodal screenshot OCR and structured entity parsing.
- 5 instant pre-computed sample cases (Package delivery scam, Bank fraud alert, Recruiter job offer, Authentic Wells Fargo notice, USPS screenshot).
- Curated directory of 27 high-profile US institutions with verified official domains and phone channels.
- SSRF-safe network fetch blocking private IPs and metadata endpoints.
- Incident response panel with custom recovery checklists and downloadable incident summaries (`.txt`).
- Complete offline / keyless fallback mode when LLM credentials are not configured.

### What Doesn't (Yet):
- **US Focus Only:** Curated directory currently covers US organizations and US phone number formats (`+1`).
- **Crawlable Directory Requirement:** Phone confirmation requires that the organization publishes contact numbers on accessible web pages; sites requiring authenticated login or heavy CAPTCHA shielding cannot confirm phones.
- **Synthetic Evaluation Set:** Benchmark figures are derived from our 35 synthetic messages, not live production telemetry.
- **Unmonitored Messaging Platforms:** Telegram, Signal, and WhatsApp handles are not yet cross-referenced against external registries.

---

## What's Next for Callback
- **Expanded Global Directory:** Expanding the curated registry to cover UK, Canadian, and Australian banking and postal institutions.
- **Mobile Share-Sheet Extension:** An iOS and Android share extension allowing users to forward a suspicious SMS screenshot directly to Callback without opening a browser.
- **Crowdsourced Cryptographic Signatures:** Enabling verified enterprise security teams to publish signed public phone registries via DNS TXT records.

---

## Built With
- `next.js` (v15 App Router)
- `react` (v19)
- `typescript`
- `tailwind-css`
- `google-gemini` (`gemini-3.5-flash-lite`)
- `playwright`
- `vitest`
- `hyperframes` (v0.8)
- `ffmpeg`
- `libphonenumber-js`
- `tldts`

---

## AI Disclosure
In accordance with competition rules: Callback was designed and built under John Tewolde's direction with AI coding assistants. AI assistants wrote most of the code from a written spec; a separate review pass checked every claim against real runs and fixed what it found. All evaluation numbers, architectural trade-offs, and system boundaries reflect real executions and empirical tests.
