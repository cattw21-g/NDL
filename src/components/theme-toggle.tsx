"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { cx } from "@/components/ui";

const themeKey = "ndl-theme";
const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemePreference = (typeof themes)[number]["value"];
const themeChangeEvent = "ndl-theme-change";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function shouldUseDark(theme: ThemePreference) {
  return (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", shouldUseDark(theme));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreference,
    getServerThemePreference,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [theme]);

  function selectTheme(nextTheme: ThemePreference) {
    localStorage.setItem(themeKey, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <div
      className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      aria-label="Theme"
    >
      {themes.map((item) => {
        const Icon = item.icon;
        const active = item.value === theme;

        return (
          <button
            key={item.value}
            type="button"
            aria-label={`${item.label} theme`}
            aria-pressed={active}
            title={`${item.label} theme`}
            onClick={() => selectTheme(item.value)}
            className={cx(
              "inline-flex h-8 w-8 items-center justify-center rounded-sm text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:text-slate-300",
              active
                ? "bg-cyan-800 text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950"
                : "hover:bg-cyan-50 hover:text-cyan-900 dark:hover:bg-cyan-950 dark:hover:text-cyan-100",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function subscribeToThemePreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(themeKey);
  return isThemePreference(stored) ? stored : "light";
}

function getServerThemePreference(): ThemePreference {
  return "light";
}
