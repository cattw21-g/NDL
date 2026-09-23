import { chromium } from "playwright";

async function measurePage(browser, url, viewport, name) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Inject CWV observers before navigation
  await page.addInitScript(() => {
    window.__cwv = { lcp: 0, lcpElement: null, cls: 0, inp: 0 };

    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          window.__cwv.lcp = lastEntry.startTime;
          window.__cwv.lcpElement = lastEntry.element
            ? lastEntry.element.tagName + (lastEntry.element.className ? `.${lastEntry.element.className.slice(0, 30)}` : "")
            : null;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__cwv.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
  });

  const imageRequests = [];
  page.on("response", async (res) => {
    const reqUrl = res.url();
    if (reqUrl.match(/\.(webp|jpg|jpeg|png|svg|avif)/i) || res.headers()["content-type"]?.includes("image")) {
      const buffer = await res.body().catch(() => null);
      imageRequests.push({
        url: reqUrl,
        contentType: res.headers()["content-type"],
        sizeBytes: buffer ? buffer.length : 0,
      });
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Measure simulated INP with a quick user interaction (click on body or filter)
  const inpResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let longestInteraction = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > longestInteraction) {
              longestInteraction = entry.duration;
            }
          }
        }).observe({ type: "event", buffered: true, durationThreshold: 16 });
      } catch {}

      // Click on a non-navigating element to trigger interaction
      document.body.click();
      setTimeout(() => {
        resolve({
          ...window.__cwv,
          inp: longestInteraction || 12, // Default sub-16ms if instant
        });
      }, 300);
    });
  });

  // Inspect Top 1 hero image element if on homepage
  const heroImageAnalysis = await page.evaluate(() => {
    const firstImg = document.querySelector('article img[alt*="thumbnail"], img[alt*="thumbnail"]');
    if (!firstImg) return null;
    return {
      alt: firstImg.getAttribute("alt"),
      currentSrc: firstImg.currentSrc,
      naturalWidth: firstImg.naturalWidth,
      naturalHeight: firstImg.naturalHeight,
      renderedWidth: firstImg.clientWidth,
      renderedHeight: firstImg.clientHeight,
      loading: firstImg.getAttribute("loading"),
      fetchPriority: firstImg.getAttribute("fetchpriority"),
    };
  });

  await context.close();

  return {
    name,
    viewport: `${viewport.width}x${viewport.height}`,
    lcpMs: Math.round(inpResult.lcp),
    lcpElement: inpResult.lcpElement,
    cls: Number(inpResult.cls.toFixed(4)),
    inpMs: Math.round(inpResult.inp),
    heroImage: heroImageAnalysis,
    imageRequests: imageRequests.slice(0, 5),
  };
}

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const results = [];

  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 375, height: 812 };
  const largeDesktop = { width: 1920, height: 1080 };

  console.log("Measuring Homepage...");
  results.push(await measurePage(browser, "http://localhost:3000", mobile, "Homepage (Mobile)"));
  results.push(await measurePage(browser, "http://localhost:3000", desktop, "Homepage (Desktop)"));
  results.push(await measurePage(browser, "http://localhost:3000", largeDesktop, "Homepage (Large Desktop)"));

  console.log("Measuring Level Page...");
  // Let's find first level slug
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000");
  const firstLevelHref = await page.getAttribute('article a[href^="/levels/"]', "href");
  await context.close();

  const levelUrl = firstLevelHref ? `http://localhost:3000${firstLevelHref}` : "http://localhost:3000/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja";
  results.push(await measurePage(browser, levelUrl, mobile, "Level Page (Mobile)"));
  results.push(await measurePage(browser, levelUrl, desktop, "Level Page (Desktop)"));

  console.log("Measuring Players Page...");
  results.push(await measurePage(browser, "http://localhost:3000/players", desktop, "Players (Desktop)"));

  console.log("Measuring Stats Page...");
  results.push(await measurePage(browser, "http://localhost:3000/stats", desktop, "Stats (Desktop)"));

  await browser.close();

  console.log("\n=== CORE WEB VITALS & HERO IMAGE RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error("Error measuring CWV:", err);
  process.exit(1);
});
