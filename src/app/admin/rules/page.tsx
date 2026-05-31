import { updateRulesAction } from "@/actions/admin";
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

export const dynamic = "force-dynamic";

export default async function AdminRulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [params, rules] = await Promise.all([
    searchParams,
    prisma.rulesDocument.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Publish rules"
        description="Publishing creates the active public rules document used by players and moderators."
      />
      <PageMessage searchParams={params} />
      <form action={updateRulesAction}>
        <SectionPanel className="grid gap-4 p-4">
          <FieldLabel label="Version">
            <input
              name="version"
              defaultValue={rules?.version ?? "v1.0"}
              required
              className={inputClass}
            />
          </FieldLabel>
          <FieldLabel label="Rules content">
            <textarea
              name="content"
              defaultValue={rules?.content}
              required
              rows={18}
              className={`${textareaClass} font-mono`}
            />
          </FieldLabel>
          <SubmitButton>Publish active rules</SubmitButton>
        </SectionPanel>
      </form>
    </div>
  );
}
