import {
  archiveChangelogAction,
  createChangelogAction,
  updateChangelogAction,
} from "@/actions/admin";
import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import {
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
  textareaClass,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import {
  changelogCategoryLabel,
  changelogCategoryOptions,
} from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminChangelogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [params, posts] = await Promise.all([
    searchParams,
    prisma.changelogPost.findMany({
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
      take: 25,
    }),
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="space-y-5">
        <PageHeader
          title="Manage news"
          description="Create public updates, drafts, pinned announcements, and archived staff notes."
        />
        <PageMessage searchParams={params} />
        <form action={createChangelogAction}>
          <SectionPanel className="grid gap-4 p-4">
            <FieldLabel label="Title">
              <input name="title" required className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Slug">
              <input
                name="slug"
                className={inputClass}
                placeholder="Leave blank to generate from title"
              />
            </FieldLabel>
            <FieldLabel label="Category">
              <select
                name="category"
                defaultValue="SITE_UPDATE"
                required
                className={inputClass}
              >
                {changelogCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Summary">
              <textarea name="summary" required rows={3} className={textareaClass} />
            </FieldLabel>
            <FieldLabel label="Body">
              <textarea
                name="content"
                required
                rows={10}
                className={textareaClass}
              />
            </FieldLabel>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input name="isPublished" type="checkbox" defaultChecked />
                Published
              </label>
              <label className="inline-flex items-center gap-2">
                <input name="isPinned" type="checkbox" />
                Pinned / featured
              </label>
            </div>
            <SubmitButton>Create post</SubmitButton>
          </SectionPanel>
        </form>
      </section>
      <aside className="space-y-3">
        <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50">
          Recent posts
        </h2>
        {posts.map((post) => (
          <SectionPanel key={post.id} className="grid gap-4 p-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  value={
                    post.archivedAt
                      ? "ARCHIVED"
                      : post.isPublished
                        ? "PUBLISHED"
                        : "DRAFT"
                  }
                />
                {post.isPinned ? <StatusBadge value="PINNED" /> : null}
                <StatusBadge value={changelogCategoryLabel(post.category)} />
              </div>
              <div className="mt-3 font-black text-slate-950 dark:text-slate-50">
                {post.title}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                Published {formatDate(post.publishedAt)} · Updated{" "}
                {formatDateTime(post.updatedAt)}
              </div>
            </div>
            {post.archivedAt ? (
              <div className="grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>This post is archived and hidden from public news pages.</p>
                <p>
                  Slug:{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {post.slug}
                  </span>
                </p>
                <p>Archived {formatDateTime(post.archivedAt)}</p>
              </div>
            ) : (
              <form action={updateChangelogAction} className="grid gap-3">
                <input type="hidden" name="id" value={post.id} />
                <FieldLabel label="Title">
                  <input
                    name="title"
                    required
                    defaultValue={post.title}
                    className={inputClass}
                  />
                </FieldLabel>
                <FieldLabel label="Slug">
                  <input
                    name="slug"
                    required
                    defaultValue={post.slug}
                    className={inputClass}
                  />
                </FieldLabel>
                <FieldLabel label="Category">
                  <select
                    name="category"
                    defaultValue={post.category}
                    required
                    className={inputClass}
                  >
                    {changelogCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <FieldLabel label="Summary">
                  <textarea
                    name="summary"
                    required
                    rows={3}
                    defaultValue={post.summary}
                    className={textareaClass}
                  />
                </FieldLabel>
                <FieldLabel label="Body">
                  <textarea
                    name="content"
                    required
                    rows={8}
                    defaultValue={post.content}
                    className={textareaClass}
                  />
                </FieldLabel>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <label className="inline-flex items-center gap-2">
                    <input
                      name="isPublished"
                      type="checkbox"
                      defaultChecked={post.isPublished}
                    />
                    Published
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      name="isPinned"
                      type="checkbox"
                      defaultChecked={post.isPinned}
                    />
                    Pinned / featured
                  </label>
                </div>
                <SubmitButton>Save post</SubmitButton>
              </form>
            )}
            {!post.archivedAt ? (
              <form action={archiveChangelogAction}>
                <input type="hidden" name="id" value={post.id} />
                <SubmitButton className="border-red-700 bg-red-700 hover:bg-red-600 dark:border-red-300 dark:bg-red-300">
                  Archive post
                </SubmitButton>
              </form>
            ) : null}
          </SectionPanel>
        ))}
      </aside>
    </div>
  );
}
