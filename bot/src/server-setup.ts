import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  Guild,
  OverwriteResolvable,
  OverwriteType,
  PermissionFlagsBits,
  Role,
} from "discord.js";

import {
  createHowToSubmitEmbed,
  createOfficialLinksEmbed,
  createRolesActionRow,
  createRolesSelectorEmbed,
  createRulesEmbed,
  createWelcomeEmbed,
  NDL_COLORS,
} from "./embed-templates.js";

export type SetupResult = {
  guildName: string;
  rolesCreated: number;
  categoriesCreated: number;
  channelsCreated: number;
  embedsPosted: number;
  errors: string[];
};

export const SERVER_ROLES = [
  {
    name: "👑 List Owner",
    color: NDL_COLORS.AMBER,
    hoist: true,
    mentionable: true,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: "🛡️ List Moderator",
    color: NDL_COLORS.CYAN,
    hoist: true,
    mentionable: true,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.DeafenMembers,
      PermissionFlagsBits.MoveMembers,
      PermissionFlagsBits.ViewAuditLog,
      PermissionFlagsBits.ManageNicknames,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.MentionEveryone,
    ],
  },
  {
    name: "🛠️ List Developer",
    color: 0x14b8a6,
    hoist: true,
    mentionable: true,
    permissions: [
      PermissionFlagsBits.ManageWebhooks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ],
  },
  {
    name: "🥇 Top 10 Player",
    color: 0xeab308,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🥈 Top 50 Player",
    color: 0x94a3b8,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🥉 Top 100 Player",
    color: 0xd97706,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🏆 List Victor",
    color: NDL_COLORS.PURPLE,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "⚡ List Player",
    color: 0x38bdf8,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🌟 Level Creator",
    color: 0xfb923c,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🎥 Content Creator",
    color: 0xec4899,
    hoist: true,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🧪 Beta Tester",
    color: 0x22c55e,
    hoist: false,
    mentionable: false,
    permissions: [],
  },
  {
    name: "🔔 Announcements Ping",
    color: NDL_COLORS.SLATE,
    hoist: false,
    mentionable: true,
    permissions: [],
  },
  {
    name: "📰 List Updates Ping",
    color: NDL_COLORS.SLATE,
    hoist: false,
    mentionable: true,
    permissions: [],
  },
];

