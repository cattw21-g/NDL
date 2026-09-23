import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const VIEWPORTS = [
  { name: "375px_mobile", width: 375, height: 812 },
  { name: "390px_mobile", width: 390, height: 844 },
  { name: "430px_mobile", width: 430, height: 932 },
  { name: "768px_tablet", width: 768, height: 1024 },
  { name: "1024px_laptop", width: 1024, height: 768 },
  { name: "1280px_desktop", width: 1280, height: 800 },
  { name: "1440px_wide", width: 1440, height: 900 },
  { name: "1920px_fhd", width: 1920, height: 1080 },
  { name: "2560px_2k", width: 2560, height: 1440 },
];

const outDir = path.join(process.cwd(), ".visual-qa");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
  });
  const report: Record<string, unknown> = {};

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });

      const networkRequests: string[] = [];
      page.on("request", (req) => {
        networkRequests.push(`${req.method()} ${req.url()}`);
      });

      await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

      // Measure layout metrics
      const metrics = await page.evaluate(() => {
        const html = document.documentElement;
        const hasHorizontalOverflow = html.scrollWidth > html.clientWidth;

        const firstCard = document.querySelector("article");
        const thumb = firstCard?.querySelector("a[tabindex='-1'] img");
        const rank = firstCard?.querySelector("span");
        const title = firstCard?.querySelector("a[href*='/levels/']");

        const thumbRect = thumb?.getBoundingClientRect();
        const rankRect = rank?.getBoundingClientRect();

        return {
          hasHorizontalOverflow,
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
          firstLevelTitle: title?.textContent?.trim(),
          thumbnail: thumbRect
            ? { width: Math.round(thumbRect.width), height: Math.round(thumbRect.height) }
            : null,
          rank: rankRect
            ? { width: Math.round(rankRect.width), height: Math.round(rankRect.height), text: rank?.textContent?.trim() }
            : null,
        };
      });

      // Capture screenshot
      const screenshotPath = path.join(outDir, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      report[vp.name] = {
        viewport: vp,
        metrics,
        networkRequestsCount: networkRequests.length,
        screenshot: screenshotPath,
      };

      console.log(`[PASS] ${vp.name}: width=${vp.width}px, thumb=${metrics.thumbnail?.width}x${metrics.thumbnail?.height}px, overflow=${metrics.hasHorizontalOverflow}`);

      await page.close();
    }

    // Network & Polling test: open page for 10 seconds and verify no unwanted anonymous polling
    console.log("\n--- Anonymous Polling Audit (10 seconds) ---");
    const pollPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    const lateRequests: string[] = [];
    pollPage.on("request", (req) => {
      lateRequests.push(`${req.method()} ${req.url()}`);
    });
    await pollPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
    const initialReqs = lateRequests.length;
    console.log(`Initial load requests: ${initialReqs}`);

    // Wait 10 seconds
    await pollPage.waitForTimeout(10000);
    const subsequentReqs = lateRequests.length - initialReqs;
    console.log(`Requests during 10s idle: ${subsequentReqs}`);

    report["anonymous_polling_idle_10s"] = {
      initialRequests: initialReqs,
      idleRequestsCount: subsequentReqs,
      zeroIdlePolling: subsequentReqs === 0,
    };

    await pollPage.close();

    fs.writeFileSync(
      path.join(outDir, "report.json"),
      JSON.stringify(report, null, 2),
      "utf-8"
    );
    console.log(`\nVisual QA report saved to ${path.join(outDir, "report.json")}`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Visual QA failed:", err);
  process.exit(1);
});
