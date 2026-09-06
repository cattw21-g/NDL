import Link from "next/link";
import { Users, Hammer, Sparkles, ShieldCheck } from "lucide-react";

type Credit = {
  name: string;
  role: string;
};

function parseCreatorCredits(raw: string): Credit[] {
  if (!raw || !raw.trim()) return [];

  // Check if JSON
  if (raw.trim().startsWith("[") && raw.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          name: String(item.name || item.creator || ""),
          role: String(item.role || "Creator"),
        }));
      }
    } catch {}
  }

  // Check format: "Name (Role), Name (Role)" or "Name, Name"
  const parts = raw.split(/[,&/]/).map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^(.+?)\s*\((.+?)\)$/);
    if (match && match[1] && match[2]) {
      return {
        name: match[1].trim(),
        role: match[2].trim(),
      };
    }
    return {
      name: part,
      role: "Creator",
    };
  });
}

const roleBadges: Record<string, { bg: string; text: string }> = {
  host: { bg: "bg-purple-500/20 border-purple-500/40", text: "text-purple-300" },
  nerfer: { bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-300" },
  decorator: { bg: "bg-cyan-500/20 border-cyan-500/40", text: "text-cyan-300" },
  builder: { bg: "bg-blue-500/20 border-blue-500/40", text: "text-blue-300" },
  verifier: { bg: "bg-emerald-500/20 border-emerald-500/40", text: "text-emerald-300" },
};

export function MultipleCreatorCredits({
  nerfCreator,
  publisher,
}: {
  nerfCreator: string;
  publisher: string;
}) {
  const credits = parseCreatorCredits(nerfCreator);

  // If only 1 simple credit matching publisher or simple string without roles
  if (credits.length <= 1 && !nerfCreator.includes("(")) {
    return (
      <span className="font-bold text-slate-900 dark:text-slate-100">
        {nerfCreator || publisher || "Unknown"}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {credits.map((c, i) => {
        const lowerRole = c.role.toLowerCase();
        const badgeStyle = roleBadges[lowerRole] || {
          bg: "bg-zinc-800 border-zinc-700",
          text: "text-zinc-300",
        };

        return (
          <span
            key={`${c.name}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <span>{c.name}</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-black uppercase border ${badgeStyle.bg} ${badgeStyle.text}`}
            >
              {c.role}
            </span>
          </span>
        );
      })}
    </div>
  );
}
