import { chromium } from "playwright";
import fs from "fs";

async function measureViewport(browser, { width, height, dpr = 1, name }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();

  // Performance observer for LCP
  await page.addInitScript(() => {
    window.__cwv = { lcp: 0, lcpElement: null };
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          window.__cwv.lcp = lastEntry.startTime;
          window.__cwv.lcpElement = lastEntry.element ? lastEntry.element.tagName : null;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
  });

  const responses = [];
  page.on("response", async (res) => {
    const url = res.url();
    const headers = res.headers();
    const contentType = headers["content-type"] || "";
    const buffer = await res.body().catch(() => null);
    responses.push({
      url,
      status: res.status(),
      contentType,
      sizeBytes: buffer ? buffer.length : 0,
      isImage: contentType.includes("image") || url.match(/\.(webp|avif|jpg|jpeg|png|svg)/i),
    });
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Inspect the Rank #1 card and image
  const imageInfo = await page.evaluate(() => {
    // Find the first level card's thumbnail
    const firstCard = document.querySelector("article");
    const img = firstCard ? firstCard.querySelector("img") : null;
    if (!img) return null;

    const rect = img.getBoundingClientRect();
    return {
      alt: img.getAttribute("alt"),
      currentSrc: img.currentSrc,
      srcAttr: img.getAttribute("src"),
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      loading: img.getAttribute("loading"),
      fetchPriority: img.getAttribute("fetchpriority"),
      sizes: img.getAttribute("sizes"),
      isLazy: img.getAttribute("loading") === "lazy",
    };
  });

  // Check how many images total are on page vs how many were loaded
  const countStats = await page.evaluate(() => {
    const allImages = Array.from(document.querySelectorAll("article img"));
    const completeCount = allImages.filter((img) => img.complete && img.naturalWidth > 0).length;
    return {
      totalCards: allImages.length,
      loadedCards: completeCount,
    };
  });

  const lcpData = await page.evaluate(() => window.__cwv);

  // Take screenshot of Rank #1 card for visual inspection
  if (name === "1440px_dpr1") {
    const cardHandle = await page.$("article");
    if (cardHandle) {
      await cardHandle.screenshot({ path: "rank1-card-desktop.png" });
    }
  }

  await context.close();

  // Find network response for rank #1 image
  const rank1Response = responses.find((r) => {
    if (!imageInfo?.currentSrc) return false;
    return r.url === imageInfo.currentSrc || (imageInfo.currentSrc.includes("/_next/image") && r.url.includes("/_next/image"));
  });

  const totalImageBytes = responses
    .filter((r) => r.isImage)
    .reduce((sum, r) => sum + r.sizeBytes, 0);

  const totalPageBytes = responses.reduce((sum, r) => sum + r.sizeBytes, 0);

  return {
    name,
    viewport: `${width}x${height} @ ${dpr}x`,
    imageInfo,
    rank1Response: rank1Response
      ? {
          url: rank1Response.url,
          contentType: rank1Response.contentType,
          sizeBytes: rank1Response.sizeBytes,
        }
      : null,
    totalImageBytes,
    totalPageBytes,
    countStats,
    lcpMs: Math.round(lcpData.lcp),
  };
}

async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  try {
    const viewports = [
      { width: 375, height: 812, dpr: 1, name: "375px_mobile_dpr1" },
      { width: 1440, height: 900, dpr: 1, name: "1440px_desktop_dpr1" },
      { width: 1920, height: 1080, dpr: 1, name: "1920px_desktop_dpr1" },
      { width: 1440, height: 900, dpr: 2, name: "1440px_desktop_dpr2" },
      { width: 375, height: 812, dpr: 2, name: "375px_mobile_dpr2" },
    ];

    const results = [];
    for (const vp of viewports) {
      const res = await measureViewport(browser, vp);
      results.push(res);
      console.log(`\n=== Viewport: ${res.viewport} (${res.name}) ===`);
      console.log(`Rendered: ${res.imageInfo?.renderedWidth} x ${res.imageInfo?.renderedHeight} px`);
      console.log(`Natural/Generated: ${res.imageInfo?.naturalWidth} x ${res.imageInfo?.naturalHeight} px`);
      console.log(`CurrentSrc: ${res.imageInfo?.currentSrc}`);
      console.log(`Response Content-Type: ${res.rank1Response?.contentType}`);
      console.log(`Response Size: ${res.rank1Response?.sizeBytes} bytes (${(res.rank1Response?.sizeBytes / 1024).toFixed(1)} KB)`);
      console.log(`Total Initial Image Transfer: ${(res.totalImageBytes / 1024).toFixed(1)} KB`);
      console.log(`Total Page Transfer: ${(res.totalPageBytes / 1024).toFixed(1)} KB`);
      console.log(`Total Cards: ${res.countStats.totalCards}, Loaded: ${res.countStats.loadedCards}`);
      console.log(`LCP: ${res.lcpMs} ms`);
    }

    // Measure level detail hero as well
    console.log("\n=== Level Detail Hero Test (/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja or fallback) ===");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const heroResponses = [];
    page.on("response", async (res) => {
      const url = res.url();
      const contentType = res.headers()["content-type"] || "";
      const buffer = await res.body().catch(() => null);
      heroResponses.push({ url, contentType, sizeBytes: buffer ? buffer.length : 0 });
    });
    // First try a ranked slug, e.g. silent-clubstep
    await page.goto("http://localhost:3000/levels/silent-clubstep", { waitUntil: "networkidle" });
    const heroInfo = await page.evaluate(() => {
      const img = document.querySelector("section img, div[class*='aspect-video'] img");
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      return {
        currentSrc: img.currentSrc,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      };
    });
    const heroRes = heroResponses.find((r) => r.url === heroInfo?.currentSrc || (heroInfo?.currentSrc.includes("/_next/image") && r.url.includes("/_next/image")));
    console.log(`Hero Rendered: ${heroInfo?.renderedWidth} x ${heroInfo?.renderedHeight} px`);
    console.log(`Hero Natural: ${heroInfo?.naturalWidth} x ${heroInfo?.naturalHeight} px`);
    console.log(`Hero Request: ${heroInfo?.currentSrc}`);
    console.log(`Hero Size: ${heroRes?.sizeBytes} bytes (${((heroRes?.sizeBytes || 0) / 1024).toFixed(1)} KB)`);
    await context.close();

    fs.writeFileSync("image-delivery-results.json", JSON.stringify({ results, heroInfo, heroRes }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
