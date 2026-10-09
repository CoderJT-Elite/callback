# Competitors and prior art

Written 2026-10-03 after 12 targeted web searches and opening the sources below. An earlier
draft of this file was **discarded**: it cited a paper whose arXiv number is a
math paper, a patent that is about security playbooks, and a second patent and ACM DOI that don't resolve.
Everything here comes from a page that was actually returned or opened. "Could not verify" means exactly that.

## Short answer

Many tools **classify** a message ("scam / not scam") or **block** by reputation. A second family lets
**businesses enroll** so their genuine messages and calls carry a verified badge. In the searches below I
did not find a free consumer tool that takes a pasted message, looks up the claimed organization's own
published contact details, and shows which of the message's phone, link and email do or don't match them.
That is a statement about what I found, not proof that none exists: the search was small (12 queries),
US-focused and English-only, and app stores and private beta tools weren't covered.

## What exists

| Tool | What it does | Checks the message's contact points against the claimed org's published channels? | Source |
|---|---|---|---|
| Google Messages scam detection (Android) | On-device AI warns about likely scams in SMS/MMS/RCS from non-contacts; looks at urgency, link patterns and conversation | Not stated; it flags patterns | [Google blog](https://blog.google/security/new-ai-powered-scam-detection-features/) |
| Norton Genie | Free app/web: paste text or upload a screenshot, get a scam / not-scam answer and advice; one review found it missed subtle social-engineering texts | Not stated; classifier | [App Store](https://apps.apple.com/app/id6448706515), [Techlicious review](https://www.techlicious.com/blog/norton-genie-your-ai-assistant-for-spotting-scams/) |
| McAfee Scam Detector | Scans texts, email and video; claims over 99% text accuracy (McAfee's own claim, not verified here) | Not stated; classifier | [McAfee press release](https://www.mcafee.com/en-us/newsroom/press-releases/2025/mcafees-scam-detector-added-to-core-plans-protecting-people-against-text-email-and-video-scams.html) |
| Bitdefender Scamio | Free chatbot (Messenger, WhatsApp, browser): paste text, screenshot, link or QR code | Not stated; uses Bitdefender threat intelligence | [Bitdefender blog](https://www.bitdefender.com/en-us/blog/hotforsecurity/am-i-being-scammed-finding-out-has-never-been-easier) |
| Trend Micro ScamCheck | Listed as an "all-in-one" scam defense app | Could not verify details | [AlternativeTo](https://alternativeto.net/software/trend-micro-scamcheck) |
| ScamAdviser | 1-100 trust score for a website from 40+ data points (domain age, server, reviews); users report some legitimate sites score low | No; scores websites only, no phone or message check | [Maltego listing](https://www.maltego.com/transform-hub/scamadviser/) |
| Google Safe Browsing, PhishTank, OpenPhish, urlscan.io | Known-bad URL and phishing feeds / scanners | No; blocklists and scans | [Safe Browsing](https://safebrowsing.google.com/), [PhishTank](https://phishtank.org/), [OpenPhish](https://openphish.com/), [urlscan](https://urlscan.io/) |
| Truecaller Verified Business | Businesses register and pass screening; their calls show a verified badge and logo | Different approach: the business enrolls, the user checks nothing | [Beebom](https://beebom.com/truecaller-will-let-businesses-verify-their-caller-ids-to-prevent-spam-and-fraud-calls/amp/) |
| Hiya Connect / Secure Branding | Carrier-integrated branded caller ID; banks and government must complete secure branding first | Different approach (enrollment) | [GSMA PDF](https://www.gsma.com/solutions-and-impact/technologies/security/scams/wp-content/uploads/2025/08/Hiya-Connect-%E2%80%93-Restoring-Trust-in-Voice-Calls-3.pdf) |
| Apple Business Connect (Business Caller ID, Mail logos) | Verified businesses show name and logo on iPhone calls and mail | Different approach (enrollment) | [Apple Newsroom](https://apple.com/newsroom/2024/10/apple-expands-tools-to-help-businesses-connect-with-customers) |
| Google Verified SMS / RCS for Business | Verified sender name, logo and badge on business texts | Different approach (enrollment; vSMS works in Google Messages only) | [Plivo](https://www.plivo.com/blog/google-verified-sms/), [Infobip](https://www.infobip.com/blog/rcs-verification) |
| iOS 26 "Screen Unknown Senders" | Messages from unknown senders go to a separate folder without alerts | No; filtering | [Braze summary](https://www.braze.com/resources/articles/ios-26-sms-mms-rcs) |
| SmishGuard (open source) | TF-IDF + engineered features classifier with optional LLM second opinion, Zimbabwe-focused | No; classifier | [GitHub](https://github.com/ipridem/smishguard) |
| "LLM-Assisted Authentication and Fraud Detection" (paper) | LLM + retrieval over scam databases and organizational policy documents; outputs a score and explanation | Closest in spirit (retrieves organizational evidence) but a research system that outputs a likelihood score; I did not check whether code or a product exists | [arXiv 2601.19684](https://arxiv.org/pdf/2601.19684) |

## How Callback differs (and where it doesn't)

- **Different:** Callback's verdict comes from fixed rules over the organization's own published contact
  details, and it shows the numbered checks behind the verdict plus the official number to use instead. The
  classifiers above give a judgment; the enrollment systems only help if the real sender enrolled and the
  user notices a missing badge.
- **Not different:** Gemini alone is a strong detector on our own synthetic set (20 of 20 scams), and Google,
  Norton, McAfee and Bitdefender already offer free or bundled AI checks. Callback does not beat them at
  catching scams; its claim is evidence, plus fewer false accusations on our synthetic set.
- **Not claimed:** "first" or "only". Do not use those words.

## Gaps in this research
Not covered: app-store tools beyond those named, carrier-built filters (AT&T, Verizon, T-Mobile), bank-side
"confirm this number" lines, non-English markets, academic search beyond one paper, and Trend Micro and
Truecaller feature depth. Anyone extending this should start there.
