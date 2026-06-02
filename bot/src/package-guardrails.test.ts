import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { publicCommandApiPaths } from "./commands/public.js";
import { staffCommandApiPaths } from "./commands/staff.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const botRoot = path.resolve(currentDir, "..");
const repoRoot = path.resolve(botRoot, "..");

describe("Discord bot package guardrails", () => {
  it("declares required package scripts and dependencies", () => {
    const botPackage = JSON.parse(
      fs.readFileSync(path.join(botRoot, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const rootPackage = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(botPackage.scripts).toMatchObject({
      dev: "tsx src/index.ts",
      build: "tsc -p tsconfig.json",
      start: "node dist/index.js",
      "register-commands": "tsx src/register-commands.ts",
    });
    expect(botPackage.dependencies).toHaveProperty("discord.js");
    expect(botPackage.dependencies).toHaveProperty("dotenv");
    expect(botPackage.devDependencies).toHaveProperty("typescript");
    expect(rootPackage.scripts).toMatchObject({
      "bot:dev": "npm.cmd --prefix bot run dev",
      "bot:build": "npm.cmd --prefix bot run build",
      "bot:register": "npm.cmd --prefix bot run register-commands",
    });
  });

  it("keeps public command path hints public and staff path hints protected", () => {
    expect(
      publicCommandApiPaths.every((pathName) =>
        pathName.startsWith("/api/public/"),
      ),
    ).toBe(true);
    expect(publicCommandApiPaths.join("\n")).not.toContain("/api/bot/staff");
    expect(
      staffCommandApiPaths.every((pathName) =>
        pathName.startsWith("/api/bot/staff/"),
      ),
    ).toBe(true);
  });

  it("documents setup, command registration, and safety rules", () => {
    const docs = fs.readFileSync(
      path.join(repoRoot, "docs/discord-bot.md"),
      "utf8",
    );
    const envExample = fs.readFileSync(
      path.join(repoRoot, ".env.example"),
      "utf8",
    );

    expect(docs).toContain("Discord Application Setup");
    expect(docs).toContain("register-commands");
    expect(docs).toContain("ephemeral");
    expect(docs).toContain("must not scrape HTML");
    expect(envExample).toContain("DISCORD_BOT_TOKEN");
    expect(envExample).toContain("NDL_BOT_API_SECRET");
  });
});
