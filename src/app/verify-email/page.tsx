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

const errorMessages: Record<string, string> = {
  email:
    "NDL could not send the verification email. Try again later or contact staff.",
  expired: "That verification link or code has expired. Request a new one.",
  invalid: "That verification link is invalid or has already been used.",
  "invalid-code": "Enter the six digit code from your verification email.",
  "invalid-email": "Enter a valid email address.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : null;
  const verified = Boolean(params.verified);
  const sent = Boolean(params.sent);
  const registered = Boolean(params.registered);
  const required = Boolean(params.required);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <div className="space-y-5">
        <PageHeader
          eyebrow={<Eyebrow icon={MailCheck}>Email verification</Eyebrow>}
          title="Verify your account"
          description="Player accounts must verify email before login, record submission, and private submission access."
        />

        {registered ? (
          <StatusPanel tone="cyan">
            Account created. Check your email for a verification link.
          </StatusPanel>
        ) : null}
        {required ? (
          <StatusPanel tone="amber">
            Verification is required before you can log in or submit records.
          </StatusPanel>
        ) : null}
        {sent ? (
          <StatusPanel tone="cyan">
            Verification sent. Check your email for the latest link or code.
          </StatusPanel>
        ) : null}
        {verified ? (
          <StatusPanel tone="emerald">
            Email verified successfully. You can now{" "}
            <Link href="/login" className="font-black underline">
              log in
            </Link>
            .
          </StatusPanel>
        ) : null}
        {error ? (
          <StatusPanel tone="red">
            {errorMessages[error] ?? "Verification could not be completed."}
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
