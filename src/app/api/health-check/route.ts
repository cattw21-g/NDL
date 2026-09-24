import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runDatabaseMaintenance, type MaintenanceResult } from "@/lib/database-hygiene";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || "1541531776097198080";
  const redirectUri = "https://www.nerfeddemonlist.net/api/auth/discord/callback";

  const u = new URL("https://discord.com/oauth2/authorize");
  u.searchParams.set("client_id", clientId.trim());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "identify");

  const botToken = process.env.DISCORD_BOT_TOKEN?.trim() || "";
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "";

  let migrationResult = "ok";
  let appMigrationResult: unknown = null;
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
  } catch (err) {
    migrationResult = `error: ${String(err)}`;
  }

  try {
    const { ensureApplicationSchemaAndOpenings } = await import("@/lib/ensure-application-schema");
    appMigrationResult = await ensureApplicationSchemaAndOpenings();
  } catch (err) {
    appMigrationResult = `error: ${String(err)}`;
  }

  let dbInfo: unknown = null;
  try {
    dbInfo = await prisma.$queryRawUnsafe(
      "SELECT current_database(), current_schema(), current_user, inet_server_addr()::text as host;"
    );
  } catch (err) {
    dbInfo = `error: ${String(err)}`;
  }

  let maintenance: MaintenanceResult | null = null;
  try {
    maintenance = await runDatabaseMaintenance(prisma);
  } catch (err) {
    console.error("Maintenance task error in health check:", err);
  }

  return NextResponse.json({
    status: "ok",
    clientId: clientId.trim(),
    guildId,
    hasBotToken: Boolean(botToken && botToken.length > 0),
    dbMigration: migrationResult,
    appMigration: appMigrationResult,
    dbInfo,
    maintenance,
  });
}
