import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { requireDatabaseUrl } from "../src/lib/production-env";
import { REVIEW_PAUSE_SEPT_2026_POST } from "../src/lib/changelog";

const connectionString = requireDatabaseUrl(process.env, "publish review pause announcement");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, displayName: true },
  });

  // Unpin older posts so this is the pinned announcement
  await prisma.changelogPost.updateMany({
    where: { isPinned: true },
    data: { isPinned: false },
  });

  const post = await prisma.changelogPost.upsert({
    where: { slug: REVIEW_PAUSE_SEPT_2026_POST.slug },
    create: {
      title: REVIEW_PAUSE_SEPT_2026_POST.title,
      slug: REVIEW_PAUSE_SEPT_2026_POST.slug,
      category: REVIEW_PAUSE_SEPT_2026_POST.category,
      summary: REVIEW_PAUSE_SEPT_2026_POST.summary,
      content: REVIEW_PAUSE_SEPT_2026_POST.content,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      publishedAt: new Date("2026-09-13T19:00:00.000Z"),
      authorId: adminUser?.id ?? null,
    },
    update: {
      title: REVIEW_PAUSE_SEPT_2026_POST.title,
      category: REVIEW_PAUSE_SEPT_2026_POST.category,
      summary: REVIEW_PAUSE_SEPT_2026_POST.summary,
      content: REVIEW_PAUSE_SEPT_2026_POST.content,
      isPublished: true,
      isPinned: true,
      isDemo: false,
      archivedAt: null,
      publishedAt: new Date("2026-09-13T19:00:00.000Z"),
    },
  });

  console.log("Successfully published announcement post to database:", post.title, `(${post.slug})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to publish:", err);
  process.exit(1);
});
