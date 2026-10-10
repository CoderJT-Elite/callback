"""Render the Sentinel demo video.

    python build.py --run-json <docs/demo/data/run.json> --out final.mp4                 # with John's clips in ./clips
    python build.py --run-json ... --preview --out preview.mp4                          # placeholder panels, silent
    python build.py --run-json ... --clips test_clips --out dryrun.mp4                  # any clips folder

Clips are named 01.mp4 ... 10.mp4 (one per scene, vertical). For each clip the script:
  1. transcribes it locally with Whisper to get word timestamps,
  2. trims leading and trailing silence,
  3. finds each cue phrase in the transcript, so every animation lands on the word being said,
  4. renders the animated scene frame by frame (Playwright) at the clip's real length,
  5. overlays the clip in the vertical 9:16 panel and keeps its audio.
Scenes are then concatenated and loudness-normalised.
"""
import argparse
import json
import multiprocessing as mp
import pathlib
import re
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import captions  # noqa: E402
FPS = 30
LEAD, TAIL = 0.45, 0.7
PAD = 0.5          # a held beat before every clip starts (the clips begin mid-breath); shape_panel.py uses the same value


def _clip(s, n=118):
    """Trim to n chars at a comma or word boundary, never mid-word."""
    if len(s) <= n:
        return s
    cut = s[:n]
    i = cut.rfind(",")
    return cut[:i] if i > 60 else cut.rsplit(" ", 1)[0]


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def words_of(text):
    return [norm(w) for w in text.split() if norm(w)]


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", str(path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def transcribe(clip, model_name="base.en"):
    """Word timestamps via openai-whisper (local), cached next to the clip so a re-render doesn't redo them."""
    cache = pathlib.Path(clip).with_suffix(".words.json")
    if cache.exists() and cache.stat().st_mtime >= pathlib.Path(clip).stat().st_mtime:
        return json.loads(cache.read_text(encoding="utf-8"))
    ws = _transcribe(clip, model_name)
    cache.write_text(json.dumps(ws), encoding="utf-8")
    return ws


def _transcribe(clip, model_name):
    import whisper
    with tempfile.TemporaryDirectory() as td:
        wav = pathlib.Path(td) / "a.wav"
        subprocess.run(["ffmpeg", "-y", "-i", str(clip), "-vn", "-ac", "1", "-ar", "16000", str(wav)], capture_output=True, check=True)
        model = whisper.load_model(model_name)
        res = model.transcribe(str(wav), word_timestamps=True, language="en", fp16=False, condition_on_previous_text=False)
    ws = []
    for seg in res["segments"]:
        for w in seg.get("words", []):
            ws.append({"w": norm(w["word"]), "s": float(w["start"]), "e": float(w["end"])})
    return [w for w in ws if w["w"]]


def find_phrase(ws, phrase, after=0):
    """Index of the first transcript word of `phrase` (whole phrase first, then its first word)."""
    pw = words_of(phrase)
    toks = [w["w"] for w in ws]
    for n in (len(pw), 2, 1):
        if n < 1 or n > len(pw):
            continue
        for i in range(after, len(toks) - n + 1):
            if toks[i:i + n] == pw[:n]:
                return i
    return None


def plan_scene(scene, clip):
    """Return {D, cues, trim:(a,b)|None} in scene time."""
    words = words_of(scene["text"])
    if clip is None:
        speech = len(words) / 150 * 60
        D = LEAD + speech + TAIL
        cues = {}
        for cid, phrase in scene["cues"].items():
            pw = words_of(phrase)
            idx = next((i for i in range(len(words)) if words[i:i + len(pw)] == pw), None)
            idx = idx if idx is not None else next((i for i, w in enumerate(words) if w == pw[0]), 0)
            cues[cid] = LEAD + idx / len(words) * speech
        return {"D": D, "cues": cues, "trim": None, "matched": {}}
    dur = probe(clip)
    ws = transcribe(clip)
    if not ws:
        raise SystemExit(f"no speech detected in {clip}")
    a = max(0.0, ws[0]["s"] - LEAD)
    b = min(dur, ws[-1]["e"] + TAIL)
    shift = PAD - a                                  # clip time -> scene time
    cues, matched, cursor = {}, {}, 0
    for cid, phrase in scene["cues"].items():
        i = find_phrase(ws, phrase, 0)
        if i is None:  # proportional fallback
            pw = words_of(phrase)
            idx = next((k for k in range(len(words)) if words[k:k + len(pw)] == pw), 0)
            t = ws[0]["s"] + idx / len(words) * (ws[-1]["e"] - ws[0]["s"])
            matched[cid] = "fallback"
        else:
            t = ws[i]["s"]
            matched[cid] = "heard"
        cues[cid] = max(0.0, t - a - 0.05) + PAD
    return {"D": b - a + PAD, "cues": cues, "trim": (a, b), "matched": matched, "heard": " ".join(w["w"] for w in ws),
            "words": captions.align(scene["text"], ws, shift)}


