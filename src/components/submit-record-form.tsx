"use client";

import { FileVideo } from "lucide-react";
import { useActionState, useState } from "react";

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
  verifier: string;
  status: string;
  points: number;
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
  const [selectedLevelId, setSelectedLevelId] = useState(values.levelId);
  const selectedLevel = levels.find((level) => level.id === selectedLevelId);
  const uploadsAvailable = imageUploadsEnabled || mp4UploadsEnabled;

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
        <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3 text-sm leading-6 text-cyan-950 dark:border-cyan-500/50 dark:bg-cyan-950/30 dark:text-cyan-100">
          <h2 className="font-black">Before you submit</h2>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            <li>Accepted NDL version</li>
            <li>Completion video link</li>
            <li>FPS and CBF settings</li>
            <li>Click audio proof</li>
            <li>Raw footage for high-ranked records</li>
          </ul>
        </div>

        <FormSection
          title="Level"
          description="Choose the exact accepted NDL version you completed."
        >
          <SelectField
            name="levelId"
            label="Level"
            defaultValue={values.levelId}
            onChange={(value) => setSelectedLevelId(value)}
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
          {selectedLevel ? (
            <div className="grid gap-2 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 sm:grid-cols-3">
              <PreviewFact
                label="Rank"
                value={selectedLevel.rank ? `#${selectedLevel.rank}` : selectedLevel.status}
              />
              <PreviewFact label="Points" value={`${selectedLevel.points} pts`} />
              <PreviewFact label="Verifier" value={selectedLevel.verifier} />
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title="Proof links"
          description="Links are recommended. Use public or reviewer-accessible proof resources."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              name="videoUrl"
              label="Completion video link"
              placeholder="https://youtu.be/..."
              defaultValue={values.videoUrl}
              required={!mp4UploadsEnabled}
              errors={state.fieldErrors.videoUrl}
            />
            <TextInput
              name="rawFootageUrl"
              label="Raw footage link"
              help={fieldHelp.rawFootageUrl}
              placeholder="https://drive.google.com/..."
              defaultValue={values.rawFootageUrl}
              errors={state.fieldErrors.rawFootageUrl}
            />
            <TextInput
              name="proofImageUrl"
              label="Proof image link"
              placeholder="https://imgur.com/..."
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

        {uploadsAvailable ? (
          <FormSection
            title="Optional uploads"
            description="Proof links remain the primary review path. Uploads win over matching URL fields when used."
          >
            <div className="grid min-w-0 gap-3 xl:grid-cols-3">
              {mp4UploadsEnabled ? (
                <>
                  <FileInput
                    name="completionVideoFile"
                    label="Completion MP4 upload"
                    accept="video/mp4,.mp4"
                    hint={`MP4 only, up to ${maxVideoMb} MB.`}
                    errors={state.fieldErrors.completionVideoFile}
                  />
                  <FileInput
                    name="rawFootageFile"
                    label="Raw footage MP4 upload"
                    accept="video/mp4,.mp4"
                    hint={`MP4 only, up to ${maxVideoMb} MB.`}
                    errors={state.fieldErrors.rawFootageFile}
                  />
                </>
              ) : null}
              {imageUploadsEnabled ? (
                <FileInput
                  name="proofImageFile"
                  label="Proof image upload"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  hint={`PNG, JPG, or WebP, up to ${maxImageMb} MB.`}
                  errors={state.fieldErrors.proofImageFile}
                />
              ) : null}
            </div>
          </FormSection>
        ) : null}

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
  placeholder,
  defaultValue,
  errors,
  help,
}: {
  name: SubmissionFormField;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue: string;
  errors?: string[];
  help?: string;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={labelWithRequired(label, required)} help={help}>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
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
  onChange,
  children,
}: {
  name: SubmissionFormField;
  label: string;
  defaultValue: string;
  errors?: string[];
  help?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const hasErrors = Boolean(errors?.length);

  return (
    <FieldLabel label={labelWithRequired(label, true)} help={help}>
      <select
        name={name}
        required
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.currentTarget.value)}
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
  hint,
  errors,
}: {
  name: SubmissionFormField;
  label: string;
  accept: string;
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
        aria-invalid={hasErrors}
        className={cx(
          inputClass,
          "w-full min-w-0 max-w-full text-xs file:mr-3 file:max-w-[9rem] file:truncate file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white dark:file:bg-cyan-300 dark:file:text-slate-950",
          hasErrors && invalidClass,
        )}
      />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {hint}
      </span>
        <FieldErrors errors={errors} />
      </FieldLabel>
    </div>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="truncate font-black text-slate-950 dark:text-slate-50">
        {value}
      </div>
    </div>
  );
}

function labelWithRequired(label: string, required: boolean) {
  return required ? `${label} (required)` : label;
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
