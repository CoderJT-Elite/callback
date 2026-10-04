# John's Recording Guide for Callback Demo Video

Read this before recording. Total recording time needed: under 10 minutes.

---

## Technical Setup (Fast 10-Line Checklist)

1. [ ] **Lighting:** Face the light or window; don't have a bright window behind you.
2. [ ] **Camera:** Webcam or phone at eye level (1080p 1920×1080, landscape).
3. [ ] **Framing:** Medium close-up (chest up, head near top third of frame).
4. [ ] **Audio:** USB microphone or wired headset mic placed close to your mouth.
5. [ ] **Room:** Quiet space; close door/windows; silence phone and notifications.
6. [ ] **Resolution:** Record at 1920×1080 (30 fps or 60 fps).
7. [ ] **Format:** Save files as `.mp4`, `.mov`, `.webm`, or `.wav`.
8. [ ] **File Names:** Name your files exactly to match their slot name below.
9. [ ] **Drop Folder:** Place recorded files into `video/footage/`.
10. [ ] **Verification:** Run `npm run lint:footage` to verify fit and audio sync.

---

## The Slots & Script Lines

### Slot 1: `intro-face.mp4`
- **Slot ID:** `intro-face`
- **Duration:** 18 seconds (target: 0:00 to 0:18)
- **Framing:** Talking head, looking directly into the camera.
- **Lines to say:**
  > "This text claims it's from the Postal Service asking for a two-dollar redelivery fee. Is it real? Imposter scams were nearly one in three fraud reports to the FTC in 2025, accounting for 3.5 billion dollars in reported losses. When you receive a text like this, how do you verify it?"

---

### Slot 2: `demo-narration.mp4` (or audio `.wav`)
- **Slot ID:** `demo-narration`
- **Duration:** 30 seconds (target: 0:34 to 1:04)
- **Framing:** Voice-over under the live paste check screen recording.
- **Lines to say:**
  > "Instead of guessing, Callback runs a live investigation. We paste the message and click Check it. Callback resolves who the message claims to be—the US Postal Service—from a curated list of official organizations, never from the message itself. It compares the message's link, usps-redelivery-notice.xyz, against the real domain, usps.com. The link isn't official, contains a lookalike brand name, and isn't registered in RDAP. The verdict stamp lands: DOESN'T MATCH. And Callback gives you the real portal to track your package safely."

---

### Slot 3: `voiceover-main.wav` (Master Voice-over Option)
- **Slot ID:** `voiceover-main`
- **Duration:** 180 seconds (3:00)
- **Note:** If you prefer recording one continuous audio track for the entire 3:00 video, read `docs/VIDEO_SCRIPT.md` from top to bottom and save it as `video/footage/voiceover-main.wav`. The composition ducks music automatically and syncs under all animated scenes.

---

### Slot 4: `outro-face.mp4`
- **Slot ID:** `outro-face`
- **Duration:** 8 seconds (target: 2:52 to 3:00)
- **Framing:** Talking head, looking into camera with closing confidence.
- **Lines to say:**
  > "I'm John Tewolde. Callback was built under my direction using an AI coding assistant and the review pass for ForgeHacks 2026. Try it live at callback-lac.vercel.app. Don't trust the number in the message. Callback finds the real one."

---

## What Happens When You Drop Files
The HyperFrames pipeline automatically:
1. Inspects duration and resolution with `ffprobe`.
2. Scales, crops-to-fill, and centers your footage in the picture-in-picture card.
3. Speed-fits within ±8% if duration varies slightly.
4. If no file is present, a clean placeholder badge is shown so test renders work immediately.
