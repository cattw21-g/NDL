import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
} from "discord.js";

import { loadBotConfig } from "./config.js";
import { createNdlApiClient } from "./ndl-api.js";
import { commands } from "./commands/index.js";

const config = loadBotConfig();
const api = createNdlApiClient(config);
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
const commandByName = new Map(
  commands.map((command) => [command.data.name, command]),
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`NDL Discord bot logged in as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isButton()) {
    const customId = interaction.customId;
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "This button can only be used in the NDL server.", ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "Could not fetch your server member data.", ephemeral: true });
      return;
    }

    let targetRoleName = "";
    let roleLabel = "";
    if (customId === "toggle_role_announcements") {
      targetRoleName = "Announcements Ping";
      roleLabel = "🔔 Announcements Ping";
    } else if (customId === "toggle_role_updates") {
      targetRoleName = "List Updates Ping";
      roleLabel = "📰 List Updates Ping";
    } else {
      return;
    }

    const role = interaction.guild.roles.cache.find((r) => r.name.includes(targetRoleName));
    if (!role) {
      await interaction.reply({ content: `The role "${roleLabel}" could not be found. Please contact staff.`, ephemeral: true });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
      await member.roles.remove(role.id).catch(() => {});
      await interaction.reply({ content: `❌ Removed **${roleLabel}** role. You will no longer receive these pings.`, ephemeral: true });
    } else {
      await member.roles.add(role.id).catch(() => {});
      await interaction.reply({ content: `✅ Added **${roleLabel}** role! You will now receive these notifications.`, ephemeral: true });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandByName.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Unknown NDL bot command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction, { api, config });
  } catch (error) {
    console.error("NDL bot command failed", {
      command: interaction.commandName,
      error,
    });

    const content = "NDL bot hit an unexpected error. Try again later.";

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content, embeds: [] });
      return;
    }

    await interaction.reply({ content, ephemeral: true });
  }
});

await client.login(config.discordToken);
