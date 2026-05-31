export type StructuredSubmissionProof = {
  levelId: string;
  videoUrl: string;
  rawFootageUrl?: string;
  proofImageUrl?: string;
  fps: number;
  cbfUsed: boolean;
  clickAudioIncluded: boolean;
  separateMicClickTrack: boolean;
  gameAudioIncluded: boolean;
  rawFootageIncluded: boolean;
  fpsOverlayVisible: boolean;
  cpsCounterVisible: boolean;
  cheatIndicatorVisible: boolean;
  microphoneModel?: string;
  inputDevice: string;
  proofNotes?: string;
  comments?: string;
};

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

export function buildClickAudioSummary(input: StructuredSubmissionProof) {
  const parts = [
    `Click audio included: ${yesNo(input.clickAudioIncluded)}`,
    `Separate mic/click track included: ${yesNo(input.separateMicClickTrack)}`,
    `Game audio included: ${yesNo(input.gameAudioIncluded)}`,
    `Microphone model: ${input.microphoneModel ?? "not provided"}`,
  ];

  if (input.proofNotes) {
    parts.push(`Extra proof notes: ${input.proofNotes}`);
  }

  return parts.join("; ");
}

export function buildDeviceSummary(input: StructuredSubmissionProof) {
  return [
    `Input device/key: ${input.inputDevice}`,
    `FPS overlay visible: ${yesNo(input.fpsOverlayVisible)}`,
    `CPS counter visible: ${yesNo(input.cpsCounterVisible)}`,
    `Cheat indicator visible: ${yesNo(input.cheatIndicatorVisible)}`,
    `Raw footage included: ${yesNo(input.rawFootageIncluded)}`,
  ].join("; ");
}
