import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Record Deletion Data Safety & Full Restoration", () => {
  it("snapshots all record fields before deletion in deleteAdminRecordAction", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("const recordSnapshot = {");
    expect(adminActions).toContain("id: record.id");
    expect(adminActions).toContain("levelId: record.levelId");
    expect(adminActions).toContain("playerId: record.playerId");
    expect(adminActions).toContain("submissionId: record.submissionId");
    expect(adminActions).toContain("progress: record.progress");
    expect(adminActions).toContain("isVerifier: record.isVerifier");
    expect(adminActions).toContain("pointsAwarded: record.pointsAwarded");
    expect(adminActions).toContain("videoUrl: record.videoUrl");
    expect(adminActions).toContain("before: recordSnapshot");
  });

  it("snapshots all record fields before deletion in user/admin deleteRecordAction", () => {
    const recordActions = source("actions/records.ts");

    expect(recordActions).toContain("const recordSnapshot = {");
    expect(recordActions).toContain("id: record.id");
    expect(recordActions).toContain("levelId: record.levelId");
    expect(recordActions).toContain("playerId: record.playerId");
    expect(recordActions).toContain("action: \"RECORD_DELETED\"");
    expect(recordActions).toContain("before: recordSnapshot");
  });

  it("provides restoreAdminRecordAction that recreates exact record and relinks submission", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain("export async function restoreAdminRecordAction");
    expect(adminActions).toContain("action: \"RECORD_DELETED\"");
    expect(adminActions).toContain("action: \"RECORD_RESTORED\"");
    expect(adminActions).toContain("tx.record.create");
    expect(adminActions).toContain("id: snapshot.id");
    expect(adminActions).toContain("status: \"ACCEPTED\"");
    expect(adminActions).toContain("revalidatePath(\"/admin/records\")");
  });

  it("exposes restore button and recently deleted recovery list in admin records UI", () => {
    const adminRecordsPage = source("app/admin/records/page.tsx");

    expect(adminRecordsPage).toContain("restoreAdminRecordAction");
    expect(adminRecordsPage).toContain("Recently Deleted Records (Recovery Available)");
    expect(adminRecordsPage).toContain("Restore Record");
  });
});
