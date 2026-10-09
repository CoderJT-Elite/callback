import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const FOOTAGE_DIR = path.join(ROOT, "footage");
export const BUILD_DIR = path.join(ROOT, "build");
export const PROCESSED_DIR = path.join(ROOT, "assets", "processed");

export interface ScriptScene {
  id: number;
  title: string;
  chunks: string[];
}
export interface ScriptFile {
  scenes: ScriptScene[];
}

export function loadScript(): ScriptFile {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "script.json"), "utf-8"));
}

/** Scene start times used when no recording exists (placeholder timing only). */
export const DEFAULT_SCENE_STARTS = [0, 18, 34, 64, 86, 104, 122, 140, 158, 172];
export const DEFAULT_TOTAL = 180;

export interface MediaInfo {
  duration: number;
  hasVideo: boolean;
  hasAudio: boolean;
  width: number;
  height: number;
}

const MEDIA_EXT = new Set([".mp4", ".mov", ".webm", ".mkv", ".m4v", ".wav", ".m4a", ".mp3", ".aac", ".ogg", ".flac"]);

/** The recording is whatever media file is in video/footage/ (prefers names with voice/full/main/me). */
export function findRecording(): string | null {
  if (!fs.existsSync(FOOTAGE_DIR)) return null;
  const files = fs
    .readdirSync(FOOTAGE_DIR)
    .filter(f => MEDIA_EXT.has(path.extname(f).toLowerCase()) && !f.startsWith("."))
    .map(f => path.join(FOOTAGE_DIR, f));
  if (files.length === 0) return null;
  const preferred = files.find(f => /voice|full|main|me\b|john|record/i.test(path.basename(f)));
  if (!preferred && files.length > 1) {
    console.warn(`Several files in footage/ and none named voice/full/main: using ${path.basename(files[0])}`);
  }
  return preferred ?? files[0];
}

export function probe(file: string): MediaInfo {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", file],
    { encoding: "utf-8" }
  );
  const j = JSON.parse(out);
  const streams: Array<{ codec_type: string; width?: number; height?: number }> = j.streams ?? [];
  const v = streams.find(s => s.codec_type === "video");
  return {
    duration: parseFloat(j.format?.duration ?? "0"),
    hasVideo: !!v,
    hasAudio: streams.some(s => s.codec_type === "audio"),
    width: v?.width ?? 0,
    height: v?.height ?? 0,
  };
}

export function fmtClock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}
