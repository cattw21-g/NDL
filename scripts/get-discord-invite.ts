import "dotenv/config";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing DISCORD_BOT_TOKEN");

  // 1. Get channels to find #welcome or #announcements
  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string; type: number }> = await chanRes.json();
  const welcomeChan = channels.find((c) => c.name.includes("welcome")) || channels[0];

  console.log(`Creating permanent invite for #${welcomeChan.name} (${welcomeChan.id})...`);

  // 2. Create permanent invite (max_age: 0 = never expires, max_uses: 0 = unlimited)
  const inviteRes = await fetch(`https://discord.com/api/v10/channels/${welcomeChan.id}/invites`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_age: 0,
      max_uses: 0,
      unique: false,
    }),
  });

  const invite = await inviteRes.json();
  console.log("Invite Response:", invite);
  if (invite.code) {
    console.log(`\n🎉 Permanent Invite Link: https://discord.gg/${invite.code}`);
  }
}

main().catch(console.error);
