import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface SlotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

interface Slot {
  id: string;
  name: string;
  scene: string;
  start: number;
  end: number;
  duration: number;
  aspect: string;
  layout: string;
  bounds: SlotBounds | null;
  description: string;
}

interface SlotsConfig {
  version: string;
  totalDuration: number;
  slots: Slot[];
}

const ROOT_VIDEO = path.resolve(import.meta.dirname, "..");
const SLOTS_PATH = path.join(ROOT_VIDEO, "slots.json");
const FOOTAGE_DIR = path.join(ROOT_VIDEO, "footage");

export function findFootageFile(slotId: string): string | null {
  if (!fs.existsSync(FOOTAGE_DIR)) return null;
  const supportedExts = [".mp4", ".mov", ".webm", ".m4v", ".wav", ".m4a", ".mp3"];
  for (const ext of supportedExts) {
    const candidate = path.join(FOOTAGE_DIR, `${slotId}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function probeMedia(filePath: string): { duration: number; width?: number; height?: number; hasAudio: boolean; hasVideo: boolean } | null {
  try {
    const stdout = execSync(
      `ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of json "${filePath}"`,
      { encoding: "utf-8" }
    );
    const data = JSON.parse(stdout);
    const duration = parseFloat(data.format?.duration || "0");
    let width: number | undefined;
    let height: number | undefined;
    let hasAudio = false;
    let hasVideo = false;

    if (Array.isArray(data.streams)) {
      for (const s of data.streams) {
        if (s.codec_type === "video") {
          hasVideo = true;
          if (s.width && s.height) {
            width = parseInt(s.width);
            height = parseInt(s.height);
          }
        }
        if (s.codec_type === "audio") {
          hasAudio = true;
        }
      }
    }

    return { duration, width, height, hasAudio, hasVideo };
  } catch (err) {
    console.error(`Error probing file ${filePath}:`, err);
    return null;
  }
}

export function lintFootage(): boolean {
  console.log("=== HyperFrames Footage Slot Linter ===");
  if (!fs.existsSync(SLOTS_PATH)) {
    console.error(`Error: slots.json not found at ${SLOTS_PATH}`);
    return false;
  }

  const config: SlotsConfig = JSON.parse(fs.readFileSync(SLOTS_PATH, "utf-8"));
  console.log(`Checking ${config.slots.length} configured slots in video/slots.json...\n`);

  let allValid = true;
  let presentCount = 0;

  for (const slot of config.slots) {
    const file = findFootageFile(slot.id);
    if (!file) {
      console.log(`[SLOT: ${slot.id}]`);
      console.log(`  Status: ℹ NO FOOTAGE FILE DETECTED in video/footage/`);
      console.log(`  Fallback: Using marked placeholder card: "John's footage goes here: ${slot.id}, ${slot.duration}s, ${slot.layout}"\n`);
      continue;
    }

    presentCount++;
    console.log(`[SLOT: ${slot.id}]`);
    console.log(`  Status: ✓ Detected file: ${path.basename(file)}`);

    const info = probeMedia(file);
    if (!info) {
      console.error(`  ERROR: Unable to probe media for ${path.basename(file)}`);
      allValid = false;
      continue;
    }

    console.log(`  Real duration: ${info.duration.toFixed(2)}s (Target: ${slot.duration}s)`);
    if (info.width && info.height) {
      console.log(`  Resolution: ${info.width}x${info.height}`);
    }

    const diffPercent = ((info.duration - slot.duration) / slot.duration) * 100;
    if (Math.abs(diffPercent) <= 8.0) {
      console.log(`  Retime check: ✓ Duration matches within speed-fit tolerance (${diffPercent > 0 ? "+" : ""}${diffPercent.toFixed(1)}%).`);
    } else {
      console.warn(
        `  Retime check: ⚠ WARNING: Duration difference of ${diffPercent > 0 ? "+" : ""}${diffPercent.toFixed(1)}% exceeds ±8% threshold.` +
        ` Footage will be automatically trimmed or speed-adjusted by prepare script.`
      );
    }
    console.log();
  }

  console.log(`Footage check summary: ${presentCount}/${config.slots.length} slots filled with live footage.`);
  if (presentCount === 0) {
    console.log(`All slots will render in preview/render mode using deterministic placeholder cards.`);
  }
  return allValid;
}

if (process.argv[1] && process.argv[1].includes("lint-footage")) {
  const ok = lintFootage();
  process.exit(ok ? 0 : 1);
}
