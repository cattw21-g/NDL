import type { BotConfig } from "../config.js";

export const staffPermissionDeniedMessage =
  "You do not have permission to use this command.";

export const staffNotConfiguredMessage =
  "Staff bot commands are not configured.";

export function hasStaffRole(member: unknown, staffRoleId: string | null) {
  if (!staffRoleId || !member || typeof member !== "object") {
    return false;
  }

  const roles = (member as { roles?: unknown }).roles;

  if (Array.isArray(roles)) {
    return roles.includes(staffRoleId);
  }

  if (roles && typeof roles === "object") {
    const roleObject = roles as {
      cache?: { has?: (roleId: string) => boolean };
      has?: (roleId: string) => boolean;
    };

    if (typeof roleObject.cache?.has === "function") {
      return roleObject.cache.has(staffRoleId);
    }

    if (typeof roleObject.has === "function") {
      return roleObject.has(staffRoleId);
    }
  }

  return false;
}

export function canUseStaffCommand(
  member: unknown,
  config: Pick<BotConfig, "discordStaffRoleId" | "ndlBotApiSecret">,
) {
  return Boolean(
    config.ndlBotApiSecret &&
      config.discordStaffRoleId &&
      hasStaffRole(member, config.discordStaffRoleId),
  );
}
