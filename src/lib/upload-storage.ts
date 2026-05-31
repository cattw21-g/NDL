import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { uploadImageExtensionPattern } from "./media";
import {
  productionLocalUploadsDisabledReason,
  type EnvMap,
} from "./production-env";

export type UploadKind = "thumbnail" | "proof-image" | "completion-video" | "raw-footage";

export type UploadResult =
  | {
      ok: true;
      publicPath: string;
      absolutePath: string;
    }
  | {
      ok: false;
      error: string;
    };

const imageMimeTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);
const mp4MimeTypes = new Set(["video/mp4", "application/mp4"]);
let warnedProductionLocalUploads = false;

export function uploadMode(env: EnvMap = process.env) {
  const configured = env.UPLOAD_MODE?.trim().toLowerCase();

  if (configured === "local" || configured === "disabled") {
    const disabledReason = productionLocalUploadsDisabledReason(env);

    if (disabledReason) {
      if (!warnedProductionLocalUploads) {
        console.warn(disabledReason);
        warnedProductionLocalUploads = true;
      }

      return "disabled";
    }

    return configured;
  }

  return env.NODE_ENV === "production" ? "disabled" : "local";
}

export function publicUploadBasePath() {
  const configured = process.env.PUBLIC_UPLOAD_BASE_PATH?.trim() || "/uploads";
  const normalized = configured.startsWith("/") ? configured : `/${configured}`;
  const withoutTrailingSlash = normalized.replace(/\/+$/, "") || "/uploads";

  if (
    withoutTrailingSlash.startsWith("//") ||
    withoutTrailingSlash.includes("\\") ||
    withoutTrailingSlash.includes("..") ||
    !/^\/[a-zA-Z0-9/_-]+$/.test(withoutTrailingSlash)
  ) {
    return "/uploads";
  }

  return withoutTrailingSlash;
}

export function maxImageUploadBytes() {
  return mbToBytes(process.env.MAX_IMAGE_UPLOAD_MB, 5);
}

export function maxVideoUploadBytes() {
  return mbToBytes(process.env.MAX_VIDEO_UPLOAD_MB, 100);
}

export function localUploadsEnabled(env: EnvMap = process.env) {
  return uploadMode(env) === "local";
}

export function videoUploadsEnabled(env: EnvMap = process.env) {
  return localUploadsEnabled(env) && env.NODE_ENV !== "production";
}

export async function saveThumbnailUpload(
  file: unknown,
  nameHint: string,
): Promise<UploadResult> {
  return saveUpload(file, {
    kind: "thumbnail",
    nameHint,
    directory: "thumbnails",
    maxBytes: maxImageUploadBytes(),
    allowed: "image",
  });
}

export async function saveProofImageUpload(
  file: unknown,
  nameHint: string,
): Promise<UploadResult> {
  return saveUpload(file, {
    kind: "proof-image",
    nameHint,
    directory: "proof-images",
    maxBytes: maxImageUploadBytes(),
    allowed: "image",
  });
}

export async function saveVideoUpload(
  file: unknown,
  nameHint: string,
  kind: "completion-video" | "raw-footage",
): Promise<UploadResult> {
  if (!videoUploadsEnabled()) {
    return {
      ok: false,
      error: "MP4 upload is available only when enabled by NDL. Use a link instead.",
    };
  }

  return saveUpload(file, {
    kind,
    nameHint,
    directory: kind === "completion-video" ? "completion-videos" : "raw-footage",
    maxBytes: maxVideoUploadBytes(),
    allowed: "mp4",
  });
}

export async function cleanupUploads(paths: string[]) {
  await Promise.all(
    paths.map(async (filePath) => {
      if (isInsidePublicUploads(filePath)) {
        await rm(filePath, { force: true });
      }
    }),
  );
}

export function isUsableFile(value: unknown): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.size > 0
  );
}

async function saveUpload(
  file: unknown,
  options: {
    kind: UploadKind;
    nameHint: string;
    directory: string;
    maxBytes: number;
    allowed: "image" | "mp4";
  },
): Promise<UploadResult> {
  if (!isUsableFile(file)) {
    return {
      ok: false,
      error: "Choose a file to upload.",
    };
  }

  if (!localUploadsEnabled()) {
    return {
      ok: false,
      error: "Local uploads are disabled. Use a link instead.",
    };
  }

  if (file.size > options.maxBytes) {
    return {
      ok: false,
      error:
        options.allowed === "image"
          ? `Image must be ${bytesToMb(options.maxBytes)} MB or smaller.`
          : `MP4 must be ${bytesToMb(options.maxBytes)} MB or smaller.`,
    };
  }

  const extension = extensionForFile(file, options.allowed);

  if (!extension) {
    return {
      ok: false,
      error:
        options.allowed === "image"
          ? "Upload a PNG, JPG, or WebP image."
          : "Upload an MP4 video file.",
    };
  }

  const basePath = publicUploadBasePath();
  const publicPath = `${basePath}/${options.directory}/${safeSlug(options.nameHint)}-${randomUUID()}${extension}`;
  const absolutePath = absolutePublicPath(publicPath);

  if (!isInsidePublicUploads(absolutePath)) {
    return {
      ok: false,
      error: "Upload path is invalid.",
    };
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    ok: true,
    publicPath,
    absolutePath,
  };
}

function extensionForFile(file: File, allowed: "image" | "mp4") {
  const name = file.name.toLowerCase();

  if (allowed === "mp4") {
    return (name.endsWith(".mp4") || mp4MimeTypes.has(file.type)) ? ".mp4" : null;
  }

  const extension = imageMimeTypes.get(file.type);

  if (extension && uploadImageExtensionPattern.test(`file${extension}`)) {
    return extension;
  }

  if (name.endsWith(".png")) {
    return ".png";
  }

  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return ".jpg";
  }

  if (name.endsWith(".webp")) {
    return ".webp";
  }

  return null;
}

function absolutePublicPath(publicPath: string) {
  return path.resolve(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
}

function isInsidePublicUploads(filePath: string) {
  const uploadRoot = path.resolve(
    process.cwd(),
    "public",
    publicUploadBasePath().replace(/^\/+/, ""),
  );
  const resolved = path.resolve(filePath);

  return resolved === uploadRoot || resolved.startsWith(`${uploadRoot}${path.sep}`);
}

function safeSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return normalized || "upload";
}

function mbToBytes(value: string | undefined, fallbackMb: number) {
  const mb = Number(value);

  return Math.max(1, Number.isFinite(mb) ? mb : fallbackMb) * 1024 * 1024;
}

function bytesToMb(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}
