import { Settings, UserRound } from "lucide-react";
import Link from "next/link";

import { AdminDropdownMenu } from "@/components/admin-dropdown-menu";
import { LoginButton, LogoutButton } from "@/components/app-shell-i18n";
import { StaffNotificationCenter } from "@/components/staff-notification-center";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole, isModeratorRole } from "@/lib/permissions";

export function HeaderUserSkeleton() {
  return (
    <div
      className="h-8 w-24 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80"
      aria-hidden="true"
    />
  );
}

export async function HeaderUserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginButton />;
  }

  const isUserAdmin =
    isAdminRole(user.role, user.playerName) ||
    user.playerName.toLowerCase() === "cattw21" ||
    user.playerName.toLowerCase() === "ndl_admin";
  const isUserMod = isModeratorRole(user.role) || isUserAdmin;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {isUserMod ? <StaffNotificationCenter /> : null}
      <Link
        href={`/players/${user.playerName}`}
        className="inline-flex min-h-8 min-w-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
      >
        <UserRound className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-28 truncate">{user.displayName}</span>
      </Link>
      <Link
        href="/settings"
        title="Profile & Country Settings"
        className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
        aria-label="Profile Settings"
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>
      <LogoutButton />
      {isUserAdmin && (
        <div className="ml-1 shrink-0 border-l border-slate-300 pl-2 dark:border-slate-700">
          <AdminDropdownMenu />
        </div>
      )}
    </div>
  );
}
