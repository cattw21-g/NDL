import {
  updateUserCountryAdminAction,
  updateUserRoleAction,
} from "@/actions/admin";
import { PageMessage } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import {
  EmptyState,
  FactPill,
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAllCountries, getCountryMeta } from "@/lib/countries";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const roles = ["ADMIN", "MODERATOR", "PLAYER"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const roleFilter = typeof params.role === "string" ? params.role.trim().toUpperCase() : "";

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { playerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (roleFilter && roles.includes(roleFilter)) {
    where.role = roleFilter as "ADMIN" | "MODERATOR" | "PLAYER";
  }

  const [totalUsers, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { displayName: "asc" }],
      take: 100,
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

      <SectionPanel className="p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel label="Search Users">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by name, handle, or email..."
                className={inputClass}
              />
            </FieldLabel>
          </div>
          <div className="w-full sm:w-48">
            <FieldLabel label="Role Filter">
              <select name="role" defaultValue={roleFilter} className={inputClass}>
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>
        <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Filter
            </button>
            {(q || roleFilter) && (
              <a
                href="/admin/users"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Reset
              </a>
            )}
          </div>
        </form>
        <div className="mt-3 text-xs text-slate-400">
          Showing {users.length} of {totalUsers} user{totalUsers === 1 ? "" : "s"} (capped at 100 per query)
        </div>
      </SectionPanel>

      <section className="space-y-3">
        {users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try refining your search query or role filter."
          />
        ) : (
          users.map((user) => {
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
        }))}
      </section>
    </div>
  );
}
