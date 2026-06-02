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
