"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { SectionPanel } from "@/components/ui";
import { useTranslation } from "@/lib/i18n/use-translation";
import { RULES_TRANSLATIONS } from "@/lib/i18n/rules-translations";

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function RulesViewer({
  defaultContent,
  updatedAtFormatted,
}: {
  defaultContent: string;
  updatedAtFormatted: string;
}) {
  const { lang, t } = useTranslation();

  const activeRules = RULES_TRANSLATIONS[lang] || RULES_TRANSLATIONS.en;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {activeRules.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-zinc-400">
                {activeRules.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-500 transition-colors"
              >
                {activeRules.submitRecord}
              </Link>
              <Link
                href="/suggest-level"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {activeRules.suggestLevel}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionPanel className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Version v1.5 - {updatedAtFormatted}
          </p>
          <div className="mt-6 space-y-6 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {activeRules.rulesSections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2
                  id={sectionId(section.title)}
                  className="pt-6 text-xl font-extrabold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 first:border-t-0 first:pt-0"
                >
                  {section.title}
                </h2>
                <div className="space-y-2">
                  {section.bullets.map((bullet, bIdx) => (
                    <p
                      key={bIdx}
                      className="border-l-2 border-rose-500/60 pl-3.5 text-zinc-600 dark:text-zinc-300"
                    >
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <aside className="space-y-4">
          <SectionPanel className="p-5 lg:sticky lg:top-24">
            <h2 className="border-b border-zinc-200 pb-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-white">
              {activeRules.quickLinks}
            </h2>
            <nav
              aria-label="Rules sections"
              className="mt-3 flex flex-wrap gap-2 lg:grid"
            >
              {activeRules.rulesSections.map((sec) => (
                <a
                  key={sec.title}
                  href={`#${sectionId(sec.title)}`}
                  className="inline-flex min-h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-rose-400 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-rose-500 dark:hover:text-white"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/rules/compare"
                className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-rose-400 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-rose-500 dark:hover:text-white"
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                {lang === "pl"
                  ? "Porównaj wersje zasad"
                  : lang === "ru"
                    ? "Сравнить версии правил"
                    : lang === "es"
                      ? "Comparar versiones"
                      : lang === "de"
                        ? "Regelversionen vergleichen"
                        : "Compare rule versions"}
              </Link>
            </div>
          </SectionPanel>
        </aside>
      </section>
    </div>
  );
}
