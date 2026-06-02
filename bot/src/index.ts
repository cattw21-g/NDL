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
