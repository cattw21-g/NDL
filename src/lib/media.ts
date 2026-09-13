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

  if (!isValidThumbnailSource(trimmed)) {
    return FALLBACK_THUMBNAIL_SRC;
  }

  return trimmed;
}

const UPCOMING_LOCAL_THUMBNAILS: Record<string, string> = {
  nerfbath: "/thumbnails/nerfbath.jpg",
  sakupencircles: "/thumbnails/sakupen-circles-v.jpg",
  lockedtidalheaven: "/thumbnails/locked-tidal-heaven.jpg",
  solarflare: "/thumbnails/solar-flare-ii.jpg",
  silentclubstep: "/thumbnails/silent-clubstep-nerf.jpg",
};

export function resolveUpcomingThumbnail(
  slug?: string | null,
  name?: string | null,
  showcaseUrl?: string | null,
  thumbnailUrl?: string | null,
): string {
  const cleanKey = ((name || "") + " " + (slug || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, path] of Object.entries(UPCOMING_LOCAL_THUMBNAILS)) {
    if (cleanKey.includes(key)) {
      return path;
    }
  }

  if (thumbnailUrl && thumbnailUrl.trim() && !thumbnailUrl.includes("blob.vercel-storage.com")) {
    return thumbnailUrl.trim();
  }

  if (showcaseUrl) {
    const ytMatch =
      showcaseUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?.*v=))([\w-]{11})/i,
      ) || showcaseUrl.match(/[?&]v=([\w-]{11})/i);
    if (ytMatch) {
      return `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
  }

  return thumbnailUrl?.trim() || FALLBACK_THUMBNAIL_SRC;
}

