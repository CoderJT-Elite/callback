# Callback Demo Video Script (Target: 2 Minutes 30 Seconds)

## Production Overview
- **Speaker:** John Tewolde
- **Screen Resolution:** 1280 × 800 (16:10 or 16:9 standard video capture)
- **Browser Zoom:** 110%
- **Audio:** Clear microphone, room quiet

---

## Shot List & Script

### Scene 1: The Hook (0:00 – 0:15)
- **Visual:** Browser opened to `http://localhost:3000/`. Mouse hovers over the input area. On-screen text or picture-in-picture showing a typical smishing text: *"USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery.xyz..."*
- **Spoken Audio:**
  > *"This text claims it's from the US Postal Service asking for a two-dollar redelivery fee. Is it real? The FTC reports over 2.7 billion dollars lost to imposter scams every year. But when people ask an AI, chatbots often hallucinate or guess. Meet Callback."*

### Scene 2: Live Trace & Imposter Verdict (0:15 – 0:50)
- **Visual:** John pastes the USPS scam message into the text box and clicks **"Check it"**. The Live Investigation Trace streams in real time:
  1. Identifies claimed sender: USPS.
  2. Resolves official domain: `usps.com` from verified public directory.
  3. Checks link `usps-redelivery.xyz` (flags lookalike score 0.85 and unregistered RDAP domain).
  4. Checks phone `+1 888-555-0142` (mismatch with official directory).
  5. Verdict Receipt snaps into view with red banner: **DOESN'T MATCH THE REAL USPS (RULE_3_STRONG_MISMATCH)**.
  6. Explanations cite `[E1]`, `[E2]`.
- **Spoken Audio:**
  > *"Instead of guessing, Callback streams an immutable investigation trace. It extracts the claimed sender, looks up official records from Wikidata P856 and verified directories, and checks the link and phone. The link is a lookalike domain, and the phone doesn't exist on USPS's directory. Verdict: DOESN'T MATCH. And here's the real USPS contact portal to check your package safely."*

### Scene 3: Legitimate Verification (0:50 – 1:15)
- **Visual:** Click sample chip: **"Real bank alert"**. Instant replay renders in under a second. Green banner: **MATCHES THE REAL WELLS FARGO (RULE_5_ALL_OFFICIAL_MATCH)**. Shows verified shortcode `93557` and official domain `wellsfargo.com`.
- **Spoken Audio:**
  > *"Callback doesn't just cry scam on everything. When you receive a real fraud alert from your bank—like this Wells Fargo security code—it verifies that the shortcode and domain match the bank's official public record. Green verdict: MATCHES."*

### Scene 4: Multimodal Screenshot & Incident Response (1:15 – 1:40)
- **Visual:** Click sample chip: **"Screenshot sample"**. Shows uploaded image of a smishing text. Trace extracts text via Gemini vision and issues verdict. John scrolls down to the **"Already clicked or paid?"** incident panel, selects **"Credit / Debit Card"**, clicks **"Download Incident Summary (.txt)"**, and clicks **"Print / Save as PDF"** showing the `/report` view.
- **Spoken Audio:**
  > *"Callback also reads screenshots using Gemini vision. And if someone already tapped the link or paid the fee, the Incident Response toolkit generates an immediate, pre-filled incident report with exact timestamps and evidence receipts ready to file with ReportFraud.ftc.gov or their credit card issuer."*

### Scene 5: Architecture & The Deterministic Rule Engine (1:40 – 2:10)
- **Visual:** Navigate to `/how-it-works`. Scroll through the interactive 7-step pipeline diagram and the deterministic rule ladder. Briefly switch to `eval/results/summary.md` showing the test split table.
- **Spoken Audio:**
  > *"Here's what makes Callback different: the AI never decides the verdict. The AI is restricted to reading messy screenshots and synthesizing cited explanations. The verdict is calculated entirely by deterministic code—evaluating public suffix math, RDAP domain age, and official directory lookups. In our 50-item evaluation dataset, 100% of explanation claims cite verified receipts."*

### Scene 6: Honesty, Limits & Closing Pitch (2:10 – 2:30)
- **Visual:** Return to the home screen showing the clean header. Picture-in-picture of John concluding.
- **Spoken Audio:**
  > *"Callback is honest about its limits: if an entity has no public directory record, it cleanly abstains rather than making up an answer. Callback was developed under my direction using AI pair-programming agents during ForgeHacks 2026. Remember: don't trust the number in the message. Callback finds the real one."*
