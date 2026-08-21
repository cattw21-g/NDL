import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoModeEnabled } from "@/lib/demo-visibility";
import { isAdminRole } from "@/lib/permissions";
import { UpcomingLevelItem, UpcomingView } from "@/components/upcoming-view";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Upcoming Levels - Nerfed Demonlist",
  description:
    "Explore nerfed demons currently in verification and approved levels waiting for a verifier.",
};

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  const isAdmin = user ? isAdminRole(user.role) : false;
  const isDemoMode = demoModeEnabled();

  const [pendingLevels, approvedSuggestions] = await Promise.all([
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
      },
      include: {
        submitter: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
      thumbnailUrl: lvl.thumbnailUrl,
      difficulty: lvl.difficulty,
      description: lvl.description,
      versionNotes: lvl.versionNotes,
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
      thumbnailUrl: sug.thumbnailUrl || "/thumbnails/fallback.png",
      difficulty: "EXTREME",
      description: sug.versionNotes,
      versionNotes: sug.versionNotes,
      isSuggestion: true,
      submitterName: sug.submitter.displayName,
    })),
  ];

  const currentlyVerifying = allItems.filter(
    (item) =>
      item.verifier &&
      item.verifier.trim() !== "" &&
      item.verifier.toLowerCase() !== "open" &&
      item.verifier.toLowerCase() !== "unassigned" &&
      item.verifier.toLowerCase() !== "none",
  );

  const waitingLevels = allItems.filter(
    (item) =>
      !item.verifier ||
      item.verifier.trim() === "" ||
      item.verifier.toLowerCase() === "open" ||
      item.verifier.toLowerCase() === "unassigned" ||
      item.verifier.toLowerCase() === "none",
  );

  return (
    <UpcomingView
      currentlyVerifying={currentlyVerifying}
      waitingLevels={waitingLevels}
      isAdmin={isAdmin}
    />
  );
}
