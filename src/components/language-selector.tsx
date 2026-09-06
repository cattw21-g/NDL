"use client";

import { Globe } from "lucide-react";
import { LANGUAGES, type SupportedLanguage } from "@/lib/i18n/translations";
import { useTranslation } from "@/lib/i18n/use-translation";

export function LanguageSelector() {
  const { lang, changeLanguage, isLoaded } = useTranslation();

  if (!isLoaded) {
    return (
      <div className="flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <Globe className="h-3.5 w-3.5" />
        <span>EN</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={lang}
        aria-label="Select website language"
        onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
        className="h-8 rounded-md border border-slate-300 bg-white pl-2 pr-6 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
