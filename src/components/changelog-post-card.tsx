"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

import { ChangelogContent } from "@/components/changelog-content";
import { StatusBadge } from "@/components/status-badge";
import { SectionPanel } from "@/components/ui";
import { changelogCategoryLabel } from "@/lib/changelog";
import { formatDate, formatDateTime } from "@/lib/format";

export interface ChangelogPostData {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  isPinned: boolean;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  author: { displayName: string } | null;
}

export function ChangelogPostCard({ post }: { post: ChangelogPostData }) {
  const [expanded, setExpanded] = useState(false);

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const updatedDate = new Date(post.updatedAt);
  const showUpdated = publishedDate && updatedDate > publishedDate;

  return (
    <SectionPanel className="p-5 transition-all duration-200">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={changelogCategoryLabel(post.category)} />
        {post.isPinned ? <StatusBadge value="Featured" /> : null}
      </div>

      <div className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
        {formatDate(publishedDate)}
        {showUpdated ? ` - Updated ${formatDateTime(updatedDate)}` : ""}
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

      {expanded ? (
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800 animate-in fade-in duration-300">
          <ChangelogContent content={post.content} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-cyan-400/80 bg-cyan-50 px-3.5 text-xs font-black text-cyan-900 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-500/50 dark:bg-cyan-950/60 dark:text-cyan-100 dark:hover:bg-cyan-950"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show full update
            </>
          )}
        </button>

        <Link
          href={`/changelog/${post.slug}`}
          className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
        >
          Read full update &rarr;
        </Link>
      </div>
    </SectionPanel>
  );
}
