import { uploadImageExtensionPattern } from "./media";

export const thumbnailUploadContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type ThumbnailUploadCandidate = {
  name: string;
  type: string;
  size: number;
};

export function thumbnailExtensionForFile(
  file: Pick<ThumbnailUploadCandidate, "name" | "type">,
) {
  const name = file.name.toLowerCase();

  if (file.type === "image/png" || name.endsWith(".png")) {
    return ".png";
  }

  if (
    file.type === "image/jpeg" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return ".jpg";
  }

  if (file.type === "image/webp" || name.endsWith(".webp")) {
    return ".webp";
  }

  return null;
}

export function validateThumbnailUploadCandidate(
  file: ThumbnailUploadCandidate,
  maxBytes: number,
) {
  if (!thumbnailExtensionForFile(file)) {
    return "Upload a PNG, JPG, or WebP image.";
  }

  if (file.size > maxBytes) {
    return `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`;
  }

  return null;
}

export function blobThumbnailPathname(
  nameHint: string,
  file: Pick<ThumbnailUploadCandidate, "name" | "type">,
) {
  return blobThumbnailPathnameForPrefix("thumbnails", nameHint, file);
}

export function isValidBlobThumbnailPathname(pathname: string) {
  return isValidBlobThumbnailPathnameForPrefix(pathname, "thumbnails");
}

export function suggestionBlobThumbnailPathname(
  nameHint: string,
  file: Pick<ThumbnailUploadCandidate, "name" | "type">,
) {
  return blobThumbnailPathnameForPrefix("suggestion-thumbnails", nameHint, file);
}

export function isValidSuggestionBlobThumbnailPathname(pathname: string) {
  return isValidBlobThumbnailPathnameForPrefix(
    pathname,
    "suggestion-thumbnails",
  );
}

function blobThumbnailPathnameForPrefix(
  prefix: "thumbnails" | "suggestion-thumbnails",
  nameHint: string,
  file: Pick<ThumbnailUploadCandidate, "name" | "type">,
) {
  const extension = thumbnailExtensionForFile(file) ?? ".png";
  return `${prefix}/${safeUploadSlug(nameHint || file.name)}${extension}`;
}

function isValidBlobThumbnailPathnameForPrefix(
  pathname: string,
  prefix: "thumbnails" | "suggestion-thumbnails",
) {
  return (
    pathname.startsWith(`${prefix}/`) &&
    !pathname.startsWith("/") &&
    !pathname.includes("\\") &&
    !pathname.includes("..") &&
    !pathname.includes("//") &&
    /^[a-zA-Z0-9/_-]+\.(png|jpe?g|webp)$/i.test(pathname) &&
    uploadImageExtensionPattern.test(pathname)
  );
}

export function safeUploadSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return normalized || "thumbnail";
}
