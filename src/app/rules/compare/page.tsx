import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { RulesCompareView } from "@/components/rules-compare-view";
import { RULE_VERSIONS_HISTORY, type RuleVersion } from "@/lib/rules-history";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rules Version Comparison — Nerfed Demonlist",
  description: "Compare revision history, amendments, side-by-side diffs, and rule changes across Nerfed Demonlist guidelines.",
};

export default async function RulesComparePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  let dbDocuments: Array<{
    id: string;
    version: string;
    content: string;
    isActive: boolean;
    publishedAt: Date;
  }> = [];

  try {
    dbDocuments = await prisma.rulesDocument.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        version: true,
        content: true,
        isActive: true,
        publishedAt: true,
      },
    });
  } catch (err) {
    console.warn("Database unavailable on /rules/compare, using baseline history:", err);
  }

  // Merge database documents with the historical record baseline
  let versions: RuleVersion[] = [...RULE_VERSIONS_HISTORY];

  if (dbDocuments.length > 0) {
    // If active database document is newer, prepend or replace the active version
    const activeDbDoc = dbDocuments.find((d) => d.isActive);
    if (activeDbDoc) {
      const existingIdx = versions.findIndex(
        (v) => v.version.toLowerCase() === activeDbDoc.version.toLowerCase(),
      );
      if (existingIdx !== -1) {
        versions[existingIdx] = {
          ...versions[existingIdx],
          id: activeDbDoc.id,
          content: activeDbDoc.content,
          isActive: true,
          publishedAt: activeDbDoc.publishedAt,
        };
      } else {
        versions.unshift({
          id: activeDbDoc.id,
          version: activeDbDoc.version,
          title: `${activeDbDoc.version} (Custom Active)`,
          publishedAt: activeDbDoc.publishedAt,
          isActive: true,
          summary: "Current active guideline document from database administration.",
          keyChanges: [],
          content: activeDbDoc.content,
        });
      }
    }
  }

  return (
    <RulesCompareView
      versions={versions}
      initialFromId={params.from}
      initialToId={params.to}
    />
  );
}
