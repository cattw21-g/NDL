import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Admin moderator rollback hardening and forensic audit", () => {
  it("implements bounded time range validation between 1 and 168 hours", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("Number.isFinite(rawHours)");
    expect(adminActions).toContain("rawHours >= 1");
    expect(adminActions).toContain("Math.min(rawHours, 168)");
  });

  it("rolls back both approved submissions and approved level suggestions atomically", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("affectedSubmissions = await prisma.recordSubmission.findMany");
    expect(adminActions).toContain("affectedSuggestions = await prisma.levelSuggestion.findMany");
    expect(adminActions).toContain("where: { id: sub.id, status: \"ACCEPTED\" }");
    expect(adminActions).toContain("where: { id: sug.id, status: \"APPROVED\" }");
    expect(adminActions).toContain("status: \"PENDING\"");
    expect(adminActions).toContain("reviewedAt: null");
    expect(adminActions).toContain("reviewerId: null");
  });

  it("creates detailed forensic audit log entries for all reverted entities", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("action: \"MODERATOR_EMERGENCY_ROLLBACK\"");
    expect(adminActions).toContain("affectedSubmissionsCount: affectedSubmissions.length");
    expect(adminActions).toContain("affectedSuggestionsCount: affectedSuggestions.length");
    expect(adminActions).toContain("revertedSubmissions");
    expect(adminActions).toContain("revertedSuggestions");
  });

  it("revalidates affected cache paths across list, players, and admin", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("revalidatePath(\"/\")");
    expect(adminActions).toContain("revalidatePath(\"/players\")");
    expect(adminActions).toContain("revalidatePath(\"/moderation\")");
    expect(adminActions).toContain("revalidatePath(\"/admin\")");
    expect(adminActions).toContain("revalidatePath(\"/admin/users\")");
  });
});
