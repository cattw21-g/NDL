import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { ensureLatestChangelogPost, V1_5_1_ANNOUNCEMENT_POST } from "../src/lib/changelog.js";
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
  console.log("🚀 Publishing Nerfed Demonlist v1.5.1 Announcement...\n");

  // 1. Sync Changelog Post into Neon Postgres database
  console.log("📝 Upserting v1.5.1 post in database...");
  await ensureLatestChangelogPost(prisma);
  console.log("✅ Database synced successfully!\n");

  const postUrl = absoluteSiteUrl(`/changelog/${V1_5_1_ANNOUNCEMENT_POST.slug}`);
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
    title: `📢 ${V1_5_1_ANNOUNCEMENT_POST.title}`,
    url: postUrl,
    description:
      "We've just rolled out **Nerfed Demonlist v1.5.1**! This update brings bug fixes, crash recovery, smooth loading skeletons, strict audio guidelines for submissions, strengthened system security, and preparation for future community moderators!",
    color: 0x06b6d4, // Cyan
    fields: [
      {
        name: "🛠️ Bug Fixes & UX Polish",
        value: "Added crash-proof error recovery screens (`Try again` button), smooth animated loading skeletons across all pages, and snappier mobile navigation.",
      },
      {
        name: "🎙️ Mandatory Mic / Click Audio",
        value: "Clean, audible click/microphone audio is strictly required for legitimate record verification. Silent or muted submissions will not be accepted.",
      },
      {
        name: "🛡️ Background System Safety",
        value: "Implemented tamper-proof audit trails and hardened permissions to ensure user accounts, records, and site data stay 100% protected as the team expands.",
      },
      {
        name: "👥 Community Moderators Soon!",
        value: "With our safety foundations in place, we will soon begin looking for active, trusted community members to join the team as List Moderators!",
      },
      {
        name: "📖 Full Changelog Article",
        value: `[Read the full announcement on the website ↗](${postUrl})`,
      },
    ],
    footer: {
      text: "Nerfed Demonlist • v1.5.1 Update",
    },
    timestamp: new Date().toISOString(),
  };

  // 2. Broadcast to #📢・announcements
  console.log("📢 Broadcasting to #announcements...");
  await sendDiscordMessage(
    announcementsChannelId,
    token,
    {
      content: `<@&${announcementsRoleId}> **Nerfed Demonlist v1.5.1 is officially live!** 🚀`,
      embeds: [embed],
      allowed_mentions: { roles: [announcementsRoleId] },
    },
    ["📢", "🔥", "🛡️"],
  );

  // 3. Broadcast to #📰・list-updates
  console.log("📰 Broadcasting to #list-updates...");
  await sendDiscordMessage(
    listUpdatesChannelId,
    token,
    {
      content: `<@&${listUpdatesRoleId}> **Nerfed Demonlist v1.5.1 Update**`,
      embeds: [embed],
      allowed_mentions: { roles: [listUpdatesRoleId] },
    },
    ["🔥", "✅"],
  );

  console.log("\n🎉 v1.5.1 Announcement published successfully to Website and Discord!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
