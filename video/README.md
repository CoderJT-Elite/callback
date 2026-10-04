# Callback Video Production (HyperFrames)

Deterministic, programmatic video production pipeline for Callback's ForgeHacks 2026 submission.

## Tech Stack & Architecture
- **HyperFrames** v0.8.117 (Apache 2.0): deterministic HTML/CSS/DOM video rendering engine with hardware GPU acceleration.
- **GSAP** (v3.14.2): seekable animation timelines registered on `window.__timelines`.
- **System FFmpeg** (8.1.2): video assembly, audio loudness normalization (`loudnorm`), retiming, and stream verification.
- **Playwright**: real UI browser automation and screen recording (`video/capture/capture.ts`).

## Directory Structure
- `index.html`: Master 16:9 composition (1920×1080, 180s duration).
- `vertical/index.html`: Portrait 9:16 composition (1080×1920, 180s duration).
- `slots.json`: Named footage slot definitions for John's live footage (`intro-face`, `demo-narration`, `voiceover-main`, `outro-face`).
- `FOOTAGE_GUIDE.md`: 2-minute checklist and exact script lines for recording John's clips.
- `LICENSES.md`: Open-source licenses for fonts (SIL OFL Newsreader, IBM Plex Sans, IBM Plex Mono) and assets.
- `assets/`:
  - `clips/`: Real Playwright screen recordings of the production Next.js build.
  - `stills/`: High-resolution UI captures across samples, incident panel, mobile, dark mode.
  - `fonts/`: Local SIL OFL TTF fonts and `fonts.css`.
  - `audio/`: Audio bed tracks and voiceover slots.
  - `captions.srt`: Synchronized subtitle file.
  - `processed/`: Automatically scaled, retimed, loudness-normalized footage clips.
- `footage/`: Directory where John drops raw camera / mic files.
- `out/`: Rendered MP4 deliverables (`callback-demo-16x9.mp4`, `callback-demo-9x16.mp4`) and verification frame stills.
- `scripts/`:
  - `lint-footage.ts`: Verifies slot durations and emits ±8% speed-fit warnings.
  - `prepare-footage.ts`: Automatically rescales, crops-to-fill, retimes, and normalizes dropped footage.
  - `render-16x9.ts`: Builds footage manifest and renders 1920×1080 30fps MP4.
  - `render-vertical.ts`: Builds footage manifest and renders 1080×1920 30fps MP4.

## Scripts & Usage

```bash
# 1. Preview compositions in HyperFrames live studio
npm run preview

# 2. Lint composition HTML and timing rules
npm run lint

# 3. Check John's footage files in video/footage/
npm run lint:footage

# 4. Re-capture live site recordings from local server (http://localhost:3100)
npm run capture

# 5. Render 16:9 master MP4 (1920x1080 30 fps, 180s)
npm run render

# 6. Render 9:16 vertical MP4 (1080x1920 30 fps, 180s)
npm run render:vertical
```

## HyperFrames Implementation Notes
1. **Directory-based compositions:** In HyperFrames 0.8.x, commands accept directories containing an `index.html`. The root `video/` directory holds the 16:9 composition, and `video/vertical/` holds the 9:16 portrait composition.
2. **Deterministic animations:** All timelines are initialized with `{ paused: true }` and registered on `window.__timelines[<comp-id>]`.
3. **Editable element IDs:** All timeline elements declare explicit IDs (e.g. `id="scene-1-heading"`) to satisfy Studio linting.
4. **Footage slot fallback:** Until John drops raw recordings into `video/footage/`, both preview and final render display clean, labeled placeholder cards with exact slot metadata.
