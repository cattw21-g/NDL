import {
  ActivityType,
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
  console.log(`✅ NDL Discord bot logged in as ${readyClient.user.tag}.`);
  readyClient.user.setPresence({
    activities: [
      {
        name: "nerfeddemonlist.net | /top",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isButton()) {
    const customId = interaction.customId;
    if (!interaction.guild) {
      await interaction.reply({ content: "This button can only be used in the NDL server.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "Could not fetch your server member data." });
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
      await interaction.editReply({ content: `The role "${roleLabel}" could not be found. Please contact staff.` });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
      await member.roles.remove(role.id).catch(() => {});
      await interaction.editReply({ content: `❌ Removed **${roleLabel}** role. You will no longer receive these pings.` });
    } else {
      await member.roles.add(role.id).catch(() => {});
      await interaction.editReply({ content: `✅ Added **${roleLabel}** role! You will now receive these notifications.` });
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
