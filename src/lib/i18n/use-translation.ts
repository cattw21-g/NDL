"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TRANSLATIONS, type SupportedLanguage, type TranslationDictionary } from "./translations";

const emptySubscribe = () => () => {};

function subscribeLang(callback: () => void) {
  window.addEventListener("ndl_language_change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("ndl_language_change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getLangSnapshot(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem("ndl_lang") as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch {
    // Ignore storage restrictions
  }
  return "en";
}

function getServerLangSnapshot(): SupportedLanguage {
  return "en";
}

export function useTranslation() {
  const isLoaded = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const lang = useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    getServerLangSnapshot,
  );

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
    [lang],
  );

  const changeLanguage = useCallback((newLang: SupportedLanguage) => {
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
    } catch {
      // Ignore cookie errors
    }

    window.dispatchEvent(new CustomEvent("ndl_language_change", { detail: newLang }));

    // Try Google Translate combo element
    try {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        combo.value = newLang;
        combo.dispatchEvent(new Event("change"));
      }
    } catch {
      // Ignore combo errors
    }

    // Smooth page reload to apply full language translation across all cards, tables, and server content
    window.location.reload();
  }, []);

  return {
    t,
    lang,
    changeLanguage,
    isLoaded,
  };
}
