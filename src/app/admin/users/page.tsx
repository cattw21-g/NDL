import {
  updateUserCountryAdminAction,
  updateUserRoleAction,
} from "@/actions/admin";
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
import { getAllCountries, getCountryMeta } from "@/lib/countries";
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

  const allCountries = getAllCountries();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage users"
        description="Role and country changes affect leaderboards, player stats, and review access immediately."
      />
      <PageMessage searchParams={params} />
      <section className="space-y-3">
        {users.map((user) => {
          const country = getCountryMeta(user.countryCode);
          return (
            <SectionPanel
              key={user.id}
              className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_1fr_1fr] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-lg font-black text-slate-950 dark:text-white">
                    {user.displayName}
                  </div>
                  <StatusBadge value={user.role} />
                </div>
                <div className="truncate text-sm text-slate-500">
                  @{user.playerName} - {user.email}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FactPill
                    label="Email"
                    value={user.emailVerifiedAt ? "verified" : "unverified"}
                  />
                  <FactPill
                    label="Country"
                    value={
                      country
                        ? `${country.flag} ${country.name}`
                        : "None / Unset"
                    }
                  />
                  {user.subdivision ? (
                    <FactPill label="Region" value={user.subdivision} />
                  ) : null}
                </div>
              </div>

              {/* Role form */}
              <form
                action={updateUserRoleAction}
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="userId" value={user.id} />
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
                <SubmitButton>Save Role</SubmitButton>
              </form>

              {/* Country form */}
              <form
                action={updateUserCountryAdminAction}
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="userId" value={user.id} />
                <FieldLabel label="Country">
                  <select
                    name="countryCode"
                    defaultValue={user.countryCode ?? ""}
                    className={inputClass}
                  >
                    <option value="">🌐 None / Unset</option>
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <SubmitButton>Save Country</SubmitButton>
              </form>
            </SectionPanel>
          );
        })}
      </section>
    </div>
  );
}
