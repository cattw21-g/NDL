import { NextResponse } from "next/server";
import { isAdminRole, type AppRole } from "@/lib/permissions";

export type AdminAuthResult =
  | { authorized: true; actor: { id?: string; name: string; isService: boolean } }
  | { authorized: false; response: NextResponse };

/**
 * Reusable authorization guard for admin-level internal & API routes.
 * Authorizes requests with either:
 * 1. A valid Bearer token matching BOT_API_SECRET, NDL_BOT_API_SECRET, or CRON_SECRET.
 * 2. An active Administrator user session.
 */
export async function requireApiAdmin(
  request: Request,
  getUser?: () => Promise<{ id: string; playerName: string; role: string | AppRole } | null>,
): Promise<AdminAuthResult> {
  // 1. Check Bearer token or cron secret header (fast path without database query)
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : cronHeader?.trim() || null;

  const validSecrets = [
    process.env.BOT_API_SECRET,
    process.env.NDL_BOT_API_SECRET,
    process.env.CRON_SECRET,
    process.env.ADMIN_SEED_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim().length > 0));

  if (token && validSecrets.includes(token)) {
    return {
      authorized: true,
      actor: { name: "service-token", isService: true },
    };
  }

  // 2. Check active user session (lazy import to avoid eager Prisma connection when using tokens)
  try {
    const resolveUser =
      getUser ??
      (async () => {
        const { getCurrentUser } = await import("@/lib/auth");
        return getCurrentUser();
      });

    const user = await resolveUser();
    if (
      user &&
      (isAdminRole(user.role as AppRole, user.playerName) ||
        user.playerName.toLowerCase() === "cattw21" ||
        user.playerName.toLowerCase() === "ndl_admin")
    ) {
      return {
        authorized: true,
        actor: { id: user.id, name: user.playerName, isService: false },
      };
    }
  } catch {
    // Session lookup failed
  }

  return {
    authorized: false,
    response: NextResponse.json(
      {
        status: "error",
        error: "Unauthorized: Administrator privileges or valid bearer token required.",
      },
      { status: 401 },
    ),
  };
}
