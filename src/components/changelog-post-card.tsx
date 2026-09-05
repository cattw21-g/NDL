"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Link from "next/link";

import { ChangelogContent } from "@/components/changelog-content";
import { StatusBadge } from "@/components/status-badge";
import { SectionPanel } from "@/components/ui";
import { changelogCategoryLabel } from "@/lib/changelog";
import { formatDate, formatDateTime } from "@/lib/format";
import { markNewsPostAsRead, useReadNewsSlugs } from "@/lib/news-read-store";

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
  const readSlugs = useReadNewsSlugs();

  const isUnread = !readSlugs.includes(post.slug);

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const updatedDate = new Date(post.updatedAt);
  const showUpdated = publishedDate && updatedDate > publishedDate;

  function handleToggleExpand() {
    if (!expanded && isUnread) {
      markNewsPostAsRead(post.slug);
    }
    setExpanded(!expanded);
  }

  function handleMarkRead() {
    if (isUnread) {
      markNewsPostAsRead(post.slug);
    }
  }

  return (
    <SectionPanel className="relative p-5 transition-all duration-200">
      <div className="flex flex-wrap items-center gap-2">
        {isUnread ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            NEW NOTIFICATION
          </span>
        ) : null}
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
          onClick={handleMarkRead}
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
          onClick={handleToggleExpand}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
              {isUnread ? <Sparkles className="h-3 w-3 text-cyan-500 animate-bounce" /> : null}
            </>
          )}
        </button>

        <Link
          href={`/changelog/${post.slug}`}
          onClick={handleMarkRead}
          className="inline-flex min-h-9 items-center rounded-lg border border-zinc-300 bg-white px-3.5 text-xs font-bold text-zinc-700 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
        >
          Read full update &rarr;
        </Link>
      </div>
    </SectionPanel>
  );
}
