"""Cut the speaker out of the selfie frames and rebuild the background.

    python matte.py frames_dir out_dir

frames_dir holds 608x1080 PNG frames (0001.png ...). For each frame this writes into out_dir:
    alpha/NNNN.png   the refined person matte
    fg/NNNN.png      the person with the old wall's color spill removed
    plate/NNNN.png   the original background with the mirror painted out
The compositing (black, white, teal, original-without-mirror) happens in variants.py.
"""
import pathlib
import sys

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent


class Matter:
    """Robust Video Matting (TorchScript): per-frame alpha and a spill-free foreground, with memory across frames."""

    def __init__(self, ratio=0.45):
        import torch
        self.torch = torch
        torch.set_num_threads(8)
        self.m = torch.jit.load(str(HERE / "rvm_mobilenetv3_fp32.torchscript"), map_location="cpu").eval()
        self.rec = [None] * 4
        self.ratio = ratio

    def __call__(self, bgr, warm=0):
        torch = self.torch
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        x = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255).unsqueeze(0)
        with torch.no_grad():
            for _ in range(warm + 1):
                fgr, pha, *self.rec = self.m(x, *self.rec, self.ratio)
        a = pha[0, 0].numpy()
        fg = fgr[0].permute(1, 2, 0).numpy()
        return a, cv2.cvtColor((fg * 255).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)


def mirror_mask(bgr, person):
    """Pixels on the left edge that don't look like the wall (the gold mirror frame and its glass)."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    h, w = bgr.shape[:2]
    band = slice(int(h * 0.20), int(h * 0.80)), slice(int(w * 0.40), int(w * 0.75))
    wall = np.median(lab[band][person[band] < 0.05].reshape(-1, 3), axis=0)
    dist = np.linalg.norm(lab - wall, axis=2)
    m = (dist > 14).astype(np.uint8)
    m[:, int(w * 0.30):] = 0                     # the mirror lives at the left edge
    m[: int(h * 0.15)] = 0                       # never the ceiling line
    m[cv2.dilate((person > 0.03).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=12) > 0] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 9), np.uint8))
    n, lab_cc, stats, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        x, y, cw, ch, area = stats[i]
        if x <= 3 and area > 4000:               # touches the left edge and is big
            keep[lab_cc == i] = 1
    ys, xs = np.nonzero(keep)
    if len(ys) == 0:
        return keep
    # bound the box by dense rows/columns so a few stray pixels can't stretch it
    height = ys.max() - ys.min() + 1
    cols = keep.sum(axis=0) / height
    x1 = np.flatnonzero(cols > 0.25).max()
    rows = keep[:, : x1 + 1].sum(axis=1) / (x1 + 1)
    ry = np.flatnonzero(rows > 0.25)
    box = np.zeros_like(keep)                    # the whole frame including the glass, not just its rim
    box[max(0, ry.min() - 14): ry.max() + 15, : x1 + 16] = 1
    return box


def paint_out(bgr, mask, person):
    """Fill the masked region with the wall just to its right, sampled row by row away from the speaker."""
    h, w = bgr.shape[:2]
    ys, xs = np.nonzero(mask)
    if len(ys) == 0:
        return bgr
    near = cv2.dilate((person > 0.02).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=14) > 0
    rows = np.arange(ys.min(), ys.max() + 1)
    cols = np.full((len(rows), 3), np.nan, np.float32)
    for k, y in enumerate(rows):
        x_end = np.nonzero(mask[y])[0].max() + 1
        ref = np.arange(x_end + 4, min(w, x_end + 34))
        ok = ref[~near[y, ref]]
        if len(ok) >= 10:
            cols[k] = np.median(bgr[y, ok].astype(np.float32), axis=0)
    good = ~np.isnan(cols[:, 0])
    for c in range(3):                                   # rows next to the hair borrow from clean rows above and below
        cols[:, c] = np.interp(rows, rows[good], cols[good, c])
    cols = cv2.GaussianBlur(cols.reshape(-1, 1, 3), (1, 0), sigmaX=0.1, sigmaY=6).reshape(-1, 3)
    out = bgr.copy()
    grain = np.random.default_rng(1).normal(0, 1.4, size=(h, w, 1)).astype(np.float32)
    for k, y in enumerate(rows):
        r = mask[y] > 0
        out[y, r] = np.clip(cols[k] + grain[y, r], 0, 255).astype(np.uint8)
    return out


def wall_bleed(bgr, a, wall_lab):
    """Wall color showing through the curls: drop alpha where a hair-region pixel looks like the wall."""
    ys = np.flatnonzero(a.max(axis=1) > 0.5)
    if len(ys) == 0:
        return a
    top = ys.min()
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    like_wall = np.linalg.norm(lab - wall_lab, axis=2) < 26
    zone = np.zeros(a.shape, bool)
    zone[top: top + 115] = True
    hole = cv2.dilate((like_wall & zone & (a > 0.2)).astype(np.uint8), np.ones((3, 3), np.uint8))
    return np.where(hole > 0, a * 0.1, a)


def main():
    src, dst = map(pathlib.Path, sys.argv[1:3])
    for sub in ("alpha", "fg", "plate"):
        (dst / sub).mkdir(parents=True, exist_ok=True)
    matter = Matter()
    files = sorted(src.glob("*.png"))
    union, wall = None, None
    for i, f in enumerate(files):
        bgr = cv2.imread(str(f))
        a, fg = matter(bgr, warm=3 if i == 0 else 0)
        if wall is None:
            lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
            h, w = a.shape
            band = (slice(int(h * 0.20), int(h * 0.80)), slice(int(w * 0.40), int(w * 0.75)))
            wall = np.median(lab[band][a[band] < 0.05].reshape(-1, 3), axis=0)
        a = wall_bleed(bgr, a, wall)
        a = np.clip((a - 0.10) / 0.85, 0, 1)
        if i % 15 == 0:
            m = mirror_mask(bgr, a)
            union = m if union is None else np.maximum(union, m)
        cv2.imwrite(str(dst / "alpha" / f.name), (a * 255).round().astype(np.uint8))
        cv2.imwrite(str(dst / "fg" / f.name), fg)
        if i % 30 == 0:
            print(i, "of", len(files))
    union = cv2.dilate(union, np.ones((3, 3), np.uint8), iterations=6)
    for f in files:
        bgr = cv2.imread(str(f))
        a = cv2.imread(str(dst / "alpha" / f.name), 0) / 255.0
        cv2.imwrite(str(dst / "plate" / f.name), paint_out(bgr, union, a))
    dbg = cv2.imread(str(files[0])); dbg[union > 0] = (dbg[union > 0] * 0.4 + np.array([0, 0, 255]) * 0.6).astype(np.uint8)
    cv2.imwrite(str(dst / "mirror_debug.png"), dbg)


if __name__ == "__main__":
    main()
