import "dotenv/config";

async function main() {
  console.log("🔍 Inspecting All Roles on the Discord Server...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch roles: ${res.status} ${res.statusText}`);
  }

  const roles: Array<{
    id: string;
    name: string;
    position: number;
    color: number;
    hoist: boolean;
    managed: boolean;
    mentionable: boolean;
  }> = await res.json();

  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

  console.log(`Total Roles Found: ${sortedRoles.length}\n`);
  for (const r of sortedRoles) {
    const hex = "#" + r.color.toString(16).padStart(6, "0");
    const flags = [
      r.managed ? "🤖 Bot Managed" : null,
      r.hoist ? "📌 Hoisted" : null,
      r.mentionable ? "🔔 Mentionable" : null,
    ].filter(Boolean).join(" | ");

    console.log(`[Pos ${r.position.toString().padStart(2)}] "${r.name}" (ID: ${r.id}, Color: ${hex}) ${flags ? `(${flags})` : ""}`);
  }
}

main().catch(console.error);
