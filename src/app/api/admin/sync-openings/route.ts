import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { ensureApplicationSchemaAndOpenings } from "@/lib/ensure-application-schema";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  const isAuthorized =
    (user && canManageApplications(user.role, user.playerName)) ||
    (secret && (secret === process.env.ADMIN_PASSWORD || secret === process.env.SESSION_SECRET));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ensureApplicationSchemaAndOpenings();

  const openings = await prisma.applicationOpening.findMany({
    include: {
      questions: { select: { id: true, prompt: true, order: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ...result,
    openingsCount: openings.length,
    openings: openings.map((o) => ({
      id: o.id,
      slug: o.slug,
      title: o.title,
      role: o.role,
      status: o.status,
      isPublished: o.isPublished,
      questionsCount: o.questions.length,
      submissionsCount: o._count.submissions,
    })),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
