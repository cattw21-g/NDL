import "dotenv/config";

import { discordCommandDefinitions } from "../src/lib/discord-interactions";

const discordApiBase = "https://discord.com/api/v10";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to register Discord commands.`);
  }

  return value;
}

const token = requiredEnv("DISCORD_BOT_TOKEN");
const applicationId =
  process.env.DISCORD_APPLICATION_ID?.trim() ||
  process.env.DISCORD_CLIENT_ID?.trim();

if (!applicationId) {
  throw new Error(
    "DISCORD_APPLICATION_ID is required to register Discord commands.",
  );
}

const guildId = process.env.DISCORD_GUILD_ID?.trim();
const route = guildId
  ? `/applications/${applicationId}/guilds/${guildId}/commands`
  : `/applications/${applicationId}/commands`;

async function main() {
  const response = await fetch(`${discordApiBase}${route}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(discordCommandDefinitions),
  });

  if (!response.ok) {
    throw new Error(
      `Discord command registration failed (${response.status}): ${await response.text()}`,
    );
  }

  console.log(
    `Registered ${discordCommandDefinitions.length} Discord slash command(s)${
      guildId ? ` for guild ${guildId}` : " globally"
    }.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
