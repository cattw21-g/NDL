"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Ban,
  Clock,
  UserCheck,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { SectionPanel } from "@/components/ui";
import {
  generateBetaKeysAction,
  revokeBetaKeyAction,
  deleteBetaKeyAction,
  type BetaKeyActionResult,
} from "@/actions/beta-keys";

export interface SerializedBetaKey {
  id: string;
  key: string;
  notes: string | null;
  isRevoked: boolean;
  expiresAt: string | null;
  redeemedAt: string | null;
  redeemedBy: {
    id: string;
    playerName: string;
    displayName: string;
    discordUsername: string | null;
  } | null;
  createdAt: string;
}

interface AdminBetaKeysManagerProps {
  initialKeys: SerializedBetaKey[];
}

export function AdminBetaKeysManager({ initialKeys }: AdminBetaKeysManagerProps) {
  const [keys, setKeys] = useState<SerializedBetaKey[]>(initialKeys);
  const [filter, setFilter] = useState<"all" | "unused" | "redeemed" | "revoked">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("0");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalKeys = keys.length;
  const unusedKeys = keys.filter((k) => !k.redeemedBy && !k.isRevoked).length;
  const redeemedKeys = keys.filter((k) => k.redeemedBy && !k.isRevoked).length;
  const revokedKeys = keys.filter((k) => k.isRevoked).length;

  const filteredKeys = keys.filter((k) => {
    if (filter === "unused") return !k.redeemedBy && !k.isRevoked;
    if (filter === "redeemed") return Boolean(k.redeemedBy) && !k.isRevoked;
    if (filter === "revoked") return k.isRevoked;
    return true;
  });

  const handleCopy = (keyText: string) => {
    void navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("count", generateCount);
    if (notes) formData.append("notes", notes);
    if (expiresInDays !== "0") formData.append("expiresInDays", expiresInDays);

    startTransition(async () => {
      const res: BetaKeyActionResult = await generateBetaKeysAction(formData);
      if (res.success) {
        setMessage({ text: res.message || "Keys generated!", type: "success" });
        setIsGenerating(false);
        setNotes("");
        // Optimistic refresh
        window.location.reload();
      } else {
        setMessage({ text: res.error || "Failed to generate keys.", type: "error" });
      }
    });
  };

  const handleRevoke = (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this Beta Key? If redeemed, the user's tester role will be removed.")) {
      return;
    }

    const formData = new FormData();
    formData.append("keyId", keyId);

    startTransition(async () => {
      const res = await revokeBetaKeyAction(formData);
      if (res.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, isRevoked: true } : k)),
        );
        setMessage({ text: "Beta Key revoked.", type: "success" });
      } else {
        setMessage({ text: res.error || "Failed to revoke key.", type: "error" });
      }
    });
  };

  const handleDelete = (keyId: string) => {
    if (!confirm("Delete this unused Beta Key?")) return;

    const formData = new FormData();
    formData.append("keyId", keyId);

    startTransition(async () => {
      const res = await deleteBetaKeyAction(formData);
      if (res.success) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
        setMessage({ text: "Beta Key deleted.", type: "success" });
      } else {
        setMessage({ text: res.error || "Failed to delete key.", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {message && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold flex items-center justify-between ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Counter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SectionPanel className="p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Keys
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {totalKeys}
          </p>
        </SectionPanel>

        <SectionPanel className="p-4 text-center border-emerald-500/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Available
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {unusedKeys}
          </p>
        </SectionPanel>

        <SectionPanel className="p-4 text-center border-purple-500/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Redeemed
          </p>
          <p className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
            {redeemedKeys}
          </p>
        </SectionPanel>

        <SectionPanel className="p-4 text-center border-rose-500/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Revoked
          </p>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {revokedKeys}
          </p>
        </SectionPanel>
      </div>

      {/* Generation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-500" />
            <span>Single-Use Beta Invite Keys</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Each key is single-use, burned immediately upon redemption, and permanently bound to that tester’s account.
          </p>
        </div>

        <button
          onClick={() => setIsGenerating((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isGenerating ? "Close Generator" : "Generate Keys"}</span>
        </button>
      </div>

      {/* Generator Form Modal / Panel */}
      {isGenerating && (
        <form
          onSubmit={handleGenerate}
          className="space-y-4 rounded-2xl border border-purple-500/40 bg-purple-50/40 p-5 backdrop-blur-sm dark:border-purple-500/30 dark:bg-purple-950/20"
        >
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Generate New Beta Keys
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Quantity
              </label>
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="1">1 Key (Individual tester)</option>
                <option value="5">5 Keys (Small wave)</option>
                <option value="10">10 Keys (Standard wave)</option>
                <option value="25">25 Keys (Large wave)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Expiration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="0">Never Expires</option>
                <option value="7">Expires in 7 Days</option>
                <option value="14">Expires in 14 Days</option>
                <option value="30">Expires in 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Notes / Purpose (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Wave 1 Discord testers, Nexus"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGenerating(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
            >
              {isPending ? "Generating..." : "Generate Keys"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-bold dark:border-slate-800">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 transition ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          All ({totalKeys})
        </button>
        <button
          onClick={() => setFilter("unused")}
          className={`rounded-lg px-3 py-1.5 transition ${
            filter === "unused"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Available ({unusedKeys})
        </button>
        <button
          onClick={() => setFilter("redeemed")}
          className={`rounded-lg px-3 py-1.5 transition ${
            filter === "redeemed"
              ? "bg-purple-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Redeemed ({redeemedKeys})
        </button>
        <button
          onClick={() => setFilter("revoked")}
          className={`rounded-lg px-3 py-1.5 transition ${
            filter === "revoked"
              ? "bg-rose-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Revoked ({revokedKeys})
        </button>
      </div>

      {/* Keys Table */}
      {filteredKeys.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invite Key</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Redeemed By</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredKeys.map((item) => {
                  const isRedeemed = Boolean(item.redeemedBy);
                  const isExpired =
                    Boolean(item.expiresAt) &&
                    new Date(item.expiresAt!) < new Date();

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Key Code with Copy Button */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black tracking-wider text-slate-900 dark:text-slate-100">
                            {item.key}
                          </span>
                          {!item.isRevoked && !isRedeemed && (
                            <button
                              onClick={() => handleCopy(item.key)}
                              title="Copy Beta Key"
                              className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {copiedKey === item.key ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {item.isRevoked ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
                            <Ban className="h-3 w-3" />
                            Revoked
                          </span>
                        ) : isRedeemed ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                            <UserCheck className="h-3 w-3" />
                            Redeemed
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-3 w-3" />
                            Available
                          </span>
                        )}
                      </td>

                      {/* Redeemed By */}
                      <td className="px-4 py-3">
                        {item.redeemedBy ? (
                          <div>
                            <Link
                              href={`/players/${item.redeemedBy.playerName}`}
                              className="font-bold text-purple-600 hover:underline dark:text-purple-400"
                            >
                              @{item.redeemedBy.playerName}
                            </Link>
                            {item.redeemedBy.discordUsername && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                {item.redeemedBy.discordUsername}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400">
                              {item.redeemedAt
                                ? new Date(item.redeemedAt).toLocaleDateString()
                                : null}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.notes || <span className="text-slate-400">—</span>}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!item.isRevoked && (
                            <button
                              onClick={() => handleRevoke(item.id)}
                              disabled={isPending}
                              title="Revoke Key"
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                            >
                              <Ban className="h-3 w-3" />
                              <span>Revoke</span>
                            </button>
                          )}
                          {!isRedeemed && !item.isRevoked && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                              title="Delete Unused Key"
                              className="inline-flex items-center gap-1 rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <SectionPanel className="p-8 text-center text-slate-500 dark:text-slate-400">
          <Key className="mx-auto h-8 w-8 opacity-40 mb-2" />
          <p className="font-bold text-sm">No Beta Keys found.</p>
          <p className="text-xs mt-1">
            Click &quot;Generate Keys&quot; above to create single-use invite codes for your testers.
          </p>
        </SectionPanel>
      )}
    </div>
  );
}
