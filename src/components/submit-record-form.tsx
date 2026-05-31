"use client";

import { FileVideo } from "lucide-react";
import { useActionState } from "react";

import { submitRecordAction } from "@/actions/submissions";
import { SubmitButton } from "@/components/submit-button";
import {
  cx,
  FieldLabel,
  FormSection,
  inputClass,
  SectionPanel,
  textareaClass,
} from "@/components/ui";
import { fieldHelp } from "@/lib/field-help";
import {
  createSubmissionFormState,
  type SubmissionFormField,
} from "@/lib/submission-form-state";

const invalidClass =
  "border-red-500 focus:border-red-600 focus:ring-red-200 dark:border-red-400 dark:focus:border-red-300 dark:focus:ring-red-500/30";

type SubmitLevelOption = {
  id: string;
  rank: number | null;
  name: string;
};

export function SubmitRecordForm({
  levels,
  imageUploadsEnabled,
  mp4UploadsEnabled,
  maxImageMb,
  maxVideoMb,
}: {
  levels: SubmitLevelOption[];
  imageUploadsEnabled: boolean;
  mp4UploadsEnabled: boolean;
  maxImageMb: number;
  maxVideoMb: number;
}) {
  const [state, formAction, pending] = useActionState(
    submitRecordAction,
    createSubmissionFormState(),
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
          title="Level"
          description="Choose the exact accepted NDL version you completed."
        >
          <SelectField
            name="levelId"
            label="Level"
            defaultValue={values.levelId}
            errors={state.fieldErrors.levelId}
          >
            <option value="">Choose a ranked NDL level</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.rank ? `#${level.rank} ` : ""}
                {level.name}
              </option>
            ))}
          </SelectField>
        </FormSection>

        <FormSection
          title="Proof links"
          description="Links are recommended. Use public or reviewer-accessible proof resources."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="videoUrl"
              label="Completion video link"
              defaultValue={values.videoUrl}
              required={!mp4UploadsEnabled}
              errors={state.fieldErrors.videoUrl}
            />
            <TextInput
              name="rawFootageUrl"
              label="Raw footage link"
              help={fieldHelp.rawFootageUrl}
              defaultValue={values.rawFootageUrl}
              errors={state.fieldErrors.rawFootageUrl}
            />
            <TextInput
              name="proofImageUrl"
              label="Proof image link"
              defaultValue={values.proofImageUrl}
              errors={state.fieldErrors.proofImageUrl}
            />
          </div>
          <CheckboxField
            name="rawFootageIncluded"
            label="Raw footage is included"
            defaultChecked={values.rawFootageIncluded === "true"}
            errors={state.fieldErrors.rawFootageIncluded}
          />
        </FormSection>

        <FormSection
          title="Optional uploads"
          description="Links remain the default. Local uploads are for development or self-hosted review."
        >
          <div className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
            {mp4UploadsEnabled ? (
              <p className="font-bold">
                Optional MP4 uploads are enabled for local review. Links still
                work and remain recommended.
              </p>
            ) : (
              <p className="font-bold">
                Video links are recommended. Uploads may be disabled on
                production. MP4 upload is available only when enabled by NDL.
              </p>
            )}
            <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-3">
              <FileInput
                name="completionVideoFile"
                label="Completion MP4 upload"
                accept="video/mp4,.mp4"
                disabled={!mp4UploadsEnabled}
                hint={`MP4 only, up to ${maxVideoMb} MB.`}
                errors={state.fieldErrors.completionVideoFile}
              />
              <FileInput
                name="rawFootageFile"
                label="Raw footage MP4 upload"
                accept="video/mp4,.mp4"
                disabled={!mp4UploadsEnabled}
                hint={`MP4 only, up to ${maxVideoMb} MB.`}
                errors={state.fieldErrors.rawFootageFile}
              />
              <FileInput
                name="proofImageFile"
                label="Proof image upload"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                disabled={!imageUploadsEnabled}
                hint={`PNG, JPG, or WebP, up to ${maxImageMb} MB.`}
                errors={state.fieldErrors.proofImageFile}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Recording settings">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="fps"
              label="FPS used"
              help={fieldHelp.fps}
              type="number"
              defaultValue={values.fps}
              required
              errors={state.fieldErrors.fps}
            />
            <CheckboxField
              name="cbfUsed"
              label="CBF was used"
              help={fieldHelp.cbfUsed}
              defaultChecked={values.cbfUsed === "true"}
              errors={state.fieldErrors.cbfUsed}
            />
            <CheckboxField
              name="fpsOverlayVisible"
              label="FPS overlay is visible"
              defaultChecked={values.fpsOverlayVisible === "true"}
              errors={state.fieldErrors.fpsOverlayVisible}
            />
            <CheckboxField
              name="cpsCounterVisible"
              label="CPS counter is visible"
              defaultChecked={values.cpsCounterVisible === "true"}
              errors={state.fieldErrors.cpsCounterVisible}
            />
            <CheckboxField
              name="cheatIndicatorVisible"
              label="Cheat indicator is visible"
              help={fieldHelp.cheatIndicatorVisible}
              defaultChecked={values.cheatIndicatorVisible === "true"}
              errors={state.fieldErrors.cheatIndicatorVisible}
            />
          </div>
        </FormSection>

        <FormSection
          title="Audio/click proof"
          description="Mark the audio evidence included in the proof package."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxField
              name="clickAudioIncluded"
              label="Click audio is included"
              defaultChecked={values.clickAudioIncluded === "true"}
              errors={state.fieldErrors.clickAudioIncluded}
            />
            <CheckboxField
              name="separateMicClickTrack"
              label="Separate mic/click track is included"
              help={fieldHelp.separateMicClickTrack}
              defaultChecked={values.separateMicClickTrack === "true"}
              errors={state.fieldErrors.separateMicClickTrack}
            />
            <CheckboxField
              name="gameAudioIncluded"
              label="Game audio is included"
              defaultChecked={values.gameAudioIncluded === "true"}
              errors={state.fieldErrors.gameAudioIncluded}
            />
          </div>
        </FormSection>

        <FormSection title="Device/input">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="inputDevice"
              label="Input device / key used"
              type="text"
              defaultValue={values.inputDevice}
              required
              errors={state.fieldErrors.inputDevice}
            />
            <TextInput
              name="microphoneModel"
              label="Microphone model"
              type="text"
              defaultValue={values.microphoneModel}
              errors={state.fieldErrors.microphoneModel}
            />
          </div>
        </FormSection>

        <FormSection title="Comments">
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea
              name="proofNotes"
              label="Extra proof notes"
              defaultValue={values.proofNotes}
              errors={state.fieldErrors.proofNotes}
            />
            <TextArea
              name="comments"
              label="Additional comments"
              defaultValue={values.comments}
              errors={state.fieldErrors.comments}
            />
          </div>
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-slate-300 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <FileVideo className="h-4 w-4 text-cyan-700" />
            Moderators may request more proof before accepting.
          </div>
          <SubmitButton>Submit for review</SubmitButton>
        </div>
      </SectionPanel>
    </form>
  );
}

