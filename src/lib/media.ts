export const FALLBACK_THUMBNAIL_SRC = "/thumbnails/fallback.svg";

export const imageExtensionPattern = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
export const uploadImageExtensionPattern = /\.(jpe?g|png|webp)$/i;
export const videoExtensionPattern = /\.mp4$/i;

export function isGoogleImagesPage(url: URL) {
  const hostname = url.hostname.toLowerCase();

  return (
    hostname.includes("google.") &&
    (url.pathname === "/search" ||
      url.pathname === "/imgres" ||
      url.searchParams.get("tbm") === "isch" ||
      url.searchParams.get("udm") === "2")
  );
}

export function isValidPublicImagePath(value: string) {
  const path = value.split("?")[0] ?? "";

  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    imageExtensionPattern.test(path)
  );
}

export function isValidRemoteImageUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !isGoogleImagesPage(url) &&
      !value.includes("\\") &&
      imageExtensionPattern.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function isValidThumbnailSource(value: string) {
  const trimmed = value.trim();

  return (
    isValidPublicImagePath(trimmed) ||
    isValidRemoteImageUrl(trimmed)
  );
}

export function isValidObjectPreviewUrl(value: string) {
  return value.trim().startsWith("blob:");
}

export function isValidPublicUploadMediaPath(value: string) {
  const path = value.split("?")[0] ?? "";

  return (
    value.startsWith("/uploads/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    (imageExtensionPattern.test(path) || videoExtensionPattern.test(path))
  );
}

export const LEVEL_LOCAL_THUMBNAILS: Record<string, string> = {
  // Ranked Demons (#1 - #12)
  "kocmoc-unleashed-uldm-nerfed-mpvcscja": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja.jpg",
  "amethyst-nerfed-mpvnpo7d": "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg",
  "tidal-wave-easy-mpvo0bcx": "/thumbnails/levels/tidal-wave-easy-mpvo0bcx.jpg",
  "andromeda-nerfed-mtkf8vnq": "/thumbnails/levels/andromeda-nerfed-mtkf8vnq.jpg",
  "kocmoc-nerfed-mshyw58z": "/thumbnails/levels/kocmoc-nerfed-mshyw58z.jpg",
  "acheron-nerfed-mtaf0vwx": "/thumbnails/levels/acheron-nerfed-mtaf0vwx.jpg",
  "sakupen-circles-nerf-mt3akbcy": "/thumbnails/levels/sakupen-circles-nerf-mt3akbcy.jpg",
  "silent-clubstep-easy-mt90m89e": "/thumbnails/levels/silent-clubstep-easy-mt90m89e.jpg",
  "nerfed-sakupen-hell-mt7k1g21": "/thumbnails/levels/nerfed-sakupen-hell-mt7k1g21.jpg",
  "thinking-space-ii-easy-mpvnhe2z": "/thumbnails/levels/thinking-space-ii-easy-mpvnhe2z.jpg",
  "boobawamba-nerfed-mpvoceeh": "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg",
  "nerfed-cataclysm-mshyd42i": "/thumbnails/levels/nerfed-cataclysm-mshyd42i.jpg",

  // Upcoming Demons
  "nerfbath": "/thumbnails/nerfbath.jpg",
  "nerfbath-mt3d7p0f": "/thumbnails/nerfbath.jpg",
  "sakupen-circles-v": "/thumbnails/sakupen-circles-v.jpg",
  "sakupen-circles-v-mt3bg2s3": "/thumbnails/sakupen-circles-v.jpg",
  "locked-tidal-heaven": "/thumbnails/locked-tidal-heaven.jpg",
  "locked-tidal-heaven-mt3bg213": "/thumbnails/locked-tidal-heaven.jpg",
  "solar-flare-ii": "/thumbnails/solar-flare-ii.jpg",
  "solar-flare-ii-mt3bg18q": "/thumbnails/solar-flare-ii.jpg",
  "silent-clubstep": "/thumbnails/silent-clubstep-nerf.jpg",
  "silent-clubstep-nerf": "/thumbnails/silent-clubstep-nerf.jpg",
};

export const BLOB_THUMBNAIL_KEYWORD_MAP: Record<string, string> = {
  "kocmoc-unleashed": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja.jpg",
  "kocmoc_unleashed": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja.jpg",
  "amethyst": "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg",
  "tidal-wave": "/thumbnails/levels/tidal-wave-easy-mpvo0bcx.jpg",
  "tidal_wave": "/thumbnails/levels/tidal-wave-easy-mpvo0bcx.jpg",
  "andromeda": "/thumbnails/levels/andromeda-nerfed-mtkf8vnq.jpg",
  "kocmoc-nerfed": "/thumbnails/levels/kocmoc-nerfed-mshyw58z.jpg",
  "kocmoc_nerfed": "/thumbnails/levels/kocmoc-nerfed-mshyw58z.jpg",
  "acheron": "/thumbnails/levels/acheron-nerfed-mtaf0vwx.jpg",
  "sakupen-circles-nerf": "/thumbnails/levels/sakupen-circles-nerf-mt3akbcy.jpg",
  "sakupen_circles_nerf": "/thumbnails/levels/sakupen-circles-nerf-mt3akbcy.jpg",
  "sakupen-circles": "/thumbnails/sakupen-circles-v.jpg",
  "silent-clubstep-easy": "/thumbnails/levels/silent-clubstep-easy-mt90m89e.jpg",
  "silent_clubstep_easy": "/thumbnails/levels/silent-clubstep-easy-mt90m89e.jpg",
  "silent-clubstep": "/thumbnails/silent-clubstep-nerf.jpg",
  "sakupen-hell": "/thumbnails/levels/nerfed-sakupen-hell-mt7k1g21.jpg",
  "sakupen_hell": "/thumbnails/levels/nerfed-sakupen-hell-mt7k1g21.jpg",
  "thinking-space": "/thumbnails/levels/thinking-space-ii-easy-mpvnhe2z.jpg",
  "thinking_space": "/thumbnails/levels/thinking-space-ii-easy-mpvnhe2z.jpg",
  "boobawamba": "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg",
  "cataclysm": "/thumbnails/levels/nerfed-cataclysm-mshyd42i.jpg",
  "nerfbath": "/thumbnails/nerfbath.jpg",
  "locked-tidal": "/thumbnails/locked-tidal-heaven.jpg",
  "solar-flare": "/thumbnails/solar-flare-ii.jpg",
};

export function extractYouTubeThumbnail(url?: string | null): string | null {
  if (!url) return null;
  const match =
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?.*v=))([\w-]{11})/i,
    ) || url.match(/[?&]v=([\w-]{11})/i);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function safeThumbnailSrc(
  value: string | null | undefined,
  options: { allowObjectUrl?: boolean } = {},
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return FALLBACK_THUMBNAIL_SRC;
  }

  if (options.allowObjectUrl && isValidObjectPreviewUrl(trimmed)) {
    return trimmed;
  }

  // Intercept suspended Vercel blob store URLs and map them to local thumbnails!
  if (trimmed.includes("blob.vercel-storage.com")) {
    const lowerUrl = trimmed.toLowerCase();
    for (const [kw, localPath] of Object.entries(BLOB_THUMBNAIL_KEYWORD_MAP)) {
      if (lowerUrl.includes(kw.toLowerCase())) {
        return localPath;
      }
    }
    if (lowerUrl.includes("demo-thumbnails-level-1-js5zoi")) {
      return "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg";
    }
    if (lowerUrl.includes("demo-thumbnails-level-1-ynxyj9")) {
      return "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg";
    }
    return FALLBACK_THUMBNAIL_SRC;
  }

  if (!isValidThumbnailSource(trimmed)) {
    return FALLBACK_THUMBNAIL_SRC;
  }

  return trimmed;
}

