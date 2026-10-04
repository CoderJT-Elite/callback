# Callback Demo Video Script (ForgeHacks 2026 Submission)

- **Total Duration:** 3 Minutes 00 Seconds (180 seconds)
- **Presenter:** John Tewolde (Solo Developer, High School Senior)
- **Track:** Cybersecurity (ForgeHacks Online 2026)
- **Visual Identity:** Paper `#F3EEE4`, Sheet `#FBF8F1`, Ink `#1C1A17`, Muted `#6B655A`, Rule `#D9D1C1`, Stamp Red `#C23B22`, Pine `#1F6A4B`, Ochre `#96640A`, Graphite `#4A4A48`. Newsreader / IBM Plex Sans / IBM Plex Mono.
- **Rules & Rubric Adherence:** Exact verified numbers only (FTC June 2026 $3.5B imposter loss; 35 synthetic test messages from `eval/results/summary.md`). Explicit AI disclosure. Grounded "what works / what doesn't" honesty beat.

---

## Time-Coded Script & Action Cues

### Scene 1: The Hook & The Imposter Crisis (0:00 – 0:18, 18s)
- **Footage Slot:** `intro-face` (Picture-in-picture bottom right)
- **[AUTO]** Kinetic type reveal over paper textured sheet:
  `"USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery-notice.xyz..."`
- **[AUTO]** Animated stat counter rolling up: `$0` → `$3.5 BILLION`
- **[AUTO]** On-screen badge with source citation:
  `"Imposter scams were nearly 1 in 3 fraud reports in 2025 · $3.5 billion reported losses"`
  `"Source: Federal Trade Commission (FTC), June 2026"`
- **[JOHN LIVE]** (On camera / voice-over):
  > "This text claims it's from the Postal Service asking for a two-dollar redelivery fee. Is it real? Imposter scams were nearly one in three fraud reports to the FTC in 2025, accounting for 3.5 billion dollars in reported losses. When you receive a text like this, how do you verify it?"

---

### Scene 2: The LLM Guessing Problem (0:18 – 0:34, 16s)
- **Footage Slot:** `voiceover-main` (Audio over animated graphics)
- **[AUTO]** Animated split comparison:
  Left: Chatbot prompt window typing `"Is this message a scam?"`
  Right: Chatbot generic response bubble with amber warning icon: `"It looks suspicious because of urgency and grammar..."`
- **[AUTO]** Graphic overlay with red cross marks:
  `✗ No official channel lookup`
  `✗ A judgment, not evidence you can check`
  `✗ Scammers now use LLMs to polish text to perfection`
- **[AUTO]** Wipe transition to Callback logo mark (`app/icon.svg`) and headline:
  `"Don't trust the number in the message. Callback finds the real one."`
- **[JOHN LIVE]** (Voice-over):
  > "The standard advice is: 'contact the company yourself.' But when people paste suspicious messages into an AI chatbot, you get a verdict but nothing you can check. Scammers use AI too, so tone proves nothing. Meet Callback."

---

### Scene 3: Live Investigation & Imposter Verdict (0:34 – 1:04, 30s)
- **Footage Slot:** `demo-narration` (Screen capture recording + audio)
- **[AUTO]** High-definition UI recording at 1920x1080.
- **[AUTO]** Smooth cursor pastes synthetic USPS smishing text into the lined input area.
- **[AUTO]** Cursor clicks **"Check it →"**.
- **[AUTO]** Investigation Trace streams in live with progress indicators:
  1. `Extracted claimed entity: USPS`
  2. `Official directory: usps.com (curated verified source)`
  3. `Link domain: usps-redelivery-notice.xyz (brand-name lookalike; unregistered in RDAP)`
  4. `Payment ask: $1.99 redelivery fee with urgent deadline`
- **[AUTO]** Result Receipt snaps into view with subtle screen shake:
  Rotated rubber stamp slams down in Stamp Red (`#C23B22`):
  **DOESN'T MATCH · CASE FILE RULE_3_STRONG_MISMATCH**
- **[AUTO]** Evidence ledger rows slide in with check/cross markers.
- **[AUTO]** Highlight card shows the official portal: `"Official USPS portal: tools.usps.com"`
- **[JOHN LIVE]** (Voice-over):
  > "Instead of guessing, Callback runs a live investigation. We paste the message and click Check it. Callback resolves who the message claims to be—the US Postal Service—from a curated list of official organizations, never from the message itself. It compares the message's link, usps-redelivery-notice.xyz, against the real domain, usps.com. The link isn't official, contains a lookalike brand name, and isn't registered in RDAP. The verdict stamp lands: DOESN'T MATCH. And Callback gives you the real portal to track your package safely."

