import { type NextRequest } from "next/server";

import { apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { parseApiLimit } from "@/lib/api-query";
import { serializeChangelogPost } from "@/lib/api-serializers";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const limit = parseApiLimit(request.nextUrl.searchParams);
  const posts = await prisma.changelogPost.findMany({
    where: publicChangelogWhere(),
    include: {
      author: true,
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return apiOk({
    posts: posts.map(serializeChangelogPost),
    limit,
  });
}
