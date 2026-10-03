# Callback Video Recording Kit & Checklist

Use this guide to record the official ForgeHacks 2026 demo video smoothly.

## 1. Technical Environment Setup
- **Screen Resolution:** Exactly 1280 × 800 (or 1920 × 1080 scaled to 1280 × 800 window).
- **Browser:** Google Chrome or Chromium in clean incognito window.
- **Browser Zoom:** Set to **110%** (makes receipt typography and buttons prominent and legible).
- **DevTools / Bookmarks Bar:** Hidden (`Ctrl + Shift + B` to hide bookmarks).
- **Audio:** External microphone, input gain 75%, noise suppression on, record a 5-second silence test first.

---

## 2. Pre-Recording Preparation
1. Ensure the app is running locally:
   ```bash
   npm run build
   npm run start
   ```
2. Open `http://localhost:3000/`.
3. Open a second tab at `http://localhost:3000/how-it-works`.
4. Copy the test paste snippet to your clipboard:
   ```text
   USPS: Action required. Package delivery pending fee payment of $1.99 at usps-redelivery.xyz. Call 888-555-0142.
   ```

---

## 3. Order of On-Screen Actions (Follow Sequentially)
1. **0:00 – 0:15:** Start on landing page. Highlight headline: *"Don't trust the number in the message. Callback finds the real one."*
2. **0:15 – 0:50:** Paste the snippet into the input box. Click **"Check it"**. Let the Live Trace stream and pause 2 seconds on the red **DOESN'T MATCH** receipt.
3. **0:50 – 1:15:** Click the chip button: **"Real bank alert"**. Watch the instant replay show the green **MATCHES** receipt.
4. **1:15 – 1:40:** Click the chip button: **"Screenshot sample"**. Scroll down to **"Already clicked, replied, or paid?"**, toggle it open, click **"Download Incident Summary (.txt)"**, then **"Print / Save as PDF"**.
5. **1:40 – 2:10:** Switch to the `/how-it-works` tab. Scroll smoothly past the 7-step pipeline diagram and the deterministic rule ladder.
6. **2:10 – 2:30:** Return to the home tab, smile at camera, deliver the closing pitch line.

---

## 4. Post-Recording Quality Checklist
- [ ] Total duration between 2:15 and 2:45.
- [ ] Audio is crisp with zero background hiss.
- [ ] No personal bookmarks, extensions, or passwords visible.
- [ ] Verdict banners (Red and Green) clearly visible.
- [ ] Uploaded as unlisted YouTube or public Vimeo video link for Devpost.
