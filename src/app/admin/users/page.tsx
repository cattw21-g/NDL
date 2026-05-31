import { updateUserRoleAction } from "@/actions/admin";
import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import {
  FactPill,
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const roles = ["ADMIN", "MODERATOR", "PLAYER"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [params, users] = await Promise.all([
    searchParams,
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { displayName: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage users"
        description="Role changes affect access to review and admin workflows immediately."
      />
      <PageMessage searchParams={params} />
      <section className="space-y-3">
        {users.map((user) => (
          <form key={user.id} action={updateUserRoleAction}>
            <SectionPanel className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_10rem_18rem] md:items-center">
              <input type="hidden" name="userId" value={user.id} />
              <div className="min-w-0">
                <div className="truncate text-lg font-black text-slate-950">
                  {user.displayName}
                </div>
                <div className="truncate text-sm text-slate-500">
                  @{user.playerName} - {user.email}
                </div>
                <div className="mt-2">
                  <FactPill
                    label="Email"
                    value={user.emailVerifiedAt ? "verified" : "unverified"}
                  />
                </div>
              </div>
              <StatusBadge value={user.role} />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <FieldLabel label="Role">
                  <select
                    name="role"
                    defaultValue={user.role}
                    className={inputClass}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <SubmitButton>Save</SubmitButton>
              </div>
            </SectionPanel>
          </form>
        ))}
      </section>
    </div>
  );
}
