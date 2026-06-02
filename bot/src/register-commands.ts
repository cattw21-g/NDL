import { REST, Routes } from "discord.js";

import { loadBotConfig } from "./config.js";
import { commandDataJson } from "./commands/index.js";

const config = loadBotConfig();
const rest = new REST({ version: "10" }).setToken(config.discordToken);
const commands = commandDataJson();

if (config.discordGuildId) {
  await rest.put(
    Routes.applicationGuildCommands(
      config.discordClientId,
      config.discordGuildId,
    ),
    { body: commands },
  );

  console.log(
    `Registered ${commands.length} NDL Discord bot commands for guild ${config.discordGuildId}.`,
  );
} else {
  await rest.put(Routes.applicationCommands(config.discordClientId), {
    body: commands,
  });

  console.log(`Registered ${commands.length} global NDL Discord bot commands.`);
}
