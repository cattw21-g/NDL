"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { LANGUAGES, type SupportedLanguage } from "@/lib/i18n/translations";

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ndl_lang") as SupportedLanguage;
    if (saved && (saved === "en" || saved === "ru" || saved === "es" || saved === "de" || saved === "pl")) {
      setCurrentLang(saved);
    }
  }, []);

  function handleLanguageChange(lang: SupportedLanguage) {
    setCurrentLang(lang);
    localStorage.setItem("ndl_lang", lang);
    window.dispatchEvent(new CustomEvent("ndl_language_change", { detail: lang }));
  }

  if (!mounted) {
    return (
      <div className="flex h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <Globe className="h-3.5 w-3.5" />
        <span>EN</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentLang}
        aria-label="Select website language"
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className="h-9 rounded-md border border-slate-300 bg-white pl-2 pr-6 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
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
