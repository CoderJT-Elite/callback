import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { FOOTAGE_DIR, findRecording, loadScript, probe } from "./lib";

// Quick pre-flight for the recording: is it there, long enough, loud enough, not clipping?
const file = findRecording();
if (!file) {
  console.log(`No recording yet. Put your file in ${FOOTAGE_DIR}`);
  process.exit(1);
}

const info = probe(file);
const script = loadScript();
const scriptWords = script.scenes.flatMap(s => s.chunks).join(" ").split(/\s+/).length;
const wpm = scriptWords / (info.duration / 60);

console.log(`File:      ${path.basename(file)} (${(fs.statSync(file).size / 1048576).toFixed(1)} MB)`);
console.log(`Type:      ${info.hasVideo ? `video ${info.width}x${info.height}` : "audio only"}${info.hasAudio ? "" : "  (NO AUDIO TRACK)"}`);
console.log(`Length:    ${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2, "0")}`);
console.log(`Pace:      ${wpm.toFixed(0)} words/min (script is ${scriptWords} words; 130-170 is comfortable)`);

const problems: string[] = [];
if (!info.hasAudio) problems.push("No audio track.");
if (info.duration < 100) problems.push("Under 1:40: did you read the whole script?");
if (info.duration > 240) problems.push("Over 4:00: judges rarely watch that long; trim retakes.");
if (wpm > 190) problems.push("Reading very fast.");

if (info.hasAudio) {
  const r = spawnSync("ffmpeg", ["-i", file, "-vn", "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf-8" });
  const mean = parseFloat((r.stderr.match(/mean_volume: (-?[0-9.]+) dB/) || [])[1]);
  const max = parseFloat((r.stderr.match(/max_volume: (-?[0-9.]+) dB/) || [])[1]);
  console.log(`Loudness:  mean ${mean} dB, peak ${max} dB`);
  if (mean < -45) problems.push("Almost silent: wrong microphone?");
  else if (mean < -32) problems.push("Quiet recording; it will be normalized, but get closer to the mic if you can.");
  if (max > -0.2) problems.push("Peaks hit 0 dB: probably clipping/distortion. Lower the mic gain and re-record.");
}

if (problems.length) {
  console.log("\nCheck:");
  problems.forEach(p => console.log("  - " + p));
  process.exit(2);
}
console.log("\nLooks good. Run: npm run render");
