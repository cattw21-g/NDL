"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Unlink, ExternalLink, ShieldCheck, KeyRound } from "lucide-react";
import { linkDiscordWithCodeAction, unlinkDiscordAccountAction } from "@/actions/discord-link";

export function DiscordLinkCard({
  isOwner,
  discordUserId,
  discordUsername,
}: {
  isOwner: boolean;
  discordUserId?: string | null;
  discordUsername?: string | null;
  discordLinkedAt?: Date | string | null;
}) {
  const searchParams = useSearchParams();
  const [isCodeInputOpen, setIsCodeInputOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const queryMessage = searchParams.get("discord_linked") === "1"
    ? { text: "🎉 Discord account successfully connected with OAuth2! Your roles are now synchronized.", type: "success" as const }
    : searchParams.get("discord_error")
      ? { text: `❌ Discord connection error: ${searchParams.get("discord_error")}`, type: "error" as const }
      : null;

  const statusMessage = actionMessage || queryMessage;

  if (!isOwner && !discordUserId) {
    return null;
  }

  const isLinked = Boolean(discordUserId);

  async function handleCodeLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("verificationCode", codeInput);

    try {
      const res = await linkDiscordWithCodeAction({ status: "idle" }, formData);
      if (res.status === "success") {
        setActionMessage({ text: res.message || "Linked!", type: "success" });
        setIsCodeInputOpen(false);
        setCodeInput("");
      } else {
        setActionMessage({ text: res.message || "Failed to link", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    if (!confirm("Are you sure you want to unlink your Discord account?")) return;
    setLoading(true);
    try {
      await unlinkDiscordAccountAction();
      setActionMessage({ text: "Discord account unlinked.", type: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#5865F2]/40 bg-gradient-to-br from-[#5865F2]/10 via-[#5865F2]/5 to-transparent p-4 dark:border-[#5865F2]/50 dark:bg-[#5865F2]/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#5865F2] text-white shadow-sm">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <span>Discord OAuth2 Integration</span>
              {isLinked ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Not Linked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isLinked
                ? `Linked Discord Account: ${discordUsername ? `@${discordUsername}` : `ID ${discordUserId}`} • Automated Roles Active`
                : "Authorize with Discord to automatically receive your Top 10/50/100, Victor, and Player roles!"}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            {isLinked ? (
              <button
                type="button"
                onClick={handleUnlink}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Unlink className="h-3.5 w-3.5" />
                Unlink Discord
              </button>
            ) : (
              <>
                <a
                  href="/api/auth/discord/login"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-4 py-2 text-xs font-black text-white shadow-md transition hover:bg-[#4752c4] active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Connect with Discord (1-Click)
                </a>
                <button
                  type="button"
                  onClick={() => setIsCodeInputOpen(!isCodeInputOpen)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <KeyRound className="h-3 w-3" />
                  {isCodeInputOpen ? "Close" : "Use Code"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isOwner && isCodeInputOpen && !isLinked && (
        <form onSubmit={handleCodeLink} className="mt-4 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800/60">
            <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-[#5865F2]" />
              Link via Discord Code:
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Click <strong>&quot;🔗 Link NDL Account&quot;</strong> in <strong>#🎭・roles</strong> on Discord to get a 1-time verification code and enter it below:
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Verification Code:
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                placeholder="e.g. NDL-8931"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                required
                className="flex-1 uppercase font-mono tracking-wider rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#5865F2] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#4752c4] disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Link"}
              </button>
            </div>
          </div>
        </form>
      )}

      {statusMessage && (
        <p
          className={`mt-3 text-xs font-bold ${
            statusMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {statusMessage.text}
        </p>
      )}
    </div>
  );
}
