import fs from "fs";
import path from "path";
import { execFileSync, spawnSync } from "child_process";
import {
  BUILD_DIR,
  DEFAULT_SCENE_STARTS,
  DEFAULT_TOTAL,
  PROCESSED_DIR,
  ROOT,
  findRecording,
  loadScript,
  probe,
} from "./lib";

export interface Timeline {
  engine: "none" | "transcript" | "pauses";
  total: number;
  scenes: Array<{ id: number; start: number; duration: number }>;
  captions: Array<{ start: number; text: string }>;
  voice: null | { src: string; hasVideo: boolean; duration: number };
  matchedPercent?: number;
  notes: string[];
}

interface Word {
  text: string;
  start: number;
  end: number;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// ---------- recording processing (square crop for the circle, loudness-normalised audio) ----------

function processRecording(file: string, hasVideo: boolean): string {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  if (hasVideo) {
    const out = path.join(PROCESSED_DIR, "voice.mp4");
    execFileSync(
      "ffmpeg",
      [
        "-y", "-loglevel", "error", "-i", file,
        "-vf", "crop='min(iw,ih)':'min(iw,ih)',scale=720:720,fps=30",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out,
      ],
      { stdio: "inherit" }
    );
    return "assets/processed/voice.mp4";
  }
  const out = path.join(PROCESSED_DIR, "voice.m4a");
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", file, "-vn", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out],
    { stdio: "inherit" }
  );
  return "assets/processed/voice.m4a";
}

// ---------- engine A: word-level transcript (needs a speech model; see notes) ----------

