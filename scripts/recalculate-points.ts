import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { safeWriteAuditLog } from "../src/lib/audit-log";
import { recalculateStoredPoints } from "../src/lib/points-recalculation";
import { assertProductionEnv, requireDatabaseUrl } from "../src/lib/production-env";

assertProductionEnv(process.env);

const connectionString = requireDatabaseUrl(
  process.env,
  "recalculate stored points",
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const result = await prisma.$transaction((tx) => recalculateStoredPoints(tx));

  await safeWriteAuditLog(prisma, {
    action: "RECORD_POINTS_RECALCULATED",
    entityType: "Points",
    entityId: "stored-points",
    entityLabel: "Stored level and record points",
    after: result,
    note: "Stored level points and accepted record awards were recalculated from current ranks/statuses.",
  });

  console.log(
    [
      "Points recalculated:",
      `${result.levelsUpdated}/${result.levelsChecked} level(s) updated,`,
      `${result.recordsUpdated} accepted record(s) updated.`,
    ].join(" "),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
