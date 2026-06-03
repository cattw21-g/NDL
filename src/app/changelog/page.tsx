import { Info, Newspaper } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Eyebrow, SectionPanel } from "@/components/ui";
import {
  changelogCategoryLabel,
  plainTextParagraphs,
} from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "News & Changelog - NDL",
  description:
    "Read Nerfed Demonlist announcements, ranking updates, rule updates, site updates, and staff notes.",
};

export default async function ChangelogPage() {
  const posts = await prisma.changelogPost.findMany({
    where: publicChangelogWhere(),
    include: {
      author: true,
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

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
            posts.map((post) => {
              const firstParagraph = plainTextParagraphs(post.content)[0] ?? "";

              return (
                <SectionPanel key={post.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={changelogCategoryLabel(post.category)} />
                    {post.isPinned ? <StatusBadge value="Featured" /> : null}
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                    {formatDate(post.publishedAt)}
                    {post.updatedAt > (post.publishedAt ?? post.updatedAt)
                      ? ` - Updated ${formatDateTime(post.updatedAt)}`
                      : ""}
                    {post.author ? ` - ${post.author.displayName}` : ""}
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">
                    <Link
                      href={`/changelog/${post.slug}`}
                      className="rounded-sm transition hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:hover:text-cyan-200"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
                    {post.summary}
                  </p>
                  {firstParagraph ? (
                    <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {firstParagraph}
                    </p>
                  ) : null}
                  <Link
                    href={`/changelog/${post.slug}`}
                    className="mt-4 inline-flex min-h-9 items-center rounded-md border border-cyan-300 bg-white px-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-500/50 dark:bg-slate-950/60 dark:text-cyan-100 dark:hover:bg-cyan-950/50"
                  >
                    Read full update
                  </Link>
                </SectionPanel>
              );
            })
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
