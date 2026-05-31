import { ModerationActionType, type Role } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";

export type RoleChangeActor = {
  id: string;
  displayName: string;
  role: Role;
};

export type RoleChangeTarget = {
  id: string;
  displayName: string;
  role: Role;
};

export type RoleChangeResult =
  | { allowed: true }
  | { allowed: false; reason: "not-admin" | "last-admin" };

export function canChangeUserRole({
  actorRole,
  targetRole,
  nextRole,
  otherAdminCount,
}: {
  actorRole: Role;
  targetRole: Role;
  nextRole: Role;
  otherAdminCount: number;
}): RoleChangeResult {
  if (actorRole !== "ADMIN") {
    return {
      allowed: false,
      reason: "not-admin",
    };
  }

  if (targetRole === "ADMIN" && nextRole !== "ADMIN" && otherAdminCount < 1) {
    return {
      allowed: false,
      reason: "last-admin",
    };
  }

  return {
    allowed: true,
  };
}

export type RoleChangeClient = Pick<Prisma.TransactionClient, "user" | "moderationAction">;

export async function applyUserRoleChange(
  tx: RoleChangeClient,
  actor: RoleChangeActor,
  target: RoleChangeTarget,
  nextRole: Role,
) {
  const user = await tx.user.update({
    where: {
      id: target.id,
    },
    data: {
      role: nextRole,
    },
  });

  await tx.moderationAction.create({
    data: {
      actorId: actor.id,
      type: ModerationActionType.USER_ROLE_UPDATED,
      targetType: "User",
      targetId: user.id,
      summary: `${actor.displayName} changed ${target.displayName}'s role from ${target.role} to ${nextRole}.`,
      metadata: {
        previousRole: target.role,
        nextRole,
      },
    },
  });

  return user;
}
