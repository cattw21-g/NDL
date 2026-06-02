import { ArrowLeft, Newspaper } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Eyebrow, SectionPanel } from "@/components/ui";
import {
  changelogCategoryLabel,
  plainTextParagraphs,
} from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { publicChangelogWhere } from "@/lib/demo-visibility";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChangelogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.changelogPost.findFirst({
    where: publicChangelogWhere({
      slug,
    }),
    include: {
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        href="/changelog"
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to changelog
      </Link>

      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Eyebrow icon={Newspaper}>NDL update</Eyebrow>
          <StatusBadge value={changelogCategoryLabel(post.category)} />
          {post.isPinned ? <StatusBadge value="Featured" /> : null}
        </div>
        <h1 className="text-balance text-4xl font-black leading-tight text-slate-950 dark:text-slate-50 sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-slate-700 dark:text-slate-200">
          {post.summary}
        </p>
        <div className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
          Published {formatDate(post.publishedAt)}
          {post.updatedAt > (post.publishedAt ?? post.updatedAt)
            ? ` · Updated ${formatDateTime(post.updatedAt)}`
            : ""}
          {post.author ? ` · ${post.author.displayName}` : ""}
        </div>
      </section>

      <SectionPanel className="p-5">
        <div className="space-y-4">
          {plainTextParagraphs(post.content).map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 24)}`}
              className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </SectionPanel>
    </article>
  );
}
