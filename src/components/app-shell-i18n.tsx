"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";
import { logoutAction } from "@/actions/auth";

export function HeaderTagline() {
  const { t } = useTranslation();
  return (
    <span className="hidden sm:block truncate text-[11px] font-semibold text-slate-600 dark:text-slate-400">
      {t("tagline", "Community list for reviewed nerfed demon records")}
    </span>
  );
}

export function LoginButton() {
  const { t } = useTranslation();
  return (
    <Link
      href="/login"
      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-cyan-800 bg-cyan-800 px-3 text-xs font-black text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
    >
      <LogIn className="h-3.5 w-3.5" />
      {t("login", "Login")}
    </Link>
  );
}

export function LogoutButton() {
  const { t } = useTranslation();
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-400 dark:hover:bg-red-950 dark:hover:text-red-100"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t("logout", "Logout")}
      </button>
    </form>
  );
}
