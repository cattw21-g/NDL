import { describe, expect, it } from "vitest";

import {
  changelogCategoryLabel,
  normalizeChangelogSlug,
  plainTextParagraphs,
} from "../lib/changelog";
import {
  changelogSchema,
  changelogUpdateSchema,
} from "../lib/validation";

describe("changelog helpers", () => {
  it("normalizes blank and edited slugs safely", () => {
    expect(normalizeChangelogSlug("", "Launch Update: Rank #1")).toBe(
      "launch-update-rank-1",
    );
    expect(normalizeChangelogSlug("  Staff Notes / June  ", "Ignored")).toBe(
      "staff-notes-june",
    );
  });

  it("maps category labels for public and admin views", () => {
    expect(changelogCategoryLabel("ANNOUNCEMENT")).toBe("Announcement");
    expect(changelogCategoryLabel("RANKING_UPDATE")).toBe("Ranking update");
    expect(changelogCategoryLabel("RULE_UPDATE")).toBe("Rule update");
    expect(changelogCategoryLabel("SITE_UPDATE")).toBe("Site update");
    expect(changelogCategoryLabel("MODERATION_NOTE")).toBe("Moderation note");
    expect(changelogCategoryLabel("UNKNOWN")).toBe("Other");
  });

  it("renders plain-text paragraphs without requiring raw HTML", () => {
    expect(plainTextParagraphs("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });
});

describe("changelog validation", () => {
  const validPost = {
    title: "Launch notes",
    slug: "",
    category: "ANNOUNCEMENT",
    summary: "NDL launch candidate notes.",
    content:
      "This update covers launch candidate changes for the public list.\n\nStaff will keep publishing updates here.",
    isPublished: "on",
    isPinned: "on",
  };

  it("accepts create input with auto-generated slug and boolean checkboxes", () => {
    const parsed = changelogSchema.safeParse(validPost);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slug).toBeUndefined();
      expect(parsed.data.isPublished).toBe(true);
      expect(parsed.data.isPinned).toBe(true);
    }
  });

  it("rejects invalid category, summary, and body", () => {
    const parsed = changelogSchema.safeParse({
      ...validPost,
      category: "BAD",
      summary: "",
      content: "short",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      expect(errors.category?.length).toBeGreaterThan(0);
      expect(errors.summary?.length).toBeGreaterThan(0);
      expect(errors.content?.length).toBeGreaterThan(0);
    }
  });

  it("requires an id when updating a post", () => {
    const parsed = changelogUpdateSchema.safeParse(validPost);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.id?.length).toBeGreaterThan(0);
    }
  });
});
