import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { provisionNdlServer } from "../bot/src/server-setup.js";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) {
    console.error("❌ Error: DISCORD_BOT_TOKEN is required in .env");
    process.exit(1);
  }

  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.nerfeddemonlist.net";

  console.log("🤖 Connecting NDL Setup Bot to Discord...");
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  await client.login(token);

  await new Promise<void>((resolve) => {
    client.once("ready", () => resolve());
  });

  console.log(`✅ Logged in as ${client.user?.tag}`);

  let guild = guildId ? await client.guilds.fetch(guildId).catch(() => null) : null;

  if (!guild) {
    const guilds = await client.guilds.fetch();
    const firstGuild = guilds.first();
    if (!firstGuild) {
      console.error("❌ The bot is not currently in any Discord servers. Please invite the bot with Administrator permission first!");
      await client.destroy();
      process.exit(1);
    }
    guild = await firstGuild.fetch();
  }

  console.log(`🏰 Found Guild: "${guild.name}" (${guild.id})`);
  console.log("⚡ Provisioning official NDL Server structure (Roles, Categories, Channels, Permissions, Embeds)...");

  const result = await provisionNdlServer(guild as never, {
    postEmbeds: true,
    siteUrl,
  });

  console.log("\n=======================================================");
  console.log("🎉 NDL DISCORD SERVER SETUP COMPLETE!");
  console.log("=======================================================");
  console.log(`• Server Name: ${result.guildName}`);
  console.log(`• Roles Created / Synced: ${result.rolesCreated}`);
  console.log(`• Categories Created: ${result.categoriesCreated}`);
  console.log(`• Channels Created: ${result.channelsCreated}`);
  console.log(`• Official Embeds Posted: ${result.embedsPosted}`);

  if (result.errors.length > 0) {
    console.log("\n⚠️ Warnings:");
    result.errors.forEach((err) => console.log(`  • ${err}`));
  }

  console.log("=======================================================\n");

  await client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal setup error:", err);
  process.exit(1);
});
