import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("ndl-v1-stable-tiktok-raw");
const TEMP_RECORD_DIR = path.resolve("temp-recording-raw");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_RECORD_DIR)) fs.mkdirSync(TEMP_RECORD_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function easeInOut(t) {
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

async function smoothMove(page, fromX, fromY, toX, toY, durationMs = 1000, steps = 25) {
  const stepDelay = durationMs / steps;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const factor = easeInOut(t);
    const x = fromX + (toX - fromX) * factor;
    const y = fromY + (toY - fromY) * factor;
    await page.mouse.move(x, y);
    await sleep(stepDelay);
  }
}

async function smoothScroll(page, fromY, toY, durationMs = 1200, steps = 30) {
  const stepDelay = durationMs / steps;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const factor = easeInOut(t);
    const y = fromY + (toY - fromY) * factor;
    await page.evaluate((val) => window.scrollTo(0, val), y);
    await sleep(stepDelay);
  }
}

function transcodeAndTrim(inputWebm, outputMp4, startSec, maxDurationSec) {
  console.log(
    `Trimming & Transcoding ${path.basename(outputMp4)} (Start: ${startSec.toFixed(2)}s, Target Duration: ${maxDurationSec.toFixed(2)}s, 1080p 60fps Dark Mode)...`
  );
  const res = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-ss", startSec.toFixed(2),
      "-i", inputWebm,
      "-t", maxDurationSec.toFixed(2),
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-r", "60",
      outputMp4,
    ],
    { stdio: "inherit" }
  );

  if (res.status !== 0) {
    throw new Error(`FFmpeg failed with exit code ${res.status}`);
  }

  try {
    fs.unlinkSync(inputWebm);
  } catch (_) {}
}

