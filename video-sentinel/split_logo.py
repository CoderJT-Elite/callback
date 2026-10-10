"""Split the generated logo (logo_src.jpg) into transparent layers: tile + handset, and the arrow."""
import cv2, numpy as np

src = cv2.imread("logo_src.jpg")                    # BGR
H, W = src.shape[:2]
f = src.astype(np.float32)
# background = near white; the tile (with everything on it) is the largest non-white blob
nonwhite = (f.min(axis=2) < 215).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(nonwhite, 8)
big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
x, y, w, h, _ = stats[big]
mask = (lab == big).astype(np.uint8)
cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
tile_mask = np.zeros_like(mask); cv2.drawContours(tile_mask, cnts, -1, 1, -1)
# soft edge from the colour distance to white
dist = np.clip((255 - f.min(axis=2)) / 120.0, 0, 1)
tile_alpha = np.where(tile_mask > 0, 1.0, 0.0).astype(np.float32)
edge = cv2.dilate(tile_mask, np.ones((5, 5), np.uint8)) - cv2.erode(tile_mask, np.ones((5, 5), np.uint8))
tile_alpha = np.where(edge > 0, np.minimum(dist * 1.0, 1.0) * (cv2.dilate(tile_mask, np.ones((5, 5), np.uint8)) > 0), tile_alpha)
ink = np.median(f[tile_mask > 0].reshape(-1, 3)[f[tile_mask > 0].reshape(-1, 3).sum(axis=1) < 150], axis=0)   # the tile's ink colour (BGR)

b, g, r = f[..., 0], f[..., 1], f[..., 2]
red = ((r - np.maximum(g, b)) > 40) & (tile_mask > 0)
red_core = red.astype(np.uint8)
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(red_core, 8)
arrow_blob = 1 + np.argmax(st2[1:, cv2.CC_STAT_AREA])
arrow_hard = (lab2 == arrow_blob)
arrow_col = np.median(f[arrow_hard], axis=0)                                           # BGR
# arrow alpha: how far a pixel is from the tile ink toward the arrow red, near the arrow only
near = cv2.dilate(arrow_hard.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
a_alpha = np.clip((r - ink[2]) / max(1.0, (arrow_col[2] - ink[2])), 0, 1) * near

# square crop around the tile with a little padding
pad = 0
cx, cy, side = x + w // 2, y + h // 2, max(w, h) + pad
x0, y0 = cx - side // 2, cy - side // 2
def crop(a):
    return a[y0:y0 + side, x0:x0 + side]
S = 1024
def out(name, bgr_color, alpha):
    rgba = np.dstack([np.clip(bgr_color, 0, 255).astype(np.uint8), np.clip(alpha * 255, 0, 255).astype(np.uint8)])
    cv2.imwrite(name, cv2.resize(rgba, (S, S), interpolation=cv2.INTER_AREA))

# tile layer: the arrow painted out with the tile ink
tile_bgr = f.copy()
fill = cv2.dilate(arrow_hard.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
tile_bgr[fill] = ink
out("logo_tile.png", crop(tile_bgr), crop(tile_alpha))
# arrow layer: flat arrow colour, soft alpha
arrow_bgr = np.zeros_like(f); arrow_bgr[...] = arrow_col
out("logo_arrow.png", crop(arrow_bgr), crop(a_alpha))
# combined mark
comb_bgr = f.copy()
out("logo_mark.png", crop(comb_bgr), crop(tile_alpha))
print("tile bbox", x, y, w, h, "ink", ink.round(), "arrow", arrow_col.round())
