import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications, isAdminRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ensureLatestChangelogPost, STAFF_APPLICATIONS_OPEN_POST } from "@/lib/changelog";
import { sendNewsBroadcastEmail } from "@/lib/email";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  const isAuthorized =
    (user && (canManageApplications(user.role, user.playerName) || isAdminRole(user.role, user.playerName))) ||
    (secret && (secret === process.env.ADMIN_PASSWORD || secret === process.env.SESSION_SECRET));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Sync Changelog Post in DB
  await ensureLatestChangelogPost(prisma);

  // 2. Fetch all registered users
  const recipients = new Map<string, string>();

  // Owner / Admin email
  const adminEmail = process.env.SMTP_USER?.trim() || "cattwgd@gmail.com";
  recipients.set(adminEmail, "cattw21");

  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        displayName: true,
        playerName: true,
      },
    });

    for (const u of users) {
      if (u.email && !u.email.endsWith(".local") && u.email.includes("@")) {
        recipients.set(u.email.trim(), u.displayName || u.playerName);
      }
    }
  } catch (err) {
    console.error("Failed to query users for email broadcast:", err);
  }

  const articleUrl = absoluteSiteUrl(`/changelog/${STAFF_APPLICATIONS_OPEN_POST.slug}`);
  const results: Array<{ email: string; name: string; success: boolean; error?: string }> = [];

  for (const [email, name] of recipients.entries()) {
    try {
      await sendNewsBroadcastEmail({
        to: email,
        recipientName: name,
        title: STAFF_APPLICATIONS_OPEN_POST.title,
        summary: STAFF_APPLICATIONS_OPEN_POST.summary,
        category: STAFF_APPLICATIONS_OPEN_POST.category,
        articleUrl,
      });
      results.push({ email, name, success: true });
    } catch (err) {
      results.push({ email, name, success: false, error: String(err) });
    }
  }

  return NextResponse.json({
    status: "ok",
    post: STAFF_APPLICATIONS_OPEN_POST.title,
    postUrl: articleUrl,
    recipientsCount: recipients.size,
    sentCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
