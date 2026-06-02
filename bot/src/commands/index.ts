import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";

import { publicCommands } from "./public.js";
import { staffCommands } from "./staff.js";

export const commands = [...publicCommands, ...staffCommands];

export function commandDataJson(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  return commands.map((command) => command.data.toJSON());
}
