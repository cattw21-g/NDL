import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { File as NodeFile } from "node:buffer";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FALLBACK_THUMBNAIL_SRC,
  isValidThumbnailSource,
  safeThumbnailSrc,
} from "../lib/media";
import {
  saveProofImageUpload,
  saveThumbnailUpload,
  saveVideoUpload,
  localUploadsEnabled,
  uploadMode,
  videoUploadsEnabled,
} from "../lib/upload-storage";

if (typeof globalThis.File === "undefined") {
  Object.defineProperty(globalThis, "File", {
    value: NodeFile,
  });
}

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  UPLOAD_MODE: process.env.UPLOAD_MODE,
  PUBLIC_UPLOAD_BASE_PATH: process.env.PUBLIC_UPLOAD_BASE_PATH,
  MAX_IMAGE_UPLOAD_MB: process.env.MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB: process.env.MAX_VIDEO_UPLOAD_MB,
  ALLOW_LOCAL_UPLOADS_IN_PRODUCTION:
    process.env.ALLOW_LOCAL_UPLOADS_IN_PRODUCTION,
};

function makeFile(
  bytes: number,
  name: string,
  type: string,
) {
  return new File([new Uint8Array(bytes)], name, { type });
}

async function cleanupUploads() {
  await rm(path.join(process.cwd(), "public", "uploads-test"), {
    recursive: true,
    force: true,
  });
}

describe("safe thumbnail media handling", () => {
  it("accepts placehold.co and local thumbnail paths", () => {
    expect(isValidThumbnailSource("https://placehold.co/320x180.png")).toBe(true);
    expect(isValidThumbnailSource("/uploads/thumbnails/demo.webp")).toBe(true);
  });

  it("falls back for unsupported external thumbnails", () => {
    expect(safeThumbnailSrc("https://example.com/not-an-image")).toBe(
      FALLBACK_THUMBNAIL_SRC,
    );
  });

  it("allows blob object URLs only for explicit preview rendering", () => {
    const objectUrl = "blob:http://localhost:3000/local-preview";

    expect(safeThumbnailSrc(objectUrl)).toBe(FALLBACK_THUMBNAIL_SRC);
    expect(safeThumbnailSrc(objectUrl, { allowObjectUrl: true })).toBe(objectUrl);
  });

  it("rejects Windows paths", () => {
    expect(isValidThumbnailSource("C:\\Users\\cat97\\thumbnail.png")).toBe(false);
  });
});

describe("local upload storage", () => {
  beforeEach(async () => {
    setEnv("NODE_ENV", "test");
    setEnv("UPLOAD_MODE", "local");
    setEnv("PUBLIC_UPLOAD_BASE_PATH", "/uploads-test");
    setEnv("MAX_IMAGE_UPLOAD_MB", "1");
    setEnv("MAX_VIDEO_UPLOAD_MB", "1");
    await cleanupUploads();
  });

  afterEach(async () => {
    restoreEnv("NODE_ENV", originalEnv.NODE_ENV);
    restoreEnv("UPLOAD_MODE", originalEnv.UPLOAD_MODE);
    restoreEnv("PUBLIC_UPLOAD_BASE_PATH", originalEnv.PUBLIC_UPLOAD_BASE_PATH);
    restoreEnv("MAX_IMAGE_UPLOAD_MB", originalEnv.MAX_IMAGE_UPLOAD_MB);
    restoreEnv("MAX_VIDEO_UPLOAD_MB", originalEnv.MAX_VIDEO_UPLOAD_MB);
    restoreEnv(
      "ALLOW_LOCAL_UPLOADS_IN_PRODUCTION",
      originalEnv.ALLOW_LOCAL_UPLOADS_IN_PRODUCTION,
    );
    await cleanupUploads();
  });

  it("saves thumbnail uploads under /uploads/thumbnails", async () => {
    const upload = await saveThumbnailUpload(
      makeFile(128, "thumbnail.png", "image/png"),
      "Demo Level",
    );

    expect(upload.ok).toBe(true);

    if (upload.ok) {
      expect(upload.publicPath).toMatch(
        /^\/uploads-test\/thumbnails\/demo-level-/,
      );
      await expect(stat(upload.absolutePath)).resolves.toBeTruthy();
    }
  });

  it("rejects invalid image types and oversized images", async () => {
    const invalid = await saveProofImageUpload(
      makeFile(128, "proof.txt", "text/plain"),
      "Proof",
    );
    const oversized = await saveProofImageUpload(
      makeFile(1024 * 1024 + 1, "proof.png", "image/png"),
      "Proof",
    );

    expect(invalid.ok).toBe(false);
    expect(oversized.ok).toBe(false);
  });

  it("accepts MP4 uploads only when local video uploads are enabled", async () => {
    const accepted = await saveVideoUpload(
      makeFile(128, "completion.mp4", "video/mp4"),
      "Completion",
      "completion-video",
    );

    expect(accepted.ok).toBe(true);

    setEnv("NODE_ENV", "production");

    expect(videoUploadsEnabled()).toBe(false);

    const rejected = await saveVideoUpload(
      makeFile(128, "completion.mp4", "video/mp4"),
      "Completion",
      "completion-video",
    );

    expect(rejected.ok).toBe(false);
  });

  it("rejects oversized MP4 uploads", async () => {
    const oversized = await saveVideoUpload(
      makeFile(1024 * 1024 + 1, "completion.mp4", "video/mp4"),
      "Completion",
      "completion-video",
    );

    expect(oversized.ok).toBe(false);
  });

  it("disables local uploads in production unless explicitly allowed", () => {
    setEnv("NODE_ENV", "production");
    setEnv("UPLOAD_MODE", "local");
    restoreEnv("ALLOW_LOCAL_UPLOADS_IN_PRODUCTION", undefined);

    expect(uploadMode()).toBe("disabled");
    expect(localUploadsEnabled()).toBe(false);

    setEnv("ALLOW_LOCAL_UPLOADS_IN_PRODUCTION", "true");

    expect(uploadMode()).toBe("local");
    expect(localUploadsEnabled()).toBe(true);
    expect(videoUploadsEnabled()).toBe(false);
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    setEnv(name, value);
  }
}

function setEnv(name: string, value: string) {
  (process.env as Record<string, string | undefined>)[name] = value;
}
