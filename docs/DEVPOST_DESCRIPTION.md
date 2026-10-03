# Callback: find the real number before you call the fake one

## Inspiration
Imposter scams were the most reported fraud category in 2025: nearly one in three fraud reports to
the FTC, and $3.5 billion in reported losses. The FTC notes some of the costliest start with a fake
bank security alert. Every one of these scams depends on you using the phone number or link inside
the message. The standard advice is "contact the company through a channel you find yourself," but
almost nobody does that in the moment. AI-written scams make it worse: they're fluent, with no
typos to give them away. So instead of judging how a message sounds, Callback checks whether its
contact details really belong to the organization it claims to be.

## What it does
Paste a text or email, or drop a screenshot. Callback:
1. Works out who the message claims to be from (Gemini reads it; regexes re-check everything it
   reports, and anything not in the original text is dropped).
2. Looks up that organization's official domains and contact pages from a hand-checked list of 27
   commonly impersonated US organizations, or from Wikidata with guards, never from the message.
3. Checks every link (official domain? lookalike? registered how long ago?), phone number (listed on
   the official contact page?), email (official domain or a free Gmail address?) and payment ask
   (gift cards, crypto).
4. Gives a verdict from seven fixed rules: DOESN'T MATCH (plus the real channel to use instead),
   MATCHES, CAN'T VERIFY, or NO ORGANIZATION CLAIMED. Gemini then explains it, and every sentence
   must cite a piece of evidence or it's dropped.
5. If you already clicked or paid: next steps and a downloadable incident summary to paste into
   ReportFraud.ftc.gov or ic3.gov.

## How we built it
Next.js 15 and TypeScript on Vercel, streaming the investigation step by step. Gemini
(`gemini-3.5-flash-lite`, JSON schema output) for reading messages and screenshots and for the
explanation; `libphonenumber-js`, `tldts`, RDAP and Wikidata for the deterministic checks. Links in
messages are never opened: only HEAD requests through an SSRF-safe fetch that blocks private and
cloud-metadata addresses on every redirect. If Gemini is down or over quota, the rules still run
and the trace says so. Tested with Vitest and Playwright, plus a three-way evaluation
(`npm run eval`).

## Challenges
- **The internet's "official" data isn't always official.** Wikidata listed a 45-day-old unrelated
  domain as Citigroup's official website. Trusting it would have marked real Citi texts as scams and
  the fake domain as official. We switched to a hand-checked list and only accept a Wikidata website
  if its label matches and the domain is over a year old.
- **Official sites hide their phone numbers** or block scripts (Amazon, SSA, Coinbase). Callback says
  "couldn't confirm" in those cases instead of guessing.
- **Free-tier AI limits.** The first model we tried allowed 20 requests a day. We moved to a lighter
  model and made every AI step optional.

## What we learned
We ran the same 35 test messages through Gemini alone and through Callback. All of them are synthetic
examples we wrote. Gemini alone flagged all 20 scams but also called a legitimate Zelle receipt a
scam, and it can't show why. Callback flagged 15 of 20, never flagged a legitimate message, and
backed every verdict with a source. The other 5 it marked "can't verify" rather than guessing. For a
tool people use before they call a number, we think a receipt matters more than a confident guess.
The numbers come from our own synthetic set, not real-world data.

## What's next
Real labeled smishing data for evaluation, more organizations and countries, checking Telegram and
WhatsApp handles, and a share-sheet shortcut so you can check a text without copying it.

---

### What works / what doesn't
- **Works:** live checks of pasted text and screenshots; 5 pre-computed samples; 27 hand-checked
  organizations; lookalike, domain-age, shortener, phone, email and payment checks; incident summary;
  keyless fallback; mobile layout.
- **Doesn't (yet):** phone numbers can only be confirmed where the official page lists them (several
  don't or block scripts); organizations outside the list depend on Wikidata; Telegram/WhatsApp
  handles aren't checked; US numbers and English first; the evaluation set is synthetic.
