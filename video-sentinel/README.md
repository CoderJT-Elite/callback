# Callback demo video (final cut)

This folder builds the demo video that goes on Devpost: a 1920x1080 frame with an animated "screen window" on the left
(real screenshots of the live app, evidence tables, the benchmark) and John, cut out of his own recording, in a shaped
panel on the right with burned-in captions. Every animation fires on the word John says.

**Reused tooling, disclosed:** the build scripts (`build.py`, `panels.py`, `shape_panel.py`, `captions.py`, `frames.py`)
and the speaker-matting model are reused from John's earlier project, Sentinel, which used the same video layout.
The scenes, script, cues, layout styling and screenshots here are new for Callback. No application code was reused;
`video/` (the earlier HyperFrames version) is kept as a backup.

## Inputs

- `clips/01.mp4 ... 10.mp4`: John's ten vertical (1080x1920) recordings, one per scene, in script order (gitignored, large).
- `scenes.json`: the script (generated from `../video/script.json`, the exact words read) and the cue phrases.
  Regenerate with `node make-scenes.cjs`.
- `shots/`: full-page screenshots of the live app (`node capture-shots.cjs`), plus two saved stills of the incident panel
  and the incident report. Saved examples are pre-computed results, labelled as such on screen.
- `_matte/rvm_mobilenetv3_fp32.torchscript`: Robust Video Matting (GPL-3.0 model by Peter Lin et al.), gitignored.

## Build (Python 3.14 via `py`; needs openai-whisper, torch, opencv, numpy, playwright, ffmpeg)

```bash
py panels.py          # cut John out of each clip (slow on CPU)
py shape_panel.py     # put him in this scene's shape on the Callback paper background
py frames.py 3 5 12 25 --timed   # preview stills of scene 3 at those seconds
py build.py --out out/callback-demo.mp4
```

`build.py` transcribes each clip locally with Whisper (cached as `clips/NN.words.json`), finds each cue phrase in the
transcript, renders the scenes frame by frame with Playwright, overlays John's panel and audio, burns in captions
(the script's words, John's timing), normalizes loudness, and writes `out/callback-demo.mp4` and `out/callback-demo.srt`.

## Honesty notes

- Numbers on screen come from `eval/results/summary.md` (35 synthetic messages, `npm run eval`) or the cited FTC release.
- The chatbot in scene 2 is an illustration of a general chatbot, labelled as such.
- Scene 8 says the messages are synthetic, as the README does.
