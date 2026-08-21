import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { requireDatabaseUrl } from "../src/lib/production-env";

const connectionString = requireDatabaseUrl(process.env, "check news");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const all = await prisma.changelogPost.findMany();
  console.log("Found", all.length, "posts total in DB:");
  for (const p of all) {
    console.log({
      id: p.id,
      title: p.title,
      slug: p.slug,
      isPublished: p.isPublished,
      isDemo: p.isDemo,
      archivedAt: p.archivedAt,
      publishedAt: p.publishedAt,
    });
  }
}

main().finally(() => prisma.$disconnect());
