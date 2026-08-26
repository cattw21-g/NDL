import { absoluteSiteUrl } from "@/lib/site-url";

const DISCORD_API_BASE = "https://discord.com/api/v10";

// Memory cache for channel IDs to avoid fetching channels repeatedly
const channelIdCache = new Map<string, string>();

async function getChannelIdByName(
  channelNameQuery: string,
  guildId: string,
  botToken: string,
): Promise<string | null> {
  const cached = channelIdCache.get(channelNameQuery);
  if (cached) return cached;

  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const channels: Array<{ id: string; name: string; type: number }> =
      await res.json();
    const cleanQuery = channelNameQuery.toLowerCase().replace(/[^a-z0-9-]/g, "");

    const match = channels.find((c) => {
      const cleanName = c.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      return cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName);
    });

    if (match) {
      channelIdCache.set(channelNameQuery, match.id);
      return match.id;
    }
  } catch (err) {
    console.error("Failed to query Discord channels:", err);
  }

  return null;
}

async function sendDiscordEmbed(
  channelName: string,
  embed: Record<string, unknown>,
) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) {
    console.warn(`Cannot send embed to #${channelName}: Missing DISCORD_BOT_TOKEN`);
    return;
  }

  try {
    const channelId = await getChannelIdByName(channelName, guildId, token);
    if (!channelId) {
      console.warn(`Cannot send embed: Channel "${channelName}" not found in Discord`);
      return;
    }

    const msgRes = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!msgRes.ok) {
      const errText = await msgRes.text();
      console.error(`Discord API Error [${msgRes.status}] posting to #${channelName}:`, errText);
    }
  } catch (err) {
    console.error(`Failed to dispatch Discord embed to #${channelName}:`, err);
  }
}

/**
 * Automatically broadcast accepted record to #accepted-records
 */
