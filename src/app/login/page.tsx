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
        <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-slate-50">
          Login
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          Use your verified player, moderator, or admin account to manage records,
          submissions, and review workflows.
        </p>
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
          <div className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-black text-cyan-800 dark:text-cyan-300"
            >
              Forgot password?
            </Link>
          </div>
          <SubmitButton className="w-full">Login</SubmitButton>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <span className="relative bg-white px-2 text-xs font-bold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Or
            </span>
          </div>

          <a
            href="/api/auth/google"
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </a>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Need a player account?{" "}
            <Link
              href="/register"
              className="font-black text-cyan-800 dark:text-cyan-300"
            >
              Register
            </Link>
          </p>
        </SectionPanel>
      </form>
    </div>
  );
}
