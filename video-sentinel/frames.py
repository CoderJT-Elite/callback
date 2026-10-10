"""Render single preview frames: py frames.py <scene_no> <t1> <t2> ...   (placeholder timing, no clip needed)"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import build
from playwright.sync_api import sync_playwright

i = int(sys.argv[1]) - 1
spec = json.loads((build.HERE / "scenes.json").read_text(encoding="utf-8"))
clip = build.HERE / "clips" / f"{i + 1:02d}.mp4"
plan = build.plan_scene(spec["scenes"][i], clip if clip.exists() and "--timed" in sys.argv else None)
times = [a for a in sys.argv[2:] if a != "--timed"]
cfg = {"placeholder": True, "seq": {}, "facts": {"repo": "github.com/CoderJT-Elite/callback", "demo": "callback-lac.vercel.app"},
       "scenes": [dict(id=s["id"], label=s["label"], node=s["node"], text=s["text"], rawCues=s["cues"], cues=plan["cues"] if k == i else {}, D=plan["D"]) for k, s in enumerate(spec["scenes"])]}
print("D=", round(plan["D"], 1), {k: round(v, 1) for k, v in plan["cues"].items()})
out = build.HERE / "_frames"
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto((build.HERE / "stage.html").as_uri()); pg.evaluate("c => window.setup(c)", cfg)
    for t in times:
        pg.evaluate("([i,t]) => window.seek(i,t)", [i, float(t)])
        pg.screenshot(path=str(out / f"f{i + 1:02d}_{float(t):05.1f}.png"))
    b.close()
