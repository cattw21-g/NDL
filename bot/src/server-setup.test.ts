import { describe, expect, it } from "vitest";

import {
  createHowToSubmitEmbed,
  createOfficialLinksEmbed,
  createRulesEmbed,
  createWelcomeEmbed,
  NDL_COLORS,
} from "./embed-templates.js";
import { SERVER_ROLES } from "./server-setup.js";

describe("Discord server setup & embed templates", () => {
  it("defines comprehensive server roles with correct color schemes", () => {
    const owner = SERVER_ROLES.find((r) => r.name.includes("Owner"));
    const mod = SERVER_ROLES.find((r) => r.name.includes("Moderator"));
    const victor = SERVER_ROLES.find((r) => r.name.includes("Victor"));
    const player = SERVER_ROLES.find((r) => r.name.includes("Player"));
    const creator = SERVER_ROLES.find((r) => r.name.includes("Creator"));

    expect(owner).toBeDefined();
    expect(owner?.color).toBe(NDL_COLORS.AMBER);
    expect(owner?.hoist).toBe(true);

    expect(mod).toBeDefined();
    expect(mod?.color).toBe(NDL_COLORS.CYAN);
    expect(mod?.hoist).toBe(true);

    expect(victor).toBeDefined();
    expect(victor?.color).toBe(NDL_COLORS.PURPLE);

    expect(player).toBeDefined();
    expect(creator).toBeDefined();

    const top10 = SERVER_ROLES.find((r) => r.name.includes("Top 10"));
    const contentCreator = SERVER_ROLES.find((r) => r.name.includes("Content Creator"));
    const betaTester = SERVER_ROLES.find((r) => r.name.includes("Beta Tester"));

    expect(top10).toBeDefined();
    expect(contentCreator).toBeDefined();
    expect(betaTester).toBeDefined();
  });

  it("creates welcome embed with official website and navigation", () => {
    const embed = createWelcomeEmbed("https://www.nerfeddemonlist.net");
    const json = embed.toJSON();
    const str = JSON.stringify(json);

    expect(str).toContain("Welcome to the Nerfed Demonlist Community");
    expect(str).toContain("nerfeddemonlist.net");
    expect(str).toContain("@cattw_gd");
    expect(json.color).toBe(NDL_COLORS.CYAN);
  });

  it("creates rules embed with CBF policy and anti-cheat guidelines", () => {
    const embed = createRulesEmbed("https://www.nerfeddemonlist.net");
    const json = embed.toJSON();
    const str = JSON.stringify(json);

    expect(str).toContain("Community & Submission Rules");
    expect(str).toContain("CBF");
    expect(str).toContain("Valid Record Proof");
    expect(str).toContain("Zero Tolerance for Cheating");
    expect(json.color).toBe(NDL_COLORS.AMBER);
  });

  it("creates official links embed with clean directory", () => {
    const embed = createOfficialLinksEmbed("https://www.nerfeddemonlist.net");
    const json = embed.toJSON();
    const str = JSON.stringify(json);

    expect(str).toContain("Official Links & Directory");
    expect(str).toContain("https://www.nerfeddemonlist.net");
    expect(str).toContain("/submit");
    expect(str).toContain("/suggest-level");
    expect(json.color).toBe(NDL_COLORS.EMERALD);
  });

  it("creates how to submit embed with step-by-step instructions", () => {
    const embed = createHowToSubmitEmbed("https://www.nerfeddemonlist.net");
    const json = embed.toJSON();
    const str = JSON.stringify(json);

    expect(str).toContain("How to Submit Runs to Nerfed Demonlist");
    expect(str).toContain("PENDING");
    expect(str).toContain("nerfeddemonlist.net/submit");
  });
});
