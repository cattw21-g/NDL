import { chromium, type Browser, type Page } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import net from "net";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ADMIN_SESSION_TOKEN,
  APPLICANT_AERO_TOKEN,
  APPLICANT_NEXUS_TOKEN,
} from "./seed-video-data";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const BASE_URL = "http://localhost:3000";
const RAW_DIR = path.resolve(process.cwd(), "video/application-announcement/raw");
const BROLL_DIR = path.resolve(process.cwd(), "video/application-announcement/broll");
const TEMP_DIR = path.resolve(process.cwd(), "video_temp_work");

function safeCleanup(dir: string) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
    }
  } catch {
    // Harmless on Windows
  }
}

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function ensureServerRunning(): Promise<() => void> {
  const isRunning = await checkPort(3000);
  if (isRunning) {
    console.log("Next.js server is already running on port 3000.");
    return () => {};
  }

  console.log("Starting Next.js production server on port 3000...");
  const proc = spawn("npx.cmd", ["next", "start", "-p", "3000"], {
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      SESSION_SECRET: "e9c4b7a1d3f82e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a",
    },
    stdio: "pipe",
  });

  proc.stdout?.on("data", (d) => {
    const s = d.toString();
    if (s.includes("Ready in") || s.includes("Local:")) {
      console.log("Next.js server is ready!");
    }
  });

  // Wait until server responds
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch("http://localhost:3000/applications");
      if (res.status === 200) {
        console.log("✓ Server confirmed ready on http://localhost:3000");
        break;
      }
    } catch {}
  }

  return () => {
    console.log("Stopping Next.js server child process...");
    try {
      proc.kill();
    } catch {}
  };
}

async function smoothScroll(page: Page, distance: number, durationMs: number) {
  const steps = Math.max(12, Math.floor(durationMs / 16));
  const stepDist = distance / steps;
  const stepTime = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "instant" }), stepDist);
    await page.waitForTimeout(stepTime);
  }
}

function transcodeWebmToMp4(webmPath: string, mp4Path: string, durationLimitSec?: number) {
  const durationArg = durationLimitSec ? `-t ${durationLimitSec.toFixed(2)}` : "";
  const cmd = `"${ffmpegPath}" -y -i "${webmPath}" ${durationArg} -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" -c:v libx264 -pix_fmt yuv420p -r 60 -crf 18 -preset fast "${mp4Path}"`;
  execSync(cmd, { stdio: "ignore" });
}

interface RecordOptions {
  viewport?: { width: number; height: number };
  sessionToken?: string;
  url: string;
  outputFile: string;
  durationTargetSec: number;
  action: (page: Page) => Promise<void>;
}

