import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole, isModeratorRole, isBetaTester } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: true, data: { user: null } },
        { headers: noStoreHeaders },
      );
    }

    const isUserAdmin =
      isAdminRole(user.role, user.playerName) ||
      user.playerName.toLowerCase() === "cattw21" ||
      user.playerName.toLowerCase() === "ndl_admin";
    const isUserMod = isModeratorRole(user.role) || isUserAdmin;

    return NextResponse.json(
      {
        ok: true,
        data: {
          user: {
            id: user.id,
            playerName: user.playerName,
            displayName: user.displayName,
            role: user.role,
            isAdmin: isUserAdmin,
            isModerator: isUserMod,
            isBetaTester: isBetaTester(user.role),
          },
        },
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    console.warn("Could not fetch current user for /api/auth/me:", error);
    return NextResponse.json(
      { ok: true, data: { user: null } },
      { headers: noStoreHeaders },
    );
  }
}
