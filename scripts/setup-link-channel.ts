import "dotenv/config";
import {
  createAccountLinkingActionRow,
  createAccountLinkingEmbed,
  createRolesActionRow,
  createRolesSelectorEmbed,
} from "../bot/src/embed-templates.js";

async function main() {
  console.log("🚀 Setting up dedicated #🔗・link-account channel & cleaning #🎭・roles...\n");

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing DISCORD_BOT_TOKEN");

  // 1. Fetch channels & categories
  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string; parent_id?: string; type: number }> = await chanRes.json();

  const catInfo = channels.find((c) => c.name.includes("INFORMATION & WELCOME"));
  const rolesChan = channels.find((c) => c.name.includes("roles"));

  // 2. Ensure #🔗・link-account exists
  let linkChan = channels.find((c) => c.name.includes("link-account") || c.name.includes("link-ndl"));

  if (!linkChan) {
    console.log("Creating dedicated #🔗・link-account channel in INFORMATION & WELCOME...");
    const createRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "🔗・link-account",
        type: 0, // GuildText
        parent_id: catInfo?.id,
        topic: "Connect your Discord account to NDL for automated player and rank roles!",
      }),
    });
    linkChan = await createRes.json();
    console.log(`✅ Created #${linkChan?.name} (${linkChan?.id})`);
  } else {
    console.log(`Found existing #${linkChan.name} (${linkChan.id})`);
  }

  // 3. Purge and post into #🔗・link-account
  if (linkChan && linkChan.id) {
    const msgsRes = await fetch(`https://discord.com/api/v10/channels/${linkChan.id}/messages?limit=20`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const msgs: Array<{ id: string }> = await msgsRes.json();
    for (const m of msgs) {
      await fetch(`https://discord.com/api/v10/channels/${linkChan.id}/messages/${m.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${token}` },
      });
    }

    const embed = createAccountLinkingEmbed();
    const row = createAccountLinkingActionRow("https://www.nerfeddemonlist.net");

    await fetch(`https://discord.com/api/v10/channels/${linkChan.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed.toJSON()],
        components: [row.toJSON()],
      }),
    });
    console.log("✅ Successfully posted dedicated Account Linking embed to #🔗・link-account!");
  }

  // 4. Purge and post clean Ping Roles into #🎭・roles
  if (rolesChan && rolesChan.id) {
    const msgsRes = await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages?limit=20`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const msgs: Array<{ id: string }> = await msgsRes.json();
    for (const m of msgs) {
      await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages/${m.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${token}` },
      });
    }

    const embed = createRolesSelectorEmbed();
    const row = createRolesActionRow();

    await fetch(`https://discord.com/api/v10/channels/${rolesChan.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed.toJSON()],
        components: [row.toJSON()],
      }),
    });
    console.log("✅ Successfully posted clean Ping Roles embed to #🎭・roles!");
  }
}

main().catch(console.error);
