import { chromium } from "playwright";
import path from "node:path";

const VIEWPORTS = [
  { name: "375px_cards", width: 375, height: 900 },
  { name: "390px_cards", width: 390, height: 900 },
  { name: "768px_cards", width: 768, height: 900 },
  { name: "1280px_cards", width: 1280, height: 900 },
  { name: "1440px_cards", width: 1440, height: 900 },
];

const outDir = path.join(process.cwd(), ".visual-qa");

async function run() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
  });

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });

      await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

      // Scroll into view of the first level card
      const firstCard = page.locator("article").first();
      await firstCard.scrollIntoViewIfNeeded();

      const screenshotPath = path.join(outDir, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log(`Captured ${vp.name} to ${screenshotPath}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
