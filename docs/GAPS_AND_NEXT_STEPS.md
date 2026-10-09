# Gaps and next steps

Rewritten 2026-10-03. An earlier draft was discarded: it stated coverage
percentages ("55-60%", "85%"), a toll-scam growth figure and per-token prices with no source, described the
safe fetcher wrongly (it follows up to 5 redirects, not 3), and numbered the verdict rules wrongly.
Every conclusion below carries a confidence label: **Sourced** (a page I opened), **From our code or tests**,
or **Inferred** (my reasoning, not measured).

## 1. Is this already done?
Partly. See `docs/COMPETITORS.md`. Free AI scam checkers exist (Norton Genie, Bitdefender Scamio, Google
Messages detection, McAfee Scam Detector), and verified-sender systems exist for businesses that enroll
(Verified SMS, RCS for Business, Truecaller and Hiya verified calling, Apple Business Connect). In 12
searches I did not find a consumer tool that compares a message's phone, link and email to the claimed
organization's own published channels and shows the receipts. **Confidence: medium; small, US-only search.**
It is a crowded space for "is this a scam?" and a much less crowded one for "do these contact details belong
to who they claim?"

## 2. What people need right now (all Sourced)
- Imposter scams are the most reported fraud category: nearly 1 in 3 fraud reports in 2025, $3.5 billion
  reported lost, bank impersonation the largest share of business-imposter losses, and some of the costliest
  start with a fake security alert from a bank ([FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025),
  [KnowBe4 summary](https://blog.knowbe4.com/ftc-report-imposter-scams-record-losses)).
- Text messages: $470 million lost to scams that began as texts in 2024 (five times 2020); package-delivery
  texts impersonating USPS were the most reported, then recruiter "task" scams, bank/Amazon "suspicious
  activity" texts that connect victims to a fake fraud department, and toll texts
  ([report on the FTC data, secondary source](https://www.yahoo.com/news/text-scams-cost-consumers-470m-195357068.html)).
- Older adults: reported losses over $100,000 to imposter scams rose nearly sevenfold from 2020 to 2024
  ([CFP Board summary of the FTC release](https://www.cfp.net/news/2026/06/imposter-scams-led-fraud-reports-to-the-ftc-for-fifth-straight-year-in-2025)).
- FBI IC3 2025: 191,561 phishing or spoofing complaints, the most reported crime type
  ([secondary summary; the report itself was not opened](https://spycloud.com/blog/fbi-internet-crime-report-2025/)).
- Callback's design matches the pattern the FTC describes (a fake bank alert that gives you a number to call):
  the check that stops it is "is this the bank's real number?". **Confidence: medium (fit is my inference).**

## 3. What Callback can and can't do (From our code or tests)
- Works: US organizations in a hand-checked list of 27; domain, lookalike and domain-age checks work for any
  TLD; phone confirmation only where the official page publishes numbers.
- Doesn't: non-US organizations and national phone formats; Telegram/WhatsApp handles; QR codes in images
  (the AI reads text, not QR payloads); organizations outside the list depend on Wikidata with guards;
  vanity numbers ("1-800-FLOWERS") and leetspeak brand spellings are not normalized
  (`docs/STRESS_TEST.md`).
- Measured on our own **synthetic** test (35 messages): Gemini alone flagged 20/20 scams and 1/15 legitimate
  messages; Callback flagged 15/20 and 0/15, with a cited receipt for each verdict. No real-world accuracy
  number exists.

## 4. Ranked next steps (all Inferred; effort S/M/L)
1. **Share-sheet / PWA share target** so a user can send a text or screenshot straight in (S-M). The need is
   speed under stress; today you must copy and paste.
2. **Grow the organization list**, starting with whoever tops the FTC text-scam lists: more banks, toll
   authorities, carriers (M). Each entry needs hand verification of its domains and contact page; without
   measured coverage data the benefit is unknown, so measure first (collect which organizations users
   check).
3. **Normalize vanity numbers, leetspeak brand names and add a "message mentions a QR code" warning** (S;
   findings in `docs/STRESS_TEST.md`).
4. **UK/CA/AU packs** with country-aware phone parsing (M).
5. **Cache RDAP and contact-page results** before any real traffic (M); free public RDAP servers rate-limit,
   and the Gemini free tier has per-minute and daily caps (seen during our eval).

## 5. Innovation statement that is true
Callback doesn't try to out-guess an AI classifier; on our synthetic set a plain Gemini prompt caught more
scams. Its different bet is that the useful answer is the check itself: look up what the claimed organization
publishes (a hand-checked directory first, never the message), compare the message's phone, link and email to
it, and show the numbered evidence and the real channel to use. AI reads messy messages and writes the
explanation; fixed rules decide. Don't say "first" or "only" or "more accurate".
