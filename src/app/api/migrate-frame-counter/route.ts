import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Level" ADD COLUMN IF NOT EXISTS "frameWindowCounterUrl" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LevelSuggestion" ADD COLUMN IF NOT EXISTS "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false;
    `);

    // Also clean up: remove old columns from RecordSubmission and Record if they exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RecordSubmission" DROP COLUMN IF EXISTS "frameWindowCounterRequested";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RecordSubmission" DROP COLUMN IF EXISTS "frameWindowCounterUrl";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Record" DROP COLUMN IF EXISTS "frameWindowCounterUrl";
    `);

    return NextResponse.json({ status: "ok", message: "Frame counter columns migrated successfully" });
  } catch (err) {
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
