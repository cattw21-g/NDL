import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  canTransitionSubmission,
  isReviewDecision,
} from "../lib/submission-status";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("submission review transitions and user level status banner", () => {
  it("accepts concrete review decisions only", () => {
    expect(isReviewDecision("ACCEPTED")).toBe(true);
    expect(isReviewDecision("PENDING")).toBe(false);
  });

  it("does not allow final submissions to be reviewed again", () => {
    expect(canTransitionSubmission("PENDING", "ACCEPTED")).toBe(true);
    expect(canTransitionSubmission("NEEDS_CHANGES", "REJECTED")).toBe(true);
    expect(canTransitionSubmission("ACCEPTED", "REJECTED")).toBe(false);
    expect(canTransitionSubmission("REJECTED", "ACCEPTED")).toBe(false);
  });

  it("renders rich submission status on the level page via UserLevelSubmissionBanner", () => {
    const bannerSource = source("components/user-level-submission-banner.tsx");
    const clientBannerSource = source("components/user-submission-banner-client.tsx");
    const levelPageSource = source("app/levels/[slug]/page.tsx");

    expect(bannerSource).toContain("UserLevelSubmissionBanner");
    expect(clientBannerSource).toContain("Your Submission Status");
    expect(clientBannerSource).toContain("submission.status === \"PENDING\"");
    expect(clientBannerSource).toContain("submission.status === \"ACCEPTED\"");
    expect(clientBannerSource).toContain("submission.status === \"NEEDS_CHANGES\"");
    expect(clientBannerSource).toContain("submission.status === \"REJECTED\"");
    expect(clientBannerSource).toContain("My Submissions Hub");

    expect(levelPageSource).toContain("<UserLevelSubmissionBanner levelId={level.id} />");
  });

  it("revalidates level page and user profile paths upon submitting a record", () => {
    const actionsSource = source("actions/submissions.ts");

    expect(actionsSource).toContain("revalidatePath(`/levels/${level.slug}`)");
    expect(actionsSource).toContain("revalidatePath(`/players/${user.playerName}`)");
    expect(actionsSource).toContain("revalidatePath(\"/submissions\")");
  });
});
