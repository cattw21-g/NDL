import "dotenv/config";

export type BotConfig = {
  discordToken: string;
  discordClientId: string;
  discordGuildId: string | null;
  ndlPublicApiBase: string;
  ndlBotApiSecret: string | null;
  discordStaffRoleId: string | null;
};

export class BotConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotConfigError";
  }
}

export function loadBotConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const discordToken = requiredEnv(env, "DISCORD_BOT_TOKEN");
  const discordClientId = requiredEnv(env, "DISCORD_CLIENT_ID");
  const ndlPublicApiBase = normalizeBaseUrl(
    env.NDL_PUBLIC_API_BASE || "https://nerfeddemonlist.net",
  );

  return {
    discordToken,
    discordClientId,
    discordGuildId: optionalEnv(env, "DISCORD_GUILD_ID"),
    ndlPublicApiBase,
    ndlBotApiSecret: optionalEnv(env, "NDL_BOT_API_SECRET"),
    discordStaffRoleId: optionalEnv(env, "DISCORD_STAFF_ROLE_ID"),
  };
}

export function isStaffBotConfigured(config: Pick<BotConfig, "ndlBotApiSecret" | "discordStaffRoleId">) {
  return Boolean(config.ndlBotApiSecret && config.discordStaffRoleId);
}

function requiredEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = optionalEnv(env, key);

  if (!value) {
    throw new BotConfigError(`${key} is required.`);
  }

  return value;
}

function optionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();
  return value ? value : null;
}

function normalizeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch {
    throw new BotConfigError("NDL_PUBLIC_API_BASE must be a valid URL.");
  }
}
