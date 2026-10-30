"use client";

import { usePathname } from "next/navigation";
import { LockedBetaScreen } from "@/components/locked-beta-screen";
import { isClosedBetaExemptPath } from "@/lib/closed-beta";

interface BetaSiteLockProps {
  children: React.ReactNode;
  isBetaSite: boolean;
  isUnlocked: boolean;
}

export function BetaSiteLock({
  children,
  isBetaSite,
  isUnlocked,
}: BetaSiteLockProps) {
  const pathname = usePathname() || "/";

  // 1. Official website: completely clean, no locks, no beta UI
  if (!isBetaSite) {
    return <>{children}</>;
  }

  // 2. Beta website: if already unlocked via valid key cookie or staff/tester role
  if (isUnlocked) {
    return <>{children}</>;
  }

  // 3. Allow authentication routes (so staff can sign in if needed)
  if (isClosedBetaExemptPath(pathname)) {
    return <>{children}</>;
  }

  // 4. Fully locked: render only the Enter Key screen
  return <LockedBetaScreen />;
}
