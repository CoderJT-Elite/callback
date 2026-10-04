import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { findFootageFile, probeMedia } from "./lint-footage";

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
const PROCESSED_DIR = path.join(ROOT_VIDEO, "assets", "processed");
const MANIFEST_PATH = path.join(PROCESSED_DIR, "manifest.json");

fs.mkdirSync(PROCESSED_DIR, { recursive: true });

export function prepareFootage(): Record<string, { present: boolean; path?: string }> {
  console.log("=== Preparing Footage for Render ===");
  const config: SlotsConfig = JSON.parse(fs.readFileSync(SLOTS_PATH, "utf-8"));
  const manifest: Record<string, { present: boolean; path?: string }> = {};

  for (const slot of config.slots) {
    const rawFile = findFootageFile(slot.id);
    if (!rawFile) {
      manifest[slot.id] = { present: false };
      continue;
    }

    const info = probeMedia(rawFile);
    if (!info) {
      manifest[slot.id] = { present: false };
      continue;
    }

    const targetDuration = slot.duration;
    const targetW = slot.bounds ? slot.bounds.width : 1920;
    const targetH = slot.bounds ? slot.bounds.height : 1080;
    const speedFactor = targetDuration / info.duration; // > 1 means speed up, < 1 means slow down

    console.log(`[Processing ${slot.id}]`);
    console.log(`  Source: ${rawFile} (${info.duration.toFixed(2)}s)`);
    console.log(`  Target: ${targetW}x${targetH}, ${targetDuration}s`);

    const outFile = path.join(PROCESSED_DIR, `${slot.id}.mp4`);

    try {
      if (info.hasVideo) {
        // Video processing: scale, crop-to-fill, retime, normalize audio if present
        let videoFilter = `scale=w=${targetW}:h=${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`;
        let audioFilter = "loudnorm";

        // Speed adjustment if within +-8%
        const diffPercent = Math.abs((info.duration - targetDuration) / targetDuration) * 100;
        if (diffPercent <= 8.0 && Math.abs(speedFactor - 1.0) > 0.01) {
          const pts = (1 / speedFactor).toFixed(4);
          videoFilter += `,setpts=${pts}*PTS`;
          audioFilter = `atempo=${speedFactor.toFixed(4)},loudnorm`;
        }

        const audioArgs = info.hasAudio
          ? `-af "${audioFilter}" -c:a aac -b:a 192k`
          : `-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -c:a aac -shortest`;

        const cmd = `ffmpeg -y -i "${rawFile}" -vf "${videoFilter}" -t ${targetDuration} -pix_fmt yuv420p -c:v libx264 -preset fast -crf 20 ${audioArgs} "${outFile}"`;
        execSync(cmd, { stdio: "ignore" });
        console.log(`  ✓ Successfully processed to ${outFile}`);
        manifest[slot.id] = { present: true, path: `assets/processed/${slot.id}.mp4` };
      } else if (info.hasAudio) {
        // Audio-only file (e.g. voiceover-main.wav)
        const audioFilter = `loudnorm`;
        const cmd = `ffmpeg -y -i "${rawFile}" -af "${audioFilter}" -t ${targetDuration} -c:a aac -b:a 192k "${outFile}"`;
        execSync(cmd, { stdio: "ignore" });
        console.log(`  ✓ Successfully processed audio to ${outFile}`);
        manifest[slot.id] = { present: true, path: `assets/processed/${slot.id}.mp4` };
      }
    } catch (err) {
      console.error(`  Failed to process footage for ${slot.id}:`, err);
      manifest[slot.id] = { present: false };
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Footage manifest written to ${MANIFEST_PATH}`);
  return manifest;
}

if (process.argv[1] && process.argv[1].includes("prepare-footage")) {
  prepareFootage();
}
