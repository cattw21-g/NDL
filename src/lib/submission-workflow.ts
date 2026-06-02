import { ModerationActionType, RecordStatus } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";
import {
  buildClickAudioSummary,
  buildDeviceSummary,
  type StructuredSubmissionProof,
} from "./submission-proof";
import { calculateLevelPoints, type ScoredLevelStatus } from "./points";
import { writeAuditLog } from "./audit-log";

export function buildSubmissionCreateData(
  playerId: string,
  input: StructuredSubmissionProof,
) {
  return {
    playerId,
    levelId: input.levelId,
    videoUrl: input.videoUrl,
    rawFootageUrl: input.rawFootageUrl,
    proofImageUrl: input.proofImageUrl,
    fps: input.fps,
    cbfUsed: input.cbfUsed,
    clickAudioIncluded: input.clickAudioIncluded,
    separateMicClickTrack: input.separateMicClickTrack,
    gameAudioIncluded: input.gameAudioIncluded,
    rawFootageIncluded: input.rawFootageIncluded,
    fpsOverlayVisible: input.fpsOverlayVisible,
    cpsCounterVisible: input.cpsCounterVisible,
    cheatIndicatorVisible: input.cheatIndicatorVisible,
    microphoneModel: input.microphoneModel,
    inputDevice: input.inputDevice,
    proofNotes: input.proofNotes,
    clickAudioNotes: buildClickAudioSummary(input),
    deviceNotes: buildDeviceSummary(input),
    comments: input.comments,
    status: RecordStatus.PENDING,
  };
}

export type ReviewableSubmission = {
  id: string;
  playerId: string;
  levelId: string;
  videoUrl: string;
  rawFootageUrl: string | null;
  fps: number;
  cbfUsed: boolean;
  status?: string;
  isDemo?: boolean;
  level: {
    name: string;
    rank: number | null;
    status: ScoredLevelStatus;
    points: number;
  };
  player: {
    displayName: string;
  };
};

export type ReviewModerator = {
  id: string;
  displayName: string;
  playerName?: string;
  role?: string;
};

export type ReviewDecision = {
  status: "ACCEPTED" | "REJECTED" | "NEEDS_CHANGES";
  moderatorNotes: string;
};

export type SubmissionReviewClient = Pick<
  Prisma.TransactionClient,
  "recordSubmission" | "record" | "moderationAction" | "adminAuditLog"
>;

export async function applySubmissionReview(
  tx: SubmissionReviewClient,
  submission: ReviewableSubmission,
  moderator: ReviewModerator,
  decision: ReviewDecision,
  reviewedAt = new Date(),
) {
  let awardedPoints: number | null = null;

  await tx.recordSubmission.update({
    where: {
      id: submission.id,
    },
    data: {
      status: decision.status,
      moderatorNotes: decision.moderatorNotes,
      reviewerId: moderator.id,
      reviewedAt,
    },
  });

  if (decision.status === RecordStatus.ACCEPTED) {
    const pointsAwarded = calculateLevelPoints(
      submission.level.rank,
      submission.level.status,
    );
    awardedPoints = pointsAwarded;
    const recordData = {
      playerId: submission.playerId,
      levelId: submission.levelId,
      videoUrl: submission.videoUrl,
      rawFootageUrl: submission.rawFootageUrl,
      fps: submission.fps,
      cbfUsed: submission.cbfUsed,
      pointsAwarded,
      isDemo: Boolean(submission.isDemo),
    };

    await tx.record.upsert({
      where: {
        submissionId: submission.id,
      },
      update: recordData,
      create: {
        submissionId: submission.id,
        ...recordData,
      },
    });
  }

  const actionType =
    decision.status === RecordStatus.ACCEPTED
      ? ModerationActionType.SUBMISSION_ACCEPTED
      : decision.status === RecordStatus.REJECTED
        ? ModerationActionType.SUBMISSION_REJECTED
        : ModerationActionType.SUBMISSION_NEEDS_CHANGES;

  await tx.moderationAction.create({
    data: {
      actorId: moderator.id,
      type: actionType,
      targetType: "RecordSubmission",
      targetId: submission.id,
      summary: `${moderator.displayName} marked ${submission.player.displayName}'s ${submission.level.name} record as ${decision.status}.`,
      metadata: {
        moderatorNotes: decision.moderatorNotes,
      },
    },
  });

  await writeAuditLog(tx, {
    actor: moderator,
    action:
      decision.status === RecordStatus.ACCEPTED
        ? "RECORD_ACCEPTED"
        : decision.status === RecordStatus.REJECTED
          ? "RECORD_REJECTED"
          : "RECORD_NEEDS_CHANGES",
    entityType: "RecordSubmission",
    entityId: submission.id,
    entityLabel: `${submission.player.displayName} on ${submission.level.name}`,
    before: {
      status: submission.status ?? RecordStatus.PENDING,
      playerId: submission.playerId,
      levelId: submission.levelId,
      levelName: submission.level.name,
    },
    after: {
      status: decision.status,
      reviewedAt,
      pointsAwarded: awardedPoints,
    },
    note: decision.moderatorNotes,
  });
}
