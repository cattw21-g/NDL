"use client";

import { useEffect, useState, useCallback } from "react";
import { TRANSLATIONS, type SupportedLanguage, type TranslationDictionary } from "./translations";

export function useTranslation() {
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ndl_lang") as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }

    function handleLangChange(e: Event) {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail && TRANSLATIONS[customEvent.detail]) {
        setLang(customEvent.detail);
      }
    }

    window.addEventListener("ndl_language_change", handleLangChange);
    return () => {
      window.removeEventListener("ndl_language_change", handleLangChange);
    };
  }, []);

  const t = useCallback(
    (key: keyof TranslationDictionary | string, fallback?: string): string => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      if (key in dict) {
        return dict[key as keyof TranslationDictionary];
      }
      const enDict = TRANSLATIONS.en;
      if (key in enDict) {
        return enDict[key as keyof TranslationDictionary];
      }
      return fallback ?? String(key);
    },
    [lang]
  );

  const changeLanguage = useCallback((newLang: SupportedLanguage) => {
    setLang(newLang);
    try {
      localStorage.setItem("ndl_lang", newLang);
      document.cookie = `ndl_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;

      // Set Google Translate target
      const targetTrans = newLang === "en" ? "/en/en" : `/en/${newLang}`;
      document.cookie = `googtrans=${targetTrans}; path=/; max-age=31536000; SameSite=Lax`;

      const host = window.location.hostname;
      if (host && host !== "localhost") {
        document.cookie = `googtrans=${targetTrans}; domain=.${host}; path=/; max-age=31536000; SameSite=Lax`;
        const parts = host.split(".");
        if (parts.length > 2) {
          const rootDomain = parts.slice(-2).join(".");
          document.cookie = `googtrans=${targetTrans}; domain=.${rootDomain}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent("ndl_language_change", { detail: newLang }));

    // Try Google Translate combo element
    try {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        combo.value = newLang;
        combo.dispatchEvent(new Event("change"));
      }
    } catch {}

    // Smooth page reload to apply full language translation across all cards, tables, and server content
    window.location.reload();
  }, []);

  return {
    t,
    lang,
    changeLanguage,
    isLoaded: mounted,
  };
}
