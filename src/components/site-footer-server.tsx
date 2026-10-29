import { SiteFooter } from "@/components/site-footer";
import type { CurrentUser } from "@/lib/use-current-user";
import { isAdminRole, isModeratorRole, isBetaTester } from "@/lib/permissions";

/**
 * SiteFooterServer renders the site footer without reading request cookies on the server,
 * allowing all public pages to be statically generated and cached by the edge CDN.
 */
export function SiteFooterServer({ user }: { user?: CurrentUser | null } = {}) {
  const userProp = user
    ? {
        playerName: user.playerName,
        isModerator: isModeratorRole(user.role),
        isAdmin: isAdminRole(user.role),
        isBetaTester: isBetaTester(user.role),
      }
    : null;

  return <SiteFooter user={userProp} />;
}
