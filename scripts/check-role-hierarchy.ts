import "dotenv/config";

async function main() {
  console.log("🔍 Checking exact Discord role positions and hierarchy...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  // 1. Get bot user ID
  const meRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bot ${token}` },
  });
  const me = await meRes.json();
  console.log(`🤖 Bot User: ${me.username}#${me.discriminator} (ID: ${me.id})`);

  // 2. Get member details for bot in guild
  const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${me.id}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const member = await memberRes.json();

  // 3. Get all roles
  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const roles: Array<{ id: string; name: string; position: number; managed: boolean }> = await rolesRes.json();

  console.log(`Bot Member Roles: [${member.roles?.join(", ")}]`);

  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);
  console.log("\n📋 Current Role Order in Discord Server (Top to Bottom):");
  for (const r of sortedRoles) {
    const isBotRole = member.roles?.includes(r.id) || r.managed;
    console.log(`  Position ${r.position.toString().padStart(2)}: "${r.name}" (ID: ${r.id}) ${isBotRole ? "⬅️ (BOT ROLE)" : ""}`);
  }
}

main().catch(console.error);
