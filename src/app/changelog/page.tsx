import { Info } from "lucide-react";

import { ChangelogPostCard } from "@/components/changelog-post-card";
import { EmptyState, SectionPanel } from "@/components/ui";
import {
  DEFAULT_POSTS,
  ensureLatestChangelogPost,
} from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "News & Changelog - NDL",
  description:
    "Read Nerfed Demonlist announcements, ranking updates, rule updates, site updates, and staff notes.",
};

export default async function ChangelogPage() {
  await ensureLatestChangelogPost(prisma);

  const postsFromDb = await prisma.changelogPost.findMany({
    where: publicChangelogWhere(),
    include: {
      author: true,
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  const posts = postsFromDb.length > 0 ? postsFromDb : DEFAULT_POSTS;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            News & Changelog
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
            Official announcements, ranking updates, and development notes from the Nerfed Demonlist team.
          </p>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <ChangelogPostCard key={post.id} post={post} />
            ))
          ) : (
            <EmptyState
              title="No public updates yet"
              description="Public list updates, rule changes, and moderation notices will appear here."
            />
          )}
        </div>
        <aside className="space-y-4">
          <SectionPanel className="p-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              <Info className="h-5 w-5 text-cyan-500" />
              Changelog Coverage
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>Official version milestones & stable releases</li>
              <li>Main List & Extended List tier movements</li>
              <li>Rules document additions & modifications</li>
              <li>Ranking formula & partial points adjustments</li>
              <li>Moderation notices & community announcements</li>
            </ul>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
