import { Info, Newspaper } from "lucide-react";

import { EmptyState, Eyebrow, SectionPanel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  const posts = await prisma.changelogPost.findMany({
    where: publicChangelogWhere(),
    include: {
      author: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="mb-3">
          <Eyebrow icon={Newspaper}>Site updates</Eyebrow>
        </div>
        <h1 className="text-4xl font-black leading-tight text-slate-950">
          Changelog
        </h1>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <SectionPanel key={post.id} className="p-5">
                <div className="text-sm font-bold text-slate-500">
                  {formatDate(post.publishedAt)}
                  {post.author ? ` by ${post.author.displayName}` : ""}
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {post.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {post.content}
                </p>
              </SectionPanel>
            ))
          ) : (
            <EmptyState
              title="No changelog posts yet"
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
              <li>Demo environment notices</li>
              <li>Public project status notes</li>
            </ul>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
