import { upload } from "@vercel/blob/client";
import { blobThumbnailPathname } from "./thumbnail-upload";

export type UploadedThumbnail = {
  url: string;
  downloadUrl?: string;
  pathname?: string;
};

const THUMBNAIL_UPLOAD_TIMEOUT_MS = 60_000;

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
    try {
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-thumbnail-upload",
        contentType: file.type || undefined,
        abortSignal: controller.signal,
      });
      return blob;
    } catch (clientError) {
      if (controller.signal.aborted) {
        throw clientError;
      }
      console.warn("Direct blob client upload failed, attempting fallback:", clientError);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("nameHint", nameHint);

      const response = await fetch("/api/admin/blob-thumbnail-upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Upload failed with status ${response.status}`);
      }

      const data = (await response.json()) as { blob?: UploadedThumbnail; url?: string };
      if (data.blob?.url) {
        return data.blob;
      }
      if (data.url) {
        return { url: data.url };
      }
      throw new Error("Invalid response from upload server.");
    }
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