function TextInput({
  name,
  label,
  type = "url",
  required = false,
  defaultValue,
  errors,
  help,
}: {
  name: SubmissionFormField;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue: string;
  errors?: string[];
  help?: string;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        className={cx(inputClass, "w-full min-w-0", hasErrors && invalidClass)}
      />
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  errors,
  help,
  children,
}: {
  name: SubmissionFormField;
  label: string;
  defaultValue: string;
  errors?: string[];
  help?: string;
  children: React.ReactNode;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={label} help={help}>
      <select
        name={name}
        required
        defaultValue={defaultValue}
        aria-invalid={hasErrors}
        className={cx(inputClass, "w-full min-w-0", hasErrors && invalidClass)}
      >
        {children}
      </select>
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked,
  errors,
  help,
}: {
  name: SubmissionFormField;
  label: string;
  defaultChecked: boolean;
  errors?: string[];
  help?: string;
}) {
  return (
    <FieldLabel label={label} help={help}>
      <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-400 bg-white px-3 transition focus-within:border-cyan-700 focus-within:ring-2 focus-within:ring-cyan-200 dark:border-slate-600 dark:bg-slate-950 dark:focus-within:border-cyan-400 dark:focus-within:ring-cyan-500/30">
        <input
          name={name}
          type="checkbox"
          value="true"
          defaultChecked={defaultChecked}
          className="h-5 w-5 accent-cyan-700"
        />
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </label>
      <FieldErrors errors={errors} />
    </FieldLabel>
  );
}

function FileInput({
  name,
  label,
  accept,
  disabled,
  hint,
  errors,
}: {
  name: SubmissionFormField;
  label: string;
  accept: string;
  disabled: boolean;
  hint: string;
  errors?: string[];
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <div className="min-w-0">
      <FieldLabel label={label}>
        <input
          name={name}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={hasErrors}
          className={cx(
            inputClass,
            "w-full min-w-0 max-w-full text-xs file:mr-3 file:max-w-[9rem] file:truncate file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:file:bg-cyan-300 dark:file:text-slate-950",
            hasErrors && invalidClass,
          )}
        />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {disabled ? "Uploads are disabled on this NDL instance." : hint}
        </span>
        <FieldErrors errors={errors} />
      </FieldLabel>
    </div>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  errors,
}: {
  name: SubmissionFormField;
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
