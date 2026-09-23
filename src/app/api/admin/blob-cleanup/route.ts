import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-admin-guard";
import { cleanupOrphanBlobs } from "@/lib/blob-cleanup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const summary = await cleanupOrphanBlobs();
    return NextResponse.json({
      ok: true,
      message: `Cleaned up ${summary.deletedBlobs} unused blobs. Freed ${(summary.freedBytes / 1024 / 1024).toFixed(2)} MB.`,
      data: summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Blob cleanup failed: ${message}` },
      { status: 500 },
    );
  }
}
