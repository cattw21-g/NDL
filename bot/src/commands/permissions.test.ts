import { describe, expect, it } from "vitest";

import {
  canUseStaffCommand,
  hasStaffRole,
  staffPermissionDeniedMessage,
} from "./permissions.js";

describe("Discord staff permission guard", () => {
  it("allows array roles and cached Discord role collections", () => {
    expect(hasStaffRole({ roles: ["staff-role"] }, "staff-role")).toBe(true);
    expect(
      hasStaffRole({ roles: { cache: { has: () => true } } }, "staff-role"),
    ).toBe(true);
  });

  it("rejects missing staff config or wrong roles", () => {
    expect(
      canUseStaffCommand(
        { roles: ["staff-role"] },
        { discordStaffRoleId: null, ndlBotApiSecret: "secret" },
      ),
    ).toBe(false);
    expect(
      canUseStaffCommand(
        { roles: ["other-role"] },
        { discordStaffRoleId: "staff-role", ndlBotApiSecret: "secret" },
      ),
    ).toBe(false);
    expect(
      canUseStaffCommand(
        { roles: ["staff-role"] },
        { discordStaffRoleId: "staff-role", ndlBotApiSecret: null },
      ),
    ).toBe(false);
  });

  it("uses the required denial message", () => {
    expect(staffPermissionDeniedMessage).toBe(
      "You do not have permission to use this command.",
    );
  });
});
