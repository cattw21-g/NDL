import "dotenv/config";

async function main() {
  console.log("🔍 Running Comprehensive Discord Server Audit...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing DISCORD_BOT_TOKEN");

  // 1. Fetch Guild
  const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const guild = await guildRes.json();
  console.log(`🏰 Server Name: ${guild.name}`);
  console.log(`🆔 Guild ID: ${guild.id}`);

  // 2. Fetch Channels
  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string; type: number; parent_id?: string }> = await chanRes.json();

  const categories = channels.filter((c) => c.type === 4);
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const voiceChannels = channels.filter((c) => c.type === 2);

  console.log(`\n📁 Categories (${categories.length}):`);
  for (const cat of categories) {
    console.log(` - ${cat.name} (${cat.id})`);
  }

  console.log(`\n💬 Text & Announcement Channels (${textChannels.length}):`);
  for (const tc of textChannels) {
    const parent = categories.find((c) => c.id === tc.parent_id);
    console.log(` - #${tc.name} in [${parent?.name || "root"}] (${tc.id})`);
  }

  console.log(`\n🔊 Voice Channels (${voiceChannels.length}):`);
  for (const vc of voiceChannels) {
    const parent = categories.find((c) => c.id === vc.parent_id);
    console.log(` - ${vc.name} in [${parent?.name || "root"}] (${vc.id})`);
  }

  // 3. Fetch Roles
  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const roles: Array<{ id: string; name: string; position: number; color: number }> = await rolesRes.json();
  roles.sort((a, b) => b.position - a.position);

  console.log(`\n🎭 Roles Hierarchy (${roles.length} roles):`);
  for (const r of roles) {
    console.log(` [Pos ${r.position}] ${r.name} (${r.id})`);
  }

  // 4. Verify Link Account & Roles Embeds
  const linkChan = channels.find((c) => c.name.includes("link-account"));
  if (linkChan) {
    const msgsRes = await fetch(`https://discord.com/api/v10/channels/${linkChan.id}/messages?limit=5`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const msgs: Array<{ id: string; embeds: Array<{ title: string }>; components: Array<{ components: Array<{ label: string; style: number; url?: string }> }> }> = await msgsRes.json();
    console.log(`\n🔗 #link-account Embeds (${msgs.length} message(s)):`);
    for (const m of msgs) {
      console.log(` - Title: "${m.embeds[0]?.title}"`);
      const btns = m.components?.[0]?.components?.map((b) => `${b.label} (${b.url || "custom_id"})`).join(" | ");
      console.log(`   Buttons: ${btns}`);
    }
  }

  const rolesChan = channels.find((c) => c.name.includes("roles"));
  if (rolesChan) {
    const msgsRes = await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages?limit=5`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const msgs: Array<{ id: string; embeds: Array<{ title: string }>; components: Array<{ components: Array<{ label: string }> }> }> = await msgsRes.json();
    console.log(`\n🎭 #roles Embeds (${msgs.length} message(s)):`);
    for (const m of msgs) {
      console.log(` - Title: "${m.embeds[0]?.title}"`);
      const btns = m.components?.[0]?.components?.map((b) => b.label).join(" | ");
      console.log(`   Buttons: ${btns}`);
    }
  }

  console.log("\n✅ Discord Server Audit Completed Successfully!");
}

main().catch(console.error);
