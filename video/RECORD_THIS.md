# Record this

**Your script is below. Read it exactly as written, in one take, about 3 minutes (478 words).**
Nothing else is needed from you: the video, captions, animations and timing are all built around your recording.

## Record it

1. Record yourself reading the whole script, **straight to camera if you want to be in the video**, or voice only.
   - On camera: sit facing a window or lamp, camera at eye level, head and shoulders in the **middle** of the frame
     (the video shows you in a circle, cropped to a centered square). Landscape or portrait both work.
   - Voice only: a phone voice memo is fine. The circle will show a "J" monogram instead of your face.
2. Quiet room, phone on silent, mic close to your mouth. Start by sitting still for one second before the first word.
3. Read at a calm pace. Take a short breath between scenes (the numbered sections below). If you flub a line, stop
   and redo the whole take; it's only 3 minutes and keeps everything lined up.
4. Save as `.mp4`, `.mov`, `.webm`, `.m4a`, `.wav` or `.mp3`.

## Hand it in

Drop the one file into `video/footage/` (any file name). Then, from the `video` folder:

```bash
npm run check
npm run render
```

`npm run check` tells you if the recording is too quiet, clipped or too short. `npm run render` lines your voice up with
each scene, adds captions, and writes `video/out/callback-demo-16x9.mp4`. Or just tell me the file is there and I'll do it.

## What if something changes later

The pictures, numbers, captions and animations can all change without you re-recording, because they follow your voice.
Only if the **words** change would you need to re-record.

---

## The script

### 1. Hook: a fake USPS text

*On screen: Big circle with you, a fake USPS text, and the FTC number counting up.*

> This text claims it's from the Postal Service, asking for a two-dollar redelivery fee. Is it real? Imposter scams were nearly one in three fraud reports to the FTC in 2025, with 3.5 billion dollars in reported losses. When you get a text like this, how do you check it?

### 2. The problem with asking a chatbot

*On screen: A typical chatbot answer next to what Callback does instead.*

> The standard advice is to contact the company yourself. But if you paste a suspicious message into an AI chatbot, you get a verdict with nothing you can check. Scammers use AI too, so good grammar proves nothing. Meet Callback.

### 3. Live check: the mismatch

*On screen: Live check: the trace ticks in and the red MISMATCH stamp lands.*

> Instead of guessing, Callback runs a live investigation. We paste the message and click Check it. Callback works out who the message claims to be, here the US Postal Service, from a hand-checked list of official organizations, never from the message itself. Then it compares the message's link with the real domain, usps.com. The link isn't official, it contains the brand name, and the domain isn't registered. The verdict: doesn't match.

### 4. Contrast: a real bank alert

*On screen: A real Wells Fargo alert and the green MATCH stamp, for contrast.*

> Callback doesn't just cry scam on everything. When you get a real fraud alert from your bank, like Wells Fargo, it confirms the link is on wellsfargo.com and checks the phone number against Wells Fargo's own contact page. The verdict: it matches. That matters, because false alarms teach people to ignore real warnings.

### 5. Screenshots

*On screen: A screenshot goes in; the guard drops anything the AI invented.*

> Callback also reads screenshots. Drop in an image of a suspicious text, and Gemini vision reads the message. Then a guard re-checks the result and drops anything the AI invented that isn't really in the image.

### 6. Already clicked or paid?

*On screen: The incident panel and the printable report.*

> If someone already clicked the link or replied, panic makes people freeze. Callback's incident panel gives a checklist for what to do next, based on how they paid, and downloads an incident summary with the evidence, ready to paste into a report for the FTC.

### 7. How it decides

*On screen: The pipeline and the seven fixed rules; the AI never decides.*

> Here is what makes Callback different: the AI never decides the verdict. Gemini only reads messy text and writes the plain-English explanation, and every sentence has to cite a numbered piece of evidence, like E1, or it gets dropped. Seven fixed rules decide whether the contact details match.

### 8. The honest comparison

*On screen: The 35-message synthetic comparison: Gemini alone vs Callback.*

> We tested this on 35 synthetic messages that we made up for this project. Gemini alone flagged all 20 scams, but it also called a real payment receipt a scam, and showed no evidence. Callback caught 15 of the 20 scams, with zero false alarms, backed 74 of 80 explanation sentences with evidence, and abstained on 10 of the 35 messages instead of guessing.

### 9. What works and what doesn't

*On screen: Honest limits: US only, phone numbers only where published.*

> Callback is honest about its limits. It covers US numbers and 27 hand-checked organizations. A phone number can only be confirmed where the organization publishes it. If an organization isn't on the list, or its site blocks automated checks, Callback says it can't verify, instead of guessing.

### 10. Closing

*On screen: End card with the repo, the live link and your closing line.*

> I'm John Tewolde, and this is Callback. Try it live at callback-lac.vercel.app. Don't trust the number in the message. Callback finds the real one.