def render_scene(args):
    idx, cfg, plan, clip, out_path, placeholder = args
    from playwright.sync_api import sync_playwright
    D, n = plan["D"], int(round(plan["D"] * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-"]
    panel = HERE / "panels" / f"{idx + 1:02d}_panel.mp4"
    meta = HERE / "panels" / f"{idx + 1:02d}.json"
    use_panel = clip is not None and panel.exists() and meta.exists() and abs(json.loads(meta.read_text())["trim"][0] - plan["trim"][0]) < 0.05 and json.loads(meta.read_text()).get("pad") == PAD
    if clip is not None:
        a, b = plan["trim"]
        cmd += ["-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(clip)]
        if use_panel:      # the speaker is already cut out, on white, in this scene's shape (shape_panel.py)
            cmd += ["-i", str(panel)]
            vf = "[2:v]fps=30,tpad=stop_mode=clone:stop=90,setsar=1[p];[0:v][p]overlay=1312:0:shortest=1[v];"
        else:
            vf = f"[1:v]scale=608:1080:force_original_aspect_ratio=increase,crop=608:1080,setsar=1,fps=30,tpad=start_duration={PAD}:start_mode=clone[p];[0:v][p]overlay=1312:0:shortest=1[v];"
        cmd += ["-filter_complex", vf +
                f"[1:a]aresample=48000,adelay={int(PAD * 1000)}|{int(PAD * 1000)},apad=whole_dur={D:.3f},atrim=0:{D:.3f}[a]",
                "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
    else:
        cmd += ["-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-shortest", "-c:a", "aac", "-b:a", "128k"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS), "-t", f"{D:.3f}", str(out_path)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        pg.goto((HERE / "stage.html").as_uri())
        scene_cfg = {"placeholder": placeholder, "facts": cfg["facts"], "seq": cfg.get("seq", {}),
                     "scenes": [dict(s, D=plan["D"] if i == idx else 1, cues=plan["cues"] if i == idx else s.get("_c", {}))
                                for i, s in enumerate(cfg["scenes"])]}
        for s in scene_cfg["scenes"]:
            s["rawCues"] = s.get("cues_raw", s.get("rawCues", {}))
        pg.evaluate("cfg => window.setup(cfg)", scene_cfg)
        for f in range(n):
            pg.evaluate("([i, t]) => window.seek(i, t)", [idx, f / FPS])
            ff.stdin.write(pg.screenshot(type="jpeg", quality=93))
        br.close()
    ff.stdin.close()
    ff.wait()
    return idx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-json", default=None)
    ap.add_argument("--clips", default=str(HERE / "clips"))
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--out", default=str(HERE / "final.mp4"))
    ap.add_argument("--repo", default="github.com/CoderJT-Elite/callback")
    ap.add_argument("--demo", default="callback-lac.vercel.app")
    ap.add_argument("--only", type=int, nargs="*", help="render only these scene numbers (1-based) for a quick check")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--from-raw", help="skip rendering scenes; use this un-captioned video (raw_nocaps.mp4 from a previous run)")
    ap.add_argument("--no-captions", action="store_true", help="skip burning captions in (the .srt is still written)")
    a = ap.parse_args()

    spec = json.loads((HERE / "scenes.json").read_text(encoding="utf-8"))
    facts = {"repo": a.repo, "demo": a.demo}
    seq = {d.name: len(list(d.glob("*.jpg"))) for d in (HERE / "screencasts" / "frames").glob("*") if d.is_dir()}
    cfg = {"facts": facts, "seq": seq, "scenes": []}
    for i, s in enumerate(spec["scenes"], 1):
        cfg["scenes"].append({"id": s["id"], "label": s["label"], "node": s["node"], "text": s["text"], "cues_raw": s["cues"], "rawCues": s["cues"]})

    clips_dir = pathlib.Path(a.clips)
    plans, jobs = [], []
    only = set(a.only) if a.only else None
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="callback_video_"))
    for i, s in enumerate(spec["scenes"], 1):
        if only and i not in only:
            continue
        clip = None
        if not a.preview:
            for ext in ("mp4", "mov", "m4v", "MOV", "MP4"):
                c = clips_dir / f"{i:02d}.{ext}"
                if c.exists():
                    clip = c
                    break
            if clip is None:
                print(f"note: no clip for scene {i}; using a placeholder panel")
        plan = plan_scene(s, clip)
        plans.append((i, plan))
        print(f"scene {i:02d} {s['id']:<9} D={plan['D']:.1f}s clip={'yes' if clip else 'placeholder'} "
              f"{ {k: v for k, v in plan.get('matched', {}).items() if v != 'heard'} or '' }")
        jobs.append((i - 1, cfg, plan, clip, tmp / f"s{i:02d}.mp4", clip is None))
    if a.from_raw:                                   # captions only: reuse the scenes from an earlier render
        raw = pathlib.Path(a.from_raw)
    else:
        with mp.Pool(a.workers) as pool:
            pool.map(render_scene, jobs)
        lst = tmp / "list.txt"
        lst.write_text("".join(f"file '{j[4].as_posix()}'" + chr(10) for j in jobs))
        raw = tmp / "all.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(raw)], check=True)
        import shutil
        shutil.copy(raw, HERE / "raw_nocaps.mp4")      # keep the un-captioned video: --from-raw re-burns captions in minutes
    # captions: the script's words timed to the speech, burned into the speaker panel, plus an .srt to upload with the video
    off, timeline = 0.0, []
    for _, p in plans:
        if p.get("words"):
            timeline.append((off, p["words"]))
        off += p["D"]
    caps = captions.build(timeline)
    out = pathlib.Path(a.out).resolve()
    vf = []
    if caps:
        captions.write_srt(caps, out.with_suffix(".srt"))
        captions.write_ass(caps, HERE / "captions.ass")
        if not a.no_captions:
            vf = ["-vf", "ass=captions.ass:fontsdir=fonts_ttf"]
    v = ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p"] if vf else ["-c:v", "copy"]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), *vf, *v, "-af", "highpass=f=90,lowpass=f=12000,afftdn=nr=30:nf=-36:tn=1,agate=threshold=0.02:ratio=4:attack=8:release=200:range=0.12,loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(out)], check=True, cwd=str(HERE))
    total = sum(p["D"] for _, p in plans)
    print(f"wrote {a.out}  ({total:.0f}s, {len(plans)} scenes)")


if __name__ == "__main__":
    main()
