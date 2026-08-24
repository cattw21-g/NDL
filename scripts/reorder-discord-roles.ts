import "dotenv/config";

async function main() {
  console.log("🔼 Sorting Discord Role Hierarchy in Server Settings...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });

  const roles: Array<{ id: string; name: string; position: number; managed: boolean }> = await res.json();

  const desiredOrderFromBottomToTop = [
    "@everyone",
    "📰 List Updates Ping",
    "🔔 Announcements Ping",
    "📜 Verified Member",
    "🧪 Beta Tester",
    "🎥 Content Creator",
    "🌟 Level Creator",
    "⚡ List Player",
    "🏆 List Victor",
    "🥉 Top 100 Player",
    "🥈 Top 50 Player",
    "🥇 Top 10 Player",
    "🛠️ List Developer",
    "✨ List Reviewer",
    "⚖️ List Moderator",
    "🛡️ List Admin",
    "👑 List Owner",
  ];

  const payload: Array<{ id: string; position: number }> = [];

  for (let i = 0; i < desiredOrderFromBottomToTop.length; i++) {
    const roleName = desiredOrderFromBottomToTop[i];
    const match = roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase() && !r.managed);
    if (match) {
      payload.push({
        id: match.id,
        position: i + 1,
      });
    }
  }

  if (payload.length > 0) {
    const patchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (patchRes.ok) {
      console.log("✅ Role hierarchy successfully sorted from Owner down to Ping roles!");
    } else {
      console.log(`Note: Role order status (${patchRes.status})`);
    }
  }
}

main().catch(console.error);
