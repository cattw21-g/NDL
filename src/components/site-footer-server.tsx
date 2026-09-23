import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole, isModeratorRole, isBetaTester } from "@/lib/permissions";

export async function SiteFooterServer() {
  const user = await getCurrentUser();

  return (
    <SiteFooter
      user={
        user
          ? {
              playerName: user.playerName,
              isModerator: isModeratorRole(user.role),
              isAdmin: isAdminRole(user.role),
              isBetaTester: isBetaTester(user.role),
            }
          : null
      }
    />
  );
}
