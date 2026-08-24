import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import type { BotConfig } from "../config.js";
import type { NdlApiClient } from "../ndl-api.js";
import { provisionNdlServer } from "../server-setup.js";
import {
  createHowToSubmitEmbed,
  createOfficialLinksEmbed,
  createRulesEmbed,
  createWelcomeEmbed,
} from "../embed-templates.js";

export const setupServerCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-server")
    .setDescription("Automatically creates and provisions the entire NDL Discord Server structure.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName("post-embeds")
        .setDescription("Automatically post the official welcome, rules, and links embeds (default: true)")
        .setRequired(false),
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    context: { api: NdlApiClient; config: BotConfig },
  ) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be executed within a Discord server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const postEmbeds = interaction.options.getBoolean("post-embeds") ?? true;
    const siteUrl = context.config.ndlPublicApiBase || "https://www.nerfeddemonlist.net";

    try {
      const result = await provisionNdlServer(interaction.guild, {
        postEmbeds,
        siteUrl,
      });

      const summary =
        `✅ **NDL Discord Server Setup Complete!**\n\n` +
        `• **Server**: ${result.guildName}\n` +
        `• **Roles Created/Updated**: ${result.rolesCreated}\n` +
        `• **Categories Created**: ${result.categoriesCreated}\n` +
        `• **Channels Created**: ${result.channelsCreated}\n` +
        `• **Official Embeds Posted**: ${result.embedsPosted}\n` +
        (result.errors.length > 0
          ? `\n⚠️ *Notes/Warnings*:\n${result.errors.map((e) => `• ${e}`).join("\n")}`
          : "");

      await interaction.editReply({
        content: summary,
      });
    } catch (error) {
      await interaction.editReply({
        content: `❌ Server setup failed: ${String(error)}`,
      });
    }
  },
};

export const postEmbedsCommand = {
  data: new SlashCommandBuilder()
    .setName("post-embeds")
    .setDescription("Posts or refreshes official NDL embeds (rules, welcome, links, submit guide).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(
    interaction: ChatInputCommandInteraction,
    context: { api: NdlApiClient; config: BotConfig },
  ) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be executed within a Discord server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const siteUrl = context.config.ndlPublicApiBase || "https://www.nerfeddemonlist.net";
    const guild = interaction.guild;
    let posted = 0;

    const chanWelcome = guild.channels.cache.find((c) => c.name.includes("welcome"));
    const chanRules = guild.channels.cache.find((c) => c.name.includes("rules"));
    const chanLinks = guild.channels.cache.find((c) => c.name.includes("official-links"));
    const chanHowTo = guild.channels.cache.find((c) => c.name.includes("how-to-submit"));

    if (chanWelcome && chanWelcome.isTextBased()) {
      await chanWelcome.send({ embeds: [createWelcomeEmbed(siteUrl)] });
      posted++;
    }
    if (chanRules && chanRules.isTextBased()) {
      await chanRules.send({ embeds: [createRulesEmbed(siteUrl)] });
      posted++;
    }
    if (chanLinks && chanLinks.isTextBased()) {
      await chanLinks.send({ embeds: [createOfficialLinksEmbed(siteUrl)] });
      posted++;
    }
    if (chanHowTo && chanHowTo.isTextBased()) {
      await chanHowTo.send({ embeds: [createHowToSubmitEmbed(siteUrl)] });
      posted++;
    }

    await interaction.editReply({
      content: `✅ Posted ${posted} official NDL embed(s) into information channels!`,
    });
  },
};
