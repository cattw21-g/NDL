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
      throw new Error(payload?.error || "Thumbnail upload failed.");
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
