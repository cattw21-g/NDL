import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteUserAsAdminAction } from "@/actions/admin-user-deletion";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, inputClass, SectionPanel } from "@/components/ui";
import { isCurrentSessionRecent, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "session-expired": "For security, sign out and sign back in before deleting an account.",
  "invalid-confirmation": "Type the exact confirmation and check the box.",
  missing: "That account no longer exists.",
  changed: "The account's username changed. Reload this page before trying again.",
  self: "Use Settings to delete your own account.",
  "last-admin": "At least one admin account must remain.",
  protected: "This system account owns shared site content and cannot be deleted.",
  "delete-failed": "The account was not deleted. Please try again or check the server logs.",
};

export default async function AdminDeleteUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  const [{ id }, query, recent] = await Promise.all([params, searchParams, isCurrentSessionRecent()]);
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, playerName: true, displayName: true, role: true },
  });
  if (!target) notFound();

  const canDelete = recent && target.id !== admin.id && target.email !== "deleted-account@nerfeddemonlist.invalid";
  const confirmation = `DELETE @${target.playerName}`;

  return (
    <div className="mx-auto max-w-xl py-8">
      <SectionPanel className="space-y-5 border-red-500/40 p-6">
        <div>
          <h1 className="text-2xl font-black text-red-700 dark:text-red-300">Delete user account</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            This permanently deletes the account, sessions, records, submissions, and applications. Levels and shared staff content remain. The action is recorded in the admin audit log.
          </p>
        </div>
        <div className="rounded-md border border-slate-300 p-3 text-sm dark:border-slate-700">
          <p className="font-bold">{target.displayName} (@{target.playerName})</p>
          <p>{target.email}</p>
          <p>Role: {target.role}</p>
        </div>
        {query.error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">
            {errorMessages[query.error] ?? "The account could not be deleted."}
          </p>
        ) : null}
        {!recent ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">Sign out and sign back in, then return here within 15 minutes.</p>
        ) : target.id === admin.id ? (
          <p className="text-sm">To delete your own account, use <Link href="/settings/delete-account" className="font-bold text-cyan-700 dark:text-cyan-300">Settings</Link>.</p>
        ) : target.email === "deleted-account@nerfeddemonlist.invalid" ? (
          <p className="text-sm">This system account cannot be deleted.</p>
        ) : null}
        {canDelete ? (
          <form action={deleteUserAsAdminAction} className="space-y-4">
            <input type="hidden" name="userId" value={target.id} />
            <input type="hidden" name="playerName" value={target.playerName} />
            <FieldLabel label={`Type ${confirmation} to confirm`}>
              <input name="confirmation" type="text" autoComplete="off" required className={inputClass} />
            </FieldLabel>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input name="understood" value="yes" type="checkbox" required className="mt-1" />
              I understand this cannot be undone and this user&apos;s records and applications will be removed.
            </label>
            <SubmitButton className="w-full border-red-700 bg-red-700 text-white hover:bg-red-800 dark:border-red-600 dark:bg-red-600 dark:text-white dark:hover:bg-red-700">
              Permanently delete account
            </SubmitButton>
          </form>
        ) : null}
        <Link href="/admin/users" className="block text-center text-sm font-semibold text-cyan-700 dark:text-cyan-300">Back to users</Link>
      </SectionPanel>
    </div>
  );
}
