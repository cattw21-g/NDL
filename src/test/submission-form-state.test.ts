import { File as NodeFile } from "node:buffer";

import { describe, expect, it } from "vitest";

import {
  createSubmissionFormErrorState,
  emptySubmissionFormValues,
  submissionObjectFromFormData,
  validateSubmissionFormSubmission,
} from "../lib/submission-form-state";

if (typeof globalThis.File === "undefined") {
  Object.defineProperty(globalThis, "File", {
    value: NodeFile,
  });
}

function linkOnlyFormData() {
  const formData = new FormData();

  formData.set("levelId", "level-1");
  formData.set("videoUrl", "https://example.com/completion");
  formData.set("fps", "240");
  formData.set("inputDevice", "Keyboard space key");
  formData.set("clickAudioIncluded", "true");
  formData.set("gameAudioIncluded", "true");
  formData.set("fpsOverlayVisible", "true");

  return formData;
}

describe("submission form state", () => {
  it("validates link-only submissions without optional upload fields", () => {
    const parsed = validateSubmissionFormSubmission(linkOnlyFormData());

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.videoUrl).toBe("https://example.com/completion");
      expect(parsed.data.rawFootageUrl).toBeUndefined();
    }
  });

  it("treats empty optional file fields as absent", () => {
    const formData = linkOnlyFormData();

    formData.set(
      "completionVideoFile",
      new File([], "", { type: "application/octet-stream" }),
    );
    formData.set(
      "rawFootageFile",
      new File([], "", { type: "application/octet-stream" }),
    );

    const object = submissionObjectFromFormData(formData);
    const parsed = validateSubmissionFormSubmission(formData);

    expect(object.videoUrl).toBe("https://example.com/completion");
    expect(object.rawFootageUrl).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  it("injects upload placeholders only for selected non-empty files", () => {
    const formData = linkOnlyFormData();

    formData.set(
      "completionVideoFile",
      new File([new Uint8Array([1])], "run.mp4", { type: "video/mp4" }),
    );

    const object = submissionObjectFromFormData(formData);

    expect(object.videoUrl).toBe("/uploads/completion-videos/pending.mp4");
  });

  it("returns structured field errors for invalid submissions", () => {
    const formData = new FormData();
    formData.set("videoUrl", "not-a-url");

    const parsed = validateSubmissionFormSubmission(formData);

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.state.summary).toBe("Fix the highlighted fields below.");
      expect(parsed.state.fieldErrors.levelId).toBeDefined();
      expect(parsed.state.fieldErrors.videoUrl).toBeDefined();
    }
  });

  it("builds structured form errors without throwing", () => {
    const state = createSubmissionFormErrorState(emptySubmissionFormValues, {
      formErrors: ["That submission could not be saved. Refresh and try again."],
    });

    expect(state.ok).toBe(false);
    expect(state.summary).toBe("Fix the highlighted fields below.");
    expect(state.formErrors).toContain(
      "That submission could not be saved. Refresh and try again.",
    );
  });
});
