"use client";

import { useActionState } from "react";

import { submitLevelSuggestionAction } from "@/actions/level-suggestions";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  FormSection,
  inputClass,
  SectionPanel,
  textareaClass,
} from "@/components/ui";
import {
  createLevelSuggestionFormState,
  type LevelSuggestionField,
} from "@/lib/level-suggestion-form-state";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function LevelSuggestionForm({
  imageUploadsEnabled,
  maxImageMb,
}: {
  imageUploadsEnabled: boolean;
  maxImageMb: number;
}) {
  const [state, formAction, pending] = useActionState(
    submitLevelSuggestionAction,
    createLevelSuggestionFormState(),
  );
  const values = state.values;

  return (
    <form action={formAction} aria-busy={pending} className="grid min-w-0 gap-4">
      {state.summary ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200"
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

      <SectionPanel className="grid gap-4 p-4">
        <FormSection
          title="Level identity"
          description="Use the accepted or intended public names and credits. Staff can request changes before approval."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              name="name"
              label="Level name"
              defaultValue={values.name}
              errors={state.fieldErrors.name}
            />
            <TextInput
              name="originalName"
              label="Original level"
              defaultValue={values.originalName}
              errors={state.fieldErrors.originalName}
            />
            <TextInput
              name="gdLevelId"
              label="GD level ID"
              defaultValue={values.gdLevelId}
              errors={state.fieldErrors.gdLevelId}
            />
            <TextInput
              name="publisher"
              label="Publisher/host"
              defaultValue={values.publisher}
              errors={state.fieldErrors.publisher}
            />
            <TextInput
              name="nerfCreator"
              label="Nerf creator"
              defaultValue={values.nerfCreator}
              errors={state.fieldErrors.nerfCreator}
            />
            <TextInput
              name="verifier"
              label="Verifier"
              defaultValue={values.verifier}
              errors={state.fieldErrors.verifier}
            />
          </div>
        </FormSection>

        <FormSection
          title="Media and version"
          description="Showcase links must be full http/https URLs. Thumbnail upload is optional and may be disabled on production."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="showcaseUrl"
              label="Showcase link"
              type="url"
              defaultValue={values.showcaseUrl}
              errors={state.fieldErrors.showcaseUrl}
            />
            <FileInput
              name="thumbnailFile"
              label="Thumbnail upload"
              disabled={!imageUploadsEnabled}
              hint={`Optional PNG, JPG, or WebP up to ${maxImageMb} MB.`}
              errors={state.fieldErrors.thumbnailFile}
            />
          </div>
          <TextArea
            name="versionNotes"
            label="Version notes"
            defaultValue={values.versionNotes}
            errors={state.fieldErrors.versionNotes}
          />
        </FormSection>

        <FormSection
          title="Compatibility notes"
          description="Explain how this nerf preserves the original route, click timing, speed, portals, gamemode order, and progression."
        >
          <TextArea
            name="compatibilityNotes"
            label="Macro/replay compatibility notes"
            defaultValue={values.compatibilityNotes}
            errors={state.fieldErrors.compatibilityNotes}
          />
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-slate-300 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Approved suggestions are reviewed by staff before they become NDL
            levels.
          </p>
          <SubmitButton>Submit level suggestion</SubmitButton>
        </div>
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
  name: LevelSuggestionField;
  label: string;
  type?: string;
  defaultValue: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        className={cx(inputClass, "w-full min-w-0", hasErrors && invalidClass)}
      />
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function FileInput({
  name,
  label,
  disabled,
  hint,
  errors,
}: {
  name: LevelSuggestionField;
  label: string;
  disabled: boolean;
  hint: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        disabled={disabled}
        aria-invalid={hasErrors}
        className={cx(
          inputClass,
          "w-full min-w-0 max-w-full text-xs file:mr-3 file:max-w-[9rem] file:truncate file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:file:bg-cyan-300 dark:file:text-slate-950",
          hasErrors && invalidClass,
        )}
      />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {disabled ? "Thumbnail uploads are disabled on this NDL instance." : hint}
      </span>
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  errors,
}: {
  name: LevelSuggestionField;
  label: string;
  defaultValue: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        className={cx(textareaClass, "w-full min-w-0", hasErrors && invalidClass)}
      />
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <span className="text-sm font-bold text-red-700 dark:text-red-300">
      {errors[0]}
    </span>
  );
}
