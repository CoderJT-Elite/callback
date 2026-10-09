import fs from "fs";
import path from "path";
import { ROOT, loadScript } from "./lib";

// Writes the two human-readable copies of the spoken script from script.json (the single source of truth).
const script = loadScript() as { scenes: Array<{ id: number; title: string; visual?: string; chunks: string[] }> };
const words = script.scenes.flatMap(s => s.chunks).join(" ").split(/\s+/).length;
const LF = String.fromCharCode(10);

const body = script.scenes
  .map(
    s =>
      `### ${s.id}. ${s.title}${LF}${LF}*On screen: ${s.visual ?? ""}*${LF}${LF}> ${s.chunks.join(" ")}${LF}`
  )
  .join(LF);

const record = `# Record this

**Your script is below. Read it exactly as written, in one take, about 3 minutes (${words} words).**
Nothing else is needed from you: the video, captions, animations and timing are all built around your recording.

## Record it

1. Record yourself reading the whole script, **straight to camera if you want to be in the video**, or voice only.
   - On camera: sit facing a window or lamp, camera at eye level, head and shoulders in the **middle** of the frame
     (the video shows you in a circle, cropped to a centered square). Landscape or portrait both work.
   - Voice only: a phone voice memo is fine. The circle will show a "J" monogram instead of your face.
2. Quiet room, phone on silent, mic close to your mouth. Start by sitting still for one second before the first word.
3. Read at a calm pace. Take a short breath between scenes (the numbered sections below). If you flub a line, stop
   and redo the whole take; it's only 3 minutes and keeps everything lined up.
4. Save as \`.mp4\`, \`.mov\`, \`.webm\`, \`.m4a\`, \`.wav\` or \`.mp3\`.

## Hand it in

Drop the one file into \`video/footage/\` (any file name). Then, from the \`video\` folder:

\`\`\`bash
npm run check
npm run render
\`\`\`

\`npm run check\` tells you if the recording is too quiet, clipped or too short. \`npm run render\` lines your voice up with
each scene, adds captions, and writes \`video/out/callback-demo-16x9.mp4\`. Or just tell me the file is there and I'll do it.

## What if something changes later

The pictures, numbers, captions and animations can all change without you re-recording, because they follow your voice.
Only if the **words** change would you need to re-record.

---

## The script

${body}
`;

fs.writeFileSync(path.join(ROOT, "RECORD_THIS.md"), record);

const docs = `# Callback demo video: the script

This is the exact text John reads (about 3 minutes, ${words} words). It is generated from \`video/script.json\`;
edit that file, not this one, then run \`npm run guide\` inside \`video/\`.

${body}
`;
fs.writeFileSync(path.join(ROOT, "..", "docs", "VIDEO_SCRIPT.md"), docs);
console.log(`Wrote RECORD_THIS.md and docs/VIDEO_SCRIPT.md (${words} words, ${script.scenes.length} scenes)`);
