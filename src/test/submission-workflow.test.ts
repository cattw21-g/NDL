import { describe, expect, it } from "vitest";

import { RecordStatus } from "../generated/prisma/enums";
import { isVerifiedAccount } from "../lib/account-state";
import {
  applySubmissionReview,
  buildSubmissionCreateData,
  type SubmissionReviewClient,
} from "../lib/submission-workflow";

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

describe("submission workflow", () => {
  it("gates submit access on verified accounts", () => {
    expect(isVerifiedAccount({ emailVerifiedAt: new Date() })).toBe(true);
    expect(isVerifiedAccount({ emailVerifiedAt: null })).toBe(false);
  });

  it("creates pending submission data with structured proof summaries", () => {
    const data = buildSubmissionCreateData("player-1", {
      levelId: "level-1",
      videoUrl: "https://example.com/video",
      rawFootageUrl: "https://example.com/raw",
      proofImageUrl: "https://example.com/proof",
      fps: 240,
      cbfUsed: true,
      clickAudioIncluded: true,
      separateMicClickTrack: true,
      gameAudioIncluded: true,
      rawFootageIncluded: true,
      fpsOverlayVisible: true,
      cpsCounterVisible: true,
      cheatIndicatorVisible: false,
      microphoneModel: "USB microphone",
      inputDevice: "Keyboard space key",
      proofNotes: "Clicks are clear.",
      comments: "First submit.",
    });

    expect(data.status).toBe(RecordStatus.PENDING);
    expect(data.playerId).toBe("player-1");
    expect(data.clickAudioIncluded).toBe(true);
    expect(data.inputDevice).toBe("Keyboard space key");
    expect(data.clickAudioNotes).toContain("Click audio included: yes");
    expect(data.deviceNotes).toContain("FPS overlay visible: yes");
  });

  it("stores uploaded public paths in the existing submission media fields", () => {
    const data = buildSubmissionCreateData("player-1", {
      levelId: "level-1",
      videoUrl: "/uploads/completion-videos/run.mp4",
      rawFootageUrl: "/uploads/raw-footage/raw.mp4",
      proofImageUrl: "/uploads/proof-images/proof.png",
      fps: 240,
      cbfUsed: false,
      clickAudioIncluded: true,
      separateMicClickTrack: false,
      gameAudioIncluded: true,
      rawFootageIncluded: true,
      fpsOverlayVisible: true,
      cpsCounterVisible: false,
      cheatIndicatorVisible: false,
      inputDevice: "Keyboard space key",
    });

    expect(data.videoUrl).toBe("/uploads/completion-videos/run.mp4");
    expect(data.rawFootageUrl).toBe("/uploads/raw-footage/raw.mp4");
    expect(data.proofImageUrl).toBe("/uploads/proof-images/proof.png");
    expect(data.status).toBe(RecordStatus.PENDING);
  });

  it("accepting a submission upserts a public record with level points", async () => {
    const calls = {
      submissionUpdates: [] as unknown[],
      recordUpserts: [] as unknown[],
      moderationActions: [] as unknown[],
    };
    const tx = {
      recordSubmission: {
        update: async (args: unknown) => {
          calls.submissionUpdates.push(args);
          return args;
        },
      },
      record: {
        upsert: async (args: unknown) => {
          calls.recordUpserts.push(args);
          return args;
        },
      },
      moderationAction: {
        create: async (args: unknown) => {
          calls.moderationActions.push(args);
          return args;
        },
      },
    } as unknown as SubmissionReviewClient;

    await applySubmissionReview(
      tx,
      {
        id: "submission-1",
        playerId: "player-1",
        levelId: "level-1",
        videoUrl: "https://example.com/video",
        rawFootageUrl: "https://example.com/raw",
        fps: 240,
        cbfUsed: true,
        level: {
          name: "Demo Level",
          points: 320,
        },
        player: {
          displayName: "Demo Player",
        },
      },
      {
        id: "mod-1",
        displayName: "Moderator",
      },
      {
        status: "ACCEPTED",
        moderatorNotes: "Proof accepted.",
      },
      new Date("2026-05-30T00:00:00.000Z"),
    );

    expect(calls.submissionUpdates).toHaveLength(1);
    expect(calls.recordUpserts).toHaveLength(1);
    expect(calls.moderationActions).toHaveLength(1);

    const recordUpsert = asRecord(calls.recordUpserts[0]);
    const create = asRecord(recordUpsert.create);
    expect(create.submissionId).toBe("submission-1");
    expect(create.pointsAwarded).toBe(320);

    const action = asRecord(asRecord(calls.moderationActions[0]).data);
    expect(action.type).toBe("SUBMISSION_ACCEPTED");
    expect(action.summary).toContain("Demo Player");
  });
});
