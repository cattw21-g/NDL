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
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
