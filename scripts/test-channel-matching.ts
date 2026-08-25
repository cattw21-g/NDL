import "dotenv/config";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing bot token");

  const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string }> = await res.json();

  const queries = [
    "accepted-records",
    "record-queue-logs",
    "suggestion-queue-logs",
    "list-updates",
    "announcements",
    "upcoming-demons",
    "mod-logs",
  ];

  console.log("Checking channel name resolution:");
  for (const q of queries) {
    const cleanQuery = q.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const match = channels.find((c) => {
      const cleanName = c.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      return cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName);
    });
    console.log(` - Query "${q}" -> Found channel: #${match?.name} (${match?.id})`);
  }
}

main().catch(console.error);
