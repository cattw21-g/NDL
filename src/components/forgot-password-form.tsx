"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/actions/password-reset";
import { CooldownSubmitButton } from "@/components/cooldown-submit-button";
import { cx, FieldLabel, inputClass, SectionPanel } from "@/components/ui";
import {
  EMAIL_RESEND_COOLDOWN_MESSAGE,
  EMAIL_RESEND_COOLDOWN_SECONDS,
} from "@/lib/email-cooldown";
import {
  createForgotPasswordFormState,
  type ForgotPasswordField,
} from "@/lib/password-reset-form-state";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    createForgotPasswordFormState(),
  );
  const shouldShowCooldown =
    Boolean(state.successMessage) ||
    state.formErrors.includes(EMAIL_RESEND_COOLDOWN_MESSAGE);

  return (
    <form action={formAction} aria-busy={pending}>
      <SectionPanel className="space-y-4 p-5">
        {state.successMessage ? (
          <div
            role="status"
            className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm leading-6 text-cyan-900 dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-100"
          >
            {state.successMessage}
          </div>
        ) : null}
        {state.summary ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-black">{state.summary}</p>
            {state.formErrors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {state.formErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <TextInput
          name="email"
          label="Email"
          type="email"
          defaultValue={state.values.email}
          errors={state.fieldErrors.email}
        />
        <CooldownSubmitButton
          key={shouldShowCooldown ? "cooldown" : "ready"}
          cooldownSeconds={EMAIL_RESEND_COOLDOWN_SECONDS}
          initialCooldownSeconds={
            shouldShowCooldown ? EMAIL_RESEND_COOLDOWN_SECONDS : 0
          }
          className="w-full"
        >
          Send reset code
        </CooldownSubmitButton>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          The email includes a reset link and six-digit code. If you do not see
          it, check your spam or junk folder.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-black text-cyan-800 dark:text-cyan-300"
          >
            Login
          </Link>
        </p>
      </SectionPanel>
    </form>
  );
}

function TextInput({
  name,
  label,
  type = "text",
  defaultValue,
  errors,
}: {
  name: ForgotPasswordField;
  label: string;
  type?: string;
  defaultValue: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);
  const errorId = `${name}-error`;

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      />
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function FieldErrors({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <ul id={id} className="space-y-1 text-xs font-bold text-red-600 dark:text-red-300">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
