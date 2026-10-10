"""Compose the speaker panel for each scene: white background, and a different shape per scene.

    python shape_panel.py               # every clip that has panels/NN_fg.mp4
    python shape_panel.py --only 2 5    # just these scene numbers

Reads panels/NN_fg.mp4 + NN_alpha.mp4 + NN.json (made by panels.py) and writes panels/NN_panel.mp4, a 608x1080 video that
build.py overlays on the right of the frame. The shape enters with a short animation (a ring drawing itself, a card
sliding up, a wipe rising), then holds.
"""
import argparse
import json
import pathlib
import subprocess

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
PAN = HERE / "panels"
W, H = 608, 1080
PAPER, INK, RED, RULE = (228, 238, 243), (23, 26, 28), (34, 59, 194), (193, 209, 217)     # BGR: paper, ink, stamp red, hairline
SHAPES = {1: "full", 2: "circle", 3: "rounded", 4: "full", 5: "circle", 6: "rounded", 7: "full", 8: "circle", 9: "rounded", 10: "full"}
PAD = 0.5                                                                                 # must match build.py: a held beat before the clip starts
SS = 3                                                                                    # supersampling for smooth edges


def ease(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def back(x):
    x = min(1.0, max(0.0, x))
    return 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2


def paper():
    img = np.full((H, W, 3), PAPER, np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    grid = ((xx % 76 == 0) | (yy % 76 == 0))[..., None]
    return np.where(grid, img * 0.45 + np.array(RULE, np.float32) * 0.55, img)


PAPER_IMG = paper()


def aa_mask(draw):
    """Anti-aliased mask: draw(canvas, scale) paints white on a supersampled canvas."""
    big = np.zeros((H * SS, W * SS), np.uint8)
    draw(big, SS)
    return cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def over(base, layer, mask):
    return base * (1 - mask[..., None]) + layer * mask[..., None]


def rounded_rect(img, x0, y0, x1, y1, r, s, color=255):
    x0, y0, x1, y1, r = [int(v * s) for v in (x0, y0, x1, y1, r)]
    cv2.rectangle(img, (x0 + r, y0), (x1 - r, y1), color, -1)
    cv2.rectangle(img, (x0, y0 + r), (x1, y1 - r), color, -1)
    for cx, cy in ((x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)):
        cv2.circle(img, (cx, cy), r, color, -1, cv2.LINE_AA)


def fill_holes(al):
    """The matte leaves transparent specks inside curly hair, which show as white. Fill any hole enclosed by the silhouette."""
    m = (al > 0.5).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(m)
    cv2.drawContours(filled, cnts, -1, 1, -1)
    filled = cv2.GaussianBlur(filled.astype(np.float32), (0, 0), 1.4)
    return np.maximum(al, filled)


def lift(img, s=1.06):
    """Scale about the bottom centre so the head sits higher and the shoulders fill the bottom."""
    M = np.float32([[s, 0, W / 2 * (1 - s)], [0, s, H * (1 - s)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))


def compose(fg, al, shape, t, top, mid):
    """One output frame. fg: HxWx3 uint8 (speaker color), al: HxW float 0..1, t: seconds since the scene started."""
    al = fill_holes(al)
    person = fg.astype(np.float32) * al[..., None] + 255 * (1 - al[..., None])        # the speaker on white
    if shape == "full":
        person = lift(person)
    if shape == "full":
        reveal = ease(t / 0.55)                                                        # the white panel rises from the bottom
        m = np.zeros((H, W), np.float32)
        m[int(H * (1 - reveal)):] = 1
        out = over(PAPER_IMG, person, m)
    elif shape == "circle":
        D, cx, cy = 520, 304, 540
        C = 640                                                                        # source pixels shown across the circle
        s = D / C
        scy = top + 290
        M = np.float32([[s, 0, cx - mid * s], [0, s, cy - scy * s]])
        content = cv2.warpAffine(person, M, (W, H), flags=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR, borderValue=(255, 255, 255))
        p = t / 0.7
        grow = 0.55 + 0.45 * back(p)                                                   # pops in with a small overshoot
        r = D / 2 * grow
        fill = aa_mask(lambda b, k: cv2.circle(b, (cx * k, cy * k), int(r * k), 255, -1, cv2.LINE_AA))
        fill *= min(1.0, ease(t / 0.35) + 0.0)
        out = over(PAPER_IMG, content, fill)
        ring_r = D / 2 + 14
        sweep = ease(t / 0.6)
        ring = aa_mask(lambda b, k: cv2.ellipse(b, (cx * k, cy * k), (int(ring_r * k),) * 2, 0, -90, -90 + 360 * sweep, 255, 6 * k, cv2.LINE_AA))
        out = over(out, np.full((H, W, 3), INK, np.float32), ring)
        if sweep > 0.999:                                                              # a red accent rides the ring once it closes
            a = np.deg2rad(-40 + 25 * np.sin(t * 1.4))
            dot = aa_mask(lambda b, k: cv2.circle(b, (int((cx + ring_r * np.cos(a)) * k), int((cy + ring_r * np.sin(a)) * k)), 15 * k, 255, -1, cv2.LINE_AA))
            out = over(out, np.full((H, W, 3), RED, np.float32), dot)
    else:                                                                              # rounded card
        x0, y0, x1, y1, rad = 44, 70, 564, 872, 44                                         # ends above the caption band
        slide = (1 - ease(t / 0.6)) * 90
        fade = ease(t / 0.45)
        sc = max((x1 - x0) / W, (y1 - y0) / H)
        img = cv2.resize(person, (int(W * sc + 0.5), int(H * sc + 0.5)), interpolation=cv2.INTER_AREA)
        canvas = np.full((H, W, 3), 255, np.float32)
        ox, oy = x0 + ((x1 - x0) - img.shape[1]) // 2, y0 + int(((y1 - y0) - img.shape[0]) * 0.75)
        sy0, dy0, sx0, dx0 = max(0, -oy), max(0, oy), max(0, -ox), max(0, ox)       # the picture may start above the frame
        h, w = min(img.shape[0] - sy0, H - dy0), min(img.shape[1] - sx0, W - dx0)
        canvas[dy0:dy0 + h, dx0:dx0 + w] = img[sy0:sy0 + h, sx0:sx0 + w]
        M = np.float32([[1, 0, 0], [0, 1, slide]])
        canvas = cv2.warpAffine(canvas, M, (W, H), borderValue=(255, 255, 255))
        shadow = aa_mask(lambda b, k: rounded_rect(b, x0 + 14, y0 + 14 + slide, x1 + 14, y1 + 14 + slide, rad, k))
        card = aa_mask(lambda b, k: rounded_rect(b, x0, y0 + slide, x1, y1 + slide, rad, k))
        edge = aa_mask(lambda b, k: rounded_rect(b, x0 - 6, y0 - 6 + slide, x1 + 6, y1 + 6 + slide, rad + 6, k))
        out = PAPER_IMG.copy()
        out = over(out, np.full((H, W, 3), INK, np.float32), shadow * fade)
        out = over(out, np.full((H, W, 3), INK, np.float32), edge * fade)
        out = over(out, canvas, card * fade)
    out = out.clip(0, 255).astype(np.uint8)
    out[:, :6] = RED                                                                   # the red spine on the panel's left edge
    return out


def raw_reader(path, pix):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", pix, "-"], stdout=subprocess.PIPE)


def render(n, shape=None, out=None):
    shape = shape or SHAPES.get(n, "full")
    meta = json.loads((PAN / f"{n:02d}.json").read_text())
    out = out or PAN / f"{n:02d}_panel.mp4"
    fg_r, al_r = raw_reader(PAN / f"{n:02d}_fg.mp4", "bgr24"), raw_reader(PAN / f"{n:02d}_alpha.mp4", "gray")
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    i, pad = 0, int(round(PAD * 30))
    while True:
        a, b = fg_r.stdout.read(W * H * 3), al_r.stdout.read(W * H)
        if len(a) < W * H * 3 or len(b) < W * H:
            break
        fg = np.frombuffer(a, np.uint8).reshape(H, W, 3)
        al = np.frombuffer(b, np.uint8).reshape(H, W).astype(np.float32) / 255
        if i == 0:                                   # hold the first frame while the shape animates in
            for k in range(pad):
                enc.stdin.write(compose(fg, al, shape, k / 30, meta["top"], meta["mid"]).tobytes())
        enc.stdin.write(compose(fg, al, shape, (i + pad) / 30, meta["top"], meta["mid"]).tobytes())
        i += 1
    enc.stdin.close(); enc.wait()
    meta["pad"] = PAD
    (PAN / f"{n:02d}.json").write_text(json.dumps(meta), encoding="utf-8")
    print(f"scene {n:02d}: {shape}, {i} frames", flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=int, nargs="*")
    a = ap.parse_args()
    for n in range(1, 11):
        if a.only and n not in a.only:
            continue
        if (PAN / f"{n:02d}_fg.mp4").exists() and (PAN / f"{n:02d}.json").exists():
            render(n)
