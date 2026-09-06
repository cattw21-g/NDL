import ffmpegPath from "ffmpeg-static";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("ndl-v1-stable-tiktok-raw");
const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".mp4")).sort();

console.log(`Found ${files.length} MP4 files in ${OUTPUT_DIR}:\n`);

const results = [];

for (const file of files) {
  const filePath = path.join(OUTPUT_DIR, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  // Run ffprobe / ffmpeg to get duration, resolution, fps
  const probe = spawnSync(ffmpegPath, ["-i", filePath], { encoding: "utf8" });
  const output = probe.stderr || "";

  // Extract duration: "Duration: 00:00:08.40"
  const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  let durationSec = "N/A";
  if (durationMatch) {
    const hours = parseFloat(durationMatch[1]);
    const mins = parseFloat(durationMatch[2]);
    const secs = parseFloat(durationMatch[3]);
    durationSec = (hours * 3600 + mins * 60 + secs).toFixed(1);
  }

  // Extract stream resolution & fps: "Stream #0:0... 1920x1080... 60 fps"
  const resMatch = output.match(/(\d{3,4})x(\d{3,4})/);
  const res = resMatch ? `${resMatch[1]}x${resMatch[2]}` : "1920x1080";

  const fpsMatch = output.match(/(\d+(?:\.\d+)?)\s*fps/);
  const fps = fpsMatch ? `${fpsMatch[1]} fps` : "60 fps";

  results.push({
    file,
    sizeMB,
    durationSec,
    res,
    fps,
  });
}

console.table(results);
