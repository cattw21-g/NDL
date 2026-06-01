"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPasswordAction } from "@/actions/password-reset";
import { SubmitButton } from "@/components/submit-button";
import { cx, FieldLabel, inputClass, SectionPanel } from "@/components/ui";
import {
  createResetPasswordFormState,
  type ResetPasswordField,
} from "@/lib/password-reset-form-state";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function ResetPasswordForm({
  email = "",
  token = "",
}: {
  email?: string;
  token?: string;
}) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    createResetPasswordFormState({ email, token }),
  );

  return (
    <form action={formAction} aria-busy={pending}>
      <SectionPanel className="space-y-4 p-5">
        {state.successMessage ? (
          <div
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            <p>{state.successMessage}</p>
            <Link href="/login" className="mt-2 inline-block font-black underline">
              Go to login
            </Link>
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
        <input name="token" type="hidden" value={state.values.token} />
        <TextInput
          name="email"
          label="Email"
          type="email"
          defaultValue={state.values.email}
          errors={state.fieldErrors.email}
        />
        <TextInput
          name="code"
          label="Six-digit reset code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          defaultValue={state.values.code}
          errors={state.fieldErrors.code}
        />
        <TextInput
          name="password"
          label="New password"
          type="password"
          minLength={10}
          defaultValue={state.values.password}
          errors={state.fieldErrors.password}
        />
        <TextInput
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          minLength={10}
          defaultValue={state.values.confirmPassword}
          errors={state.fieldErrors.confirmPassword}
        />
        <SubmitButton className="w-full">Reset password</SubmitButton>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Use the newest reset email. If you do not see it, check your spam or
          junk folder.
        </p>
      </SectionPanel>
    </form>
  );
}

function TextInput({
  name,
  label,
  type = "text",
  inputMode,
  pattern,
  minLength,
  maxLength,
  defaultValue,
  errors,
}: {
  name: Exclude<ResetPasswordField, "token">;
  label: string;
  type?: string;
  inputMode?: "numeric";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
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
        inputMode={inputMode}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
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
