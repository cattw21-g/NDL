import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoModeEnabled } from "@/lib/demo-visibility";
import { isAdminRole } from "@/lib/permissions";
import { UpcomingLevelItem, UpcomingView } from "@/components/upcoming-view";
import { parseUpcomingProgress } from "@/lib/upcoming-progress";
import { resolveUpcomingThumbnail } from "@/lib/media";

export { parseUpcomingProgress };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Upcoming Levels - Nerfed Demonlist",
  description:
    "Explore nerfed demons currently in verification and approved levels waiting for a verifier.",
};

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  const isAdmin = user
    ? isAdminRole(user.role, user.playerName) ||
      user.playerName.toLowerCase() === "cattw21" ||
      user.playerName.toLowerCase() === "ndl_admin"
    : false;
  const isDemoMode = demoModeEnabled();

  let pendingLevels: Array<any> = [];
  let approvedSuggestions: Array<any> = [];

  try {
    const results = await Promise.all([
      prisma.level.findMany({
        where: {
          status: "PENDING",
          ...(isDemoMode ? {} : { isDemo: false }),
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.levelSuggestion.findMany({
        where: {
          status: "APPROVED",
          createdLevelId: null,
          ...(isDemoMode ? {} : { isDemo: false }),
        },
        include: {
          submitter: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    pendingLevels = results[0];
    approvedSuggestions = results[1];
  } catch (err) {
    console.warn("Database unavailable on /upcoming, using fallback:", err);
  }

  const allItems: UpcomingLevelItem[] = [
    ...pendingLevels.map((lvl) => ({
      id: lvl.id,
      name: lvl.name,
      originalName: lvl.originalName,
      slug: lvl.slug,
      gdLevelId: lvl.gdLevelId,
      publisher: lvl.publisher,
      nerfCreator: lvl.nerfCreator,
      verifier: lvl.verifier,
      verifierUserId: lvl.verifierUserId,
      showcaseUrl: lvl.showcaseUrl,
      verificationVideoUrl: lvl.verificationVideoUrl,
      thumbnailUrl: resolveUpcomingThumbnail(
        lvl.slug,
        lvl.name,
        lvl.showcaseUrl || lvl.verificationVideoUrl,
        lvl.thumbnailUrl,
      ),
      difficulty: lvl.difficulty,
      description: lvl.description,
      versionNotes: lvl.versionNotes,
      progress: parseUpcomingProgress(lvl.versionNotes, lvl.minimumProgress),
      isSuggestion: false,
    })),
    ...approvedSuggestions.map((sug) => ({
      id: sug.id,
      name: sug.name,
      originalName: sug.originalName,
      slug: sug.originalName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      gdLevelId: sug.gdLevelId,
      publisher: sug.publisher,
      nerfCreator: sug.nerfCreator,
      verifier: sug.verifier,
      showcaseUrl: sug.showcaseUrl,
      verificationVideoUrl: sug.verificationVideoUrl,
      thumbnailUrl: resolveUpcomingThumbnail(
        sug.originalName,
        sug.name,
        sug.showcaseUrl || sug.verificationVideoUrl,
        sug.thumbnailUrl,
      ),
      difficulty: "EXTREME",
      description: sug.versionNotes,
      versionNotes: sug.versionNotes,
      progress: parseUpcomingProgress(sug.versionNotes, null),
      isSuggestion: true,
      submitterName: sug.submitter.displayName,
    })),
  ];

  const isWaitingVerifier = (v?: string | null) => {
    if (!v || v.trim() === "") return true;
    const l = v.trim().toLowerCase();
    return (
      l === "open" ||
      l === "open verification" ||
      l === "unassigned" ||
      l === "none" ||
      l === "n/a"
    );
  };

  const currentlyVerifying = allItems.filter(
    (item) => !isWaitingVerifier(item.verifier),
  );

  const waitingLevels = allItems.filter(
    (item) => isWaitingVerifier(item.verifier),
  );

  return (
    <UpcomingView
      currentlyVerifying={currentlyVerifying}
      waitingLevels={waitingLevels}
      isAdmin={isAdmin}
    />
  );
}
