import fs from "fs";
import path from "path";

const levels = [
  {
    rank: 1,
    slug: "kocmoc-unleashed-uldm-nerfed-mpvcscja",
    name: "Kocmoc Unleashed ULDM Nerfed",
    showcaseUrl: "https://www.tiktok.com/@cattw_gd/video/7645766642835655938?is_from_webapp=1&sender_device=pc",
    type: "tiktok",
  },
  {
    rank: 2,
    slug: "amethyst-nerfed-mpvnpo7d",
    name: "Amethyst Nerfed",
    showcaseUrl: "https://youtu.be/4FXfZip3tgQ",
    type: "youtube",
    youtubeId: "4FXfZip3tgQ",
  },
  {
    rank: 3,
    slug: "tidal-wave-easy-mpvo0bcx",
    name: "Tidal Wave Easy",
    showcaseUrl: "https://youtu.be/K0ZT4FMoNvo?list=RDK0ZT4FMoNvo",
    type: "youtube",
    youtubeId: "K0ZT4FMoNvo",
  },
  {
    rank: 4,
    slug: "andromeda-nerfed-mtkf8vnq",
    name: "Andromeda Nerfed",
    showcaseUrl: "https://medal.tv/games/geometry-dash/clips/nrGRI4K792z3Esew0?invite=cr-MSxVcmcsNTc2MDY2MzM2",
    type: "medal",
  },
  {
    rank: 5,
    slug: "kocmoc-nerfed-mshyw58z",
    name: "KOCMOC NERFED",
    showcaseUrl: "https://medal.tv/games/geometry-dash/clips/mIKdo8OSIezerNx_W?invite=cr-MSxCWTUsNTc2MDY2MzM2&v=108",
    type: "medal",
  },
  {
    rank: 6,
    slug: "acheron-nerfed-mtaf0vwx",
    name: "Acheron Nerfed",
    showcaseUrl: "https://medal.tv/games/geometry-dash/clips/nuYXGrqWnF-ipai9V?invite=cr-MSx0YWwsNTc2MDY2MzM2",
    type: "medal",
  },
  {
    rank: 7,
    slug: "sakupen-circles-nerf-mt3akbcy",
    name: "Sakupen Circles Nerf",
    showcaseUrl: "https://medal.tv/games/geometry-dash/clips/ncLvRyHq6p8CWzkWM?invite=cr-MSxZTmUsNTc2MDY2MzM2",
    type: "medal",
  },
  {
    rank: 8,
    slug: "silent-clubstep-easy-mt90m89e",
    name: "silent clubstep easy",
    showcaseUrl: "https://www.youtube.com/watch?v=K0dgE2ICa-w",
    type: "youtube",
    youtubeId: "K0dgE2ICa-w",
  },
  {
    rank: 9,
    slug: "nerfed-sakupen-hell-mt7k1g21",
    name: "Nerfed Sakupen Hell",
    showcaseUrl: "https://www.youtube.com/watch?v=Z5T7l6NTQwo",
    type: "youtube",
    youtubeId: "Z5T7l6NTQwo",
  },
  {
    rank: 10,
    slug: "thinking-space-ii-easy-mpvnhe2z",
    name: "Thinking Space II Easy",
    showcaseUrl: "https://youtu.be/piCzVYS2Zm4",
    type: "youtube",
    youtubeId: "piCzVYS2Zm4",
  },
  {
    rank: 11,
    slug: "boobawamba-nerfed-mpvoceeh",
    name: "BOOBAWAMBA Nerfed",
    showcaseUrl: "https://youtu.be/sj22eAqjJoY?list=RDsj22eAqjJoY",
    type: "youtube",
    youtubeId: "sj22eAqjJoY",
  },
  {
    rank: 12,
    slug: "nerfed-cataclysm-mshyd42i",
    name: "Nerfed Cataclysm",
    showcaseUrl: "https://youtu.be/hjdkeXOAjs4",
    type: "youtube",
    youtubeId: "hjdkeXOAjs4",
  },
];

async function resolveImageUrl(level) {
  if (level.type === "youtube") {
    // Try maxresdefault first, fallback to hqdefault
    const maxres = `https://i.ytimg.com/vi/${level.youtubeId}/maxresdefault.jpg`;
    const res = await fetch(maxres, { method: "HEAD" });
    if (res.ok) return maxres;
    return `https://i.ytimg.com/vi/${level.youtubeId}/hqdefault.jpg`;
  }

  if (level.type === "medal") {
    const oembedUrl = `https://medal.tv/api/oembed?url=${encodeURIComponent(level.showcaseUrl.split("?")[0])}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail_url) return data.thumbnail_url;
    }
  }

  if (level.type === "tiktok") {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(level.showcaseUrl.split("?")[0])}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail_url) return data.thumbnail_url;
    }
  }

  return null;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  const targetDir = path.resolve("public/thumbnails/levels");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting thumbnail downloads for ${levels.length} levels...`);

  for (const level of levels) {
    const dest = path.join(targetDir, `${level.slug}.jpg`);
    try {
      console.log(`[#${level.rank}] Resolving thumbnail for ${level.name}...`);
      const imgUrl = await resolveImageUrl(level);
      if (!imgUrl) {
        console.error(`  ❌ Failed to resolve image URL for ${level.name}`);
        continue;
      }
      console.log(`  Downloading from: ${imgUrl}`);
      await downloadImage(imgUrl, dest);
      const size = fs.statSync(dest).size;
      console.log(`  ✅ Saved: ${dest} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ❌ Error downloading ${level.name}:`, err.message);
    }
  }

  console.log("\nFinished downloading all thumbnails!");
}

main().catch(console.error);