export async function provisionNdlServer(
  guild: Guild,
  options: { postEmbeds?: boolean; siteUrl?: string } = {},
): Promise<SetupResult> {
  const { postEmbeds = true, siteUrl = "https://www.nerfeddemonlist.net" } = options;
  const errors: string[] = [];
  let rolesCreated = 0;
  let categoriesCreated = 0;
  let channelsCreated = 0;
  let embedsPosted = 0;

  // 1. Set server name
  try {
    if (guild.name !== "Nerfed Demonlist | Official Community") {
      await guild.setName("Nerfed Demonlist | Official Community");
    }
  } catch (err) {
    errors.push(`Could not update guild name: ${String(err)}`);
  }

  // 2. Provision Roles
  const createdRoles = new Map<string, Role>();
  for (const roleDef of SERVER_ROLES) {
    try {
      let existingRole = guild.roles.cache.find((r) => r.name === roleDef.name);
      if (!existingRole) {
        existingRole = await guild.roles.create({
          name: roleDef.name,
          color: roleDef.color,
          hoist: roleDef.hoist,
          mentionable: roleDef.mentionable,
          permissions: roleDef.permissions,
          reason: "NDL Server Setup: Initializing role hierarchy",
        });
        rolesCreated++;
      } else {
        // Update existing role properties to ensure exact colors and flags
        await existingRole.edit({
          color: roleDef.color,
          hoist: roleDef.hoist,
          mentionable: roleDef.mentionable,
        });
      }
      createdRoles.set(roleDef.name, existingRole);
    } catch (err) {
      errors.push(`Failed to provision role '${roleDef.name}': ${String(err)}`);
    }
  }

  const modRole = createdRoles.get("🛡️ List Moderator") ?? guild.roles.cache.find((r) => r.name.includes("Moderator"));
  const ownerRole = createdRoles.get("👑 List Owner") ?? guild.roles.cache.find((r) => r.name.includes("Owner"));

  // Helper to find or create category
  async function ensureCategory(name: string, permissionOverwrites: OverwriteResolvable[] = []) {
    let cat = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (!cat) {
      cat = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites,
        reason: "NDL Server Setup: Creating Category",
      });
      categoriesCreated++;
    }
    return cat;
  }

  const isCommunity = guild.features.includes("COMMUNITY");

  // Helper to find or create text/voice/announcement channel
  async function ensureChannel(
    name: string,
    type: ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildAnnouncement,
    parentId?: string,
    topic?: string,
    permissionOverwrites: OverwriteResolvable[] = [],
  ) {
    const effectiveType =
      type === ChannelType.GuildAnnouncement && !isCommunity
        ? ChannelType.GuildText
        : type;

    let chan = guild.channels.cache.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.parentId === parentId,
    );
    if (!chan) {
      chan = await guild.channels.create({
        name,
        type: effectiveType,
        parent: parentId,
        topic,
        permissionOverwrites,
        reason: "NDL Server Setup: Creating Channel",
      });
      channelsCreated++;
    }
    return chan;
  }

  // Standard Read-Only overwrites for info channels
  const readOnlyOverwrites: OverwriteResolvable[] = [
    {
      id: guild.id, // @everyone
      type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      deny: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.AddReactions,
      ],
    },
  ];

  if (modRole) {
    readOnlyOverwrites.push({
      id: modRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ],
      deny: [],
    });
  }

  // Private Staff Overwrites
  const staffOverwrites: OverwriteResolvable[] = [
    {
      id: guild.id, // @everyone
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
      allow: [],
    },
  ];

  if (modRole) {
    staffOverwrites.push({
      id: modRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
      deny: [],
    });
  }

  if (ownerRole) {
    staffOverwrites.push({
      id: ownerRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
      deny: [],
    });
  }

  try {
    // 3. Category: 📌 INFORMATION & WELCOME
    const catInfo = await ensureCategory("📌 INFORMATION & WELCOME", readOnlyOverwrites);
    const chanWelcome = await ensureChannel(
      "👋・welcome",
      ChannelType.GuildText,
      catInfo.id,
      "Welcome to Nerfed Demonlist! Official links and getting started.",
      readOnlyOverwrites,
    );
    const chanRules = await ensureChannel(
      "📜・rules",
      ChannelType.GuildText,
      catInfo.id,
      "Official Nerfed Demonlist rules, proof requirements, and community standards.",
      readOnlyOverwrites,
    );
    await ensureChannel(
      "📢・announcements",
      ChannelType.GuildAnnouncement,
      catInfo.id,
      "Official announcements and major updates for Nerfed Demonlist.",
      readOnlyOverwrites,
    );
    await ensureChannel(
      "📰・list-updates",
      ChannelType.GuildAnnouncement,
      catInfo.id,
      "Demon additions, list placements, point adjustments, and leaderboard news.",
      readOnlyOverwrites,
    );
    const chanLinks = await ensureChannel(
      "🔗・official-links",
      ChannelType.GuildText,
      catInfo.id,
      "Directory of verified official Nerfed Demonlist links and socials.",
      readOnlyOverwrites,
    );
    const chanRoles = await ensureChannel(
      "🎭・roles",
      ChannelType.GuildText,
      catInfo.id,
      "Select your notification ping roles with one click!",
      readOnlyOverwrites,
    );

    // 4. Category: 💬 COMMUNITY & DISCUSSION
    const catComm = await ensureCategory("💬 COMMUNITY & DISCUSSION");
    await ensureChannel(
      "💬・general-chat",
      ChannelType.GuildText,
      catComm.id,
      "Main community discussion for Geometry Dash and Nerfed Demonlist.",
    );
    await ensureChannel(
      "🎮・demon-discussion",
      ChannelType.GuildText,
      catComm.id,
      "Discuss nerfed extremes, completions, progress runs, and demon difficulty.",
    );
    await ensureChannel(
      "🎬・clips-and-media",
      ChannelType.GuildText,
      catComm.id,
      "Share screenshots, completion videos, and Geometry Dash clips.",
    );
    await ensureChannel(
      "🎨・art-and-creations",
      ChannelType.GuildText,
      catComm.id,
      "Share thumbnails, level banners, Geometry Dash artwork, and creative designs.",
    );
    await ensureChannel(
      "💭・off-topic",
      ChannelType.GuildText,
      catComm.id,
      "Casual discussions, memes, and non-GD chats.",
    );
    await ensureChannel(
      "🤖・bot-commands",
      ChannelType.GuildText,
      catComm.id,
      "Use public slash commands: /top, /level, /player, /leaderboard, /rules, /search.",
    );

    // 5. Category: 🏆 SUBMISSIONS & PROGRESS
    const catSub = await ensureCategory("🏆 SUBMISSIONS & PROGRESS");
    const chanHowTo = await ensureChannel(
      "📥・how-to-submit",
      ChannelType.GuildText,
      catSub.id,
      "Step-by-step guide to submitting your runs on nerfeddemonlist.net/submit.",
      readOnlyOverwrites,
    );
    await ensureChannel(
      "✅・accepted-records",
      ChannelType.GuildAnnouncement,
      catSub.id,
      "Live feed of verified and accepted list records.",
      readOnlyOverwrites,
    );
    await ensureChannel(
      "📊・progress-runs",
      ChannelType.GuildText,
      catSub.id,
      "Share your percentage milestones, practice clips, and grind progression.",
    );
    await ensureChannel(
      "💡・level-suggestions",
      ChannelType.GuildText,
      catSub.id,
      "Suggest new nerfed demons to be reviewed and placed on the list.",
    );
    await ensureChannel(
      "🔥・upcoming-demons",
      ChannelType.GuildText,
      catSub.id,
      "Previews and progress on upcoming nerfed demons in verification.",
      readOnlyOverwrites,
    );

    // 6. Category: 🛠️ SUPPORT & TICKETS
    const catSupp = await ensureCategory("🛠️ SUPPORT & TICKETS");
    await ensureChannel(
      "❓・help-and-questions",
      ChannelType.GuildText,
      catSupp.id,
      "Ask questions about rules, submissions, or the website.",
    );
    await ensureChannel(
      "🐛・bug-reports",
      ChannelType.GuildText,
      catSupp.id,
      "Report bugs, glitches, or suggest website features.",
    );

    // 7. Category: 🛡️ STAFF HQ (Private)
    const catStaff = await ensureCategory("🛡️ STAFF HQ", staffOverwrites);
    await ensureChannel(
      "🔒・staff-chat",
      ChannelType.GuildText,
      catStaff.id,
      "Private list moderator and staff discussion.",
      staffOverwrites,
    );
    await ensureChannel(
      "📋・record-queue-logs",
      ChannelType.GuildText,
      catStaff.id,
      "Log feed of newly submitted records awaiting staff review.",
      staffOverwrites,
    );
    await ensureChannel(
      "💡・suggestion-queue-logs",
      ChannelType.GuildText,
      catStaff.id,
      "Log feed of newly submitted demon suggestions awaiting staff review.",
      staffOverwrites,
    );
    await ensureChannel(
      "📊・staff-commands",
      ChannelType.GuildText,
      catStaff.id,
      "Staff slash commands (/pending-records, /pending-suggestions, /stats, /audit).",
      staffOverwrites,
    );
    await ensureChannel(
      "🛡️・mod-logs",
      ChannelType.GuildText,
      catStaff.id,
      "Moderation logs and audit trail.",
      staffOverwrites,
    );

    // 8. Category: 🔊 VOICE CHANNELS
    const catVoice = await ensureCategory("🔊 VOICE CHANNELS");
    await ensureChannel("🔊・General Voice 1", ChannelType.GuildVoice, catVoice.id);
    await ensureChannel("🔊・General Voice 2", ChannelType.GuildVoice, catVoice.id);
    await ensureChannel("🎮・Demon Grinding 1 (Clicks)", ChannelType.GuildVoice, catVoice.id);
    await ensureChannel("🎮・Demon Grinding 2", ChannelType.GuildVoice, catVoice.id);
    await ensureChannel("🎧・Music & Chill", ChannelType.GuildVoice, catVoice.id);
    await ensureChannel("🔒・Staff Meeting", ChannelType.GuildVoice, catVoice.id, undefined, staffOverwrites);

    // 9. Post Formatted Embeds if requested
    if (postEmbeds) {
      const mentions: Record<string, string> = {
        rules: chanRules.id,
        "official-links": chanLinks.id,
        "how-to-submit": chanHowTo.id,
        welcome: chanWelcome.id,
      };
      const chanGeneral = guild.channels.cache.find((c) => c.name.includes("general-chat"));
      if (chanGeneral) mentions["general-chat"] = chanGeneral.id;
      const chanDemon = guild.channels.cache.find((c) => c.name.includes("demon-discussion"));
      if (chanDemon) mentions["demon-discussion"] = chanDemon.id;
      const chanBot = guild.channels.cache.find((c) => c.name.includes("bot-commands"));
      if (chanBot) mentions["bot-commands"] = chanBot.id;

      async function purgeAndSend(
        chan: typeof chanWelcome,
        embed: ReturnType<typeof createWelcomeEmbed>,
        components?: ActionRowBuilder<ButtonBuilder>[],
      ) {
        if (chan && chan.isTextBased()) {
          try {
            const messages = await chan.messages.fetch({ limit: 20 });
            for (const [, msg] of messages) {
              await msg.delete().catch(() => {});
            }
          } catch {
            // Ignore purge errors if messages are too old or cannot be deleted
          }
          await chan.send({ embeds: [embed], components: components ?? [] });
          embedsPosted++;
        }
      }

      await purgeAndSend(chanWelcome, createWelcomeEmbed(siteUrl, mentions));
      await purgeAndSend(chanRules, createRulesEmbed(siteUrl));
      await purgeAndSend(chanLinks, createOfficialLinksEmbed(siteUrl));
      await purgeAndSend(chanRoles, createRolesSelectorEmbed(), [createRolesActionRow()]);
      await purgeAndSend(chanHowTo, createHowToSubmitEmbed(siteUrl, mentions));
    }
  } catch (err) {
    errors.push(`Error during channel provisioning: ${String(err)}`);
  }

  return {
    guildName: guild.name,
    rolesCreated,
    categoriesCreated,
    channelsCreated,
    embedsPosted,
    errors,
  };
}
