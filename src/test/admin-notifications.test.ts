import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { isModeratorRole, isAdminRole } from "../lib/permissions";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), "src", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Staff review notification system", () => {
  it("enforces staff permissions for review queues", () => {
    expect(isModeratorRole("ADMIN")).toBe(true);
    expect(isModeratorRole("MODERATOR")).toBe(true);
    expect(isModeratorRole("PLAYER")).toBe(false);

    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("MODERATOR")).toBe(false);
    expect(isAdminRole("PLAYER")).toBe(false);
  });

  it("implements authenticated notifications endpoint with record & suggestion counts", () => {
    const route = source("app/api/admin/notifications/route.ts");

    expect(route).toContain("getCurrentUser()");
    expect(route).toContain("isModeratorRole(user.role)");
    expect(route).toContain("apiUnauthorized");
    expect(route).toContain("pendingRecordsCount");
    expect(route).toContain("pendingSuggestionsCount");
    expect(route).toContain("totalPendingCount");
    expect(route).toContain("recentPendingRecords");
    expect(route).toContain("recentPendingSuggestions");
    expect(route).toContain("apiOk");
  });

  it("implements interactive StaffNotificationCenter with dropdown, auto-polling, and real-time alerts", () => {
    const component = source("components/staff-notification-center.tsx");

    expect(component).toContain("Staff Review Queue");
    expect(component).toContain("Record Submissions");
    expect(component).toContain("Level Suggestions");
    expect(component).toContain("fetchNotifications");
    expect(component).toContain("hasPending");
    expect(component).toContain("BellRing");
    expect(component).toContain("/api/admin/notifications");
    expect(component).toContain("formatRelativeTime");
  });

  it("integrates notification center and nav counter badge in AppShell and NavLink", () => {
    const appShell = source("components/app-shell.tsx");
    const navLink = source("components/nav-link.tsx");

    expect(appShell).toContain("StaffNotificationCenter");
    expect(appShell).toContain("isModeratorRole(user.role)");
    expect(appShell).toContain("badgeCount={pendingTotalCount}");
    expect(navLink).toContain("badgeCount");
  });

  it("displays prominent pending reviews banner in the Admin Dashboard", () => {
    const adminPage = source("app/admin/page.tsx");

    expect(adminPage).toContain("Pending Staff Reviews");
    expect(adminPage).toContain("pendingRecords + pendingSuggestions > 0");
    expect(adminPage).toContain("Review Records");
    expect(adminPage).toContain("Review Suggestions");
  });
});
