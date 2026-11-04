import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type APIEmbed,
  type ButtonInteraction,
  type Guild,
  type ModalSubmitInteraction,
} from "discord.js";

import { NDL_COLORS, renderProgressBar, isStaffMember } from "./staff-voting.js";

const OPTION_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"] as const;

export type CommunityVoteOptionState = {
  index: number;
  emoji: string;
  name: string;
  voters: string[];
};

export type CommunityVoteState = {
  title: string;
  description: string;
  isClosed: boolean;
  creatorId: string;
  options: CommunityVoteOptionState[];
  totalVotes: number;
};

/**
 * Checks if a Discord member is a verified Community Voter or a Staff member.
 */
export function isCommunityVoter(
  member: unknown,
  guild?: Guild | null,
  voterRoleId?: string | null,
  staffRoleId?: string | null,
): boolean {
  if (!member || typeof member !== "object") return false;

  // 1. Staff members, Admins, and Owners can always vote in community polls
  if (isStaffMember(member, guild, staffRoleId)) {
    return true;
  }

  // 2. Check Voter role ID explicitly
  const roles = (member as any).roles;
  if (Array.isArray(roles)) {
    if (voterRoleId && roles.includes(voterRoleId)) return true;

    if (guild && "roles" in guild && guild.roles?.cache) {
      for (const roleId of roles) {
        const guildRole = guild.roles.cache.get(roleId);
        if (guildRole && guildRole.name.toLowerCase().includes("voter")) {
          return true;
        }
      }
    }
  }

  // 3. Role Cache Names check
  if (roles && typeof roles === "object" && "cache" in roles) {
    const cache = (roles as any).cache;
    if (voterRoleId && typeof cache?.has === "function" && cache.has(voterRoleId)) {
      return true;
    }
    if (typeof cache?.some === "function") {
      return cache.some((r: any) => r.name.toLowerCase().includes("voter"));
    }
  }

  return false;
}

export function createCommunityVoteModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("community_vote_modal")
    .setTitle("Create Community Vote");

  const titleInput = new TextInputBuilder()
    .setCustomId("vote_title")
    .setLabel("Level / Question to Vote On")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. Should Nerfed Slaughterhouse be placed at #12?")
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(200);

  const descInput = new TextInputBuilder()
    .setCustomId("vote_description")
    .setLabel("Context & Showcase Video URL (Optional)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Level ID, verification video URL, difficulty details...")
    .setRequired(false)
    .setMaxLength(1000);

  const opt1Input = new TextInputBuilder()
    .setCustomId("vote_opt1")
    .setLabel("Option 1")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Yes / Place Level (leave blank for default)")
    .setRequired(false)
    .setMaxLength(80);

  const opt2Input = new TextInputBuilder()
    .setCustomId("vote_opt2")
    .setLabel("Option 2")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("No / Reject Level (leave blank for default)")
    .setRequired(false)
    .setMaxLength(80);

  const opt3Input = new TextInputBuilder()
    .setCustomId("vote_opt3")
    .setLabel("Option 3 (Optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. Needs Rework / Lower Nerfs")
    .setRequired(false)
    .setMaxLength(80);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(opt1Input),
    new ActionRowBuilder<TextInputBuilder>().addComponents(opt2Input),
    new ActionRowBuilder<TextInputBuilder>().addComponents(opt3Input),
  );

  return modal;
}

export function createCommunityVotePayload(params: {
  title: string;
  description?: string | null;
  options: string[];
  creatorId: string;
  creatorName: string;
}) {
  const { title, description, options, creatorId } = params;

  const voteOptions: CommunityVoteOptionState[] = options.slice(0, 4).map((opt, i) => ({
    index: i,
    emoji: OPTION_EMOJIS[i] || `${i + 1}️⃣`,
    name: opt.trim(),
    voters: [],
  }));

  const embed = buildCommunityVoteEmbed({
    title,
    description: description?.trim() || "",
    isClosed: false,
    creatorId,
    options: voteOptions,
    totalVotes: 0,
  });

  const components = buildCommunityVoteComponents(voteOptions, false);

  return {
    embeds: [embed],
    components,
  };
}

