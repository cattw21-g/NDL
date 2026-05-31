import Link from "next/link";

import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, inputClass, SectionPanel } from "@/components/ui";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <h1 className="text-4xl font-black leading-tight text-slate-950">
          Create player profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Player accounts can submit records and track pending, accepted,
          rejected, and needs-changes submissions after email verification.
        </p>
      </section>

      <form action={registerAction}>
        <SectionPanel className="space-y-4 p-5">
          {params.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">
              {params.error}
            </p>
          ) : null}
          <FieldLabel label="Email">
            <input name="email" type="email" required className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Player name">
            <input name="playerName" required className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Display name">
            <input name="displayName" required className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Password">
            <input
              name="password"
              type="password"
              minLength={10}
              required
              className={inputClass}
            />
          </FieldLabel>
          <SubmitButton className="w-full">Register</SubmitButton>
          <p className="text-sm leading-6 text-slate-600">
            Registration sends a verification link and six digit code. In local
            development, NDL prints them to the terminal if SMTP is not set.
          </p>
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-black text-cyan-800">
              Login
            </Link>
          </p>
        </SectionPanel>
      </form>
    </div>
  );
}
