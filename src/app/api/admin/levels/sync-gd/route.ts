import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isModeratorRole } from "@/lib/permissions";
import { fetchGdLevelMetadata } from "@/lib/gd-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isModeratorRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const gdLevelId = searchParams.get("gdLevelId");

  if (!gdLevelId) {
    return NextResponse.json({ error: "Missing gdLevelId" }, { status: 400 });
  }

  const data = await fetchGdLevelMetadata(gdLevelId);
  if (!data) {
    return NextResponse.json(
      { error: "Could not fetch level data from Geometry Dash servers. Check the ID." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data });
}