export async function handleCommunityVoteModalSubmit(
  interaction: ModalSubmitInteraction,
  staffRoleId?: string | null,
  voterRoleId?: string | null,
) {
  if (!isStaffMember(interaction.member, interaction.guild, staffRoleId)) {
    await interaction.reply({
      content:
        "⛔ **Access Denied**: Only Nerfed Demonlist Staff members can create a community vote.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const title = interaction.fields.getTextInputValue("vote_title").trim();
  const description =
    interaction.fields.getTextInputValue("vote_description")?.trim() || null;
  const opt1 =
    interaction.fields.getTextInputValue("vote_opt1")?.trim() || "Yes / Place Level";
  const opt2 =
    interaction.fields.getTextInputValue("vote_opt2")?.trim() || "No / Reject Level";
  const opt3 = interaction.fields.getTextInputValue("vote_opt3")?.trim();

  const options = [opt1, opt2];
  if (opt3) options.push(opt3);

  const payload = createCommunityVotePayload({
    title,
    description,
    options,
    creatorId: interaction.user.id,
    creatorName: interaction.user.displayName || interaction.user.username,
  });

  // Find #community-votes channel
  const targetChannel =
    interaction.guild?.channels.cache.find(
      (c) =>
        c.isTextBased() &&
        (c.name.includes("community-votes") ||
          c.name.includes("community-vote")),
    ) ?? interaction.channel;

  // Resolve voter mention
  let voterMention = "@everyone";
  if (interaction.guild) {
    const vRole =
      (voterRoleId && interaction.guild.roles.cache.get(voterRoleId)) ||
      interaction.guild.roles.cache.find((r) => r.name.toLowerCase().includes("voter"));
    if (vRole) {
      voterMention = `<@&${vRole.id}>`;
    }
  }

  const fullPayload = {
    content: `📢 ${voterMention} **A new Community Vote is now open!** Cast your votes below.`,
    ...payload,
  };

  if (
    targetChannel &&
    "send" in targetChannel &&
    targetChannel.id !== interaction.channelId
  ) {
    const message = await targetChannel.send(fullPayload);
    await interaction.reply({
      content: `✅ **Community vote published!**\nPosted in <#${targetChannel.id}>: [Jump to Vote](${message.url})`,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply(fullPayload);
  }
}

export function buildCommunityVoteEmbed(state: CommunityVoteState): EmbedBuilder {
  const { title, description, isClosed, creatorId, options, totalVotes } = state;

  const embed = new EmbedBuilder()
    .setTitle(`${isClosed ? "🗳️ [CLOSED]" : "🗳️"} Community Vote: ${title.slice(0, 200)}`)
    .setColor(isClosed ? NDL_COLORS.SLATE : 0x6366f1) // Indigo for Community
    .setFooter({
      text: `NDL Community Vote • Creator: ${creatorId} • Real-time Community Tally`,
    })
    .setTimestamp();

  let descText = description ? `> ${description.replace(/\n/g, "\n> ")}\n\n` : "";

  if (isClosed) {
    // Determine winner
    let maxVotes = -1;
    let winners: CommunityVoteOptionState[] = [];
    for (const opt of options) {
      if (opt.voters.length > maxVotes) {
        maxVotes = opt.voters.length;
        winners = [opt];
      } else if (opt.voters.length === maxVotes && maxVotes > 0) {
        winners.push(opt);
      }
    }

    if (maxVotes <= 0) {
      descText += "🏆 **Voting Closed! Result:**\n> *No votes were cast.*";
    } else if (winners.length > 1) {
      const tiedNames = winners.map((w) => `**${w.name}**`).join(" and ");
      descText += `🏆 **Voting Closed! Result:**\n> **Tie** between ${tiedNames} with **${maxVotes}** votes each!`;
    } else {
      const winner = winners[0];
      const percent = totalVotes > 0 ? Math.round((winner.voters.length / totalVotes) * 100) : 0;
      descText += `🏆 **Voting Closed! Winning Outcome:**\n> **${winner.emoji} ${winner.name}** with **${winner.voters.length}** votes (${percent}%)!`;
    }
  } else {
    descText += "📢 **Community Deliberation & Voting**\nVerified Community Voters can cast their vote using the buttons below. You can change or retract your vote at any time before the vote closes.";
  }

  embed.setDescription(descText.slice(0, 4000));

  // Add field for each option
  for (const opt of options) {
    const count = opt.voters.length;
    const ratio = totalVotes > 0 ? count / totalVotes : 0;
    const bar = renderProgressBar(ratio, 12);
    const percent = Math.round(ratio * 100);

    const voterList =
      opt.voters.length > 0
        ? `👥 ${opt.voters.map((id) => `<@${id}>`).join(", ")}`
        : "*No votes yet*";

    embed.addFields({
      name: `${opt.emoji} ${opt.name.slice(0, 200)}`,
      value: `\`[${bar}]\` **${count} ${count === 1 ? "vote" : "votes"}** (${percent}%)\n${voterList}`,
      inline: false,
    });
  }

  // Poll Details Field
  embed.addFields({
    name: "📊 Poll Details",
    value: [
      `• **Status**: ${isClosed ? "🔒 Closed" : "🟢 Open for Voting"}`,
      `• **Total Votes**: ${totalVotes}`,
      `• **Initiated by**: <@${creatorId}>`,
    ].join("\n"),
    inline: false,
  });

  return embed;
}

export function buildCommunityVoteComponents(
  options: CommunityVoteOptionState[],
  disabled = false,
): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>();

  const isBinary = options.length === 2;

  options.forEach((opt, idx) => {
    let style = ButtonStyle.Primary;
    if (isBinary) {
      style = idx === 0 ? ButtonStyle.Success : ButtonStyle.Danger;
    }

    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`community_vote_cast_${opt.index}`)
        .setLabel(`${opt.emoji} ${opt.name}`.slice(0, 80))
        .setStyle(style)
        .setDisabled(disabled),
    );
  });

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("community_vote_retract")
      .setLabel("🔄 Retract Vote")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("community_vote_close")
      .setLabel("🔒 Close Vote")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  return [row1, row2];
}

export function parseCommunityVoteState(embed: APIEmbed): CommunityVoteState | null {
  if (!embed || !embed.title || !embed.title.includes("Community Vote:")) {
    return null;
  }

  const isClosed = embed.title.includes("[CLOSED]");
  const title = embed.title.replace(/^🗳️\s*(\[CLOSED\]\s*)?Community Vote:\s*/, "");

  const footerText = embed.footer?.text ?? "";
  const creatorMatch = footerText.match(/Creator:\s*([a-zA-Z0-9_-]+)/);
  const creatorId = creatorMatch ? creatorMatch[1] : "";

  let description = embed.description ?? "";
  if (description.startsWith("> ")) {
    const splitIndex = description.indexOf("\n\n");
    if (splitIndex !== -1) {
      description = description.slice(2, splitIndex).replace(/\n> /g, "\n");
    } else {
      description = description.slice(2);
    }
  } else {
    description = "";
  }

  const options: CommunityVoteOptionState[] = [];
  let totalVotes = 0;

  for (const field of embed.fields ?? []) {
    const match = field.name.match(/^([1-4]️⃣)\s*(.*)$/);
    if (match) {
      const emoji = match[1];
      const name = match[2];
      const index = OPTION_EMOJIS.indexOf(emoji as any);

      const voters = [...field.value.matchAll(/<@!?([a-zA-Z0-9_-]+)>/g)].map((m) => m[1]);
      totalVotes += voters.length;

      options.push({
        index: index !== -1 ? index : options.length,
        emoji,
        name,
        voters,
      });
    }
  }

  return {
    title,
    description,
    isClosed,
    creatorId,
    options,
    totalVotes,
  };
}

export async function handleCommunityVoteButtonInteraction(
  interaction: ButtonInteraction,
  voterRoleId?: string | null,
  staffRoleId?: string | null,
) {
  const customId = interaction.customId;
  const member = interaction.member;
  const user = interaction.user;

  // 1. Voter verification
  if (!isCommunityVoter(member, interaction.guild, voterRoleId, staffRoleId)) {
    await interaction.reply({
      content:
        "⛔ **Access Denied**: Only verified **Community Voters** can participate in community votes!\n\nYou can apply for the role on our website:\n🔗 **https://www.nerfeddemonlist.net/applications/community-voter**",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const message = interaction.message;
  const firstEmbed = message.embeds[0]?.toJSON();
  if (!firstEmbed) {
    await interaction.reply({
      content: "Could not read poll data from message.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const state = parseCommunityVoteState(firstEmbed);
  if (!state) {
    await interaction.reply({
      content: "This message is not a valid NDL community vote.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 2. Close Vote Handler
  if (customId === "community_vote_close") {
    if (state.isClosed) {
      await interaction.reply({
        content: "ℹ️ This community vote has already been closed.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const isCreator = user.id === state.creatorId;
    const isStaff = isStaffMember(member, interaction.guild, staffRoleId);

    if (!isCreator && !isStaff) {
      await interaction.reply({
        content:
          "⛔ **Permission Denied**: Only Nerfed Demonlist Staff or the poll creator can close this vote.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    state.isClosed = true;
    const newEmbed = buildCommunityVoteEmbed(state);
    const disabledComponents = buildCommunityVoteComponents(state.options, true);

    await interaction.update({
      embeds: [newEmbed],
      components: disabledComponents,
    });

    await interaction.followUp({
      content: `🔒 **Community Vote Closed** by <@${user.id}>! Results are now finalized.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if poll already closed
  if (state.isClosed) {
    await interaction.reply({
      content: "🔒 This community vote is closed and no longer accepting votes.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 3. Retract Vote Handler
  if (customId === "community_vote_retract") {
    let removed = false;
    for (const opt of state.options) {
      const idx = opt.voters.indexOf(user.id);
      if (idx !== -1) {
        opt.voters.splice(idx, 1);
        removed = true;
      }
    }

    if (!removed) {
      await interaction.reply({
        content: "ℹ️ You haven't cast a vote in this poll yet.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    state.totalVotes = Math.max(0, state.totalVotes - 1);
    const newEmbed = buildCommunityVoteEmbed(state);
    const components = buildCommunityVoteComponents(state.options, false);

    await interaction.update({
      embeds: [newEmbed],
      components,
    });

    await interaction.followUp({
      content: "🔄 Your vote has been retracted.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 4. Cast Vote Handler
  const match = customId.match(/^community_vote_cast_(\d+)$/);
  if (!match) return;

  const targetIndex = parseInt(match[1], 10);
  const targetOption = state.options.find((o) => o.index === targetIndex);

  if (!targetOption) {
    await interaction.reply({
      content: "Invalid vote option selected.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if already voted for this option
  if (targetOption.voters.includes(user.id)) {
    await interaction.reply({
      content: `ℹ️ You have already voted for **${targetOption.emoji} ${targetOption.name}**!`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Remove previous vote if switching options
  let switched = false;
  for (const opt of state.options) {
    const idx = opt.voters.indexOf(user.id);
    if (idx !== -1) {
      opt.voters.splice(idx, 1);
      switched = true;
    }
  }

  targetOption.voters.push(user.id);
  if (!switched) {
    state.totalVotes += 1;
  }

  const newEmbed = buildCommunityVoteEmbed(state);
  const components = buildCommunityVoteComponents(state.options, false);

  await interaction.update({
    embeds: [newEmbed],
    components,
  });

  const feedbackText = switched
    ? `✅ **Vote Switched!** You are now voting for **${targetOption.emoji} ${targetOption.name}**.`
    : `✅ **Vote Recorded!** You voted for **${targetOption.emoji} ${targetOption.name}**.`;

  await interaction.followUp({
    content: feedbackText,
    flags: MessageFlags.Ephemeral,
  });
}