---

### Scene 4: Legitimate Bank Alert & Contrast (1:04 – 1:26, 22s)
- **Footage Slot:** `voiceover-main` (Screen capture recording + audio)
- **[AUTO]** Cursor glides to the chip under **"Try a saved example"**: clicks **"Real bank alert (genuine)"**.
- **[AUTO]** Replay renders instantly.
- **[AUTO]** Result Receipt snaps in with Pine Green (`#1F6A4B`) rubber stamp:
  **MATCHES · CASE FILE RULE_5_ALL_OFFICIAL_MATCH**
- **[AUTO]** Split-screen ledger comparison card:
  - Phone in message: `1-800-869-3557`
  - Wells Fargo verified contact page: `1-800-869-3557` (Matched)
  - Official web domain: `wellsfargo.com` (Matched)
- **[JOHN LIVE]** (Voice-over):
  > "Callback doesn't just cry scam on everything. When you receive a real fraud alert from your bank—like this Wells Fargo security notice—it checks that the link is on wellsfargo.com and verifies the phone number against Wells Fargo's own contact page. Green stamp: MATCHES. That contrast is critical: false alarms make people ignore real bank warnings."

---

### Scene 5: Multimodal Screenshot Reading (1:26 – 1:44, 18s)
- **Footage Slot:** `voiceover-main` (Screen capture recording + audio)
- **[AUTO]** Cursor clicks sample chip: **"Screenshot sample (image)"**.
- **[AUTO]** Animated visual scanning sweep over screenshot image.
- **[AUTO]** Gemini vision extracts sender text, link, and phone number into structured JSON schema.
- **[AUTO]** Anti-hallucination guard badge illuminates:
  `"Anti-hallucination guard: Re-scans image text; drops any entity not found in original image."`
- **[AUTO]** Verdict Receipt populates with cited evidence ledger.
- **[JOHN LIVE]** (Voice-over):
  > "Callback also reads screenshots. Drop an image of a suspicious text or email, and Gemini vision reads the message into structured data. Then our extraction guard re-scans the text and drops anything the AI extracted that wasn't actually present in the original image."

---

### Scene 6: Incident Response & Report Dossier (1:44 – 2:02, 18s)
- **Footage Slot:** `voiceover-main` (Screen capture recording + audio)
- **[AUTO]** Cursor scrolls to the bottom panel and clicks:
  **"Already clicked, replied or paid?"**
- **[AUTO]** Accordion expands with clear paper styling.
- **[AUTO]** User selects **"Credit or debit card"**; guided recovery steps appear:
  `1. Call the card issuer via the number on the back of your physical card.`
  `2. Request an immediate temporary card lock and dispute unauthorized charges.`
  `3. File an official complaint with ReportFraud.ftc.gov.`
- **[AUTO]** Cursor clicks **"Download summary (.txt)"**.
- **[AUTO]** Transition to `/report` clean printable dossier formatted for FTC and IC3 complaints.
- **[JOHN LIVE]** (Voice-over):
  > "If someone already clicked the link or replied, panic makes people freeze. Callback's incident panel gives an immediate action checklist tailored to how they paid, and exports a complete incident summary with exact timestamps and evidence receipts to paste directly into ReportFraud.ftc.gov or hand to their bank."

---

### Scene 7: Deterministic Architecture: 7 Fixed Rules (2:02 – 2:20, 18s)
- **Footage Slot:** `voiceover-main` (Animated architecture diagram + `/how-it-works`)
- **[AUTO]** Screen navigates to **"How Callback decided"** (`/how-it-works`).
- **[AUTO]** Animated flowchart draws itself node-by-node:
  `Input` → `Gemini schema extraction` → `Anti-hallucination drop` → `Curated directory & Wikidata guards` → `Official page crawl & RDAP` → `7 Deterministic Rules` → `Cited explanation ([E1] required)`.
- **[AUTO]** Bold highlight callout banner:
  `"THE AI NEVER DECIDES THE VERDICT."`
- **[AUTO]** Rule ladder illuminates rules 1 through 7.
- **[JOHN LIVE]** (Voice-over):
  > "Here is what makes Callback different: the AI never decides the verdict. Gemini is used only to read messy text and draft plain-English explanations where every single sentence must cite an evidence receipt like E1 or it is dropped. Seven fixed, deterministic rules decide whether the channels match."

