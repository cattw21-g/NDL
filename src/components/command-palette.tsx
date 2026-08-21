"use client";

import {
  ArrowRight,
  BookOpen,
  Newspaper,
  Search,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cx } from "@/components/ui";

export type SearchableItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: "Level" | "Navigation" | "Rules" | "News";
  href: string;
  badge?: string;
};

const DEFAULT_ACTIONS: SearchableItem[] = [
  {
    id: "nav-home",
    title: "Ranked Demonlist",
    subtitle: "Browse the official ranked levels",
    category: "Navigation",
    href: "/",
  },
  {
    id: "nav-players",
    title: "Player Leaderboard",
    subtitle: "View community player rankings and scores",
    category: "Navigation",
    href: "/players",
  },
  {
    id: "nav-submit",
    title: "Submit a Record",
    subtitle: "Submit video proof for an NDL level",
    category: "Navigation",
    href: "/submit",
  },
  {
    id: "nav-suggest",
    title: "Suggest a Level",
    subtitle: "Submit a nerfed demon with verification proof",
    category: "Navigation",
    href: "/suggest-level",
  },
  {
    id: "nav-rules",
    title: "Official Rules",
    subtitle: "Guidelines for proof, CBF, recording, and nerfs",
    category: "Navigation",
    href: "/rules",
  },
  {
    id: "nav-news",
    title: "News & Changelog",
    subtitle: "Read the latest NDL release updates",
    category: "Navigation",
    href: "/changelog",
  },
];

type LevelApiResponse = {
  slug: string;
  name: string;
  rank: number | null;
  publisher: string;
  nerfCreator: string;
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [levelItems, setLevelItems] = useState<SearchableItem[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch quick levels for search on first open
  useEffect(() => {
    if (isOpen && levelItems.length === 0) {
      fetch("/api/public/levels")
        .then((res) => res.json())
        .then((data: LevelApiResponse[]) => {
          if (Array.isArray(data)) {
            const items: SearchableItem[] = data.map((l) => ({
              id: `level-${l.slug}`,
              title: l.name,
              subtitle: `Rank #${l.rank ?? "-"} • ${l.publisher} (Nerfed by ${l.nerfCreator})`,
              category: "Level",
              href: `/levels/${l.slug}`,
              badge: l.rank ? `#${l.rank}` : "Legacy",
            }));
            setLevelItems(items);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, levelItems.length]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (!next) {
            setQuery("");
          }
          return next;
        });
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const allItems = useMemo(() => {
    return [...levelItems, ...DEFAULT_ACTIONS];
  }, [levelItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return DEFAULT_ACTIONS;
    }
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [allItems, query]);

  // Arrow key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      const target = filtered[selectedIndex];
      setIsOpen(false);
      setQuery("");
      router.push(target.href);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search levels, players, rules, or actions..."
            className="flex-1 bg-transparent px-3 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-50"
          />
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length > 0 ? (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleClose}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cx(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition",
                    isSelected
                      ? "bg-cyan-50 text-cyan-950 dark:bg-cyan-950/50 dark:text-cyan-100"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.category === "Level" ? (
                        <Trophy className="h-4 w-4 text-amber-500" />
                      ) : item.category === "Rules" ? (
                        <BookOpen className="h-4 w-4 text-cyan-600" />
                      ) : item.category === "News" ? (
                        <Newspaper className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-black text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                        {item.badge ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.2 text-xs font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                      {item.subtitle ? (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {isSelected ? "Press Enter ↵" : item.category}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm font-semibold text-slate-500">
              No matching levels or actions found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
          <span>Navigate with ↑ ↓ keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteTrigger() {
  const trigger = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );
  };

  return (
    <button
      type="button"
      onClick={trigger}
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:border-cyan-400 hover:bg-white hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:bg-slate-950"
    >
      <Search className="h-3.5 w-3.5 text-slate-400" />
      <span className="hidden sm:inline">Quick Search...</span>
      <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        Ctrl+K
      </kbd>
    </button>
  );
}
