import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { ensureLatestChangelogPost, V1_6_0_ANNOUNCEMENT_POST } from "../src/lib/changelog.js";
import { absoluteSiteUrl } from "../src/lib/site-url.js";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function sendDiscordMessage(channelId: string, token: string, payload: Record<string, unknown>, emojis: string[] = []) {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to post to channel ${channelId} (${res.status}): ${text}`);
    return null;
  }

  const data: { id: string } = await res.json();
  console.log(`Successfully posted message ${data.id} to channel ${channelId}`);

  for (const emoji of emojis) {
    const encoded = encodeURIComponent(emoji);
    await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages/${data.id}/reactions/${encoded}/@me`, {
      method: "PUT",
      headers: { Authorization: `Bot ${token}` },
    }).catch(console.error);
  }

  return data;
}

async function main() {
  console.log("🚀 Publishing Nerfed Demonlist v1.6.0 Announcement...\n");

  // 1. Sync Changelog Post into database
  console.log("📝 Upserting v1.6.0 post in database...");
  await ensureLatestChangelogPost(prisma);
  console.log("✅ Database synced successfully!\n");

  const postUrl = absoluteSiteUrl(`/changelog/${V1_6_0_ANNOUNCEMENT_POST.slug}`);
  const token = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!token) {
    console.warn("⚠️ DISCORD_BOT_TOKEN is not defined in .env. Skipping Discord broadcast.");
    return;
  }

  const announcementsChannelId = "1541533253134188554"; // #📢・announcements
  const listUpdatesChannelId = "1541533254169923710";   // #📰・list-updates
  const announcementsRoleId = "1541533109756108896";   // 🔔 Announcements Ping
  const listUpdatesRoleId = "1541533112243322970";     // 📰 List Updates Ping

  const embed = {
    title: `📢 ${V1_6_0_ANNOUNCEMENT_POST.title}`,
    url: postUrl,
    description:
      "We've just rolled out **Nerfed Demonlist v1.6.0**! This update brings a refined Demonlist presentation with larger previews, major image optimization and speed upgrades, intelligent moderation safeguards, background resilience during outages, and countless quality-of-life polish items.",
    color: 0x06b6d4, // Cyan
    fields: [
      {
        name: "🏆 Demonlist & Browsing",
        value: "Expanded level cards with prominent 16:9 previews, high-contrast rank badges, decluttered toolbars, and a redesigned upcoming demons view.",
      },
      {
        name: "⚡ Performance & Images",
        value: "Lightweight responsive AVIF/WebP image delivery, priority loading for top demons, and smarter background sync.",
      },
      {
        name: "🛡️ Moderation & Records",
        value: "Automated anti-alt and conflict detection, top 10 verification gates, structured rejection feedback, and reversible record restoration.",
      },
      {
        name: "🔒 Reliability & Outages",
        value: "Automatic fallback resilience during database maintenance so the Demonlist remains browsable without downtime.",
      },
      {
        name: "📖 Full Changelog Article",
        value: `[Read the full v1.6.0 changelog on the website ↗](${postUrl})`,
      },
    ],
    footer: {
      text: "Nerfed Demonlist • v1.6.0 Release",
    },
    timestamp: new Date().toISOString(),
  };

  // 2. Broadcast to #📢・announcements
  console.log("📢 Broadcasting to #announcements...");
  await sendDiscordMessage(
    announcementsChannelId,
    token,
    {
      content: `<@&${announcementsRoleId}> **Nerfed Demonlist v1.6.0 is officially live!** 🚀`,
      embeds: [embed],
      allowed_mentions: { roles: [announcementsRoleId] },
    },
    ["📢", "🔥", "🎉"],
  );

  // 3. Broadcast to #📰・list-updates
  console.log("📰 Broadcasting to #list-updates...");
  await sendDiscordMessage(
    listUpdatesChannelId,
    token,
    {
      content: `<@&${listUpdatesRoleId}> **Nerfed Demonlist v1.6.0 Update**`,
      embeds: [embed],
      allowed_mentions: { roles: [listUpdatesRoleId] },
    },
    ["🔥", "✅"],
  );

  console.log("\n🎉 v1.6.0 Announcement published successfully to Website and Discord!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
