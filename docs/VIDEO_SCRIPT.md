# Callback Demo Video Script (Target: 2 Minutes 30 Seconds)

## Production Overview
- **Speaker:** John Tewolde
- **Screen Resolution:** 1280 × 800 (16:10 or 16:9 standard video capture)
- **Browser Zoom:** 110%
- **Audio:** Clear microphone, room quiet

---

## Shot List & Script

### Scene 1: The Hook (0:00 – 0:15)
- **Visual:** Browser opened to `http://localhost:3000/`. Mouse hovers over the input area. On-screen text or picture-in-picture showing a typical smishing text: *"USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery-notice.xyz..." (use the **Package delivery** sample text; that domain was checked as unregistered)"*
- **Spoken Audio:**
  > *"This text claims it's from the US Postal Service asking for a two-dollar redelivery fee. Is it real? People reported losing 3.5 billion dollars to imposter scams last year, the FTC's most reported fraud. Asking a chatbot "is this a scam?" gets you a guess with no proof. Meet Callback."*

### Scene 2: Live Trace & Imposter Verdict (0:15 – 0:50)
- **Visual:** John pastes the USPS scam message into the text box and clicks **"Check it"**. The Live Investigation Trace streams in real time:
  1. Identifies claimed sender: USPS.
  2. Resolves official domain: `usps.com` from the hand-checked list.
  3. Checks link `usps-redelivery-notice.xyz` (not usps.com, brand-name lookalike, not a registered domain per RDAP).
  4. Flags the $1.99 fee and the "within 24 hours" urgency.
  5. Verdict Receipt snaps into view with red banner: **DOESN'T MATCH THE REAL USPS (RULE_3_STRONG_MISMATCH)**.
  6. Explanation sentences each cite an evidence id like `[E1]`.
- **Spoken Audio:**
  > *"Instead of guessing, Callback streams its investigation step by step. It extracts the claimed sender, looks up USPS's official domain from a hand-checked list, never from the message, and checks the link. It's not a usps.com address, it contains the brand name, and it isn't even a registered domain. Verdict: DOESN'T MATCH. And here's the real USPS contact portal to check your package safely."*

### Scene 3: Legitimate Verification (0:50 – 1:15)
- **Visual:** Click sample chip: **"Real bank alert"**. Instant replay renders in under a second. Green banner: **MATCHES THE REAL WELLS FARGO (RULE_5_ALL_OFFICIAL_MATCH)**. Shows the official domain `wellsfargo.com` and the phone number matched on Wells Fargo's contact page.
- **Spoken Audio:**
  > *"Callback doesn't just cry scam on everything. When you receive a real fraud alert from your bank—like this Wells Fargo fraud alert, it checks that the link is on wellsfargo.com and that the phone number is listed on Wells Fargo's own contact page. Green verdict: MATCHES."*

### Scene 4: Multimodal Screenshot & Incident Response (1:15 – 1:40)
- **Visual:** Click sample chip: **"Screenshot sample"**. Shows uploaded image of a smishing text. Trace extracts text via Gemini vision and issues verdict. John scrolls down to the **"Already clicked or paid?"** incident panel, selects **"Credit / Debit Card"**, clicks **"Download Incident Summary (.txt)"**, and clicks **"Print / Save as PDF"** showing the `/report` view.
- **Spoken Audio:**
  > *"Callback also reads screenshots using Gemini vision. And if someone already tapped the link or paid the fee, the Incident Response toolkit generates an immediate, pre-filled incident report with exact timestamps and evidence receipts ready to file with ReportFraud.ftc.gov or their credit card issuer."*

### Scene 5: Architecture & The Deterministic Rule Engine (1:40 – 2:10)
- **Visual:** Navigate to `/how-it-works`. Scroll through the interactive 7-step pipeline diagram and the deterministic rule ladder. Briefly switch to `eval/results/summary.md` showing the test split table.
- **Spoken Audio:**
  > *"Here's what makes Callback different: the AI never decides the verdict. The AI is restricted to reading messy screenshots and synthesizing cited explanations. The verdict is calculated entirely by deterministic code—evaluating public suffix math, RDAP domain age, and official directory lookups. On our own test set of 35 synthetic messages, Gemini alone flagged more scams, but it also called a real payment receipt a scam and showed no evidence. Callback never flagged a legitimate message, and when it wasn't sure, it said "can't verify" instead of guessing."*

### Scene 6: Honesty, Limits & Closing Pitch (2:10 – 2:30)
- **Visual:** Return to the home screen showing the clean header. Picture-in-picture of John concluding.
- **Spoken Audio:**
  > *"Callback is honest about its limits: if an entity has no public directory record, it cleanly abstains rather than making up an answer. Callback was developed under my direction using AI pair-programming agents during ForgeHacks 2026. Remember: don't trust the number in the message. Callback finds the real one."*
