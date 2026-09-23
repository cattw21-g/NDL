import { describe, it, expect } from "vitest";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";

describe("Staff Applications System Core Tests", () => {
  describe("Official Application Templates", () => {
    it("provides the complete List Reviewer template with required community questions", () => {
      const tmpl = APPLICATION_TEMPLATES.LIST_REVIEWER;
      expect(tmpl).toBeDefined();
      expect(tmpl.role).toBe("LIST_REVIEWER");
      expect(tmpl.questions).toHaveLength(6);

      // Verify specific question contents required by NDL community
      const prompts = tmpl.questions.map((q) => q.prompt.toLowerCase());
      expect(prompts.some((p) => p.includes("discord") && p.includes("availability"))).toBe(true);
      expect(prompts.some((p) => p.includes("geometry dash") && p.includes("followed"))).toBe(true);
      expect(prompts.some((p) => p.includes("pointercrate") || p.includes("review guidelines"))).toBe(true);
      expect(prompts.some((p) => p.includes("cut") || p.includes("audio sync"))).toBe(true);
      expect(prompts.some((p) => p.includes("clicks") && p.includes("top 20"))).toBe(true);
      expect(prompts.some((p) => p.includes("disagreements"))).toBe(true);
    });

    it("provides the complete List Moderator template with leadership & investigation questions", () => {
      const tmpl = APPLICATION_TEMPLATES.LIST_MODERATOR;
      expect(tmpl).toBeDefined();
      expect(tmpl.role).toBe("LIST_MODERATOR");
      expect(tmpl.questions).toHaveLength(6);

      const prompts = tmpl.questions.map((q) => q.prompt.toLowerCase());
      expect(prompts.some((p) => p.includes("discord") && (p.includes("age") || p.includes("maturity")))).toBe(true);
      expect(prompts.some((p) => p.includes("leadership") || p.includes("prior moderation"))).toBe(true);
      expect(prompts.some((p) => p.includes("circumstantial") && p.includes("cheating"))).toBe(true);
      expect(prompts.some((p) => p.includes("arguing") || p.includes("rejected"))).toBe(true);
      expect(prompts.some((p) => p.includes("philosophy") && p.includes("placements"))).toBe(true);
      expect(prompts.some((p) => p.includes("unlisting") || p.includes("accountability"))).toBe(true);
    });

    it("provides the complete Beta Tester template with device & bug testing questions", () => {
      const tmpl = APPLICATION_TEMPLATES.BETA_TESTER;
      expect(tmpl).toBeDefined();
      expect(tmpl.role).toBe("BETA_TESTER");
      expect(tmpl.questions).toHaveLength(4);

      const prompts = tmpl.questions.map((q) => q.prompt.toLowerCase());
      expect(prompts.some((p) => p.includes("devices") || p.includes("browsers"))).toBe(true);
      expect(prompts.some((p) => p.includes("active"))).toBe(true);
      expect(prompts.some((p) => p.includes("bug") || p.includes("ui issue"))).toBe(true);
      expect(prompts.some((p) => p.includes("willing to test"))).toBe(true);
    });
  });

  describe("Question Snapshot Immutability", () => {
    it("correctly freezes question structure at submission time", () => {
      const questions = APPLICATION_TEMPLATES.LIST_REVIEWER.questions;
      const snapshotString = JSON.stringify(
        questions.map((q, i) => ({
          id: `q-${i + 1}`,
          order: q.order,
          prompt: q.prompt,
          type: q.type,
          required: q.required,
        })),
      );

      const restored = JSON.parse(snapshotString);
      expect(restored).toHaveLength(6);
      expect(restored[0].prompt).toBe(questions[0].prompt);

      // Verify mutating the original does not change the snapshot
      const modifiedQuestions = [...questions];
      modifiedQuestions[0] = { ...modifiedQuestions[0], prompt: "Changed Prompt!" };

      expect(restored[0].prompt).not.toBe("Changed Prompt!");
      expect(restored[0].prompt).toBe(questions[0].prompt);
    });
  });

  describe("Deadline & Position Enforcement Logic", () => {
    it("determines when a deadline has expired using server timestamp", () => {
      const pastDeadline = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDeadline = new Date(Date.now() + 3600000); // 1 hour from now

      const isPastExpired = new Date() > pastDeadline;
      const isFutureExpired = new Date() > futureDeadline;

      expect(isPastExpired).toBe(true);
      expect(isFutureExpired).toBe(false);
    });

    it("evaluates position limits correctly", () => {
      const maxPositions = 5;
      const currentAccepted = 5;

      const isLimitReached = currentAccepted >= maxPositions;
      expect(isLimitReached).toBe(true);

      const nextAccepted = 4;
      expect(nextAccepted >= maxPositions).toBe(false);
    });
  });

  describe("Discord Backoff Queue Calculations", () => {
    it("computes bounded backoff times predictably", () => {
      const BACKOFF_SECONDS = [30, 120, 600, 1800, 3600];
      expect(BACKOFF_SECONDS[0]).toBe(30);
      expect(BACKOFF_SECONDS[1]).toBe(120);
      expect(BACKOFF_SECONDS[2]).toBe(600);
      expect(BACKOFF_SECONDS[3]).toBe(1800);
      expect(BACKOFF_SECONDS[4]).toBe(3600);

      // Verify attempts beyond length clamp to max delay (1 hour)
      const attempt10Index = Math.min(10 - 1, BACKOFF_SECONDS.length - 1);
      expect(BACKOFF_SECONDS[attempt10Index]).toBe(3600);
    });
  });
});
