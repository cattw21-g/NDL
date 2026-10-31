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
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type ModalSubmitInteraction,
  type OverwriteResolvable,
} from "discord.js";

export const NDL_COLORS = {
  CYAN: 0x06b6d4,
  AMBER: 0xf59e0b,
  EMERALD: 0x10b981,
  PURPLE: 0x9333ea,
  SLATE: 0x64748b,
  ROSE: 0xf43f5e,
};

const OPTION_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"] as const;

export function renderProgressBar(ratio: number, length = 12): string {
  const safeRatio = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const filled = Math.round(safeRatio * length);
  const empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

export type StaffVoteOptionState = {
  index: number;
  emoji: string;
  name: string;
  voters: string[];
};

export type StaffVoteState = {
  title: string;
  description: string;
  isClosed: boolean;
  creatorId: string;
  options: StaffVoteOptionState[];
  totalVotes: number;
};

export function isStaffMember(
  member: unknown,
  guild?: Guild | null,
  staffRoleId?: string | null,
): boolean {
  if (!member || typeof member !== "object") return false;

  const memberId =
    (member as any).user?.id ||
    (member as any).id ||
    (member as any).userId;

  // 1. Explicit Owner ID Check
  if (
    memberId &&
    (memberId === "948605174203686912" ||
      memberId === process.env.DISCORD_OWNER_ID)
  ) {
    return true;
  }

  // 2. Server Owner check
  if (guild && "ownerId" in guild && memberId) {
    if (guild.ownerId === memberId) return true;
  }

  // 3. Administrator Permission check
  if (
    "permissions" in member &&
    typeof (member as any).permissions?.has === "function"
  ) {
    try {
      if ((member as any).permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
      }
    } catch {}
  }

  // 4. Roles Check
  const roles = (member as any).roles;

  // 4a. If roles is an array of IDs
  if (Array.isArray(roles)) {
    if (staffRoleId && roles.includes(staffRoleId)) return true;

    if (guild && "roles" in guild && guild.roles?.cache) {
      for (const roleId of roles) {
        const guildRole = guild.roles.cache.get(roleId);
        if (guildRole) {
          const name = guildRole.name.toLowerCase();
          if (
            name.includes("moderator") ||
            name.includes("reviewer") ||
            name.includes("admin") ||
            name.includes("owner")
          ) {
            return true;
          }
        }
      }
    }
  }

  // 4b. Role Cache Names check
  if (roles && typeof roles === "object" && "cache" in roles) {
    const cache = (roles as any).cache;
    if (staffRoleId && typeof cache?.has === "function" && cache.has(staffRoleId)) {
      return true;
    }

    if (Array.isArray(cache)) {
      return cache.some((role: any) => {
        if (staffRoleId && role.id === staffRoleId) return true;
        const name = (role.name || "").toLowerCase();
        return (
          name.includes("moderator") ||
          name.includes("reviewer") ||
          name.includes("admin") ||
          name.includes("owner")
        );
      });
    }

    if (typeof cache?.some === "function") {
      return cache.some((role: any) => {
        const name = (role.name || "").toLowerCase();
        return (
          name.includes("moderator") ||
          name.includes("reviewer") ||
          name.includes("admin") ||
          name.includes("owner")
        );
      });
    }
  }

  return false;
}

export function createStaffVotePayload(params: {
  title: string;
  description?: string | null;
  options: string[];
  creatorId: string;
  creatorName: string;
}) {
  const { title, description, options, creatorId, creatorName } = params;

  const voteOptions: StaffVoteOptionState[] = options.slice(0, 4).map((opt, i) => ({
    index: i,
    emoji: OPTION_EMOJIS[i] || `${i + 1}️⃣`,
    name: opt.trim(),
    voters: [],
  }));

  const embed = buildStaffVoteEmbed({
    title,
    description: description?.trim() || "",
    isClosed: false,
    creatorId,
    options: voteOptions,
    totalVotes: 0,
  });

  const components = buildStaffVoteComponents(voteOptions, false);

  return {
    embeds: [embed],
    components,
  };
}

export function createStaffVoteModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("staff_vote_modal")
    .setTitle("Create Staff Vote");

  const titleInput = new TextInputBuilder()
    .setCustomId("vote_title")
    .setLabel("Question / Title")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. Should Nerfed Acheron be placed at #1?")
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(200);

  const descInput = new TextInputBuilder()
    .setCustomId("vote_description")
    .setLabel("Context & Proof Notes (Optional)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Provide context, video proof link, CBF notes...")
    .setRequired(false)
    .setMaxLength(1000);

  const opt1Input = new TextInputBuilder()
    .setCustomId("vote_opt1")
    .setLabel("Option 1")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Approve / Yes (leave blank for default)")
    .setRequired(false)
    .setMaxLength(80);

  const opt2Input = new TextInputBuilder()
    .setCustomId("vote_opt2")
    .setLabel("Option 2")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Reject / No (leave blank for default)")
    .setRequired(false)
    .setMaxLength(80);

  const opt3Input = new TextInputBuilder()
    .setCustomId("vote_opt3")
    .setLabel("Option 3 (Optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. Needs More Review / Hold")
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

export async function handleStaffVoteModalSubmit(
  interaction: ModalSubmitInteraction,
  staffRoleId?: string | null,
) {
  if (!isStaffMember(interaction.member, interaction.guild, staffRoleId)) {
    await interaction.reply({
      content:
        "⛔ **Access Denied**: Only Nerfed Demonlist Staff members (Reviewers, Moderators, Admins) can create a staff vote.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const title = interaction.fields.getTextInputValue("vote_title").trim();
  const description =
    interaction.fields.getTextInputValue("vote_description")?.trim() || null;
  const opt1 =
    interaction.fields.getTextInputValue("vote_opt1")?.trim() || "Approve / Yes";
  const opt2 =
    interaction.fields.getTextInputValue("vote_opt2")?.trim() || "Reject / No";
  const opt3 = interaction.fields.getTextInputValue("vote_opt3")?.trim();

  const options = [opt1, opt2];
  if (opt3) options.push(opt3);

  const payload = createStaffVotePayload({
    title,
    description,
    options,
    creatorId: interaction.user.id,
    creatorName: interaction.user.displayName || interaction.user.username,
  });

  const targetChannel =
    interaction.guild?.channels.cache.find(
      (c) =>
        c.isTextBased() &&
        (c.name.includes("staff-voting") ||
          c.name === "🗳️・staff-voting" ||
          c.name.includes("voting")),
    ) ?? interaction.channel;

  if (
    targetChannel &&
    "send" in targetChannel &&
    targetChannel.id !== interaction.channelId
  ) {
    const message = await targetChannel.send(payload);
    await interaction.reply({
      content: `✅ **Staff vote published!**\nPosted to <#${targetChannel.id}>: [Jump to Vote](${message.url})`,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply(payload);
  }
}

export function buildStaffVoteEmbed(state: StaffVoteState): EmbedBuilder {
  const { title, description, isClosed, creatorId, options, totalVotes } = state;

  const embed = new EmbedBuilder()
    .setTitle(`${isClosed ? "🗳️ [CLOSED]" : "🗳️"} Staff Vote: ${title.slice(0, 200)}`)
    .setColor(isClosed ? NDL_COLORS.SLATE : NDL_COLORS.AMBER)
    .setFooter({
      text: `NDL Staff Vote • Creator: ${creatorId} • Real-time Staff Tally`,
    })
    .setTimestamp();

  let descText = description ? `> ${description.replace(/\n/g, "\n> ")}\n\n` : "";

  if (isClosed) {
    // Determine winner
    let maxVotes = -1;
    let winners: StaffVoteOptionState[] = [];
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
    descText += "📢 **Staff Deliberation & Voting**\nCast your vote using the buttons below. You can change or retract your vote at any time before the vote closes.";
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
      `• **Created by**: <@${creatorId}>`,
    ].join("\n"),
    inline: false,
  });

  return embed;
}

export function buildStaffVoteComponents(
  options: StaffVoteOptionState[],
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
        .setCustomId(`staff_vote_cast_${opt.index}`)
        .setLabel(`${opt.emoji} ${opt.name}`.slice(0, 80))
        .setStyle(style)
        .setDisabled(disabled),
    );
  });

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("staff_vote_retract")
      .setLabel("🔄 Retract Vote")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("staff_vote_close")
      .setLabel("🔒 Close Vote")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );

  return [row1, row2];
}

