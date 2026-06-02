"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerColumns = [
  {
    title: "NDL",
    links: [
      { href: "/", label: "Ranked List" },
      { href: "/rules", label: "Rules" },
      { href: "/players", label: "Players" },
      { href: "/changelog", label: "Changelog" },
      { href: "/news", label: "News" },
    ],
  },
  {
    title: "Submissions",
    links: [
      { href: "/submit", label: "Submit Record" },
      { href: "/suggest-level", label: "Suggest Level" },
      { href: "/level-suggestions", label: "Level Suggestions" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Login" },
      { href: "/register", label: "Register" },
      { href: "/verify-email", label: "Verify Email" },
    ],
  },
] as const;

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/moderation" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative z-10 border-t border-slate-300 bg-white/82 px-3 py-6 text-sm text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-950/72 dark:text-slate-300 sm:px-5">
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-cyan-900 bg-cyan-800 text-xs font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
              <span className="absolute left-0 top-0 h-3 w-3 border-b border-r border-white/35 bg-cyan-400/40" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-l border-t border-white/30 bg-teal-400/30" />
              NDL
            </span>
            <div className="min-w-0">
              <p className="font-black text-slate-950 dark:text-slate-50">
                © 2026 Nerfed Demonlist
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-800 dark:text-cyan-300">
                Community reviewed nerfed demons
              </p>
            </div>
          </div>

          <p className="max-w-2xl leading-6">
            NDL is a community-ranked list for approved nerfed Geometry Dash
            demon versions.
          </p>
          <p className="max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-400">
            Nerfed Demonlist is not affiliated with RobTopGames, Geometry Dash,
            Pointercrate, or the official Demonlist. All level names, creators,
            and related Geometry Dash content belong to their respective owners.
          </p>
          <p className="max-w-3xl text-xs font-bold leading-5 text-slate-600 dark:text-slate-400">
            Rules, rankings, records, and points are maintained by NDL staff and
            may change after review.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={`${column.title} footer links`}>
              <h2 className="border-b border-slate-300 pb-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {column.title}
              </h2>
              <ul className="mt-2 space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex rounded-sm font-bold text-slate-700 transition hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:text-slate-300 dark:hover:text-cyan-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="sm:col-span-3">
            <a
              href="#top"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-100"
            >
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
