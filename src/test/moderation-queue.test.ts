import { describe, expect, it } from "vitest";

import {
  moderationQueueQuery,
  moderationQueueStatuses,
  moderationQueueWhere,
} from "../lib/moderation-queue";

describe("moderation queue query", () => {
  it("includes pending submissions in the staff review queue", () => {
    expect(moderationQueueStatuses).toContain("PENDING");
    expect(moderationQueueStatuses).toContain("NEEDS_CHANGES");
    expect(moderationQueueStatuses).not.toContain("ACCEPTED");

    expect(moderationQueueWhere()).toEqual({
      status: {
        in: ["PENDING", "NEEDS_CHANGES"],
      },
    });
  });

  it("does not filter pending submissions by submitter role", () => {
    const query = moderationQueueQuery();
    const submissions = [
      { id: "admin-submit", status: "PENDING", submitterRole: "ADMIN" },
      { id: "player-submit", status: "PENDING", submitterRole: "PLAYER" },
      { id: "accepted-submit", status: "ACCEPTED", submitterRole: "PLAYER" },
    ];

    const visible = submissions.filter((submission) =>
      query.where.status.in.includes(
        submission.status as (typeof query.where.status.in)[number],
      ),
    );

    expect(visible.map((submission) => submission.id)).toEqual([
      "admin-submit",
      "player-submit",
    ]);
  });
});
