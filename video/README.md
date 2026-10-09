# Callback demo video (HyperFrames)

The demo video is built from HTML scenes with [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache 2.0),
GSAP animation, and FFmpeg. Real recordings of the live site are in `assets/clips/` and `assets/stills/`.

## How it works

1. The spoken script lives in **`script.json`** (one source of truth). `RECORD_THIS.md` and `docs/VIDEO_SCRIPT.md` are
   generated from it (`npm run guide`).
2. You drop **one recording** (voice or video of you, any name) into `footage/`.
3. `npm run render` then:
   - finds the recording, normalises its loudness, and for video crops it to a centered square for the circle;
   - lines the script up with your voice (word-level timing with the HyperFrames speech model, or pause detection if
     the model isn't installed) so **each scene starts on its own words**, and builds the captions from that;
   - rewrites `index.html` from `index.tpl` and renders `out/callback-demo-16x9.mp4` (1920x1080, 30 fps).
4. With no recording, it renders placeholder timing and a "J" monogram circle so the project always builds.

Your face (or the monogram) is a circle in the corner: large in the hook and the closing, small during the demo.

## Commands (run inside `video/`)

```bash
npm run check     # is the recording there, long enough, loud enough, not clipping
npm run build     # align + rewrite index.html only (no render)
npm run render    # build, then render out/callback-demo-16x9.mp4
npm run preview   # live preview in HyperFrames Studio
npm run lint      # composition lint
npm run guide     # regenerate RECORD_THIS.md and docs/VIDEO_SCRIPT.md from script.json
npm run capture   # re-record the live site (needs the app on http://localhost:3100)
```

The speech model (one time, about 640 MB, runs locally): `npx hyperframes models install parakeet`.

## Files

- `script.json`: spoken script, scene titles, what's on screen.
- `index.tpl`: master template; `index.html` is generated from it (do not hand-edit `index.html`).
- `compositions/scene-1.html` ... `scene-10.html`: the scenes.
- `scripts/`: `align.ts` (recording to script), `build-index.ts`, `render-16x9.ts`, `check-footage.ts`, `make-guide.ts`.
- `assets/`: site recordings, stills, fonts, `captions.srt` (regenerated on build).
- `vertical/`: an older 9:16 cut with fixed timing. It is silent and does not use your recording; not part of the submission.
- `LICENSES.md`: fonts and assets.

## Honesty notes

- All numbers on screen come from `eval/results/summary.md` (35 synthetic messages) or the cited FTC release.
- The site recordings show the real app; the saved examples are pre-computed results labelled as such.
