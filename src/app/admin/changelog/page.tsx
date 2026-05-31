import { createChangelogAction } from "@/actions/admin";
import { PageMessage } from "@/components/message";
import { SubmitButton } from "@/components/submit-button";
import {
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
  textareaClass,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

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
      orderBy: {
        publishedAt: "desc",
      },
      take: 10,
    }),
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="space-y-5">
        <PageHeader
          title="Publish changelog"
          description="Keep public project updates clear and auditable."
        />
        <PageMessage searchParams={params} />
        <form action={createChangelogAction}>
          <SectionPanel className="grid gap-4 p-4">
            <FieldLabel label="Title">
              <input name="title" required className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Content">
              <textarea
                name="content"
                required
                rows={10}
                className={textareaClass}
              />
            </FieldLabel>
            <SubmitButton>Publish post</SubmitButton>
          </SectionPanel>
        </form>
      </section>
      <aside className="space-y-3">
        <h2 className="text-2xl font-black text-slate-950">Recent posts</h2>
        {posts.map((post) => (
          <SectionPanel key={post.id} className="p-4">
            <div className="text-sm text-slate-500">
              {formatDate(post.publishedAt)}
            </div>
            <div className="mt-1 font-black text-slate-950">{post.title}</div>
          </SectionPanel>
        ))}
      </aside>
    </div>
  );
}
