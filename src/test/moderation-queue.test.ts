import { describe, expect, it } from "vitest";

import {
  levelSuggestionQuery,
  levelSuggestionWhere,
  moderationPageSize,
  moderationQueueQuery,
  moderationQueueStatuses,
  moderationQueueWhere,
  parseModerationFilters,
  recordSubmissionQuery,
  recordSubmissionWhere,
} from "../lib/moderation-queue";

describe("moderation queue query", () => {
  it("keeps the default record queue scoped to pending and needs-changes", () => {
    expect(moderationQueueStatuses).toEqual(["PENDING", "NEEDS_CHANGES"]);
    expect(moderationQueueWhere()).toEqual({
      AND: [
        {
          status: {
            in: ["PENDING", "NEEDS_CHANGES"],
          },
        },
      ],
    });
    expect(moderationQueueQuery().take).toBe(moderationPageSize);
  });

  it("parses record status, sorting, date range, and pagination params", () => {
    const filters = parseModerationFilters({
      q: " slaughterhouse ",
      recordStatus: "ACCEPTED",
      recordLevel: "abyss",
      recordPlayer: "player",
      recordFrom: "2026-01-01",
      recordTo: "2026-01-31",
      recordSort: "rank-high",
      recordPage: "3",
    });
    const query = recordSubmissionQuery(filters.record);

    expect(filters.record.statuses).toEqual(["ACCEPTED"]);
    expect(filters.record.q).toBe("slaughterhouse");
    expect(filters.record.level).toBe("abyss");
    expect(filters.record.player).toBe("player");
    expect(filters.record.sort).toBe("rank-high");
    expect(filters.record.page).toBe(3);
    expect(query.skip).toBe(50);
    expect(query.take).toBe(25);
    expect(query.orderBy).toEqual([
      { level: { rank: "asc" } },
      { submittedAt: "desc" },
    ]);
  });

  it("builds record search across player, level, video, proof, and moderation notes", () => {
    const filters = parseModerationFilters({
      q: "clicks",
    });
    const where = recordSubmissionWhere(filters.record);
    const serialized = JSON.stringify(where);

    expect(serialized).toContain("player");
    expect(serialized).toContain("level");
    expect(serialized).toContain("videoUrl");
    expect(serialized).toContain("proofNotes");
    expect(serialized).toContain("moderatorNotes");
    expect(serialized).toContain("clicks");
  });

  it("uses oldest and lowest-rank record sorts when requested", () => {
    expect(
      recordSubmissionQuery(
        parseModerationFilters({ recordSort: "oldest" }).record,
      ).orderBy,
    ).toEqual([{ submittedAt: "asc" }]);
    expect(
      recordSubmissionQuery(
        parseModerationFilters({ recordSort: "rank-low" }).record,
      ).orderBy,
    ).toEqual([
      { level: { rank: "desc" } },
      { submittedAt: "desc" },
    ]);
  });

  it("keeps default suggestion queue to pending, needs-changes, and unconverted approved", () => {
    const filters = parseModerationFilters({});
    const where = levelSuggestionWhere(filters.suggestion);

    expect(filters.suggestion.statuses).toEqual([
      "PENDING",
      "NEEDS_CHANGES",
      "APPROVED",
    ]);
    expect(where).toEqual({
      AND: [
        {
          OR: [
            { status: "PENDING" },
            { status: "NEEDS_CHANGES" },
            { status: "APPROVED", createdLevelId: null },
          ],
        },
      ],
    });
  });

  it("parses suggestion status, sorting, date range, and pagination params", () => {
    const filters = parseModerationFilters({
      q: "verifier",
      suggestionStatus: "CONVERTED",
      suggestionName: "nerf",
      suggestionOriginal: "original",
      suggestionSubmitter: "submitter",
      suggestionFrom: "2026-02-01",
      suggestionTo: "2026-02-28",
      suggestionSort: "approved",
      suggestionPage: "2",
    });
    const query = levelSuggestionQuery(filters.suggestion);

    expect(filters.suggestion.statuses).toEqual(["CONVERTED"]);
    expect(filters.suggestion.q).toBe("verifier");
    expect(filters.suggestion.name).toBe("nerf");
    expect(filters.suggestion.original).toBe("original");
    expect(filters.suggestion.submitter).toBe("submitter");
    expect(filters.suggestion.sort).toBe("approved");
    expect(filters.suggestion.page).toBe(2);
    expect(query.skip).toBe(25);
    expect(query.take).toBe(25);
  });

  it("builds suggestion search across level, GD ID, submitter, creators, and moderation notes", () => {
    const filters = parseModerationFilters({
      q: "host",
    });
    const where = levelSuggestionWhere(filters.suggestion);
    const serialized = JSON.stringify(where);

    expect(serialized).toContain("name");
    expect(serialized).toContain("originalName");
    expect(serialized).toContain("gdLevelId");
    expect(serialized).toContain("submitter");
    expect(serialized).toContain("nerfCreator");
    expect(serialized).toContain("verifier");
    expect(serialized).toContain("versionNotes");
    expect(serialized).toContain("moderatorNotes");
    expect(serialized).toContain("host");
  });
});