function tryTranscribe(file: string): Word[] | null {
  // Paths contain spaces, so quote them. Cache by file size + mtime so re-runs don't re-transcribe.
  const stat = fs.statSync(file);
  const cacheKey = `${path.basename(file)}:${stat.size}:${Math.round(stat.mtimeMs)}`;
  const cacheFile = path.join(BUILD_DIR, "transcript-cache.json");
  if (fs.existsSync(cacheFile)) {
    const c = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (c.key === cacheKey && Array.isArray(c.words)) return c.words;
  }
  const r = spawnSync(`npx hyperframes transcribe "${file}" --dir "${ROOT}" --json`, {
    encoding: "utf-8",
    shell: true,
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = (r.stdout || "").trim();
  if (!text) return null;
  let j: any;
  try {
    j = JSON.parse(text.slice(text.indexOf("{")));
  } catch {
    return null;
  }
  if (j?.ok === false || j?.skipped) return null;
  const candidates: any[] = [];
  const pull = (x: any) => {
    if (Array.isArray(x)) candidates.push(...x);
  };
  pull(j.words);
  pull(j.transcript);
  (j.segments ?? []).forEach((s: any) => pull(s.words));
  // The CLI writes the word list to a transcript.json in the project directory.
  if (candidates.length === 0) {
    const f = typeof j.transcriptPath === "string" && fs.existsSync(j.transcriptPath) ? j.transcriptPath : path.join(ROOT, "transcript.json");
    if (fs.existsSync(f)) {
      pull(JSON.parse(fs.readFileSync(f, "utf-8")));
      fs.mkdirSync(BUILD_DIR, { recursive: true });
      fs.renameSync(f, path.join(BUILD_DIR, "transcript.json"));
    }
  }
  const words: Word[] = candidates
    .map((w: any) => ({ text: String(w.text ?? w.word ?? ""), start: Number(w.start), end: Number(w.end) }))
    .filter(w => w.text && Number.isFinite(w.start) && Number.isFinite(w.end));
  if (words.length <= 20) return null;
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify({ key: cacheKey, words }));
  return words;
}

/** LCS alignment between script tokens and transcript tokens; returns script token index -> time. */
function alignToTranscript(scriptTokens: string[], words: Word[]) {
  const asr: Array<{ t: string; start: number; end: number }> = [];
  for (const w of words) for (const t of norm(w.text)) asr.push({ t, start: w.start, end: w.end });
  const n = scriptTokens.length;
  const m = asr.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = scriptTokens[i] === asr[j].t ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const timeAt = new Map<number, number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (scriptTokens[i] === asr[j].t) {
      timeAt.set(i, asr[j].start);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { timeAt, matched: timeAt.size / n, endTime: words[words.length - 1].end };
}

// ---------- engine B: pause detection (no download needed) ----------

function detectPauses(file: string, duration: number) {
  const r = spawnSync("ffmpeg", ["-i", file, "-vn", "-af", "silencedetect=noise=-38dB:d=0.28", "-f", "null", "-"], { encoding: "utf-8" });
  const log = r.stderr || "";
  const starts = [...log.matchAll(/silence_start: ([0-9.]+)/g)].map(x => parseFloat(x[1]));
  const ends = [...log.matchAll(/silence_end: ([0-9.]+)/g)].map(x => parseFloat(x[1]));
  const pauses: Array<{ start: number; end: number }> = [];
  for (let k = 0; k < starts.length; k++) pauses.push({ start: starts[k], end: ends[k] ?? duration });
  const speechStart = pauses.length && pauses[0].start < 0.05 ? pauses[0].end : 0;
  const last = pauses[pauses.length - 1];
  const speechEnd = last && duration - last.end < 0.05 ? last.start : duration;
  const inner = pauses.filter(p => p.start > speechStart + 0.2 && p.end < speechEnd - 0.2);
  return { speechStart, speechEnd, pauses: inner };
}

/** Choose, in order, one pause per chunk boundary so cumulative word share best matches the pause positions. */
function boundariesFromPauses(chunkWords: number[], speechStart: number, speechEnd: number, pauses: Array<{ start: number; end: number }>) {
  const nb = chunkWords.length - 1;
  if (nb <= 0) return [];
  const total = chunkWords.reduce((a, b) => a + b, 0);
  const expected: number[] = [];
  let acc = 0;
  for (let k = 0; k < nb; k++) {
    acc += chunkWords[k];
    expected.push(speechStart + (acc / total) * (speechEnd - speechStart));
  }
  const cand = pauses.map(p => p.end - 0.05);
  if (cand.length < nb) return expected; // too few pauses: proportional estimate
  const INF = 1e12;
  const dp: number[][] = Array.from({ length: nb }, () => Array(cand.length).fill(INF));
  const prev: number[][] = Array.from({ length: nb }, () => Array(cand.length).fill(-1));
  for (let c = 0; c < cand.length; c++) dp[0][c] = Math.abs(cand[c] - expected[0]);
  for (let k = 1; k < nb; k++) {
    let runMin = INF;
    let runArg = -1;
    for (let c = 0; c < cand.length; c++) {
      if (c > 0 && dp[k - 1][c - 1] < runMin) {
        runMin = dp[k - 1][c - 1];
        runArg = c - 1;
      }
      if (runArg >= 0) {
        dp[k][c] = runMin + Math.abs(cand[c] - expected[k]);
        prev[k][c] = runArg;
      }
    }
  }
  let c = -1;
  let best = INF;
  for (let i = 0; i < cand.length; i++) if (dp[nb - 1][i] < best) { best = dp[nb - 1][i]; c = i; }
  if (c < 0) return expected;
  const chosen: number[] = Array(nb);
  for (let k = nb - 1; k >= 0; k--) {
    chosen[k] = cand[c];
    c = prev[k][c];
    if (c < 0 && k > 0) return expected;
  }
  // A chosen pause far from its expected position is probably a mid-sentence breath: trust the proportional estimate.
  const window = Math.max(4, (speechEnd - speechStart) * 0.1);
  return chosen.map((t, k) => (Math.abs(t - expected[k]) > window ? expected[k] : t));
}

// ---------- main ----------

export function align(): Timeline {
  const script = loadScript();
  const flat: Array<{ scene: number; text: string; tokens: string[] }> = [];
  for (const s of script.scenes) for (const c of s.chunks) flat.push({ scene: s.id, text: c, tokens: norm(c) });

  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const notes: string[] = [];
  const file = findRecording();

  let timeline: Timeline;
  if (!file) {
    // No recording yet: placeholder timing so previews and test renders work.
    const total = DEFAULT_TOTAL;
    const captions: Timeline["captions"] = [];
    for (const s of script.scenes) {
      const idx = s.id - 1;
      const sStart = DEFAULT_SCENE_STARTS[idx];
      const sEnd = DEFAULT_SCENE_STARTS[idx + 1] ?? total;
      const words = s.chunks.map(c => norm(c).length);
      const sum = words.reduce((a, b) => a + b, 0);
      let acc = 0;
      s.chunks.forEach((c, k) => {
        captions.push({ start: +(sStart + 0.4 + (acc / sum) * (sEnd - sStart - 0.8)).toFixed(2), text: c });
        acc += words[k];
      });
    }
    timeline = {
      engine: "none",
      total,
      scenes: script.scenes.map(s => ({ id: s.id, start: DEFAULT_SCENE_STARTS[s.id - 1], duration: (DEFAULT_SCENE_STARTS[s.id] ?? total) - DEFAULT_SCENE_STARTS[s.id - 1] })),
      captions,
      voice: null,
      notes: ["No recording found in video/footage/: placeholder timing."],
    };
  } else {
    const info = probe(file);
    console.log(`Recording: ${path.basename(file)} (${info.duration.toFixed(1)}s, ${info.hasVideo ? `video ${info.width}x${info.height}` : "audio only"})`);
    if (!info.hasAudio) throw new Error("The recording has no audio track.");
    if (info.duration < 60) notes.push(`Recording is only ${info.duration.toFixed(0)}s; the script reads in about 2:45-3:15.`);
    const src = processRecording(file, info.hasVideo);

    const allTokens = flat.flatMap(f => f.tokens);
    const chunkStartIdx: number[] = [];
    let run = 0;
    for (const f of flat) {
      chunkStartIdx.push(run);
      run += f.tokens.length;
    }

    let starts: number[] = [];
    let engine: Timeline["engine"] = "pauses";
    let matchedPercent: number | undefined;
    let speechEnd = info.duration;

    const words = tryTranscribe(file);
    if (words) {
      const { timeAt, matched, endTime } = alignToTranscript(allTokens, words);
      matchedPercent = Math.round(matched * 100);
      if (matched >= 0.55) {
        engine = "transcript";
        speechEnd = endTime;
        starts = flat.map((f, k) => {
          const a = chunkStartIdx[k];
          const b = a + f.tokens.length;
          for (let i = a; i < b; i++) if (timeAt.has(i)) return timeAt.get(i)!;
          return NaN;
        });
        // fill gaps by interpolation
        for (let k = 0; k < starts.length; k++) {
          if (!Number.isNaN(starts[k])) continue;
          let lo = k - 1;
          while (lo >= 0 && Number.isNaN(starts[lo])) lo--;
          let hi = k + 1;
          while (hi < starts.length && Number.isNaN(starts[hi])) hi++;
          const t0 = lo >= 0 ? starts[lo] : 0;
          const t1 = hi < starts.length ? starts[hi] : endTime;
          starts[k] = t0 + ((t1 - t0) * (k - lo)) / (hi - lo);
        }
      } else {
        notes.push(`Transcript matched only ${matchedPercent}% of the script; used pause detection instead. Read the script as written.`);
      }
    } else {
      notes.push("No speech model installed: timing comes from pauses in the recording (install the model with `npx hyperframes models install parakeet` for word-level timing).");
    }

    if (engine === "pauses") {
      const { speechStart, speechEnd: se, pauses } = detectPauses(file, info.duration);
      speechEnd = se;
      const wordsPer = flat.map(f => f.tokens.length);
      const inner = boundariesFromPauses(wordsPer, speechStart, speechEnd, pauses);
      starts = [speechStart, ...inner];
      notes.push(`Pause detection found ${pauses.length} pauses; speech runs ${speechStart.toFixed(1)}s to ${speechEnd.toFixed(1)}s.`);
    }

    // enforce strictly increasing starts
    for (let k = 1; k < starts.length; k++) if (starts[k] < starts[k - 1] + 0.3) starts[k] = starts[k - 1] + 0.3;

    const total = +Math.max(info.duration, speechEnd + 1.2).toFixed(2);
    const sceneStarts: number[] = [];
    const sceneIds = script.scenes.map(s => s.id);
    for (const id of sceneIds) {
      const firstChunk = flat.findIndex(f => f.scene === id);
      sceneStarts.push(id === 1 ? 0 : Math.max(0, +(starts[firstChunk] - 0.25).toFixed(2)));
    }
    timeline = {
      engine,
      total,
      scenes: sceneIds.map((id, k) => ({
        id,
        start: sceneStarts[k],
        duration: +((sceneStarts[k + 1] ?? total) - sceneStarts[k]).toFixed(2),
      })),
      captions: flat.map((f, k) => ({ start: +starts[k].toFixed(2), text: f.text })),
      voice: { src, hasVideo: info.hasVideo, duration: info.duration },
      matchedPercent,
      notes,
    };
  }

  fs.writeFileSync(path.join(BUILD_DIR, "timeline.json"), JSON.stringify(timeline, null, 2));
  console.log(`Timeline (${timeline.engine}): total ${timeline.total}s`);
  for (const s of timeline.scenes) console.log(`  scene ${String(s.id).padStart(2)}  ${s.start.toFixed(1).padStart(6)}s  +${s.duration.toFixed(1)}s`);
  timeline.notes.forEach(n => console.log("  note: " + n));
  return timeline;
}

if (process.argv[1] && process.argv[1].includes("align")) align();
