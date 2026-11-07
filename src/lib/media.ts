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
  "kocmoc-unleashed-uldm-nerfed": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed.png",
  "kocmoc-unleashed-uldm-nerfed-mpvcscja": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed-mpvcscja.jpg",
  "kocmoc-unleashed-uldm-nerfed-7x3f05ha": "/thumbnails/levels/kocmoc-unleashed-uldm-nerfed-7x3f05ha.jpg",
  "amethyst-nerfed": "/thumbnails/levels/amethyst-nerfed.jpg",
  "amethyst-nerfed-mpvnpo7d": "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg",
  "tidal-wave-easy": "/thumbnails/levels/tidal-wave-easy.png",
  "tidal-wave-easy-mpvo0bcx": "/thumbnails/levels/tidal-wave-easy-mpvo0bcx.jpg",
  "tidal-wave-easy-w1tpxm5v": "/thumbnails/levels/tidal-wave-easy-w1tpxm5v.jpg",
  "andromeda-nerfed": "/thumbnails/levels/andromeda-nerfed.jpg",
  "andromeda-nerfed-mtkf8vnq": "/thumbnails/levels/andromeda-nerfed-mtkf8vnq.jpg",
  "andromeda-nerfed-b6845j6m": "/thumbnails/levels/andromeda-nerfed-b6845j6m.jpg",
  "kocmoc-nerfed": "/thumbnails/levels/kocmoc-nerfed.png",
  "kocmoc-nerfed-mshyw58z": "/thumbnails/levels/kocmoc-nerfed-mshyw58z.jpg",
  "kocmoc-nerfed-6i8h1mka": "/thumbnails/levels/kocmoc-nerfed-6i8h1mka.jpg",
  "acheron-nerfed": "/thumbnails/levels/acheron-nerfed.png",
  "acheron-nerfed-mtaf0vwx": "/thumbnails/levels/acheron-nerfed-mtaf0vwx.jpg",
  "acheron-nerfed-1q14d33k": "/thumbnails/levels/acheron-nerfed-1q14d33k.jpg",
  "sakupen-circles-nerf": "/thumbnails/levels/sakupen-circles-nerf.png",
  "sakupen-circles-nerf-mt3akbcy": "/thumbnails/levels/sakupen-circles-nerf-mt3akbcy.jpg",
  "silent-clubstep": "/thumbnails/silent-clubstep-nerf.jpg",
  "silent-clubstep-nerf": "/thumbnails/silent-clubstep-nerf.jpg",
  "silent-clubstep-easy": "/thumbnails/levels/silent-clubstep-easy-sug4b11f.jpg",
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
  "grief": "/thumbnails/grief-ii.jpg",
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

  // Legacy fallback for old demo seed URLs
  if (trimmed.includes("demo-thumbnails-level-1-js5zoi")) {
    return "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg";
  }
  if (trimmed.includes("demo-thumbnails-level-1-ynxyj9")) {
    return "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg";
  }

  if (isValidThumbnailSource(trimmed)) {
    return trimmed;
  }

  return FALLBACK_THUMBNAIL_SRC;
}

export function resolveLevelThumbnail(
  slug?: string | null,
  name?: string | null,
  showcaseUrl?: string | null,
  thumbnailUrl?: string | null,
): string {
  // 1. If thumbnailUrl is provided and valid, prioritize the database value!
  if (thumbnailUrl && thumbnailUrl.trim()) {
    const trimmed = thumbnailUrl.trim();
    if (trimmed.includes("demo-thumbnails-level-1-js5zoi")) {
      return "/thumbnails/levels/amethyst-nerfed-mpvnpo7d.jpg";
    }
    if (trimmed.includes("demo-thumbnails-level-1-ynxyj9")) {
      return "/thumbnails/levels/boobawamba-nerfed-mpvoceeh.jpg";
    }
    if (isValidThumbnailSource(trimmed)) {
      return trimmed;
    }
  }

  // 2. Exact slug match in bundled local thumbnails (fallback when no valid thumbnailUrl in DB)
  if (slug && LEVEL_LOCAL_THUMBNAILS[slug]) {
    return LEVEL_LOCAL_THUMBNAILS[slug];
  }

  // 3. Keyword match on name / slug (fallback)
  const cleanKey = `${name || ""} ${slug || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [kw, localPath] of Object.entries(BLOB_THUMBNAIL_KEYWORD_MAP)) {
    const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanKey.includes(cleanKw)) {
      return localPath;
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
