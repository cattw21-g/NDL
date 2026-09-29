import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { completeGoogleSignupAction } from "@/actions/google-signup";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, inputClass, SectionPanel } from "@/components/ui";
import { GOOGLE_SETUP_COOKIE, readGoogleSignupToken } from "@/lib/google-signup";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CompleteGoogleSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const pending = readGoogleSignupToken((await cookies()).get(GOOGLE_SETUP_COOKIE)?.value);
  if (!pending) redirect("/login?error=Google%20setup%20expired.%20Please%20sign%20in%20again.");
  const existingUser = pending.existingUserId
    ? await prisma.user.findUnique({ where: { id: pending.existingUserId }, select: { email: true, playerName: true } })
    : null;
  if (pending.existingUserId && (!existingUser || existingUser.email !== pending.email)) {
    redirect("/login?error=Google%20setup%20expired.%20Please%20sign%20in%20again.");
  }
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg py-8">
      <SectionPanel className="space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Choose your username</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {existingUser
              ? "Your current username is filled in. Keep it or choose a new one for this one-time Google setup."
              : "Your Google email is verified. Pick the name players will see on Nerfed Demonlist."}
          </p>
        </div>
        {params.error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">
            {params.error}
          </p>
        ) : null}
        <form action={completeGoogleSignupAction} className="space-y-4">
          <FieldLabel label="Username">
            <input
              name="playerName"
              type="text"
              autoComplete="username"
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9_-]+"
              required
              autoFocus
              defaultValue={existingUser?.playerName ?? ""}
              className={inputClass}
            />
          </FieldLabel>
          <p className="text-xs text-slate-500 dark:text-slate-400">2–32 letters, numbers, underscores, or dashes. You cannot change this later.</p>
          <SubmitButton className="w-full">{existingUser ? "Continue with this username" : "Create my account"}</SubmitButton>
        </form>
        <Link href="/login" className="block text-center text-sm font-semibold text-cyan-700 dark:text-cyan-300">Cancel</Link>
      </SectionPanel>
    </div>
  );
}
