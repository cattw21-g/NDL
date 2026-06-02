import { type NextRequest } from "next/server";

import { requireBotApiSecret } from "@/lib/api-auth";
import { apiOk } from "@/lib/api-response";
import { parseApiLimit, parseApiSearch } from "@/lib/api-query";
import { serializeAuditLogEntry } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireBotApiSecret(request);

  if (auth) {
    return auth;
  }

  const q = parseApiSearch(request.nextUrl.searchParams);
  const limit = parseApiLimit(request.nextUrl.searchParams);
  const entries = await prisma.adminAuditLog.findMany({
    where: q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityLabel: { contains: q, mode: "insensitive" } },
            { actorHandle: { contains: q, mode: "insensitive" } },
            { actorName: { contains: q, mode: "insensitive" } },
            { note: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return apiOk({
    query: q,
    entries: entries.map(serializeAuditLogEntry),
    limit,
  });
}
