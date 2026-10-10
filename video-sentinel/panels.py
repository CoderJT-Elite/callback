"""Cut John out of every clip, once, so the panel can be composited on any background or shape.

    python panels.py                # all clips in ./clips, speech window only
    python panels.py --only 3 5     # just these scene numbers

For clip NN this writes panels/NN_fg.mp4 (the speaker's color, 608x1080, 30 fps), panels/NN_alpha.mp4 (the matte)
and panels/NN.json (trim window and where the head sits). build.py uses them when they exist. The matting model is
Robust Video Matting (_matte/rvm_mobilenetv3_fp32.torchscript); helpers live in _matte/matte.py.
"""
import argparse
import json
import multiprocessing as mp
import pathlib
import subprocess
import sys

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "_matte"))
OUT = HERE / "panels"
W, H = 608, 1080


def find_clip(n, clips):
    for ext in ("mp4", "mov", "m4v", "MOV", "MP4"):
        c = clips / f"{n:02d}.{ext}"
        if c.exists():
            return c
    return None


def windows(clips, only):
    """Trim window per clip: the same one build.py uses (speech plus a lead-in and a tail)."""
    import build
    spec = json.loads((HERE / "scenes.json").read_text(encoding="utf-8"))
    jobs = []
    for i, s in enumerate(spec["scenes"], 1):
        if only and i not in only:
            continue
        clip = find_clip(i, clips)
        if clip is None:
            print(f"scene {i}: no clip, skipped")
            continue
        a, b = build.plan_scene(s, clip)["trim"]
        jobs.append((i, str(clip), a, b))
        print(f"scene {i:02d}: {a:.2f} to {b:.2f} ({b - a:.1f}s)", flush=True)
    return jobs


def work(job):
    n, clip, a, b = job
    import torch
    import matte
    torch.set_num_threads(4)
    OUT.mkdir(exist_ok=True)
    matter = matte.Matter(ratio=0.45)
    rd = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", clip, "-an",
                           "-vf", f"fps=30,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
                           "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)

    def enc(path, pix):
        return subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", pix, "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                                 "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", str(path)], stdin=subprocess.PIPE)
    fg_e, al_e = enc(OUT / f"{n:02d}_fg.mp4", "bgr24"), enc(OUT / f"{n:02d}_alpha.mp4", "gray")
    size, i, wall, tops, mids = W * H * 3, 0, None, [], []
    while True:
        buf = rd.stdout.read(size)
        if len(buf) < size:
            break
        bgr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        al, fg = matter(bgr, warm=3 if i == 0 else 0)
        if wall is None:
            lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
            band = (slice(int(H * 0.20), int(H * 0.80)), slice(int(W * 0.40), int(W * 0.75)))
            wall = np.median(lab[band][al[band] < 0.05].reshape(-1, 3), axis=0)
        al = matte.wall_bleed(bgr, al, wall)
        al = np.clip((al - 0.10) / 0.85, 0, 1)
        rows = np.flatnonzero(al.max(axis=1) > 0.5)
        if len(rows):
            tops.append(int(rows[0]))
            cols = np.flatnonzero(al[rows[0]: rows[0] + 300].max(axis=0) > 0.5)
            mids.append(int((cols[0] + cols[-1]) // 2))
        fg_e.stdin.write(np.ascontiguousarray(fg).tobytes())
        al_e.stdin.write((al * 255).round().astype(np.uint8).tobytes())
        i += 1
        if i % 60 == 0:
            print(f"clip {n:02d}: {i} frames", flush=True)
    for p in (fg_e, al_e):
        p.stdin.close()
        p.wait()
    rd.wait()
    meta = {"trim": [a, b], "frames": i, "top": int(np.median(tops)) if tops else 250, "mid": int(np.median(mids)) if mids else W // 2}
    (OUT / f"{n:02d}.json").write_text(json.dumps(meta), encoding="utf-8")
    print(f"clip {n:02d} done: {i} frames, head top {meta['top']}", flush=True)
    return n


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", default=str(HERE / "clips"))
    ap.add_argument("--only", type=int, nargs="*")
    ap.add_argument("--workers", type=int, default=2)
    a = ap.parse_args()
    jobs = windows(pathlib.Path(a.clips), set(a.only) if a.only else None)
    jobs.sort(key=lambda j: j[3] - j[2], reverse=True)
    with mp.Pool(a.workers) as pool:
        for _ in pool.imap_unordered(work, jobs):
            pass
    print("all panels done", flush=True)
