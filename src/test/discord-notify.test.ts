import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  notifyChangelogPosted,
  notifyLevelRanked,
  notifyLevelUpdated,
  notifyNewSubmission,
  notifyNewSuggestion,
  notifyRecordAccepted,
  notifyUpcomingDemonAdded,
} from "../lib/discord-notify";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Discord notification system and website actions integration", () => {
  it("exports all required broadcast functions without crashing in non-configured env", async () => {
    // Should gracefully return and not throw even if token/guildId are empty
    await expect(
      notifyRecordAccepted({
        playerName: "TestPlayer",
        playerHandle: "testplayer",
        levelName: "Kocmoc Unleashed",
        levelSlug: "kocmoc-unleashed",
        levelRank: 1,
        progress: 100,
        pointsAwarded: 320,
        videoUrl: "https://youtu.be/test",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyNewSubmission({
        playerName: "TestPlayer",
        playerHandle: "testplayer",
        levelName: "Kocmoc Unleashed",
        levelSlug: "kocmoc-unleashed",
        levelRank: 1,
        progress: 100,
        videoUrl: "https://youtu.be/test",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyNewSuggestion({
        userName: "Suggester",
        userHandle: "suggester",
        levelName: "Acheron Nerfed",
        originalName: "Acheron",
        videoUrl: "https://youtu.be/showcase",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyLevelRanked({
        levelName: "Acheron Nerfed",
        levelSlug: "acheron-nerfed",
        levelRank: 2,
        points: 300,
        verifier: "VerifierGuy",
        nerfCreator: "NerferGuy",
        showcaseUrl: "https://youtu.be/acheron",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyUpcomingDemonAdded({
        levelName: "Sakupen Circles Nerfed",
        originalName: "Sakupen Circles",
        verifier: "Cattw",
        nerfCreator: "Cattw",
        showcaseUrl: "https://youtu.be/sakupen",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyChangelogPosted({
        title: "Major List Update v1.2",
        slug: "major-list-update-v1-2",
        category: "NEWS",
        summary: "New demons added and rankings updated.",
      }),
    ).resolves.not.toThrow();

    await expect(
      notifyLevelUpdated({
        levelName: "Acheron Nerfed",
        levelSlug: "acheron-nerfed",
        oldRank: 2,
        newRank: 1,
        status: "RANKED",
        points: 320,
      }),
    ).resolves.not.toThrow();
  });

  it("wires notifyRecordAccepted and notifyNewSubmission into submissions action", () => {
    const submissionsSource = source("actions/submissions.ts");

    expect(submissionsSource).toContain("notifyRecordAccepted");
    expect(submissionsSource).toContain("notifyNewSubmission");
  });

  it("wires notifyNewSuggestion into level-suggestions action", () => {
    const suggestionsSource = source("actions/level-suggestions.ts");

    expect(suggestionsSource).toContain("notifyNewSuggestion");
  });

  it("wires notifyLevelRanked, notifyLevelUpdated, and notifyChangelogPosted into admin action", () => {
    const adminSource = source("actions/admin.ts");

    expect(adminSource).toContain("notifyLevelRanked");
    expect(adminSource).toContain("notifyLevelUpdated");
    expect(adminSource).toContain("notifyChangelogPosted");
  });

  it("wires notifyUpcomingDemonAdded into upcoming action", () => {
    const upcomingSource = source("actions/upcoming.ts");

    expect(upcomingSource).toContain("notifyUpcomingDemonAdded");
  });
});
