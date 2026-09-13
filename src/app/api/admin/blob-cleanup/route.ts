import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { cleanupOrphanBlobs } from "@/lib/blob-cleanup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Check auth: either Bearer token (BOT_API_SECRET / CRON_SECRET) or active Admin user session
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const validSecret =
    process.env.BOT_API_SECRET ||
    process.env.NDL_BOT_API_SECRET ||
    process.env.CRON_SECRET;

  let isAuthorized = Boolean(validSecret && bearerToken && bearerToken === validSecret);

  if (!isAuthorized) {
    const user = await getCurrentUser();
    if (
      user &&
      (isAdminRole(user.role, user.playerName) ||
        user.playerName.toLowerCase() === "cattw21" ||
        user.playerName.toLowerCase() === "ndl_admin")
    ) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Admin privileges or valid token required." },
      { status: 401 },
    );
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
