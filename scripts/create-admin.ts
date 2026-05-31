import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { upsertAdminFromEnv } from "../src/lib/admin-bootstrap";
import { assertProductionEnv, requireDatabaseUrl } from "../src/lib/production-env";

assertProductionEnv(process.env);

const connectionString = requireDatabaseUrl(
  process.env,
  "create the first admin",
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const admin = await upsertAdminFromEnv(prisma);

  if (!admin) {
    throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_HANDLE are required.");
  }

  console.log(`Admin ready: ${admin.email} (${admin.playerName})`);
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
