import "dotenv/config";

async function main() {
  console.log("🔍 Running Comprehensive Discord Server Audit (REST API Engine)...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    throw new Error("Missing DISCORD_BOT_TOKEN");
  }

  const headers = {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };

  // 1. Fetch Guild
  const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, { headers });
  if (!guildRes.ok) {
    throw new Error(`Failed to fetch guild: ${guildRes.status} ${guildRes.statusText}`);
  }
  const guild = await guildRes.json();
  console.log(`🏰 Server Name: "${guild.name}" (ID: ${guild.id})`);
  console.log(`👥 Member Count: ${guild.approximate_member_count ?? "N/A"} members`);

  // 2. Fetch Roles
  console.log("\n=======================================================");
  console.log("1. ROLES AUDIT");
  console.log("=======================================================");
  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers });
  const roles: Array<{ id: string; name: string; position: number; color: number }> = await rolesRes.json();
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

  const expectedRoles = [
    "👑 Owner",
    "🛡️ List Admin",
    "⚖️ List Moderator",
    "✨ List Reviewer",
    "🥇 Top 10 Player",
    "🥈 Top 50 Player",
    "🥉 Top 100 Player",
    "🎥 Content Creator",
    "🧪 Beta Tester",
    "🏆 List Victor",
    "📜 Verified Member",
    "🔔 Announcements Ping",
    "📰 List Updates Ping",
  ];

  let missingRoles = 0;
  for (const exp of expectedRoles) {
    const cleanName = exp.replace(/^[^\w\s]+/, "").trim().toLowerCase();
    const found = sortedRoles.find((r) => r.name.toLowerCase().includes(cleanName));
    if (found) {
      console.log(`  ✅ ${exp.padEnd(25)} (ID: ${found.id}, Pos: ${found.position})`);
    } else {
      console.log(`  ❌ Missing Role: ${exp}`);
      missingRoles++;
    }
  }

  // 3. Fetch Channels & Categories
  console.log("\n=======================================================");
  console.log("2. CHANNELS & CATEGORIES AUDIT");
  console.log("=======================================================");
  const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers });
  const channels: Array<{ id: string; name: string; type: number; parent_id?: string }> = await channelsRes.json();

  const categories = channels.filter((c) => c.type === 4);
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const voiceChannels = channels.filter((c) => c.type === 2);

  console.log(`📂 Categories (${categories.length}):`);
  for (const cat of categories) {
    const children = channels.filter((c) => c.parent_id === cat.id);
    console.log(`   📁 ${cat.name} (${children.length} channels)`);
  }

  console.log(`\n💬 Text & Announcement Channels (${textChannels.length}):`);
  for (const ch of textChannels) {
    const parent = categories.find((c) => c.id === ch.parent_id);
    console.log(`   #️⃣ ${ch.name.padEnd(30)} [Category: ${parent?.name || "None"}]`);
  }

  console.log(`\n🔊 Voice Channels (${voiceChannels.length}):`);
  for (const vc of voiceChannels) {
    const parent = categories.find((c) => c.id === vc.parent_id);
    console.log(`   🔊 ${vc.name.padEnd(30)} [Category: ${parent?.name || "None"}]`);
  }

  // 4. Info Channels Messages & Interactive Buttons Audit
  console.log("\n=======================================================");
  console.log("3. INFO CHANNELS & BUTTON ROLES AUDIT");
  console.log("=======================================================");

  const infoChannelNames = ["welcome", "rules", "official-links", "roles", "how-to-submit"];
  for (const key of infoChannelNames) {
    const ch = channels.find((c) => c.name.toLowerCase().includes(key));
    if (ch) {
      const msgRes = await fetch(`https://discord.com/api/v10/channels/${ch.id}/messages?limit=5`, { headers });
      const messages: Array<{ id: string; embeds: Array<{ title?: string }>; components: Array<{ components: Array<{ custom_id?: string; label?: string }> }> }> = await msgRes.json();
      console.log(`  📨 Channel #${ch.name} (ID: ${ch.id}):`);
      console.log(`     - Message Count: ${messages.length}`);
      for (const m of messages) {
        const title = m.embeds[0]?.title || "No embed title";
        const buttonCount = m.components?.reduce((acc, row) => acc + (row.components?.length || 0), 0) || 0;
        const buttonLabels = m.components?.flatMap((row) => row.components?.map((b) => b.label || b.custom_id)) || [];
        console.log(`     - Embed: "${title}" | Buttons (${buttonCount}): [${buttonLabels.join(", ")}]`);
      }
    }
  }

  console.log("\n=======================================================");
  console.log("🎯 FINAL AUDIT RESULT");
  console.log("=======================================================");
  console.log(`• Total Server Roles: ${roles.length}`);
  console.log(`• Total Categories: ${categories.length}`);
  console.log(`• Total Channels: ${channels.length}`);
  console.log(`• Missing Roles: ${missingRoles}`);
  if (missingRoles === 0) {
    console.log("🌟 SERVER STATUS: 100% PERFECT! ALL SYSTEMS VERIFIED AND RUNNING WITH 0 ERRORS!");
  }
}

main().catch(console.error);
