import type { NextConfig } from "next";

function uploadBodySizeLimit() {
  const imageMb = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 5);
  const videoMb = Number(process.env.MAX_VIDEO_UPLOAD_MB ?? 100);
  const largestMb = Math.max(
    1,
    Number.isFinite(imageMb) ? imageMb : 5,
    Number.isFinite(videoMb) ? videoMb : 100,
  );

  return `${largestMb + 5}mb` as `${number}mb`;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: uploadBodySizeLimit(),
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 144, 176, 208, 224, 256, 288, 352, 384, 448],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com https://img.youtube.com https://i.ytimg.com https://cdn.discordapp.com https://www.google.com https://translate.google.com https://translate.googleapis.com",
      "media-src 'self' blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://translate.google.com",
      "frame-ancestors 'self'",
      "connect-src 'self' https://translate.googleapis.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
