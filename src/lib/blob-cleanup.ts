import { del, list } from "@vercel/blob";
import { prisma } from "@/lib/db";

/**
 * Checks whether a given URL points to an asset stored in Vercel Blob storage.
 */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".blob.vercel-storage.com") ||
      parsed.hostname.includes("blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Safely deletes a blob from Vercel Blob storage by URL.
 * Will not throw errors if deletion fails or token is missing — logs a warning instead.
 */
export async function deleteBlobSafely(
  url: string | null | undefined,
): Promise<boolean> {
  if (!url || !isVercelBlobUrl(url)) {
    return false;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn(
      `[BlobCleanup] Cannot delete blob "${url}": BLOB_READ_WRITE_TOKEN is not configured.`,
    );
    return false;
  }

  try {
    await del(url, { token });
    console.log(`[BlobCleanup] Successfully deleted orphaned blob: ${url}`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[BlobCleanup] Failed to delete blob "${url}": ${message}`);
    return false;
  }
}

export type BlobCleanupSummary = {
  totalBlobs: number;
  usedBlobs: number;
  deletedBlobs: number;
  freedBytes: number;
  deletedUrls: string[];
};

/**
 * Comprehensive garbage collector for Vercel Blob store:
 * 1. Collects all thumbnail URLs actively referenced in the database (Levels & Level Suggestions).
 * 2. Fetches the complete list of blobs in the Vercel Blob store.
 * 3. Identifies and permanently deletes any blobs not referenced in the database.
 */
export async function cleanupOrphanBlobs(): Promise<BlobCleanupSummary> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  // 1. Gather all active thumbnail URLs currently stored in the database
  const [levels, suggestions] = await Promise.all([
    prisma.level.findMany({
      select: { thumbnailUrl: true },
    }),
    prisma.levelSuggestion.findMany({
      select: { thumbnailUrl: true },
    }),
  ]);

  const activeUrls = new Set<string>();
  for (const lvl of levels) {
    if (lvl.thumbnailUrl) {
      activeUrls.add(lvl.thumbnailUrl.trim());
    }
  }
  for (const sug of suggestions) {
    if (sug.thumbnailUrl) {
      activeUrls.add(sug.thumbnailUrl.trim());
    }
  }

  // 2. List all blobs in store
  const blobResult = await list({ token });
  const totalBlobs = blobResult.blobs.length;

  const orphanedBlobs = blobResult.blobs.filter(
    (b) => !activeUrls.has(b.url.trim()),
  );

  let freedBytes = 0;
  const deletedUrls: string[] = [];

  // 3. Delete each orphaned blob
  for (const orphan of orphanedBlobs) {
    try {
      await del(orphan.url, { token });
      freedBytes += orphan.size;
      deletedUrls.push(orphan.url);
      console.log(
        `[BlobCleanup] Deleted unused blob: ${orphan.pathname} (${(orphan.size / 1024 / 1024).toFixed(2)} MB)`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[BlobCleanup] Error deleting orphan blob "${orphan.url}": ${message}`,
      );
    }
  }

  return {
    totalBlobs,
    usedBlobs: totalBlobs - orphanedBlobs.length,
    deletedBlobs: deletedUrls.length,
    freedBytes,
    deletedUrls,
  };
}
