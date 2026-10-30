import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Key, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBetaKeysSchema } from "@/lib/ensure-beta-keys-schema";
import { AdminBetaKeysManager, type SerializedBetaKey } from "@/components/admin-beta-keys-manager";

export const metadata: Metadata = {
  title: "Beta Keys Manager — NDL Admin",
  description: "Generate and manage single-use Beta Invite Keys for testers.",
};

export default async function AdminBetaKeysPage() {
  await requireAdmin();
  await ensureBetaKeysSchema();

  let keys: SerializedBetaKey[] = [];

  try {
    const rawKeys = await prisma.betaInviteKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        redeemedBy: {
          select: {
            id: true,
            playerName: true,
            displayName: true,
            discordUsername: true,
          },
        },
      },
    });

    keys = rawKeys.map((k) => ({
      id: k.id,
      key: k.key,
      notes: k.notes,
      isRevoked: k.isRevoked,
      expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
      redeemedAt: k.redeemedAt ? k.redeemedAt.toISOString() : null,
      redeemedBy: k.redeemedBy
        ? {
            id: k.redeemedBy.id,
            playerName: k.redeemedBy.playerName,
            displayName: k.redeemedBy.displayName,
            discordUsername: k.redeemedBy.discordUsername,
          }
        : null,
      createdAt: k.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to query beta keys:", err);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Navigation header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Admin Console</span>
          </Link>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl flex items-center gap-2.5">
            <Key className="h-7 w-7 text-purple-500" />
            <span>Beta Keys Manager</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create un-shareable single-use invite codes to grant verified testers instant Closed Beta access.
          </p>
        </div>
      </div>

      <AdminBetaKeysManager initialKeys={keys} />
    </div>
  );
}
