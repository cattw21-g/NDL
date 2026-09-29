import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runDatabaseMaintenance, type MaintenanceResult } from "@/lib/database-hygiene";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shouldSync = url.searchParams.get("sync") === "true";
  const shouldBroadcast = url.searchParams.get("broadcast_email") === "true";
  const shouldMaintain = url.searchParams.get("maintenance") === "true";
  const adminKey = url.searchParams.get("admin_key") || request.headers.get("x-cron-secret");

  const isAuthorized =
    (process.env.CRON_SECRET && adminKey === process.env.CRON_SECRET) ||
    (process.env.BOT_API_SECRET && adminKey === process.env.BOT_API_SECRET);

  const clientId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || "1541531776097198080";
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim() || "";
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "";

  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "unavailable";
    dbError = err instanceof Error ? err.message : String(err);
  }

  let migrationResult: string | null = null;
  let appMigrationResult: unknown = null;
  let maintenance: MaintenanceResult | null = null;
  let broadcastResult: unknown = null;

  // Only run heavy schema sync and maintenance if explicitly requested by authorized caller
  if (isAuthorized && shouldSync) {
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'RecordStatus' AND e.enumlabel = 'UNDER_CONSIDERATION'
          ) THEN
            ALTER TYPE "RecordStatus" ADD VALUE 'UNDER_CONSIDERATION';
          END IF;
        END
        $$;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSubmissionLocked" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subdivision" TEXT;
        ALTER TABLE "LevelSuggestion" ALTER COLUMN "verificationVideoUrl" DROP NOT NULL;
      `);
      migrationResult = "ok";
    } catch (err) {
      migrationResult = `error: ${String(err)}`;
    }

    try {
      const { ensureApplicationSchemaAndOpenings } = await import("@/lib/ensure-application-schema");
      appMigrationResult = await ensureApplicationSchemaAndOpenings();
    } catch (err) {
      appMigrationResult = `error: ${String(err)}`;
    }

    try {
      const { ensureLatestChangelogPost } = await import("@/lib/changelog");
      await ensureLatestChangelogPost(prisma);
    } catch (err) {
      console.error("Health check changelog sync error:", err);
    }
  }

  if (isAuthorized && shouldMaintain) {
    try {
      maintenance = await runDatabaseMaintenance(prisma);
    } catch (err) {
      console.error("Maintenance task error in health check:", err);
    }
  }

  if (isAuthorized && shouldBroadcast) {
    try {
      const { sendNewsBroadcastEmail } = await import("@/lib/email");
      const { STAFF_APPLICATIONS_OPEN_POST } = await import("@/lib/changelog");
      const { absoluteSiteUrl } = await import("@/lib/site-url");

      const recipients = new Map<string, string>();
      const adminEmail = process.env.SMTP_USER?.trim() || "cattwgd@gmail.com";
      recipients.set(adminEmail, "cattw21");

      const users = await prisma.user.findMany({
        where: { email: { not: "" }, isDemo: false },
        select: { email: true, displayName: true, playerName: true },
      });

      for (const u of users) {
        if (u.email && !u.email.endsWith(".local") && u.email.includes("@")) {
          recipients.set(u.email.trim(), u.displayName || u.playerName);
        }
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
        } catch (e) {
          results.push({ email, name, success: false, error: String(e) });
        }
      }

      broadcastResult = {
        total: recipients.size,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (err) {
      broadcastResult = `error: ${String(err)}`;
    }
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    database: dbStatus,
    ...(dbError ? { dbError } : {}),
    clientId: clientId.trim(),
    guildId,
    hasBotToken: Boolean(botToken && botToken.length > 0),
    ...(migrationResult ? { dbMigration: migrationResult } : {}),
    ...(appMigrationResult ? { appMigration: appMigrationResult } : {}),
    ...(maintenance ? { maintenance } : {}),
    ...(broadcastResult ? { broadcastResult } : {}),
  });
}