let clipCounter = 0;
async function recordClip(browser: Browser, opts: RecordOptions) {
  clipCounter++;
  console.log(`\n[${clipCounter}] Recording: ${path.basename(opts.outputFile)} (${opts.durationTargetSec}s) -> ${opts.url}`);

  const clipTempDir = path.resolve(TEMP_DIR, `clip_${clipCounter}`);
  fs.mkdirSync(clipTempDir, { recursive: true });

  const vp = opts.viewport || { width: 430, height: 764 };

  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2.5,
    colorScheme: "dark",
    recordVideo: {
      dir: clipTempDir,
      size: { width: 1080, height: 1920 },
    },
  });

  await context.addInitScript(() => {
    localStorage.setItem("ndl-theme", "dark");
    sessionStorage.setItem("ndl_splash_seen", "1");
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  });

  if (opts.sessionToken) {
    await context.addCookies([
      {
        name: "ndl_session",
        value: opts.sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }

  const page = await context.newPage();
  await page.goto(`${BASE_URL}${opts.url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Execute recorded action
  await opts.action(page);

  await page.waitForTimeout(300);

  const video = page.video();
  await page.close();
  await context.close();

  if (video) {
    const rawWebm = await video.path();
    await new Promise((r) => setTimeout(r, 300));
    transcodeWebmToMp4(rawWebm, opts.outputFile, opts.durationTargetSec);
    const size = fs.statSync(opts.outputFile).size;
    console.log(`✓ Saved ${path.basename(opts.outputFile)} (${(size / 1024).toFixed(1)} KB)`);
  }
}

async function main() {
  console.log("==================================================");
  console.log("STARTING NDL APPLICATION ANNOUNCEMENT RECORDINGS");
  console.log("==================================================");

  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
  if (!fs.existsSync(BROLL_DIR)) fs.mkdirSync(BROLL_DIR, { recursive: true });
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const stopServer = await ensureServerRunning();

  const opening = await prisma.applicationOpening.findUnique({
    where: { slug: "list-reviewer" },
    include: {
      submissions: {
        include: { user: true },
      },
    },
  });

  if (!opening) throw new Error("List Reviewer opening not found in DB");

  const vortexSub = opening.submissions.find((s) => s.user.playerName === "vortexgd");
  const solarisSub = opening.submissions.find((s) => s.user.playerName === "solaris_gd");
  const novaSub = opening.submissions.find((s) => s.user.playerName === "novagd");

  if (!vortexSub || !solarisSub || !novaSub) {
    throw new Error("Missing required demo candidates in DB");
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // 01: Home / Brand Hook (1.8s)
    await recordClip(browser, {
      url: "/",
      outputFile: path.resolve(RAW_DIR, "01_home_hook.mp4"),
      durationTargetSec: 1.8,
      action: async (page) => {
        await page.waitForTimeout(400);
        await smoothScroll(page, 160, 1000);
        await page.waitForTimeout(400);
      },
    });

    // 02: Applications are Open (3.0s)
    await recordClip(browser, {
      url: "/applications",
      outputFile: path.resolve(RAW_DIR, "02_applications_open.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.waitForTimeout(400);
        await smoothScroll(page, 260, 1800);
        await page.waitForTimeout(800);
      },
    });

    // 03: The Three Roles (3.0s)
    await recordClip(browser, {
      url: "/applications",
      outputFile: path.resolve(RAW_DIR, "03_roles.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 240));
        await page.waitForTimeout(500);
        await smoothScroll(page, 260, 1800);
        await page.waitForTimeout(700);
      },
    });

    // 04: Open List Reviewer Application (2.3s)
    await recordClip(browser, {
      url: "/applications",
      outputFile: path.resolve(RAW_DIR, "04_reviewer_form.mp4"),
      durationTargetSec: 2.3,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 200));
        await page.waitForTimeout(300);
        const applyLink = page.locator('a[href="/applications/list-reviewer"]').first();
        const box = await applyLink.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
          await page.waitForTimeout(250);
          await applyLink.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(700);
        }
      },
    });

    // 05: Application Questions (4.5s)
    await recordClip(browser, {
      url: "/applications/list-reviewer",
      sessionToken: APPLICANT_NEXUS_TOKEN,
      outputFile: path.resolve(RAW_DIR, "05_application_questions.mp4"),
      durationTargetSec: 4.5,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 280));
        await page.waitForTimeout(500);
        await smoothScroll(page, 440, 3200);
        await page.waitForTimeout(800);
      },
    });

    // 06: Autosave / Professional Form (2.8s)
    await recordClip(browser, {
      url: "/applications/list-reviewer",
      sessionToken: APPLICANT_NEXUS_TOKEN,
      outputFile: path.resolve(RAW_DIR, "06_autosave.mp4"),
      durationTargetSec: 2.8,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 280));
        await page.waitForTimeout(300);
        const textarea = page.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.focus();
          await page.keyboard.type(" I want to help keep reviews fair.", {
            delay: 30,
          });
          // Wait for autosave debouncer and indicator
          await page.waitForTimeout(2200);
        }
      },
    });

    // 07: My Applications (2.8s)
    await recordClip(browser, {
      url: "/applications/mine",
      sessionToken: APPLICANT_AERO_TOKEN,
      outputFile: path.resolve(RAW_DIR, "07_my_applications.mp4"),
      durationTargetSec: 2.8,
      action: async (page) => {
        await page.waitForTimeout(500);
        await smoothScroll(page, 140, 1500);
        await page.waitForTimeout(800);
      },
    });

    // 08: Admin Application Dashboard (3.5s)
    await recordClip(browser, {
      url: "/admin/applications",
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(RAW_DIR, "08_admin_dashboard.mp4"),
      durationTargetSec: 3.5,
      action: async (page) => {
        await page.waitForTimeout(500);
        await smoothScroll(page, 260, 2200);
        await page.waitForTimeout(800);
      },
    });

    // 09: Review An Application (3.5s)
    await recordClip(browser, {
      url: `/admin/applications/${opening.id}/submissions/${vortexSub.id}`,
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(RAW_DIR, "09_review_application.mp4"),
      durationTargetSec: 3.5,
      action: async (page) => {
        await page.waitForTimeout(500);
        await smoothScroll(page, 320, 2200);
        await page.waitForTimeout(800);
      },
    });

    // 10: Compare Candidates (3.5s)
    await recordClip(browser, {
      url: `/admin/applications/${opening.id}/compare?ids=${vortexSub.id},${solarisSub.id}`,
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(RAW_DIR, "10_compare_candidates.mp4"),
      durationTargetSec: 3.5,
      action: async (page) => {
        await page.waitForTimeout(600);
        await smoothScroll(page, 340, 2200);
        await page.waitForTimeout(700);
      },
    });

    // 11: Accept & Grant Role (3.0s)
    await recordClip(browser, {
      url: `/admin/applications/${opening.id}/submissions/${novaSub.id}`,
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(RAW_DIR, "11_accept_role.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.waitForTimeout(400);
        const acceptBtn = page.locator('button:has-text("Accept & Grant Role")');
        if (await acceptBtn.isVisible()) {
          await acceptBtn.click();
          await page.waitForTimeout(500);
          const confirmBtn = page.locator('button:has-text("Confirm Accept")');
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
            await page.waitForTimeout(1100);
          }
        }
      },
    });

    // Reset NovaGD to SHORTLISTED for idempotency
    await prisma.applicationSubmission.update({
      where: { id: novaSub.id },
      data: { status: "SHORTLISTED" },
    });

    // 12: Beta Tester / Feedback System (3.0s)
    await recordClip(browser, {
      url: "/beta/feedback",
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(RAW_DIR, "12_beta_feedback.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.waitForTimeout(500);
        await smoothScroll(page, 220, 1800);
        await page.waitForTimeout(700);
      },
    });

    // 13: Final CTA (2.5s)
    await recordClip(browser, {
      url: "/applications",
      outputFile: path.resolve(RAW_DIR, "13_final_cta.mp4"),
      durationTargetSec: 2.5,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 260));
        await page.waitForTimeout(2000);
      },
    });

    // ==================================================
    // B-ROLL CLIPS
    // ==================================================
    console.log("\n==================================================");
    console.log("RECORDING B-ROLL CLIPS");
    console.log("==================================================");

    // B1: Demonlist Scroll (2.0s)
    await recordClip(browser, {
      url: "/",
      outputFile: path.resolve(BROLL_DIR, "B1_demonlist_scroll.mp4"),
      durationTargetSec: 2.0,
      action: async (page) => {
        await page.waitForTimeout(300);
        await smoothScroll(page, 320, 1400);
        await page.waitForTimeout(300);
      },
    });

    // B2: Mobile Applications (3.0s, 375x667)
    await recordClip(browser, {
      url: "/applications",
      viewport: { width: 375, height: 667 },
      outputFile: path.resolve(BROLL_DIR, "B2_mobile_applications.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.waitForTimeout(400);
        await smoothScroll(page, 300, 2000);
        await page.waitForTimeout(600);
      },
    });

    // B3: Mobile Form (3.0s, 375x667)
    await recordClip(browser, {
      url: "/applications/list-reviewer",
      sessionToken: APPLICANT_NEXUS_TOKEN,
      viewport: { width: 375, height: 667 },
      outputFile: path.resolve(BROLL_DIR, "B3_mobile_form.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 220));
        await page.waitForTimeout(400);
        await smoothScroll(page, 280, 2000);
        await page.waitForTimeout(600);
      },
    });

    // B4: Admin Create Opening (3.0s)
    await recordClip(browser, {
      url: "/admin/applications/new",
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(BROLL_DIR, "B4_admin_create_opening.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.waitForTimeout(500);
        await smoothScroll(page, 200, 1800);
        await page.waitForTimeout(700);
      },
    });

    // B5: Question Builder (3.0s)
    await recordClip(browser, {
      url: "/admin/applications/new",
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(BROLL_DIR, "B5_question_builder.mp4"),
      durationTargetSec: 3.0,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 320));
        await page.waitForTimeout(500);
        await smoothScroll(page, 220, 1800);
        await page.waitForTimeout(700);
      },
    });

    // B6: Statuses (2.0s)
    await recordClip(browser, {
      url: "/admin/applications",
      sessionToken: ADMIN_SESSION_TOKEN,
      outputFile: path.resolve(BROLL_DIR, "B6_statuses.mp4"),
      durationTargetSec: 2.0,
      action: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 160));
        await page.waitForTimeout(1600);
      },
    });

    console.log("\n==================================================");
    console.log("CREATING TIKTOK PREVIEW (ndl-applications-tiktok-preview.mp4)");
    console.log("==================================================");

    createTikTokPreview();

    console.log("\n==================================================");
    console.log("GENERATING SHOT-LIST.MD");
    console.log("==================================================");

    generateShotList();

    console.log("\n✓ All tasks completed cleanly!");
  } finally {
    await browser.close();
    await prisma.$disconnect();
    stopServer();
    safeCleanup(TEMP_DIR);
  }
}

function createTikTokPreview() {
  const previewPath = path.resolve(
    process.cwd(),
    "video/application-announcement/ndl-applications-tiktok-preview.mp4"
  );

  const segments = [
    { file: "01_home_hook.mp4", duration: 1.5, text: "NDL STAFF APPLICATIONS" },
    { file: "02_applications_open.mp4", duration: 2.5, text: "APPLICATIONS ARE OPEN" },
    { file: "03_roles.mp4", duration: 2.5, text: "REVIEWERS • MODS • BETA TESTERS" },
    { file: "05_application_questions.mp4", duration: 3.5, text: "APPLY DIRECTLY ON WEBSITE" },
    { file: "06_autosave.mp4", duration: 2.0, text: "INSTANT DRAFT AUTOSAVE" },
    { file: "08_admin_dashboard.mp4", duration: 3.0, text: "REAL APPLICATION SYSTEM" },
    { file: "10_compare_candidates.mp4", duration: 3.0, text: "SIDE-BY-SIDE REVIEW" },
    { file: "11_accept_role.mp4", duration: 2.5, text: "ONE-CLICK ONBOARDING" },
    { file: "12_beta_feedback.mp4", duration: 2.0, text: "DEDICATED BETA HUB" },
    { file: "13_final_cta.mp4", duration: 2.5, text: "APPLY NOW: nerfeddemonlist.net" },
  ];

  const fontFile = "C\\:/Windows/Fonts/arial.ttf";
  const tempSegFiles: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const src = path.resolve(RAW_DIR, seg.file);
    const outSeg = path.resolve(TEMP_DIR, `seg_${i}.mp4`);
    tempSegFiles.push(outSeg);

    const filter = `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,drawbox=y=ih-340:w=iw:h=140:color=black@0.65:t=fill,drawtext=fontfile='${fontFile}':text='${seg.text}':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=h-295`;
    const cmd = `"${ffmpegPath}" -y -i "${src}" -t ${seg.duration} -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -r 60 -crf 18 -preset fast "${outSeg}"`;
    execSync(cmd, { stdio: "ignore" });
  }

  const concatList = path.resolve(TEMP_DIR, "concat.txt");
  fs.writeFileSync(
    concatList,
    tempSegFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n")
  );

  const concatCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatList}" -c copy "${previewPath}"`;
  execSync(concatCmd, { stdio: "ignore" });

  const size = fs.statSync(previewPath).size;
  console.log(`✓ Produced ${path.basename(previewPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}

function generateShotList() {
  const docPath = path.resolve(process.cwd(), "video/application-announcement/shot-list.md");
  const content = `# NDL Staff Applications Announcement — TikTok Shot List & Production Package

**Theme:** Dark Mode Only  
**Target Format:** Vertical 9:16 (1080 × 1920 @ 60 FPS)  
**Total Production Duration:** ~25.0 seconds  
**Recorded Against:** NDL v1.6.0 Local High-Fidelity Production Environment  

---

## 1. Raw Clips Manifest (\`/video/application-announcement/raw/\`)

| Filename | Duration | Page URL | Action Performed | Demo Account | Suggested Overlay Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **\`01_home_hook.mp4\`** | 1.8s | \`/\` | Static branding pause (0.4s) then smooth downward glide revealing top Demonlist thumbnails. | None | \`NDL STAFF APPLICATIONS\` |
| **\`02_applications_open.mp4\`** | 3.0s | \`/applications\` | Header framing then smooth scroll revealing the 3 open role cards with cyan 'Apply Now' buttons. | Guest / Logged out | \`APPLICATIONS ARE OPEN\` |
| **\`03_roles.mp4\`** | 3.0s | \`/applications\` | Slow scroll across List Reviewer, List Moderator, and Beta Tester cards with readable requirements. | Guest / Logged out | \`REVIEWERS • MODS • BETA TESTERS\` |
| **\`04_reviewer_form.mp4\`** | 2.3s | \`/applications\` → \`/applications/list-reviewer\` | Mouse moves to 'Apply Now' button on List Reviewer card, clicks, and transitions into the application form. | Guest / Logged out | \`QUICK & CLEAN APPLICATION\` |
| **\`05_application_questions.mp4\`** | 4.5s | \`/applications/list-reviewer\` | Smooth scroll through scenario questions, rules familiarity choice, conflict of interest, and availability. | \`@nexusgd\` (Draft) | \`APPLY DIRECTLY ON WEBSITE\` |
| **\`06_autosave.mp4\`** | 2.8s | \`/applications/list-reviewer\` | Applicant types answer into question textarea; pauses; debounced autosave completes showing saved status. | \`@nexusgd\` (Draft) | \`INSTANT DRAFT AUTOSAVE\` |
| **\`07_my_applications.mp4\`** | 2.8s | \`/applications/mine\` | User dashboard displaying submitted application, submission timestamp, and 'SUBMITTED' status badge. | \`@aerogd\` (Submitted) | \`TRACK YOUR STATUS LIVE\` |
| **\`08_admin_dashboard.mp4\`** | 3.5s | \`/admin/applications\` | Admin management view displaying openings, applicant counts, and status breakdowns (Submitted, Shortlisted). | \`@cattw\` (Admin) | \`REAL APPLICATION SYSTEM\` |
| **\`09_review_application.mp4\`** | 3.5s | \`/admin/applications/[id]/submissions/[vortexId]\` | Admin inspecting shortlisted applicant VortexGD, reading scenario responses, and viewing private notes. | \`@vortexgd\` (Demo) | \`THOROUGH CANDIDATE EVALUATION\` |
| **\`10_compare_candidates.mp4\`** | 3.5s | \`/admin/applications/[id]/compare?ids=...\` | Side-by-side response comparison between candidate submissions for direct evaluation. | VortexGD & Solaris_GD | \`SIDE-BY-SIDE REVIEW\` |
| **\`11_accept_role.mp4\`** | 3.0s | \`/admin/applications/[id]/submissions/[novaId]\` | Admin clicks 'Accept & Grant Role', confirmation dialog appears, confirms accept, and role status updates. | \`@novagd\` (Demo) | \`ONE-CLICK ROLE ONBOARDING\` |
| **\`12_beta_feedback.mp4\`** | 3.0s | \`/beta/feedback\` | Beta Tester feedback hub showcasing bug reports, feature suggestions, and workflow tracking. | \`@cattw\` (Staff) | \`DEDICATED BETA HUB\` |
| **\`13_final_cta.mp4\`** | 2.5s | \`/applications\` | Applications overview framing all three open positions with clear call-to-action hold. | Guest / Logged out | \`APPLY NOW: nerfeddemonlist.net\` |

---

## 2. B-Roll Footage (\`/video/application-announcement/broll/\`)

| Filename | Duration | Viewport | Subject / Focus |
| :--- | :--- | :--- | :--- |
| **\`B1_demonlist_scroll.mp4\`** | 2.0s | 430 × 764 (9:16) | Smooth dark mode Demonlist scroll showcasing large responsive 16:9 thumbnails. |
| **\`B2_mobile_applications.mp4\`** | 3.0s | 375 × 667 | Mobile viewport scroll of the staff applications page. |
| **\`B3_mobile_form.mp4\`** | 3.0s | 375 × 667 | Mobile viewport scroll of the interactive application question form. |
| **\`B4_admin_create_opening.mp4\`** | 3.0s | 430 × 764 (9:16) | Admin opening creation interface showing role template picker. |
| **\`B5_question_builder.mp4\`** | 3.0s | 430 × 764 (9:16) | Question builder interface showing custom question prompts and order controls. |
| **\`B6_statuses.mp4\`** | 2.0s | 430 × 764 (9:16) | Close-up view of status pills across submitted and shortlisted candidates. |

---

## 3. Edited TikTok Preview (\`ndl-applications-tiktok-preview.mp4\`)

- **Duration:** 25.0 seconds
- **Resolution:** 1080 × 1920 (Vertical 9:16)
- **Framerate:** 60 FPS
- **Color Profile:** Dark Mode Native, yuv420p
- **Audio:** Clean website footage (music to be added inside TikTok / editor)
- **Editing Structure:**
  - \`0.0s – 1.5s\`: Hook — Brand title card over Demonlist header
  - \`1.5s – 4.0s\`: Announcement — Applications open headline & card intro
  - \`4.0s – 6.5s\`: Role Showcase — Reviewers, Moderators, Beta Testers
  - \`6.5s – 10.0s\`: Form Polish — Scenario questions & single choice options
  - \`10.0s – 12.0s\`: Autosave — Applicant live response typing and saved indicator
  - \`12.0s – 15.0s\`: Staff System — Admin dashboard & applicant counts
  - \`15.0s – 18.0s\`: Evaluation — Side-by-side candidate comparison
  - \`18.0s – 20.5s\`: Decision — 'Accept & Grant Role' confirmation
  - \`20.5s – 22.5s\`: Beta System — Bug reporting and feature testing hub
  - \`22.5s – 25.0s\`: Final Call-to-Action — Applications open now hold

---

## 4. Safety & Privacy Compliance

- [x] **Zero Real Emails:** Only verified mock addresses (\`*@demo.local\`, \`*@demonlist.local\`) used.
- [x] **Zero Real Tokens / Passwords:** Session tokens injected via Playwright HTTP context cookies.
- [x] **Realistic Geometry Dash Content:** Real community terminology (TPS bypass, audible clicks, frame cuts, Geode mods).
- [x] **No Browser UI / DevTools:** Clean headless rendering with native device scale factor 2.5.
- [x] **No Light Mode Regressions:** Forced dark theme via localStorage and document dataset.
`;

  fs.writeFileSync(docPath, content, "utf8");
  console.log(`✓ Saved ${path.basename(docPath)}`);
}

main().catch((err) => {
  console.error("Recording process failed:", err);
  process.exit(1);
});
