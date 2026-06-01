import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
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
