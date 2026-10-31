import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { BotConfig } from "../config.js";
import type { NdlApiClient } from "../ndl-api.js";
import {
  formatAuditEmbed,
  formatBotError,
  formatPendingRecordsEmbed,
  formatPendingSuggestionsEmbed,
  formatStatsEmbed,
  formatSubmissionEmbed,
  formatSuggestionEmbed,
} from "./formatters.js";
import type { BotCommand } from "./public.js";
import {
  canUseStaffCommand,
  staffNotConfiguredMessage,
  staffPermissionDeniedMessage,
} from "./permissions.js";
import { createStaffVotePayload, isStaffMember } from "../staff-voting.js";

type StaffContext = {
  api: NdlApiClient;
  config: Pick<
    BotConfig,
    "ndlPublicApiBase" | "ndlBotApiSecret" | "discordStaffRoleId"
  >;
};

export const staffCommandApiPaths = [
  "/api/bot/staff/pending-records",
  "/api/bot/staff/pending-suggestions",
  "/api/bot/staff/record-submissions",
  "/api/bot/staff/level-suggestions",
  "/api/bot/staff/audit",
  "/api/bot/staff/stats",
] as const;

export const staffCommands: BotCommand[] = [
  {
    data: new SlashCommandBuilder()
      .setName("pending-records")
      .setDescription("Show pending NDL record submissions."),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api, config }) => {
        const data = await api.getPendingRecords(10);
        return formatPendingRecordsEmbed(
          data.submissions,
          config.ndlPublicApiBase,
        );
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("pending-suggestions")
      .setDescription("Show pending NDL level suggestions."),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api, config }) => {
        const data = await api.getPendingSuggestions(10);
        return formatPendingSuggestionsEmbed(
          data.suggestions,
          config.ndlPublicApiBase,
        );
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("submission")
      .setDescription("Show one staff-visible record submission.")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Record submission ID.")
          .setRequired(true),
      ),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api }) => {
        const id = interaction.options.getString("id", true);
        const data = await api.getSubmission(id);
        return formatSubmissionEmbed(data.submission);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("suggestion")
      .setDescription("Show one staff-visible level suggestion.")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Level suggestion ID.")
          .setRequired(true),
      ),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api }) => {
        const id = interaction.options.getString("id", true);
        const data = await api.getSuggestion(id);
        return formatSuggestionEmbed(data.suggestion);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("audit")
      .setDescription("Search the NDL admin audit log.")
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("Audit search text.")
          .setRequired(false),
      ),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api }) => {
        const query = interaction.options.getString("query") ?? "";
        const data = await api.getAudit(query, 10);
        return formatAuditEmbed(data.entries, query);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Show NDL staff queue and site stats."),
    execute(interaction, context) {
      return executeStaff(interaction, context, async ({ api }) => {
        const data = await api.getStats();
        return formatStatsEmbed(data.stats);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("staff-vote")
      .setDescription("Create an interactive staff voting poll in #staff-voting.")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("The title or question being voted on.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Context, level details, proof video link, or instructions.")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("option1")
          .setDescription("First voting option (default: 'Approve / Yes').")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("option2")
          .setDescription("Second voting option (default: 'Reject / No').")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("option3")
          .setDescription("Third voting option (optional).")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("option4")
          .setDescription("Fourth voting option (optional).")
          .setRequired(false),
      ),
    async execute(interaction, context) {
      if (
        !isStaffMember(
          interaction.member,
          interaction.guild,
          context.config.discordStaffRoleId,
        )
      ) {
        await interaction.reply({
          content:
            "⛔ **Access Denied**: Only Nerfed Demonlist Staff members (Reviewers, Moderators, Admins) can start a staff vote.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description");
      const opt1 =
        interaction.options.getString("option1")?.trim() || "Approve / Yes";
      const opt2 =
        interaction.options.getString("option2")?.trim() || "Reject / No";
      const opt3 = interaction.options.getString("option3")?.trim();
      const opt4 = interaction.options.getString("option4")?.trim();

      const options = [opt1, opt2];
      if (opt3) options.push(opt3);
      if (opt4) options.push(opt4);

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
          content: `✅ **Staff vote created!**\nPosted to <#${targetChannel.id}>: [Jump to Vote](${message.url})`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply(payload);
      }
    },
  },
];

async function executeStaff(
  interaction: ChatInputCommandInteraction,
  context: StaffContext,
  handler: (context: StaffContext) => Promise<ReturnType<typeof formatStatsEmbed>>,
) {
  if (!context.config.ndlBotApiSecret || !context.config.discordStaffRoleId) {
    await interaction.reply({
      content: staffNotConfiguredMessage,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!canUseStaffCommand(interaction.member, context.config)) {
    await interaction.reply({
      content: staffPermissionDeniedMessage,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await interaction.editReply({ embeds: [await handler(context)] });
  } catch (error) {
    await interaction.editReply({ content: formatBotError(error) });
  }
}
