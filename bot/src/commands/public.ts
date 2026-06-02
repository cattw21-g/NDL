import {
  ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

import type { BotConfig } from "../config.js";
import type { NdlApiClient } from "../ndl-api.js";
import {
  formatBotError,
  formatLevelEmbed,
  formatPlayerEmbed,
  formatRecentRecordsEmbed,
  formatRecordsEmbed,
  formatRulesEmbed,
  formatSearchEmbed,
  formatTopLevelsEmbed,
} from "./formatters.js";

export type CommandContext = {
  api: NdlApiClient;
  config: Pick<
    BotConfig,
    "ndlPublicApiBase" | "ndlBotApiSecret" | "discordStaffRoleId"
  >;
};

export type BotCommand = {
  data: {
    name: string;
    toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute: (
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
  ) => Promise<void>;
};

export const publicCommandApiPaths = [
  "/api/public/levels",
  "/api/public/search",
  "/api/public/players",
  "/api/public/recent-records",
  "/api/public/rules",
] as const;

export const publicCommands: BotCommand[] = [
  {
    data: new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show the top ranked NDL levels.")
      .addIntegerOption((option) =>
        option
          .setName("count")
          .setDescription("Number of levels to show.")
          .setMinValue(1)
          .setMaxValue(50),
      ),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();
      const count = interaction.options.getInteger("count") ?? 10;

      await editWithApiResult(interaction, async () => {
        const data = await api.getTopLevels(count);
        return formatTopLevelsEmbed(data.levels, config.ndlPublicApiBase);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("level")
      .setDescription("Find an NDL level.")
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("Level name, original level, GD ID, creator, or verifier.")
          .setRequired(true),
      ),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();
      const query = interaction.options.getString("query", true);

      await editWithApiResult(interaction, async () => {
        const data = await api.search(query, 5);
        const level = data.levels[0];

        if (!level) {
          return `No public level matched "${query}".`;
        }

        return formatLevelEmbed(level, config.ndlPublicApiBase);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("player")
      .setDescription("Show an NDL player summary.")
      .addStringOption((option) =>
        option
          .setName("handle")
          .setDescription("Player username/handle.")
          .setRequired(true),
      ),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();
      const handle = interaction.options.getString("handle", true);

      await editWithApiResult(interaction, async () => {
        const [playerData, recordData] = await Promise.all([
          api.getPlayer(handle),
          api.getPlayerRecords(handle, 50),
        ]);

        return formatPlayerEmbed(
          playerData.player,
          playerData.summary,
          recordData.records,
          config.ndlPublicApiBase,
        );
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("records")
      .setDescription("Show accepted records for an NDL player.")
      .addStringOption((option) =>
        option
          .setName("handle")
          .setDescription("Player username/handle.")
          .setRequired(true),
      ),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();
      const handle = interaction.options.getString("handle", true);

      await editWithApiResult(interaction, async () => {
        const data = await api.getPlayerRecords(handle, 50);
        return formatRecordsEmbed(handle, data.records, config.ndlPublicApiBase);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("recent")
      .setDescription("Show recent accepted NDL records."),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();

      await editWithApiResult(interaction, async () => {
        const data = await api.getRecentRecords(10);
        return formatRecentRecordsEmbed(data.records, config.ndlPublicApiBase);
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("search")
      .setDescription("Search NDL levels and players.")
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("Search text.")
          .setRequired(true),
      ),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();
      const query = interaction.options.getString("query", true);

      await editWithApiResult(interaction, async () => {
        const data = await api.search(query, 10);
        return formatSearchEmbed(
          data.query,
          data.levels,
          data.players,
          config.ndlPublicApiBase,
        );
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("rules")
      .setDescription("Show the NDL rules link and summary."),
    async execute(interaction, { api, config }) {
      await interaction.deferReply();

      await editWithApiResult(interaction, async () => {
        const data = await api.getRules();
        return formatRulesEmbed(data.rules, config.ndlPublicApiBase);
      });
    },
  },
];

async function editWithApiResult(
  interaction: ChatInputCommandInteraction,
  handler: () => Promise<ReturnType<typeof formatTopLevelsEmbed> | string>,
) {
  try {
    const result = await handler();

    if (typeof result === "string") {
      await interaction.editReply({ content: result });
      return;
    }

    await interaction.editReply({ embeds: [result] });
  } catch (error) {
    await interaction.editReply({ content: formatBotError(error) });
  }
}
