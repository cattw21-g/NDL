import "dotenv/config";
import { createRolesActionRow, createRolesSelectorEmbed } from "../bot/src/embed-templates.js";

async function main() {
  console.log("🎭 Updating #🎭・roles with Link & Sync buttons...");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing bot token");

  // 1. Fetch channels to find #🎭・roles
  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string }> = await chanRes.json();
  const rolesChan = channels.find((c) => c.name.includes("roles"));

  if (!rolesChan) {
    console.error("Roles channel not found");
    return;
  }

  console.log(`Found roles channel: #${rolesChan.name} (${rolesChan.id})`);

  // 2. Fetch existing messages in channel to clean duplicates
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages?limit=10`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const messages: Array<{ id: string }> = await msgRes.json();

  for (const m of messages) {
    await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages/${m.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bot ${token}` },
    });
  }

  // 3. Post new updated embed with 4 buttons
  const embed = createRolesSelectorEmbed();
  const actionRow = createRolesActionRow();

  const postRes = await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      embeds: [embed.toJSON()],
      components: [actionRow.toJSON()],
    }),
  });

  if (postRes.ok) {
    console.log("✅ Successfully posted updated Roles & Account Linking embed!");
  } else {
    console.error("Failed to post embed:", await postRes.text());
  }
}

main().catch(console.error);
