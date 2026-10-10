"""Composite the matted speaker over each background option, in the real 1920x1080 video layout.

    python variants.py scene_frame.png out_dir

Writes out_dir/compare.png (2x2 still), out_dir/compare.mp4 (2x2, the six seconds with sound) and a still per option.
"""
import pathlib
import subprocess
import sys

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
PW, PH = 608, 1080
RED = (0x1b, 0x00, 0xd8)             # BGR of the brand red #d8001b


def teal_plate():
    """Brand teal, lighter at the top, darker at the bottom, with the UI's faint grid."""
    top, bot = np.array((0x76, 0x7c, 0x0c), np.float32), np.array((0x45, 0x48, 0x05), np.float32)   # BGR of #0c7c76 -> #054845
    k = np.linspace(0, 1, PH, dtype=np.float32)[:, None, None]
    img = top * (1 - k) + bot * k
    img = np.repeat(img, PW, axis=1)
    yy, xx = np.mgrid[0:PH, 0:PW]
    vig = 1 - 0.28 * (((xx - PW / 2) / (PW / 2)) ** 2 + ((yy - PH * 0.45) / (PH * 0.7)) ** 2).clip(0, 1)
    img = img * vig[..., None]
    grid = ((xx % 76 == 0) | (yy % 76 == 0))[..., None]
    img = np.where(grid, img * 0.9 + 255 * 0.10, img)
    return img.clip(0, 255)


def options(plate):
    flat = lambda c: np.full((PH, PW, 3), c, np.float32)
    return [("A  Black", flat(0)), ("B  White", flat(255)), ("C  Brand teal", teal_plate()), ("D  Original wall, mirror removed", plate)]


def panel(fg, a, bg):
    out = fg.astype(np.float32) * a[..., None] + bg * (1 - a[..., None])
    out = out.clip(0, 255).astype(np.uint8)
    out[:, :6] = RED
    return out


def main():
    scene = cv2.imread(sys.argv[1])
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    src = HERE / "out"
    names = sorted(p.name for p in (src / "alpha").glob("*.png"))
    teal = teal_plate()
    cells = []
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1920x1080", "-r", "30", "-i", "-",
                           "-ss", "8", "-t", "6", "-i", str(HERE.parent / "clips" / "03.mp4"), "-map", "0:v", "-map", "1:a",
                           "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(out / "compare.mp4")], stdin=subprocess.PIPE)
    for i, n in enumerate(names):
        a = cv2.imread(str(src / "alpha" / n), 0) / 255.0
        fg = cv2.imread(str(src / "fg" / n))
        plate = cv2.imread(str(src / "plate" / n)).astype(np.float32)
        opts = options(plate)
        opts[2] = (opts[2][0], teal)
        grid = np.zeros((1080, 1920, 3), np.uint8)
        for k, (label, bg) in enumerate(opts):
            full = scene.copy()
            full[:, 1312:] = panel(fg, a, bg)
            if i == 60:
                cv2.imwrite(str(out / f"option_{'ABCD'[k]}.png"), full)
            small = cv2.resize(full, (960, 540), interpolation=cv2.INTER_AREA)
            cv2.rectangle(small, (0, 506), (len(label) * 13 + 24, 540), (16, 20, 24), -1)
            cv2.putText(small, label, (10, 530), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 255, 255), 1, cv2.LINE_AA)
            grid[(k // 2) * 540:(k // 2 + 1) * 540, (k % 2) * 960:(k % 2 + 1) * 960] = small
        if i == 60:
            cv2.imwrite(str(out / "compare.png"), grid)
        ff.stdin.write(grid.tobytes())
    ff.stdin.close(); ff.wait()


if __name__ == "__main__":
    main()
