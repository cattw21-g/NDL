import { MailCheck, RefreshCw } from "lucide-react";
import Link from "next/link";

import {
  resendVerificationAction,
  verifyEmailCodeAction,
} from "@/actions/verification";
import { SubmitButton } from "@/components/submit-button";
import {
  Eyebrow,
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { verificationStatusFromParams } from "@/lib/verification-status";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const status = verificationStatusFromParams(params);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <div className="space-y-5">
        <PageHeader
          eyebrow={<Eyebrow icon={MailCheck}>Email verification</Eyebrow>}
          title="Verify your account"
          description="Player accounts must verify email before login, record submission, and private submission access."
        />

        {status ? (
          <StatusPanel tone={status.tone}>
            {status.showLoginLink ? (
              <>
                Email verified successfully. You can now{" "}
                <Link href="/login" className="font-black underline">
                  log in
                </Link>
                .
              </>
            ) : (
              status.message
            )}
          </StatusPanel>
        ) : null}
      </div>

      <div className="space-y-4">
        <form action={verifyEmailCodeAction}>
          <SectionPanel className="space-y-4 p-5">
            <h2 className="text-xl font-black text-slate-950">
              Enter verification code
            </h2>
            <FieldLabel label="Email">
              <input
                name="email"
                type="email"
                defaultValue={email}
                required
                className={inputClass}
              />
            </FieldLabel>
            <FieldLabel label="Six digit code">
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                className={inputClass}
              />
            </FieldLabel>
            <SubmitButton className="w-full">Verify email</SubmitButton>
          </SectionPanel>
        </form>

        <form action={resendVerificationAction}>
          <SectionPanel className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-cyan-800" />
              <h2 className="text-xl font-black text-slate-950">
                Resend verification
              </h2>
            </div>
            <FieldLabel label="Email">
              <input
                name="email"
                type="email"
                defaultValue={email}
                required
                className={inputClass}
              />
            </FieldLabel>
            <SubmitButton className="w-full">Send a new code</SubmitButton>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              If the email is not in your inbox, check spam/junk.
            </p>
          </SectionPanel>
        </form>
      </div>
    </div>
  );
}

function StatusPanel({
  tone,
  children,
}: {
  tone: "amber" | "cyan" | "emerald" | "red";
  children: React.ReactNode;
}) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-100",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100",
    red: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-100",
  }[tone];

  return (
    <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${toneClass}`}>
      {children}
    </div>
  );
}
