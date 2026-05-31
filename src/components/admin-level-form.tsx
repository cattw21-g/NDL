"use client";

import {
  type ChangeEvent,
  useActionState,
  useEffect,
  useId,
  useState,
} from "react";

import { createLevelAction, updateLevelAction } from "@/actions/admin";
import { SafeThumbnail } from "@/components/safe-thumbnail";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  FormSection,
  inputClass,
  textareaClass,
} from "@/components/ui";
import {
  createLevelFormState,
  type LevelFormField,
  type LevelFormValues,
} from "@/lib/level-form-state";

const statuses = ["RANKED", "LEGACY", "PENDING", "REJECTED", "REMOVED"];
const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

export function AdminLevelForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<LevelFormValues>;
}) {
  const formId = useId();
  const action = mode === "edit" ? updateLevelAction : createLevelAction;
  const [state, formAction, pending] = useActionState(
    action,
    createLevelFormState(initialValues),
  );
  const values = state.values;
  const [thumbnailUrlValue, setThumbnailUrlValue] = useState(values.thumbnailUrl);
  const [uploadedPreview, setUploadedPreview] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const previewSrc = uploadedPreview?.url ?? thumbnailUrlValue;

  useEffect(() => {
    return () => {
      if (uploadedPreview?.url) {
        URL.revokeObjectURL(uploadedPreview.url);
      }
    };
  }, [uploadedPreview]);

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={pending}
      className="mt-4 grid gap-4"
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="difficulty" value={values.difficulty || "EXTREME"} />
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

      <FormSection title="Identity">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            formId={formId}
            name="name"
            label="Level name"
            defaultValue={values.name}
            errors={state.fieldErrors.name}
          />
          <Field
            formId={formId}
            name="originalName"
            label="Original level"
            defaultValue={values.originalName}
            errors={state.fieldErrors.originalName}
          />
          <Field
            formId={formId}
            name="gdLevelId"
            label="GD level ID"
            defaultValue={values.gdLevelId}
            errors={state.fieldErrors.gdLevelId}
          />
          <Field
            formId={formId}
            name="publisher"
            label="Publisher/host"
            defaultValue={values.publisher}
            errors={state.fieldErrors.publisher}
          />
          <Field
            formId={formId}
            name="nerfCreator"
            label="Nerf creator"
            defaultValue={values.nerfCreator}
            errors={state.fieldErrors.nerfCreator}
          />
          <Field
            formId={formId}
            name="verifier"
            label="Verifier"
            defaultValue={values.verifier}
            errors={state.fieldErrors.verifier}
          />
        </div>
      </FormSection>

      <FormSection title="Ranking and media">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:row-span-2">
            <span className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Thumbnail preview
            </span>
            <div className="aspect-video overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
              <SafeThumbnail
                src={previewSrc}
                alt="Level thumbnail preview"
                className="h-full w-full object-cover"
                allowObjectUrl={Boolean(uploadedPreview)}
              />
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              {uploadedPreview
                ? `${uploadedPreview.name} is previewing locally and will replace the URL on submit.`
                : "Upload wins over the URL. Use PNG, JPG, or WebP."}
            </p>
          </div>
          <FileField
            formId={formId}
            name="thumbnailFile"
            label="Upload thumbnail"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            errors={state.fieldErrors.thumbnailFile}
            onFileChange={(file) => {
              setUploadedPreview(
                file
                  ? {
                      url: URL.createObjectURL(file),
                      name: file.name,
                    }
                  : null,
              );
            }}
          />
          <details className="rounded-md border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-2">
            <summary className="cursor-pointer text-sm font-black text-slate-800 dark:text-slate-200">
              Advanced: use image URL instead
            </summary>
            <div className="mt-3">
              <Field
                formId={formId}
                name="thumbnailUrl"
                label="Thumbnail URL"
                defaultValue={values.thumbnailUrl}
                value={thumbnailUrlValue}
                onValueChange={setThumbnailUrlValue}
                errors={state.fieldErrors.thumbnailUrl}
              />
            </div>
          </details>
          <Field
            formId={formId}
            name="showcaseUrl"
            label="Showcase URL"
            defaultValue={values.showcaseUrl}
            errors={state.fieldErrors.showcaseUrl}
          />
          <Field
            formId={formId}
            name="placementDate"
            label="Placement date"
            type="date"
            defaultValue={values.placementDate}
            errors={state.fieldErrors.placementDate}
          />
          <Field
            formId={formId}
            name="rank"
            label="Rank"
            type="number"
            defaultValue={values.rank}
            errors={state.fieldErrors.rank}
          />
          <SelectField
            formId={formId}
            name="status"
            label="Status"
            defaultValue={values.status}
            options={statuses}
            errors={state.fieldErrors.status}
          />
        </div>
      </FormSection>

      <FormSection
        title="List copy"
        description="Use description/version notes to document eligibility exceptions. Original replay/macro compatibility is a structural nerf check only; it never permits player record submissions with macros or replay bots."
      >
        <TextArea
          formId={formId}
          name="description"
          label="Description"
          defaultValue={values.description}
          rows={4}
          errors={state.fieldErrors.description}
        />
        <TextArea
          formId={formId}
          name="versionNotes"
          label="Version notes"
          defaultValue={values.versionNotes}
          rows={3}
          placeholder="Document route fidelity, matching FPS/CBF or physics assumptions, and any approved exception such as bugfixes, impossible original transitions, or necessary 2.2 compatibility changes."
          errors={state.fieldErrors.versionNotes}
        />
      </FormSection>

      <SubmitButton>{mode === "edit" ? "Update level" : "Create level"}</SubmitButton>
    </form>
  );
}

function Field({
  formId,
  name,
  label,
  type = "text",
  defaultValue,
  value,
  onValueChange,
  errors,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  type?: string;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  errors?: string[];
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type={type}
        {...(value === undefined
          ? { defaultValue }
          : {
              value,
              onChange: (event: ChangeEvent<HTMLInputElement>) =>
                onValueChange?.(event.currentTarget.value),
            })}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      />
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function FileField({
  formId,
  name,
  label,
  accept,
  errors,
  onFileChange,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  accept: string;
  errors?: string[];
  onFileChange?: (file: File | null) => void;
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <input
        name={name}
        type="file"
        accept={accept}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(
          inputClass,
          "file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white dark:file:bg-cyan-300 dark:file:text-slate-950",
          hasErrors && invalidClass,
        )}
        onChange={(event) =>
          onFileChange?.(event.currentTarget.files?.[0] ?? null)
        }
      />
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function SelectField({
  formId,
  name,
  label,
  defaultValue,
  options,
  errors,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  defaultValue: string;
  options: string[];
  errors?: string[];
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <select
        name={name}
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(inputClass, hasErrors && invalidClass)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldErrors id={errorId} errors={errors} />
    </FieldLabel>
  );
}

function TextArea({
  formId,
  name,
  label,
  defaultValue,
  rows,
  placeholder,
  errors,
}: {
  formId: string;
  name: LevelFormField;
  label: string;
  defaultValue: string;
  rows: number;
  placeholder?: string;
  errors?: string[];
}) {
  const errorId = `${formId}-${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label}>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className={cx(textareaClass, hasErrors && invalidClass)}
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
    <span id={id} className="text-sm font-bold text-red-700 dark:text-red-300">
      {errors[0]}
    </span>
  );
}
