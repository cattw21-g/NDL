import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { publicChangelogWhere } from "../src/lib/demo-visibility.js";
import { DEFAULT_POSTS } from "../src/lib/changelog.js";

async function main() {
  console.log("Checking database changelog posts...");

  for (const post of DEFAULT_POSTS) {
    await prisma.changelogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        category: post.category,
        summary: post.summary,
        content: post.content,
        isPublished: true,
        isPinned: post.isPinned,
        isDemo: false,
        archivedAt: null,
      },
      create: {
        title: post.title,
        slug: post.slug,
        category: post.category,
        summary: post.summary,
        content: post.content,
        isPublished: true,
        isPinned: post.isPinned,
        isDemo: false,
        publishedAt: post.publishedAt,
      },
    });
    console.log(`✅ Upserted post: ${post.title} (${post.slug})`);
  }

  const allPosts = await prisma.changelogPost.findMany({
    where: publicChangelogWhere(),
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  console.log(`\n📋 Query returned ${allPosts.length} posts for public changelog:`);
  for (const p of allPosts) {
    console.log(`   - [${p.isPinned ? "PINNED" : "NORMAL"}] ${p.title} (${p.slug})`);
  }
}

main().catch(console.error);
