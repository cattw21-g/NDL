import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

async function main() {
  console.log("🔍 Running Comprehensive Full Discord Server Audit...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("ready", async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      console.log(`🏰 Connected to Guild: "${guild.name}" (ID: ${guild.id})`);

      const roles = await guild.roles.fetch();
      console.log(`• Total Server Roles: ${roles.size}`);

      const channels = await guild.channels.fetch();
      console.log(`• Total Server Channels: ${channels.size}`);

      console.log("🌟 SERVER SCAN COMPLETE!");
    } finally {
      await client.destroy();
    }
  });

  await client.login(token);
}

main().catch(console.error);
