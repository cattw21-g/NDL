import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Admin level mutation actions", () => {
  it("does not call revalidatePath with 'layout' to avoid Cloudflare Worker runtime crashes", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).not.toContain('revalidatePath("/", "layout")');
    expect(adminActions).not.toContain("revalidatePath('/', 'layout')");
  });

  it("revalidates specific list and level paths on create and update", () => {
    const adminActions = source("actions/admin.ts");

    expect(adminActions).toContain('revalidatePath("/admin/levels")');
    expect(adminActions).toContain('redirect("/admin/levels?updated=1")');
    expect(adminActions).toContain('redirect(\n    parsed.data.sourceSuggestionId\n      ? "/admin/levels?converted=1"\n      : "/admin/levels?created=1",\n  )');
  });
});
