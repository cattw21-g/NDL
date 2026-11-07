import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!token || !guildId) {
    console.error("❌ DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required in .env");
    process.exit(1);
  }

  console.log("⚡ Syncing all Discord Tier 1 Boost Perks to guild", guildId);

  // 1. Upgrade Voice Channels to 128 kbps
  console.log("\n🔊 1. Upgrading Voice Channels to 128 kbps...");
  const chRes = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (chRes.ok) {
    const channels = (await chRes.json()) as Array<{ id: string; name: string; type: number }>;
    const voiceChannels = channels.filter((c) => c.type === 2 || c.type === 13);
    for (const v of voiceChannels) {
      await fetch(`${DISCORD_API_BASE}/channels/${v.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bitrate: 128000 }),
      });
      console.log(`  ✅ Upgraded ${v.name} to 128 kbps`);
    }
  }

  // 2. Apply Animated Server Icon
  const iconPath = path.join(process.cwd(), "public", "server-icon-animated.gif");
  if (fs.existsSync(iconPath)) {
    console.log("\n✨ 2. Applying Animated Server Icon...");
    const iconBuf = fs.readFileSync(iconPath);
    const iconB64 = `data:image/gif;base64,${iconBuf.toString("base64")}`;
    const iconRes = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ icon: iconB64 }),
    });
    if (iconRes.ok) {
      console.log("  ✅ Animated Server Icon successfully applied!");
    } else {
      console.error("  ❌ Failed to apply animated icon:", await iconRes.text());
    }
  }

  // 3. Apply Custom Server Invite Banner (Splash)
  const bannerPath = path.join(process.cwd(), "public", "server-invite-banner.png");
  if (fs.existsSync(bannerPath)) {
    console.log("\n🖼️ 3. Applying Custom Server Invite Banner...");
    const bannerBuf = fs.readFileSync(bannerPath);
    const bannerB64 = `data:image/png;base64,${bannerBuf.toString("base64")}`;
    const bannerRes = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ splash: bannerB64 }),
    });
    if (bannerRes.ok) {
      console.log("  ✅ Custom Server Invite Banner successfully applied!");
    } else {
      console.error("  ❌ Failed to apply banner:", await bannerRes.text());
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL DISCORD TIER 1 BOOST PERKS APPLIED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("❌ Fatal error syncing Tier 1 perks:", err);
  process.exit(1);
});
