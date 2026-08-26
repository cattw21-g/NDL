import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function createOgImage() {
  const logoBuffer = fs.readFileSync(path.resolve('public/logo.png'));
  const logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');

  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#080b12" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#050811" />
      </linearGradient>
      
      <radialGradient id="purpleGlow" cx="20%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="cyanGlow" cx="85%" cy="70%" r="50%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
      </radialGradient>

      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.2" />
      </pattern>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#e0e7ff" />
        <stop offset="100%" stop-color="#a5b4fc" />
      </linearGradient>

      <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.6" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#purpleGlow)" />
    <rect width="1200" height="630" fill="url(#cyanGlow)" />
    <rect width="1200" height="630" fill="url(#grid)" />

    <!-- Outer Frame Glow -->
    <rect x="24" y="24" width="1152" height="582" rx="24" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

    <!-- Logo Glow and Image -->
    <g transform="translate(80, 165)">
      <circle cx="150" cy="150" r="130" fill="#6366f1" fill-opacity="0.15" filter="url(#glow)" />
      <circle cx="150" cy="150" r="120" fill="#0f172a" stroke="#4f46e5" stroke-width="3" stroke-opacity="0.8" />
      <image href="${logoBase64}" x="45" y="45" width="210" height="210" />
    </g>

    <!-- Text Group -->
    <g transform="translate(420, 150)">
      <!-- Badge -->
      <g transform="translate(0, 20)">
        <rect width="310" height="40" rx="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />
        <text x="155" y="25" fill="#a5b4fc" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle" letter-spacing="1.5">GEOMETRY DASH COMMUNITY</text>
      </g>

      <!-- Main Title -->
      <text x="0" y="130" fill="url(#textGrad)" font-family="sans-serif" font-size="64" font-weight="900" letter-spacing="-1">NERFED DEMONLIST</text>
      
      <!-- Subtitle -->
      <text x="0" y="185" fill="#94a3b8" font-family="sans-serif" font-size="24" font-weight="500">The Official Community Leaderboard for Nerfed Demons</text>

      <!-- Pill Badges -->
      <g transform="translate(0, 235)">
        <!-- Pill 1 -->
        <rect x="0" y="0" width="190" height="44" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
        <text x="95" y="27" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">🔥 Ranked Demons</text>

        <!-- Pill 2 -->
        <rect x="205" y="0" width="210" height="44" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
        <text x="310" y="27" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">🏆 Player Rankings</text>

        <!-- Pill 3 -->
        <rect x="430" y="0" width="220" height="44" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
        <text x="540" y="27" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">✅ Verified Records</text>
      </g>
    </g>

    <!-- Footer URL -->
    <g transform="translate(80, 560)">
      <text x="0" y="0" fill="#64748b" font-family="sans-serif" font-size="18" font-weight="600">nerfeddemonlist.net</text>
      <text x="1040" y="0" fill="#6366f1" font-family="sans-serif" font-size="18" font-weight="700" text-anchor="end">1,000-Point Standard</text>
    </g>
  </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 100 }).toBuffer();
  fs.writeFileSync(path.resolve('public/og-image.png'), pngBuffer);
  fs.writeFileSync(path.resolve('public/twitter-image.png'), pngBuffer);
  fs.writeFileSync(path.resolve('src/app/opengraph-image.png'), pngBuffer);
  fs.writeFileSync(path.resolve('src/app/twitter-image.png'), pngBuffer);
  console.log('Successfully generated og-image.png (1200x630)!');
}

createOgImage().catch(console.error);
