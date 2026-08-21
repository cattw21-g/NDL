import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { requireDatabaseUrl } from "../src/lib/production-env";

const connectionString = requireDatabaseUrl(process.env, "cleanup old news");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const result = await prisma.changelogPost.deleteMany({
    where: {
      slug: {
        not: "ndl-v1-0-rc-release",
      },
    },
  });
  console.log("Deleted", result.count, "old changelog posts from DB.");
}

main().finally(() => prisma.$disconnect());
