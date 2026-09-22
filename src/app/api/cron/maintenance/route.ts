import { NextResponse, type NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/api-admin-guard";
import { runDatabaseMaintenance } from "@/lib/database-hygiene";
import { autoExpireOverdueSubmissions } from "@/lib/submission-workflow";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const startTime = Date.now();

  try {
    const maintenanceResult = await runDatabaseMaintenance(prisma);
    let autoExpiredCount = 0;

    try {
      autoExpiredCount = await autoExpireOverdueSubmissions(prisma);
    } catch (expireErr) {
      console.error("Auto-expire overdue submissions error:", expireErr);
    }

    const totalDurationMs = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      actor: auth.actor.name,
      maintenance: {
        ...maintenanceResult,
        autoExpiredSubmissions: autoExpiredCount,
        totalDurationMs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cron maintenance execution failure:", err);

    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: message,
        totalDurationMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Support GET invocation for standard HTTP cron services
  return POST(request);
}
