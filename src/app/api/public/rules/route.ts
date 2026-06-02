import { apiNotFound, apiOk } from "@/lib/api-response";
import { enforceApiRateLimit } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rateLimit = await enforceApiRateLimit("public-api");

  if (rateLimit) {
    return rateLimit;
  }

  const rules = await prisma.rulesDocument.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  if (!rules) {
    return apiNotFound("Rules document not found.");
  }

  return apiOk({
    rules: {
      id: rules.id,
      version: rules.version,
      content: rules.content,
      publishedAt: rules.publishedAt.toISOString(),
    },
  });
}