export function parseStaffVoteState(embed: APIEmbed): StaffVoteState | null {
  if (!embed || !embed.title || !embed.title.includes("Staff Vote:")) {
    return null;
  }

  const isClosed = embed.title.includes("[CLOSED]");
  const title = embed.title.replace(/^🗳️\s*(\[CLOSED\]\s*)?Staff Vote:\s*/, "");

  const footerText = embed.footer?.text ?? "";
  const creatorMatch = footerText.match(/Creator:\s*([a-zA-Z0-9_-]+)/);
  const creatorId = creatorMatch ? creatorMatch[1] : "";

  // Extract clean description (strip closed banner or open prompt)
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

  const options: StaffVoteOptionState[] = [];
  let totalVotes = 0;

  for (const field of embed.fields ?? []) {
    const match = field.name.match(/^([1-4]️⃣)\s*(.*)$/);
    if (match) {
      const emoji = match[1];
      const name = match[2];
      const index = OPTION_EMOJIS.indexOf(emoji as any);

      // Parse voters: <@123456> or <@user_1>
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

export async function handleStaffVoteButtonInteraction(
  interaction: ButtonInteraction,
  staffRoleId?: string | null,
) {
  const customId = interaction.customId;
  const member = interaction.member;
  const user = interaction.user;

  // 1. Staff verification
  if (!isStaffMember(member, interaction.guild, staffRoleId)) {
    await interaction.reply({
      content:
        "⛔ **Access Denied**: Only Nerfed Demonlist Staff members (Reviewers, Moderators, Admins) can vote on staff polls.",
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

  const state = parseStaffVoteState(firstEmbed);
  if (!state) {
    await interaction.reply({
      content: "This message is not a valid NDL staff vote.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 2. Close Vote Handler
  if (customId === "staff_vote_close") {
    if (state.isClosed) {
      await interaction.reply({
        content: "ℹ️ This staff vote has already been closed.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const isCreator = user.id === state.creatorId;
    const isOwnerOrAdmin =
      interaction.guild?.ownerId === user.id ||
      ("permissions" in (member as any) &&
        (member as any).permissions?.has?.(PermissionFlagsBits.Administrator));

    if (!isCreator && !isOwnerOrAdmin) {
      await interaction.reply({
        content:
          "⛔ **Permission Denied**: Only the poll creator or an Administrator can close this vote.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    state.isClosed = true;
    const newEmbed = buildStaffVoteEmbed(state);
    const disabledComponents = buildStaffVoteComponents(state.options, true);

    await interaction.update({
      embeds: [newEmbed],
      components: disabledComponents,
    });

    await interaction.followUp({
      content: `🔒 **Staff Vote Closed** by <@${user.id}>! Results are now final.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if poll already closed
  if (state.isClosed) {
    await interaction.reply({
      content: "🔒 This staff vote is closed and no longer accepting votes.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 3. Retract Vote Handler
  if (customId === "staff_vote_retract") {
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
    const newEmbed = buildStaffVoteEmbed(state);
    const components = buildStaffVoteComponents(state.options, false);

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

  // 4. Cast Vote Handler (staff_vote_cast_0 .. 3)
  if (customId.startsWith("staff_vote_cast_")) {
    const targetIndex = parseInt(customId.replace("staff_vote_cast_", ""), 10);
    const targetOption = state.options.find((o) => o.index === targetIndex);

    if (!targetOption) {
      await interaction.reply({
        content: "Invalid option selected.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (targetOption.voters.includes(user.id)) {
      await interaction.reply({
        content: `ℹ️ You have already voted for **${targetOption.name}**!`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Remove user's vote from any other option
    let previousOption: StaffVoteOptionState | null = null;
    for (const opt of state.options) {
      const idx = opt.voters.indexOf(user.id);
      if (idx !== -1) {
        opt.voters.splice(idx, 1);
        previousOption = opt;
      }
    }

    targetOption.voters.push(user.id);

    // If new voter, increment total
    if (!previousOption) {
      state.totalVotes += 1;
    }

    const newEmbed = buildStaffVoteEmbed(state);
    const components = buildStaffVoteComponents(state.options, false);

    await interaction.update({
      embeds: [newEmbed],
      components,
    });

    const switchMsg = previousOption
      ? ` (Switched from *${previousOption.name}*)`
      : "";

    await interaction.followUp({
      content: `✅ Your vote for **${targetOption.name}** has been recorded!${switchMsg}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
