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
  experimental: {
    serverActions: {
      bodySizeLimit: uploadBodySizeLimit(),
    },
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