export function resolveLevelThumbnail(
  slug?: string | null,
  name?: string | null,
  showcaseUrl?: string | null,
  thumbnailUrl?: string | null,
): string {
  // 1. Exact slug match in bundled local thumbnails
  if (slug && LEVEL_LOCAL_THUMBNAILS[slug]) {
    return LEVEL_LOCAL_THUMBNAILS[slug];
  }

  // 2. Keyword match on name / slug
  const cleanKey = `${name || ""} ${slug || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [kw, localPath] of Object.entries(BLOB_THUMBNAIL_KEYWORD_MAP)) {
    const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanKey.includes(cleanKw)) {
      return localPath;
    }
  }

  // 3. If thumbnailUrl is provided:
  if (thumbnailUrl && thumbnailUrl.trim()) {
    const trimmed = thumbnailUrl.trim();
    if (trimmed.includes("blob.vercel-storage.com")) {
      const lowerUrl = trimmed.toLowerCase();
      for (const [kw, localPath] of Object.entries(BLOB_THUMBNAIL_KEYWORD_MAP)) {
        if (lowerUrl.includes(kw.toLowerCase())) {
          return localPath;
        }
      }
      if (lowerUrl.includes("demo-thumbnails-level-1-js5zoi")) {
        return "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg";
      }
      if (lowerUrl.includes("demo-thumbnails-level-1-ynxyj9")) {
        return "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg";
      }
    } else {
      return trimmed;
    }
  }

  // 4. Fallback to YouTube showcase
  const yt = extractYouTubeThumbnail(showcaseUrl);
  if (yt) {
    return yt;
  }

  return FALLBACK_THUMBNAIL_SRC;
}

export const resolveUpcomingThumbnail = resolveLevelThumbnail;


