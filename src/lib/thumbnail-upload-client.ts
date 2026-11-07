import { upload } from "@vercel/blob/client";
import { blobThumbnailPathname } from "./thumbnail-upload";

export type UploadedThumbnail = {
  url: string;
  downloadUrl?: string;
  pathname?: string;
};

const THUMBNAIL_UPLOAD_TIMEOUT_MS = 45_000;

export async function uploadThumbnailFile(
  file: File,
  nameHint: string,
): Promise<UploadedThumbnail> {
  // Direct client upload via @vercel/blob/client is optimal for edge/workers environments:
  // the client asks the worker for an upload token and sends the image directly to Vercel's CDN,
  // preventing multi-second multipart streaming and worker isolate timeouts.
  try {
    const pathname = blobThumbnailPathname(nameHint, file);
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/admin/blob-thumbnail-upload",
      contentType: file.type || undefined,
      multipart: file.size > 4 * 1024 * 1024,
    });
    return blob;
  } catch (clientError) {
    console.warn("Direct blob client upload failed, attempting fallback:", clientError);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      THUMBNAIL_UPLOAD_TIMEOUT_MS,
    );
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nameHint", nameHint);

    try {
      const response = await fetch("/api/admin/blob-thumbnail-upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        blob?: UploadedThumbnail;
        error?: string;
      } | null;

      if (!response.ok || !payload?.blob?.url) {
        const errorMsg =
          payload?.error ||
          (clientError instanceof Error ? clientError.message : "Thumbnail upload failed.");
        throw new Error(errorMsg);
      }

      return payload.blob;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Thumbnail upload timed out. Try a smaller image or try again.");
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
