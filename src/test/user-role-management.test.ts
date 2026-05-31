import { describe, expect, it } from "vitest";

import { Role } from "../generated/prisma/enums";
import {
  applyUserRoleChange,
  canChangeUserRole,
  type RoleChangeClient,
} from "../lib/user-role-management";

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

describe("user role management", () => {
  it("allows an admin to promote a player to moderator", () => {
    expect(
      canChangeUserRole({
        actorRole: Role.ADMIN,
        targetRole: Role.PLAYER,
        nextRole: Role.MODERATOR,
        otherAdminCount: 1,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows an admin to promote a player to admin", () => {
    expect(
      canChangeUserRole({
        actorRole: Role.ADMIN,
        targetRole: Role.PLAYER,
        nextRole: Role.ADMIN,
        otherAdminCount: 1,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows an admin to demote another admin when an admin remains", () => {
    expect(
      canChangeUserRole({
        actorRole: Role.ADMIN,
        targetRole: Role.ADMIN,
        nextRole: Role.PLAYER,
        otherAdminCount: 1,
      }),
    ).toEqual({ allowed: true });
  });

  it("prevents removing the last admin", () => {
    expect(
      canChangeUserRole({
        actorRole: Role.ADMIN,
        targetRole: Role.ADMIN,
        nextRole: Role.PLAYER,
        otherAdminCount: 0,
      }),
    ).toEqual({ allowed: false, reason: "last-admin" });
  });

  it("rejects role changes by non-admin users", () => {
    expect(
      canChangeUserRole({
        actorRole: Role.MODERATOR,
        targetRole: Role.PLAYER,
        nextRole: Role.ADMIN,
        otherAdminCount: 1,
      }),
    ).toEqual({ allowed: false, reason: "not-admin" });
  });

  it("logs a moderation action when a role changes", async () => {
    const calls = {
      updates: [] as unknown[],
      actions: [] as unknown[],
    };
    const tx = {
      user: {
        update: async (args: unknown) => {
          calls.updates.push(args);
          return {
            id: "player-1",
            role: Role.MODERATOR,
          };
        },
      },
      moderationAction: {
        create: async (args: unknown) => {
          calls.actions.push(args);
          return args;
        },
      },
    } as unknown as RoleChangeClient;

    await applyUserRoleChange(
      tx,
      {
        id: "admin-1",
        displayName: "Admin",
        role: Role.ADMIN,
      },
      {
        id: "player-1",
        displayName: "Player",
        role: Role.PLAYER,
      },
      Role.MODERATOR,
    );

    expect(calls.updates).toHaveLength(1);
    expect(calls.actions).toHaveLength(1);
    const action = asRecord(asRecord(calls.actions[0]).data);
    expect(action.type).toBe("USER_ROLE_UPDATED");
    expect(action.summary).toContain("from PLAYER to MODERATOR");
    expect(action.metadata).toEqual({
      previousRole: "PLAYER",
      nextRole: "MODERATOR",
    });
  });
});
