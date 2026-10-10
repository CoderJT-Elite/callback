import fs from "fs";
import path from "path";
import { ROOT, BUILD_DIR, fmtClock } from "./lib";
import type { Timeline } from "./align";

const LF = String.fromCharCode(10);

/** Writes index.html (and build/captions.srt) from index.tpl + build/timeline.json. */
export function buildIndex(): void {
  const tpl = fs.readFileSync(path.join(ROOT, "index.tpl"), "utf-8").split(String.fromCharCode(13, 10)).join(LF);
  const t: Timeline = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, "timeline.json"), "utf-8"));
  const total = t.total;

  const scenes = t.scenes
    .map(
      s => `<div
        id="scene-${s.id}-mount"
        class="scene-slot clip"
        data-composition-id="scene-${s.id}"
        data-composition-src="compositions/scene-${s.id}.html"
        data-start="${s.start}"
        data-duration="${s.duration}"
        data-track-index="1"
        data-width="1920"
        data-height="1080"
      ></div>`
    )
    .join(LF + LF + "      ");

  // Media: the recording (video of John shows in the circle; audio-only shows a monogram shape).
  let media = `<div id="pip"><div class="shape">J</div></div>`;
  if (t.voice?.hasVideo) {
    media = `<div id="pip">
        <video id="john-video" class="clip" src="${t.voice.src}" playsinline data-has-audio="true" data-start="0" data-duration="${total}" data-track-index="5" data-volume="1"></video>
      </div>`;
  } else if (t.voice) {
    media += `
      <audio id="john-voice" src="${t.voice.src}" data-start="0" data-duration="${total}" data-track-index="5" data-volume="1"></audio>`;
  }

  const firstDemo = t.scenes[1]?.start ?? 18;
  const lastScene = t.scenes[t.scenes.length - 1].start;
  const pipAnim = `// Circle (John's video, or a monogram until a recording exists): big in the hook and closing, small during the demo.
      tl.fromTo("#pip", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.45, duration: 0.6, ease: "back.out(1.6)" }, 0.4);
      tl.to("#pip", { scale: 1, duration: 0.7, ease: "power2.inOut" }, ${firstDemo});
      tl.to("#pip", { scale: 1.45, duration: 0.7, ease: "power2.inOut" }, ${Math.max(firstDemo + 1, lastScene)});`;

  const html = tpl
    .split("@@TOTAL@@").join(String(total))
    .split("@@TIME0@@").join(`00:00 / ${fmtClock(total)}`)
    .split("@@MEDIA@@").join(media)
    .split("@@SCENES@@").join(scenes)
    .split("@@CAPTIONS@@").join(JSON.stringify(t.captions, null, 2).split(LF).join(LF + "      "))
    .split("@@PIPANIM@@").join(pipAnim);

  fs.writeFileSync(path.join(ROOT, "index.html"), html);

  // Matching subtitle file for upload (YouTube etc.)
  const ts = (s: number) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  const srt = t.captions
    .map((c, i) => {
      const end = Math.min(t.captions[i + 1]?.start ?? total, c.start + 8);
      return `${i + 1}${LF}${ts(c.start)} --> ${ts(Math.max(c.start + 0.8, end - 0.05))}${LF}${c.text}${LF}`;
    })
    .join(LF);
  fs.mkdirSync(path.join(ROOT, "assets"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "assets", "captions.srt"), srt);
  console.log(`index.html written (${t.engine}, ${total}s, ${t.scenes.length} scenes, ${t.captions.length} captions)`);
}

if (process.argv[1] && process.argv[1].includes("build-index")) buildIndex();
