import Link from "next/link";

import { loginAction } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, inputClass, SectionPanel } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <h1 className="text-4xl font-black leading-tight text-slate-950">
          Login
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Use a player, moderator, or admin account to submit records and manage
          review workflows. New player accounts must verify email before login.
        </p>
        <div className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-800 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100">
          Demo local accounts are created only by `npm.cmd run db:seed:demo`.
          Safe seeding can also bootstrap an environment admin.
        </div>
      </section>

      <form action={loginAction}>
        <SectionPanel className="space-y-4 p-5">
          {params.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200">
              {params.error}
            </p>
          ) : null}
          <FieldLabel label="Email">
            <input name="email" type="email" required className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Password">
            <input
              name="password"
              type="password"
              required
              className={inputClass}
            />
          </FieldLabel>
          <SubmitButton className="w-full">Login</SubmitButton>
          <p className="text-sm text-slate-600">
            Need a player account?{" "}
            <Link href="/register" className="font-black text-cyan-800">
              Register
            </Link>
          </p>
        </SectionPanel>
      </form>
    </div>
  );
}
