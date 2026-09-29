import Link from "next/link";

import { deleteOwnAccountAction } from "@/actions/account-deletion";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, inputClass, SectionPanel } from "@/components/ui";
import { isCurrentSessionRecent, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const [params, recent] = await Promise.all([searchParams, isCurrentSessionRecent()]);

  return (
    <div className="mx-auto max-w-xl py-8">
      <SectionPanel className="space-y-5 border-red-500/40 p-6">
        <div>
          <h1 className="text-2xl font-black text-red-700 dark:text-red-300">Delete your account</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            This permanently removes your profile, login, sessions, records, record submissions, staff applications, and personal settings. Your levels and shared staff openings stay on the site. Moderation audit history may be retained.
          </p>
        </div>

        {params.error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">{params.error}</p>
        ) : null}

        {!recent ? (
          <p className="rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            For security, sign out and sign in again, then return here within 15 minutes to delete your account.
          </p>
        ) : (
          <form action={deleteOwnAccountAction} className="space-y-4">
            <FieldLabel label={`Type DELETE ${user.playerName} to confirm`}>
              <input name="confirmation" type="text" autoComplete="off" required className={inputClass} />
            </FieldLabel>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input name="understood" value="yes" type="checkbox" required className="mt-1" />
              I understand this cannot be undone and my records and applications will be removed.
            </label>
            <SubmitButton className="w-full border-red-700 bg-red-700 text-white hover:bg-red-800 dark:border-red-600 dark:bg-red-600 dark:text-white dark:hover:bg-red-700">
              Permanently delete my account
            </SubmitButton>
          </form>
        )}
        <Link href="/settings" className="block text-center text-sm font-semibold text-cyan-700 dark:text-cyan-300">Keep my account</Link>
      </SectionPanel>
    </div>
  );
}