---

### Scene 8: The Honest Evaluation (2:20 – 2:38, 18s)
- **Footage Slot:** `voiceover-main` (Animated evaluation charts + audio)
- **[AUTO]** On-screen prominent label:
  `"EVALUATION: 35 SYNTHETIC MESSAGES (Source: eval/results/summary.md, Oct 3, 2026)"`
  `"Modeled on FTC, USPIS, IRS, and SSA scam alerts. Synthetic test split: 20 scams, 15 legitimate."`
- **[AUTO]** Animated comparison bar charts grow side by side:
  - **Scams caught:**
    - Gemini alone: 20/20 (100.0%)
    - Callback: 15/20 (75.0%)
  - **False alarms on legitimate messages:**
    - Gemini alone: 1/15 (6.7% false alarm rate)
    - Callback: 0/15 (0.0% false alarm rate)
  - **Evidence receipts:**
    - Gemini alone: 0% (No evidence cited)
    - Callback: 92.5% (74/80 sentences kept; 5 uncited dropped)
  - **Abstained ("Can't verify"):**
    - Gemini alone: 0.0% (Always forced a guess)
    - Callback: 28.6% (10/35 abstained rather than guessing)
- **[JOHN LIVE]** (Voice-over):
  > "We tested this on 35 synthetic messages that we wrote. Gemini alone flagged all 20 scams, but it also called a real payment receipt a scam and gave no evidence. Callback caught 15 scams with zero false alarms, cited evidence on 74 out of 80 explanation sentences, and answered 'can't verify' on 28.6% rather than guessing."

---

### Scene 9: What Works / What Doesn't (2:38 – 2:52, 14s)
- **Footage Slot:** `voiceover-main` (Split comparison card)
- **[AUTO]** Split ledger card on sheet paper:
  - **What works today (Tested locally):**
    - 27 curated US organizations (banks, carriers, delivery, federal agencies).
    - Lookalike detection, RDAP domain age, shortener expansion, freemail checks.
    - Keyless fallback: runs rules offline if Gemini free tier hits quota.
  - **Current limitations (Honest scope):**
    - US phone numbers (+1) and English only.
    - Phone confirmation requires organizations to publish phone numbers on crawlable pages.
    - Unlisted organizations query Wikidata with age guards; Callback cleanly abstains if unverified.
- **[JOHN LIVE]** (Voice-over):
  > "Callback is honest about its limits. It currently focuses on US numbers and 27 curated organizations. Official phone numbers can only be confirmed where organizations publish them on crawlable contact pages. If an entity is unlisted or blocks scraping, Callback says 'can't verify' instead of making up an answer."

---

### Scene 10: End Card & AI Disclosure (2:52 – 3:00, 8s)
- **Footage Slot:** `outro-face` (Picture-in-picture bottom right / full-bleed)
- **[AUTO]** End card appears with sheet styling, double hairline rule, and rubber stamp:
  `"CALLBACK · FORGEHACKS 2026"`
- **[AUTO]** Text links and metadata:
  - **Repository:** `github.com/CoderJT-Elite/callback`
  - **Live URL:** `callback-lac.vercel.app`
  - **Track:** `Cybersecurity · ForgeHacks Online 2026`
  - **Developer:** `John Tewolde (Solo, High School Senior)`
- **[AUTO]** AI Disclosure Badge:
  `"AI Disclosure: Built with AI coding agents (an AI coding assistant wrote v1; the review pass reviewed and fixed) under John Tewolde's direction."`
- **[AUTO]** Tagline:
  `"Don't trust the number in the message. Callback finds the real one."`
- **[JOHN LIVE]** (On camera / voice-over):
  > "I'm John Tewolde. Callback was built under my direction using an AI coding assistant and the review pass for ForgeHacks 2026. Try it live at callback-lac.vercel.app. Don't trust the number in the message. Callback finds the real one."

---

## Technical Recording Specs for John

1. **Resolution:** 1080p (1920×1080) webcam or camera for face shots.
2. **Framing:** Medium close-up, neutral background, good lighting.
3. **Audio:** USB microphone or clear headset mic, quiet room.
4. **Export Format:** `.mp4`, `.mov`, or `.wav` named to match the slot in `video/slots.json` (e.g., `intro-face.mp4`, `outro-face.mp4`, `voiceover-main.wav`).
5. **Drop Location:** Save raw files into `video/footage/`. The HyperFrames composition will automatically detect, retime, rescale, and composite them.
