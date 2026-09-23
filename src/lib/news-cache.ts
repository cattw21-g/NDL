import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";

export const getRecentNewsSlugs = unstable_cache(
  async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentNewsPosts = await prisma.changelogPost.findMany({
        where: publicChangelogWhere({
          publishedAt: {
            gte: fortyEightHoursAgo,
          },
        }),
        select: { slug: true },
      });
      return recentNewsPosts.map((p) => p.slug);
    } catch {
      return [];
    }
  },
  ["recent-news-slugs"],
  { revalidate: 600, tags: ["changelog"] }
);
