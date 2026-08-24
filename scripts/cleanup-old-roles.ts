import "dotenv/config";

async function main() {
  console.log("🧹 Cleaning up old duplicate Discord roles...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });

  const roles: Array<{
    id: string;
    name: string;
    position: number;
    color: number;
    managed: boolean;
  }> = await res.json();

  // Find old duplicate role: "🛡️ List Moderator" with ID 1541533102021681254
  const oldModRole = roles.find((r) => r.id === "1541533102021681254" || (r.name.includes("🛡️") && r.name.includes("Moderator")));

  if (oldModRole) {
    console.log(`🗑️ Deleting old duplicate role: "${oldModRole.name}" (ID: ${oldModRole.id})...`);
    const delRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${oldModRole.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bot ${token}` },
    });

    if (delRes.ok) {
      console.log(`✅ Successfully deleted old leftover role: "${oldModRole.name}"!`);
    } else {
      console.error(`❌ Failed to delete role: ${delRes.status} ${delRes.statusText}`);
    }
  } else {
    console.log("✅ No old duplicate roles found.");
  }
}

main().catch(console.error);
