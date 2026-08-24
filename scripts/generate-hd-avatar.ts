import sharp from "sharp";
import path from "node:path";

async function main() {
  const svg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080e1a" />
        <stop offset="50%" stop-color="#0c1a2e" />
        <stop offset="100%" stop-color="#050a14" />
      </linearGradient>

      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#0d9488" />
      </linearGradient>

      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0e304a" />
        <stop offset="100%" stop-color="#071b2b" />
      </linearGradient>

      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe" />
        <stop offset="100%" stop-color="#4facfe" />
      </linearGradient>

      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Circular / Rounded background with glow -->
    <rect width="512" height="512" fill="url(#bgGrad)" />

    <!-- Outer geometric frame -->
    <rect x="36" y="36" width="440" height="440" rx="96" fill="url(#cardGrad)" stroke="url(#glowGrad)" stroke-width="8" filter="url(#softGlow)" />
    <rect x="36" y="36" width="440" height="440" rx="96" fill="url(#cardGrad)" stroke="url(#glowGrad)" stroke-width="8" />

    <!-- Geometry Dash Grid Corner Accents -->
    <rect x="40" y="40" width="80" height="80" rx="20" fill="none" stroke="rgba(56, 189, 248, 0.4)" stroke-width="4" />
    <rect x="392" y="392" width="80" height="80" rx="20" fill="none" stroke="rgba(20, 184, 166, 0.4)" stroke-width="4" />

    <!-- Center Demon Horns / Crown Accent -->
    <path d="M 180 140 L 256 180 L 332 140 L 290 200 L 222 200 Z" fill="url(#accentGrad)" opacity="0.9" filter="url(#neonGlow)" />

    <!-- Main NDL Logo Text -->
    <text x="256" y="315"
          font-family="system-ui, -apple-system, sans-serif, 'Impact', 'Arial Black'"
          font-size="118"
          font-weight="900"
          letter-spacing="4"
          text-anchor="middle"
          fill="#ffffff"
          stroke="#050a14"
          stroke-width="12"
          paint-order="stroke fill"
          filter="url(#neonGlow)">
      NDL
    </text>

    <!-- Subtitle -->
    <text x="256" y="375"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="24"
          font-weight="800"
          letter-spacing="6"
          text-anchor="middle"
          fill="#38bdf8"
          opacity="0.95">
      NERFED DEMONLIST
    </text>

    <!-- Bottom Tech Dots -->
    <circle cx="216" cy="420" r="5" fill="#38bdf8" />
    <circle cx="256" cy="420" r="7" fill="#06b6d4" />
    <circle cx="296" cy="420" r="5" fill="#14b8a6" />
  </svg>
  `;

  const buffer = Buffer.from(svg);
  const outPath1 = path.join(process.cwd(), "public", "logo.png");
  const outPath2 = path.join(process.cwd(), "public", "icon.png");
  const outPath3 = path.join(process.cwd(), "src", "app", "icon.png");

  await sharp(buffer).resize(512, 512).png().toFile(outPath1);
  await sharp(buffer).resize(512, 512).png().toFile(outPath2);
  await sharp(buffer).resize(512, 512).png().toFile(outPath3);

  console.log("✅ Rendered HD 512x512 Avatar to public/logo.png, public/icon.png, and src/app/icon.png!");
}

main().catch(console.error);
