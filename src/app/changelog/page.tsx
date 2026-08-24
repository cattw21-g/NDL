import { Info, Newspaper } from "lucide-react";

import { ChangelogPostCard } from "@/components/changelog-post-card";
import { EmptyState, Eyebrow, SectionPanel } from "@/components/ui";
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
    <div className="space-y-5">
      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="mb-3">
          <Eyebrow icon={Newspaper}>Site updates</Eyebrow>
        </div>
        <h1 className="text-4xl font-black leading-tight text-slate-950">
          News & changelog
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Public announcements, ranking updates, rule changes, staff notes, and
          launch information from NDL staff.
        </p>
      </section>

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
        <aside className="space-y-3">
          <SectionPanel className="p-4">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-3 font-black text-slate-950">
              <Info className="h-5 w-5 text-cyan-800" />
              What gets posted
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>List policy updates</li>
              <li>Rules document changes</li>
              <li>Ranking and placement changes</li>
              <li>Moderation and launch notes</li>
              <li>Public project status notes</li>
            </ul>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