async function createContextAndPage(browser, initialX = 960, initialY = 540, skipSplash = true) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark", // Native browser dark mode preference
    recordVideo: {
      dir: TEMP_RECORD_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  await context.addInitScript(
    ({ startX, startY, noSplash }) => {
      try {
        localStorage.setItem("ndl-theme", "dark");
        document.documentElement.classList.add("dark");
        document.documentElement.dataset.theme = "dark";
        if (noSplash) {
          sessionStorage.setItem("ndl_splash_seen", "true");
        }
      } catch (_) {}

      window.addEventListener("DOMContentLoaded", () => {
        try {
          document.documentElement.classList.add("dark");
          document.documentElement.dataset.theme = "dark";
        } catch (_) {}

        const cursor = document.createElement("div");
        cursor.id = "virtual-cursor";
        cursor.style.position = "fixed";
        cursor.style.left = "0px";
        cursor.style.top = "0px";
        cursor.style.pointerEvents = "none";
        cursor.style.zIndex = "2147483647";
        cursor.style.transform = "translate(" + startX + "px, " + startY + "px)";
        cursor.style.transition = "transform 0.04s cubic-bezier(0.1, 0.9, 0.2, 1)";
        cursor.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));">
            <path d="M4 2L20 10L12 12L10 20L4 2Z" fill="#ffffff" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
          <div id="cursor-click-ring" style="position: absolute; left: -10px; top: -10px; width: 32px; height: 32px; border: 2px solid #38bdf8; border-radius: 50%; opacity: 0; pointer-events: none; transition: transform 0.3s ease-out, opacity 0.3s ease-out; transform: scale(0.5);"></div>
        `;
        document.body.appendChild(cursor);

        window.addEventListener("mousemove", (e) => {
          cursor.style.transform = "translate(" + e.clientX + "px, " + e.clientY + "px)";
        });

        window.addEventListener("mousedown", () => {
          const ring = document.getElementById("cursor-click-ring");
          if (ring) {
            ring.style.opacity = "1";
            ring.style.transform = "scale(1.4)";
          }
        });

        window.addEventListener("mouseup", () => {
          const ring = document.getElementById("cursor-click-ring");
          if (ring) {
            ring.style.opacity = "0";
            ring.style.transform = "scale(0.5)";
          }
        });
      });
    },
    { startX: initialX, startY: initialY, noSplash: skipSplash }
  );

  const page = await context.newPage();
  return { context, page };
}

// -------------------------------------------------------------
// SHOTS (ALL IN DARK MODE)
// -------------------------------------------------------------

async function recordShot01(browser) {
  console.log("\n>>> Recording 01_STABLE_RELEASE_HOOK.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 480, true);

  await page.goto("https://www.nerfeddemonlist.net", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(1000); // Hold still on hero
  await smoothMove(page, 960, 480, 580, 240, 1200); // Hover "Nerfed Demonlist"
  await sleep(1000);
  await smoothMove(page, 580, 240, 550, 310, 1000); // Hover stats
  await sleep(800);
  await smoothScroll(page, 0, 380, 1400); // Scroll to top 3 demons
  await smoothMove(page, 550, 310, 720, 380, 800); // Hover #1 demon
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "01_STABLE_RELEASE_HOOK.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.5); // Target 7–9s
}

async function recordShot02(browser) {
  console.log("\n>>> Recording 02_NEWS_V1_STABLE.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net/changelog", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 400, 680, 330, 1000); // Hover v1.0.0 Stable article card
  await sleep(800);

  // Click article title
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("text=Nerfed Demonlist v1.0.0: Official Stable Release");
  await page.waitForLoadState("networkidle");
  await sleep(800);

  await smoothScroll(page, 0, 380, 1400); // Scroll down through changelog
  await smoothMove(page, 680, 330, 550, 460, 800); // Hover changelog bullets
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "02_NEWS_V1_STABLE.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 7.5); // Target 6–8s
}

async function recordShot03(browser) {
  console.log("\n>>> Recording 03_MAIN_EXTENDED_LIST.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 360));
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 400, 440, 220, 1000); // Hover Main List tab
  await sleep(600);
  await smoothMove(page, 440, 220, 580, 220, 1000); // Hover Extended List tab
  await sleep(800);

  // Click Extended List
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("button:has-text('Extended List')");
  await sleep(1000);

  // Move to All Demons tab
  await smoothMove(page, 580, 220, 820, 220, 1000);
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("button:has-text('All Demons')");
  await sleep(2000);

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "03_MAIN_EXTENDED_LIST.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.3); // Target 7–9s
}

async function recordShot04(browser) {
  console.log("\n>>> Recording 04_PARTIAL_PROGRESS_POINTS.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 450, true);

  await page.goto("https://www.nerfeddemonlist.net/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => window.scrollTo(0, 780));
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  // Hover Qualifying Requirement badge
  await smoothMove(page, 960, 450, 720, 185, 1200);
  await sleep(1600);

  // Smooth scroll to records table
  await smoothScroll(page, 780, 1020, 1000);
  await smoothMove(page, 720, 185, 780, 360, 800); // Hover Progress
  await smoothMove(page, 780, 360, 890, 360, 800); // Hover Points
  await sleep(2200); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "04_PARTIAL_PROGRESS_POINTS.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.2); // Target 7–9s
}

async function recordShot05(browser) {
  console.log("\n>>> Recording 05_COUNTRY_RANKINGS.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net/countries", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 400, 680, 310, 1000); // Hover stats
  await sleep(600);
  await smoothMove(page, 680, 310, 480, 410, 1000); // Hover Europe tab
  await sleep(800);

  // Click Europe tab
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("a[href='/countries?continent=Europe']");
  await page.waitForLoadState("networkidle");
  await sleep(800);

  await smoothScroll(page, 0, 300, 1000); // Scroll to standings
  await smoothMove(page, 480, 410, 620, 420, 1000); // Hover Poland
  await sleep(1000);
  await smoothMove(page, 620, 420, 620, 490, 800); // Hover Germany
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "05_COUNTRY_RANKINGS.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 9.2); // Target 8–10s
}

async function recordShot06(browser) {
  console.log("\n>>> Recording 06_NATIONAL_TEAM_PAGE.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 300, true);

  await page.goto("https://www.nerfeddemonlist.net/countries/us", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 300, 550, 240, 1000); // Hover USA header
  await sleep(800);
  await smoothMove(page, 550, 240, 520, 460, 1000); // Hover top player alalrbw
  await sleep(1000);
  await smoothMove(page, 520, 460, 720, 460, 800); // Hover points contribution
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "06_NATIONAL_TEAM_PAGE.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 7.0); // Target 5–7s
}

async function recordShot07(browser) {
  console.log("\n>>> Recording 07_CREATOR_LEADERBOARD.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net/creators", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 400, 720, 310, 1000); // Hover creator stats
  await sleep(800);
  await smoothMove(page, 720, 310, 520, 485, 1000); // Hover #1 creator AkayukiGD
  await sleep(1000);
  await smoothScroll(page, 0, 340, 1200); // Scroll down to top 5-8 creators
  await smoothMove(page, 520, 485, 690, 400, 1000); // Hover creator score
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "07_CREATOR_LEADERBOARD.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.5); // Target 7–9s
}

async function recordShot08(browser) {
  console.log("\n>>> Recording 08_HISTORICAL_ARCHIVE.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net/archive", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(1000);
  await smoothMove(page, 960, 400, 920, 275, 1200); // Hover Launch Day preset
  await sleep(1000);

  // Click Launch Day preset
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("text=Launch Day");
  await page.waitForLoadState("networkidle");
  await sleep(1000);

  await smoothMove(page, 920, 275, 950, 350, 1000); // Hover "Viewing list on: June 1, 2026"
  await sleep(1200);
  await smoothScroll(page, 0, 360, 1400); // Scroll to historical rankings
  await smoothMove(page, 950, 350, 650, 420, 1000); // Hover #1 demon
  await sleep(2200); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "08_HISTORICAL_ARCHIVE.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 11.0); // Target 9–12s
}

async function recordShot09(browser) {
  console.log("\n>>> Recording 09_LEVEL_METADATA.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 500, true);

  await page.goto("https://www.nerfeddemonlist.net/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => window.scrollTo(0, 560));
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 500, 520, 230, 800); // Level ID
  await sleep(700);
  await smoothMove(page, 520, 230, 740, 230, 800); // In-Game Rating
  await sleep(700);
  await smoothMove(page, 740, 230, 740, 320, 800); // Objects & Copy Password
  await sleep(800);
  await smoothMove(page, 740, 320, 620, 400, 800); // Soundtrack & Song ID
  await sleep(800);
  await smoothMove(page, 620, 400, 700, 460, 1000); // Qualifying Requirement
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "09_LEVEL_METADATA.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.2); // Target 7–9s
}

async function recordShot10(browser) {
  console.log("\n>>> Recording 10_POSITION_HISTORY.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 400, true);

  await page.goto("https://www.nerfeddemonlist.net/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => window.scrollTo(0, 1080));
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 400, 580, 260, 1200); // Peak Rank badge
  await sleep(1200);
  await smoothMove(page, 580, 260, 750, 360, 1000); // Placement row
  await smoothMove(page, 750, 360, 950, 360, 800); // Date and current rank
  await sleep(2000); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "10_POSITION_HISTORY.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 7.1); // Target 6–8s
}

async function recordShot11(browser) {
  console.log("\n>>> Recording 11_NEW_NAVIGATION_REDESIGN.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 400, 70, true);

  await page.goto("https://www.nerfeddemonlist.net", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 400, 70, 520, 70, 600); // Upcoming
  await smoothMove(page, 520, 70, 640, 70, 600); // Players
  await smoothMove(page, 640, 70, 770, 70, 600); // Countries
  await smoothMove(page, 770, 70, 950, 70, 600); // News
  await sleep(500);

  // Quick Search button
  await smoothMove(page, 950, 70, 1340, 24, 800);
  await sleep(600);
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("button:has-text('Quick Search...')");
  await sleep(800);

  // Type search
  await page.keyboard.type("Koc", { delay: 180 });
  await sleep(800);
  await smoothMove(page, 1340, 24, 960, 360, 1000); // Hover top search result
  await sleep(1200);

  // Close search
  await page.keyboard.press("Escape");
  await sleep(1500); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "11_NEW_NAVIGATION_REDESIGN.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 9.5); // Target 8–10s
}

async function recordShot12(browser) {
  console.log("\n>>> Recording 12_FINAL_HOMEPAGE.mp4 (Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 1620, 700, true);

  await page.goto("https://www.nerfeddemonlist.net", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(1000);
  await smoothScroll(page, 0, 450, 2000);
  await sleep(500);
  await smoothScroll(page, 450, 980, 2000);
  await sleep(500);
  await smoothScroll(page, 980, 1400, 1500);
  await sleep(2200); // End hold on clean frame

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "12_FINAL_HOMEPAGE.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 9.5); // Target 8–10s
}

async function recordShot13(browser) {
  console.log("\n>>> Recording 13_COUNTRY_TO_CREATOR_TRANSITION.mp4 (Optional B-Roll - Dark Mode)...");
  const recStart = Date.now();
  const { context, page } = await createContextAndPage(browser, 960, 500, true);

  await page.goto("https://www.nerfeddemonlist.net/countries", { waitUntil: "networkidle" });
  const actionStart = (Date.now() - recStart) / 1000;

  await sleep(800);
  await smoothMove(page, 960, 500, 650, 520, 1000); // Hover countries table
  await sleep(800);
  await smoothMove(page, 650, 520, 720, 70, 1000); // Move to Creators in navbar
  await sleep(600);

  // Click Creators
  await page.mouse.down();
  await sleep(100);
  await page.mouse.up();
  await page.click("a[href='/creators']");
  await page.waitForLoadState("networkidle");
  await sleep(800);

  await smoothMove(page, 720, 70, 600, 220, 1000); // Hover creator title
  await sleep(1800); // End hold

  const video = page.video();
  await context.close();

  const rawPath = await video.path();
  const outPath = path.join(OUTPUT_DIR, "13_COUNTRY_TO_CREATOR_TRANSITION.mp4");
  transcodeAndTrim(rawPath, outPath, actionStart, 8.0); // Target 6–8s
}

async function main() {
  console.log("Starting full DARK MODE precision raw footage capture session...");
  console.log("Target directory:", OUTPUT_DIR);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  try {
    await recordShot01(browser);
    await recordShot02(browser);
    await recordShot03(browser);
    await recordShot04(browser);
    await recordShot05(browser);
    await recordShot06(browser);
    await recordShot07(browser);
    await recordShot08(browser);
    await recordShot09(browser);
    await recordShot10(browser);
    await recordShot11(browser);
    await recordShot12(browser);
    await recordShot13(browser);
    console.log("\nALL 13 DARK MODE CLIPS RECORDED AND TRANSCODED!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
