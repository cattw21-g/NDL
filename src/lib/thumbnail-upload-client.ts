import { upload } from "@vercel/blob/client";
import { blobThumbnailPathname } from "./thumbnail-upload";

export type UploadedThumbnail = {
  url: string;
  downloadUrl?: string;
  pathname?: string;
};

const THUMBNAIL_UPLOAD_TIMEOUT_MS = 120_000;

export async function uploadThumbnailFile(
  file: File,
  nameHint: string,
): Promise<UploadedThumbnail> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    THUMBNAIL_UPLOAD_TIMEOUT_MS,
  );

  try {
    const pathname = blobThumbnailPathname(nameHint, file);
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/admin/blob-thumbnail-upload",
      contentType: file.type || undefined,
      abortSignal: controller.signal,
    });
    return blob;
  } catch (error) {
    const isAbort =
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error &&
        (error.name === "BlobRequestAbortedError" ||
          error.name === "AbortError" ||
          error.message.toLowerCase().includes("aborted") ||
          error.message.toLowerCase().includes("timed out")));

    if (isAbort) {
      throw new Error("Thumbnail upload timed out. Check your internet connection or try a smaller image.");
    }
    const message = error instanceof Error ? error.message : "Thumbnail upload failed.";
    throw new Error(message);
  } finally {
    window.clearTimeout(timeoutId);
  }
}