export async function notifyRecordAccepted(data: {
  playerName: string;
  playerHandle: string;
  levelName: string;
  levelSlug: string;
  levelRank: number | null;
  progress: number;
  pointsAwarded: number;
  videoUrl: string;
  reviewerName?: string;
  thumbnailUrl?: string | null;
  fps?: number | null;
  cbfUsed?: boolean | null;
}) {
  const levelUrl = absoluteSiteUrl(`/levels/${data.levelSlug}`);
  const playerUrl = absoluteSiteUrl(`/players/${encodeURIComponent(data.playerHandle)}`);
  const rankStr = data.levelRank ? `#${data.levelRank}` : "Unranked";
  const is100 = data.progress === 100;

  const validThumbnail =
    data.thumbnailUrl && data.thumbnailUrl.startsWith("http")
      ? data.thumbnailUrl
      : undefined;

  const embed = {
    title: is100
      ? `🏆 100% Completion Verified — ${data.levelName} (${rankStr})`
      : `⚡ Progress Record Verified — ${data.levelName} (${data.progress}%)`,
    description: is100
      ? `**[${data.playerName}](${playerUrl})** has conquered **[${data.levelName}](${levelUrl})** (${rankStr}) and earned **+${data.pointsAwarded} points**!`
      : `**[${data.playerName}](${playerUrl})** achieved **${data.progress}%** on **[${data.levelName}](${levelUrl})**!`,
    url: levelUrl,
    color: is100 ? 0x10b981 : 0x06b6d4, // Emerald Green for 100%, Cyan for progress
    thumbnail: validThumbnail ? { url: validThumbnail } : undefined,
    fields: [
      {
        name: "🏆 Demon",
        value: `**[${data.levelName}](${levelUrl})**\nRank: **${rankStr}**`,
        inline: true,
      },
      {
        name: "👤 Player",
        value: `**[${data.playerName}](${playerUrl})**\nProgress: **${data.progress}%**`,
        inline: true,
      },
      {
        name: "💎 Points Awarded",
        value: `**+${data.pointsAwarded} pts**\nStatus: **Verified**`,
        inline: true,
      },
      {
        name: "⚙️ Hardware / Run Stats",
        value: `FPS: **${data.fps || 360} FPS** • CBF: **${data.cbfUsed ? "Yes" : "No"}**`,
        inline: true,
      },
      ...(data.videoUrl && data.videoUrl.startsWith("http")
        ? [
            {
              name: "🎬 Proof Video",
              value: `[Watch Verification Run ↗](${data.videoUrl})`,
              inline: true,
            },
          ]
        : []),
    ],
    footer: {
      text: data.reviewerName
        ? `Verified by ${data.reviewerName} • Nerfed Demonlist`
        : "Verified • Nerfed Demonlist",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("accepted-records", embed);
}

/**
 * Automatically alert staff in #record-queue-logs when a new run is submitted
 */
export async function notifyNewSubmission(data: {
  playerName: string;
  playerHandle: string;
  levelName: string;
  levelSlug: string;
  levelRank: number | null;
  progress: number;
  videoUrl: string;
}) {
  const modUrl = absoluteSiteUrl("/moderation");
  const rankStr = data.levelRank ? `#${data.levelRank}` : "Unranked";

  const embed = {
    title: `📋 New Record Submission — ${data.levelName}`,
    description: `**${data.playerName}** submitted a **${data.progress}% run** for staff review.`,
    url: modUrl,
    color: 0xf59e0b, // Amber Gold
    fields: [
      {
        name: "Level",
        value: `${data.levelName} (${rankStr})`,
        inline: true,
      },
      {
        name: "Progress",
        value: `${data.progress}%`,
        inline: true,
      },
      {
        name: "Submitted Video",
        value: `[Click to Watch](${data.videoUrl})`,
        inline: false,
      },
      {
        name: "Review Queue",
        value: `[Open Staff Moderation Hub](${modUrl})`,
        inline: false,
      },
    ],
    footer: {
      text: "NDL Staff Notification Queue",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("record-queue-logs", embed);
}

/**
 * Automatically alert staff in #suggestion-queue-logs when a new demon is suggested
 */
export async function notifyNewSuggestion(data: {
  userName: string;
  userHandle: string;
  levelName: string;
  originalName: string;
  videoUrl?: string | null;
}) {
  const modUrl = absoluteSiteUrl("/moderation");

  const embed = {
    title: `💡 New Demon Suggestion — ${data.levelName}`,
    description: `**${data.userName}** suggested a new nerfed demon for the list.`,
    url: modUrl,
    color: 0x06b6d4, // Cyan
    fields: [
      {
        name: "Suggested Demon",
        value: data.levelName,
        inline: true,
      },
      {
        name: "Original Level",
        value: data.originalName,
        inline: true,
      },
      ...(data.videoUrl
        ? [
            {
              name: "Showcase Video",
              value: `[Watch Showcase](${data.videoUrl})`,
              inline: false,
            },
          ]
        : []),
      {
        name: "Review Queue",
        value: `[Open Staff Moderation Hub](${modUrl})`,
        inline: false,
      },
    ],
    footer: {
      text: "NDL Suggestion Queue",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("suggestion-queue-logs", embed);
}

/**
 * Automatically broadcast new demon additions / placements to #list-updates
 */
export async function notifyLevelRanked(data: {
  levelName: string;
  levelSlug: string;
  levelRank: number | null;
  points: number;
  verifier: string;
  nerfCreator: string;
  showcaseUrl?: string | null;
  thumbnailUrl?: string | null;
}) {
  const levelUrl = absoluteSiteUrl(`/levels/${data.levelSlug}`);
  const rankStr = data.levelRank ? `#${data.levelRank}` : "Unranked";

  const validThumbnail =
    data.thumbnailUrl && data.thumbnailUrl.startsWith("http")
      ? data.thumbnailUrl
      : undefined;

  const embed = {
    title: `🔥 New Demon Ranked — ${data.levelName} (${rankStr})`,
    description: `**[${data.levelName}](${levelUrl})** has officially been added to the Nerfed Demonlist at **${rankStr}** worth **${data.points} points**!`,
    url: levelUrl,
    color: 0xf59e0b, // Amber Gold
    thumbnail: validThumbnail ? { url: validThumbnail } : undefined,
    fields: [
      {
        name: "🏆 Placement Rank",
        value: `**${rankStr}**`,
        inline: true,
      },
      {
        name: "💎 Points Value",
        value: `**${data.points} pts**`,
        inline: true,
      },
      {
        name: "⚔️ Verifier",
        value: data.verifier || "N/A",
        inline: true,
      },
      {
        name: "🛠️ Nerf Creator",
        value: data.nerfCreator || "N/A",
        inline: true,
      },
      ...(data.showcaseUrl && data.showcaseUrl.startsWith("http")
        ? [
            {
              name: "🎬 Verification Showcase",
              value: `[Watch Showcase Video ↗](${data.showcaseUrl})`,
              inline: true,
            },
          ]
        : []),
      {
        name: "🌐 Level Page",
        value: `[Open on Nerfed Demonlist ↗](${levelUrl})`,
        inline: true,
      },
    ],
    footer: {
      text: "Nerfed Demonlist • Official List Update",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("list-updates", embed);
}

/**
 * Automatically broadcast when an upcoming demon is added/updated to #upcoming-demons
 */
export async function notifyUpcomingDemonAdded(data: {
  levelName: string;
  originalName: string;
  verifier: string;
  nerfCreator: string;
  showcaseUrl?: string | null;
  difficulty?: string;
  thumbnailUrl?: string | null;
}) {
  const upcomingUrl = absoluteSiteUrl("/upcoming");

  const validThumbnail =
    data.thumbnailUrl && data.thumbnailUrl.startsWith("http")
      ? data.thumbnailUrl
      : undefined;

  const embed = {
    title: `🔥 New Upcoming Demon — ${data.levelName}`,
    description: `A new nerfed demon is currently in verification and coming soon to Nerfed Demonlist!`,
    url: upcomingUrl,
    color: 0xf97316, // Orange / Fire
    thumbnail: validThumbnail ? { url: validThumbnail } : undefined,
    fields: [
      {
        name: "Demon",
        value: data.levelName,
        inline: true,
      },
      {
        name: "Original Level",
        value: data.originalName,
        inline: true,
      },
      {
        name: "Verifier",
        value: data.verifier || "Open / Unassigned",
        inline: true,
      },
      {
        name: "Nerf Creator",
        value: data.nerfCreator,
        inline: true,
      },
      ...(data.showcaseUrl && data.showcaseUrl.startsWith("http")
        ? [
            {
              name: "Showcase Preview",
              value: `[Watch Verification Showcase ↗](${data.showcaseUrl})`,
              inline: true,
            },
          ]
        : []),
      {
        name: "Upcoming Hub",
        value: `[View All Upcoming Demons ↗](${upcomingUrl})`,
        inline: true,
      },
    ],
    footer: {
      text: "Nerfed Demonlist Upcoming Hub",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("upcoming-demons", embed);
}

/**
 * Automatically broadcast news & changelog posts to #list-updates
 */
export async function notifyChangelogPosted(data: {
  title: string;
  slug: string;
  category: string;
  summary: string;
}) {
  const changelogUrl = absoluteSiteUrl(`/changelog/${data.slug}`);

  const embed = {
    title: `📢 New List Update — ${data.title}`,
    description: data.summary,
    url: changelogUrl,
    color: 0x06b6d4, // Cyan
    fields: [
      {
        name: "Category",
        value: data.category,
        inline: true,
      },
      {
        name: "Read Full Article",
        value: `[Open on Website ↗](${changelogUrl})`,
        inline: true,
      },
    ],
    footer: {
      text: "Nerfed Demonlist News & Changelog",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("list-updates", embed);
}

/**
 * Automatically broadcast when a level's rank or status updates
 */
export async function notifyLevelUpdated(data: {
  levelName: string;
  levelSlug: string;
  oldRank: number | null;
  newRank: number | null;
  status: string;
  points: number;
  thumbnailUrl?: string | null;
}) {
  const levelUrl = absoluteSiteUrl(`/levels/${data.levelSlug}`);
  const isRankChange =
    data.oldRank !== null &&
    data.newRank !== null &&
    data.oldRank !== data.newRank;
  const oldRankStr = data.oldRank ? `#${data.oldRank}` : "Unranked";
  const newRankStr = data.newRank ? `#${data.newRank}` : "Unranked";

  const validThumbnail =
    data.thumbnailUrl && data.thumbnailUrl.startsWith("http")
      ? data.thumbnailUrl
      : undefined;

  let title = `📊 Level Adjusted — ${data.levelName} (${newRankStr})`;
  let description = `**[${data.levelName}](${levelUrl})** has been adjusted on the list to **${newRankStr}** (${data.points} pts).`;
  let color = 0x6366f1; // Blurple / Indigo

  if (isRankChange) {
    const isPromotion = (data.oldRank || 999) > (data.newRank || 999);
    title = isPromotion
      ? `📈 Demon Moved Up — ${data.levelName} (#${data.oldRank} ➔ #${data.newRank})`
      : `📉 Demon Moved Down — ${data.levelName} (#${data.oldRank} ➔ #${data.newRank})`;
    description = `**[${data.levelName}](${levelUrl})** has moved from **#${data.oldRank}** to **#${data.newRank}** on the list!`;
    color = isPromotion ? 0x10b981 : 0xf43f5e;
  } else if (data.status === "LEGACY") {
    title = `📦 Demon Moved to Legacy — ${data.levelName}`;
    description = `**[${data.levelName}](${levelUrl})** has been moved to the **Legacy List** (${data.points} pts).`;
    color = 0x64748b; // Slate
  }

  const embed = {
    title,
    description,
    url: levelUrl,
    color,
    thumbnail: validThumbnail ? { url: validThumbnail } : undefined,
    fields: [
      {
        name: "📍 Placement Change",
        value: `${oldRankStr} ➡️ **${newRankStr}**`,
        inline: true,
      },
      {
        name: "💎 Points",
        value: `**${data.points} pts**`,
        inline: true,
      },
      {
        name: "📊 Status",
        value: `**${data.status}**`,
        inline: true,
      },
      {
        name: "🌐 Level Page",
        value: `[Open on Nerfed Demonlist ↗](${levelUrl})`,
        inline: false,
      },
    ],
    footer: {
      text: "Nerfed Demonlist • Official List Update",
    },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordEmbed("list-updates", embed);
}
