import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { prepareFootage } from "./prepare-footage";

const ROOT_VIDEO = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT_VIDEO, "out");
const OUT_FILE = path.join(OUT_DIR, "callback-demo-9x16.mp4");
const VERTICAL_DIR = path.join(ROOT_VIDEO, "vertical");

async function main() {
  console.log("=========================================");
  console.log("   HyperFrames 9:16 Vertical Video Render ");
  console.log("=========================================");

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. Prepare raw footage (scale, crop, normalize loudness)
  console.log("\nStep 1: Preparing dropped footage slots...");
  prepareFootage();

  // 2. Execute HyperFrames Render for Vertical Cut
  console.log("\nStep 2: Executing HyperFrames render (1080x1920 @ 30fps)...");
  // Run inside vertical directory where index.html is the root 1080x1920 composition
  const renderCmd = `npx hyperframes render -o "../out/callback-demo-9x16.mp4" -f 30 --browser-timeout 120`;
  try {
    execSync(renderCmd, { cwd: VERTICAL_DIR, stdio: "inherit" });
    console.log(`\n✓ Vertical render command completed.`);
  } catch (err) {
    console.error("Vertical render execution failed:", err);
    process.exit(1);
  }

  // 3. Post-render media verification via ffprobe
  console.log("\nStep 3: Verifying media streams via ffprobe...");
  if (!fs.existsSync(OUT_FILE)) {
    console.error(`Error: Output file not found at ${OUT_FILE}`);
    process.exit(1);
  }

  try {
    const probeJsonStr = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${OUT_FILE}"`,
      { encoding: "utf-8" }
    );
    const probeData = JSON.parse(probeJsonStr);

    const videoStream = probeData.streams.find((s: any) => s.codec_type === "video");
    const audioStream = probeData.streams.find((s: any) => s.codec_type === "audio");
    const duration = parseFloat(probeData.format.duration || "0");

    console.log(`- File Size: ${(fs.statSync(OUT_FILE).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`- Duration: ${duration.toFixed(2)}s`);
    if (videoStream) {
      console.log(`- Video: ${videoStream.codec_name}, ${videoStream.width}x${videoStream.height} @ ${videoStream.r_frame_rate} fps`);
    } else {
      console.error(`✗ Missing video stream!`);
    }

    if (audioStream) {
      console.log(`- Audio: ${audioStream.codec_name}, ${audioStream.sample_rate} Hz, ${audioStream.channels} channels (✓ PRESENT)`);
    } else {
      console.log(`! Notice: Audio stream missing. Muxing silence bed audio...`);
      const audioBed = path.join(ROOT_VIDEO, "assets", "audio", "silence-bed.mp3");
      const tempOut = path.join(OUT_DIR, "temp-muxed-9x16.mp4");
      const muxCmd = `ffmpeg -y -i "${OUT_FILE}" -i "${audioBed}" -c:v copy -c:a aac -b:a 192k -shortest "${tempOut}"`;
      execSync(muxCmd, { stdio: "ignore" });
      fs.copyFileSync(tempOut, OUT_FILE);
      fs.unlinkSync(tempOut);
      console.log(`✓ Audio stream successfully muxed into ${OUT_FILE}`);
    }

    console.log(`\n=========================================`);
    console.log(`✓ 9:16 Vertical Video Ready: ${OUT_FILE}`);
    console.log(`=========================================`);
  } catch (err) {
    console.error("ffprobe inspection error:", err);
  }
}

main().catch(console.error);
