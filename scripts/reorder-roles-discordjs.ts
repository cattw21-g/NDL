import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

async function main() {
  console.log("🔧 Attempting to reorder Discord roles with setPositions()...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  await client.login(token);

  const guild = await client.guilds.fetch(guildId);
  console.log(`🏰 Connected to "${guild.name}"`);

  const roles = await guild.roles.fetch();
  const botMember = await guild.members.fetchMe();
  console.log(`🤖 Bot Highest Role Position: ${botMember.roles.highest.position} ("${botMember.roles.highest.name}")`);

  const targetOrderFromTopToBottom = [
    "👑 List Owner",
    "🛡️ List Admin",
    "⚖️ List Moderator",
    "✨ List Reviewer",
    "🛠️ List Developer",
    "🥇 Top 10 Player",
    "🥈 Top 50 Player",
    "🥉 Top 100 Player",
    "🏆 List Victor",
    "⚡ List Player",
    "🌟 Level Creator",
    "🎥 Content Creator",
    "🧪 Beta Tester",
    "📜 Verified Member",
    "🔔 Announcements Ping",
    "📰 List Updates Ping",
  ];

  const positions: Array<{ role: string; position: number }> = [];
  const total = targetOrderFromTopToBottom.length;

  for (let i = 0; i < targetOrderFromTopToBottom.length; i++) {
    const roleName = targetOrderFromTopToBottom[i];
    const role = roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase() && !r.managed);
    if (role) {
      const targetPos = total - i;
      positions.push({ role: role.id, position: targetPos });
      console.log(`Setting "${role.name}" to position ${targetPos}`);
    }
  }

  try {
    await guild.roles.setPositions(positions);
    console.log("✅ Roles successfully reordered via Discord API!");
  } catch (err) {
    console.log("⚠️ Discord API hierarchy restriction:", String(err));
  }

  await client.destroy();
}

main().catch(console.error);
