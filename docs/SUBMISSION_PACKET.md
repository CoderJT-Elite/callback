# Callback — ForgeHacks 2026 Submission Packet

> **Submission Target:** https://forgehacks-2026.devpost.com/  
> **Deadline:** Saturday, October 10, 2026 at 12:00 PM ET (Target completion: Friday, October 9)  
> **Author:** John Tewolde (Solo Developer)  
> **Track:** Cybersecurity (Cannot be changed after submission!)

---

## Pre-Submission Quick Checklist (For John on Friday, Oct 9)

- [x] **1. Set Vercel API Key & Redeploy:** `GEMINI_API_KEY` successfully added to Vercel (Production & Preview secrets) and redeployed. Live screenshot OCR and AI-written explanations are active on `https://callback-lac.vercel.app`.
- [ ] **2. Record Your Footage (Optional):** Follow `video/FOOTAGE_GUIDE.md` to record your clips (`intro-face.mp4`, `outro-face.mp4`). Drop them into `video/footage/` and run `npm run render` inside `video/`. If you don't record, the pre-rendered master video in `video/out/callback-demo-16x9.mp4` already contains crisp, clearly marked animated cards.
- [ ] **3. Upload Demo Video:** Upload `video/out/callback-demo-16x9.mp4` to YouTube (set to Unlisted or Public) or Vimeo. Copy the URL.
- [ ] **4. Copy-Paste Devpost Form:** Fill out the Devpost fields below in order, upload the gallery images from `docs/devpost/gallery/`, and click **Submit**.

---

## Devpost Field-by-Field Submission Guide

Copy and paste the exact content below into each field on Devpost:

### 1. Project Overview
- **Project Name:** `Callback`
- **Tagline (Short Description):**  
  `Find the real number before you call the fake one. Verifies suspicious messages against official directories with receipts.`
- **Track Selection:**  
  Select: **Cybersecurity** *(CRITICAL: Check this carefully; track cannot be changed after submitting!)*

### 2. Team Members
- **Members:** John Tewolde (Solo)

### 3. Links & Repository
- **GitHub Repository URL:**  
  `https://github.com/CoderJT-Elite/callback`
- **Live Demo URL:**  
  `https://callback-lac.vercel.app`
- **Video Demo URL:**  
  `[PASTE YOUR YOUTUBE/VIMEO LINK HERE]` *(from Step 3 above)*

### 4. Built With (Tags)
`next.js`, `react`, `typescript`, `tailwind-css`, `google-gemini`, `playwright`, `vitest`, `hyperframes`, `ffmpeg`, `libphonenumber-js`

### 5. Project Media & Gallery Uploads
Upload the following files from `docs/devpost/gallery/` in this exact sequence:
1. **Header / Cover Art:** `docs/devpost/gallery/cover-art.png`
2. **Project Thumbnail (3:2):** `docs/devpost/gallery/thumbnail-3x2.png`
3. **Gallery Image 1 (Landing Hero):** `docs/devpost/gallery/01-hero-landing-1600x900.png`
4. **Gallery Image 2 (Scam Mismatch Verdict):** `docs/devpost/gallery/02-mismatch-verdict-1600x900.png`
5. **Gallery Image 3 (Authentic Match Verdict):** `docs/devpost/gallery/03-match-verdict-1600x900.png`
6. **Gallery Image 4 (Incident Response Toolkit):** `docs/devpost/gallery/04-incident-response-1600x900.png`
7. **Gallery Image 5 (7-Rule Pipeline Architecture):** `docs/devpost/gallery/05-how-it-decides-1600x900.png`

---

### 6. Main Project Description (Paste into Devpost Markdown Editor)

Copy and paste the entire contents of [docs/DEVPOST_DESCRIPTION.md](file:///C:/OS/GitHub/Competition%20Builds/callback/docs/DEVPOST_DESCRIPTION.md) into the description field.

A quick preview of the sections included in that file:
- **Inspiration:** FTC June 2026 statistics ($3.5B losses, 1 in 3 fraud reports) and the fallacy of asking chatbots "is this a scam?".
- **What It Does:** 5-stage pipeline, deterministic 7-rule engine, cited evidence receipts, incident response toolkit.
- **How We Built It:** Next.js 15, Gemini vision/flash-lite, SSRF-safe fetch, Playwright, HyperFrames.
- **Challenges:** Dealing with poisoned community databases (Wikidata lookalikes), defensive crawl-blocking bank contact pages, enforcing strict evidence citations.
- **Accomplishments & Learnings:** Controlled 35-message synthetic evaluation matrix (Gemini alone vs Callback).
- **What Works / What Doesn't:** Explicit rubric-compliant honesty boundaries.
- **What's Next:** Global directories, share extensions, cryptographic DNS proofs.
- **AI Disclosure:** Created by John Tewolde using an AI coding assistant and the review pass.

---

## Post-Submission Verification
Once you press "Submit":
1. Verify the project appears on the ForgeHacks 2026 Devpost showcase page under the Cybersecurity track.
2. Confirm the demo video embeds and plays properly.
3. Test that the GitHub link and live Vercel URL open correctly in an incognito window.
4. Save the submission confirmation email to your records.

---

## Cross-Check Against ForgeHacks Master Checklist (00-SUBMIT-CHECKLIST.md)

Audit against `submission-kit\00-SUBMIT-CHECKLIST.md`:

| Item / Requirement | Status | Verification & Evidence |
|---|:---:|---|
| **Repo public / first commit after Oct 3 12 PM ET** | Ready for John | Repository is initialized locally on main; first commit Oct 3 2026; John OKs the push on Fri Oct 9. |
| **Fresh clone installs & runs from README** | PASS | Verified `npm ci`, `npm run dev`, `npm run build`, `npm run start` execute cleanly. |
| **Live link opened logged out, no signup, no key** | PASS | Verified `https://callback-lac.vercel.app` returns HTTP 200 OK without authentication. |
| **Every number in README matches command in repo** | PASS | FTC June 2026 cited with URL; 35 synthetic messages reproduce via `npm run eval`. |
| **"What works / what doesn't" section written & honest** | PASS | Written in both `README.md` and `DEVPOST_DESCRIPTION.md`. |
| **AI disclosure in README & video end card** | PASS | Present in `README.md`, `DEVPOST_DESCRIPTION.md`, and burned into `frame-12-176s.png`. |
| **No keys, tokens or personal data committed** | PASS | Git log scan (`git log -p -S "AIzaSy"`) verified 0 leaked keys; `.env.local` strictly ignored. |
| **Reused code named in README** | PASS | Documented: "No code was reused from earlier projects." |
| **Devpost form fields filled** | PASS | Complete text and field mappings provided above. |
| **Demo video (2-3 min)** | PASS | Master video `callback-demo-16x9.mp4` is exactly 3:00 (180.00s); vertical cut is also 3:00. |
| **Items package does not cover (John-only actions)** | Noted | 1) Adding Vercel `GEMINI_API_KEY`, 2) Uploading video & setting `VIDEO_URL_TBD`, 3) Final Devpost Submit. |

