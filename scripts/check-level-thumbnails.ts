import "dotenv/config";
import fs from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const envLatest = fs.existsSync(".env.vercel-latest")
  ? fs.readFileSync(".env.vercel-latest", "utf8")
  : "";
const dbMatch = envLatest.match(/DATABASE_URL=['"]?([^'"\r\n]+)/);
const connectionString = dbMatch ? dbMatch[1] : process.env.DATABASE_URL;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const levels = await prisma.level.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailUrl: true,
      showcaseUrl: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total levels in DB: ${levels.length}`);
  for (const l of levels) {
    console.log(`[${l.status}] ${l.name} (${l.slug}):`);
    console.log(`   thumbnailUrl: ${l.thumbnailUrl}`);
    console.log(`   showcaseUrl:  ${l.showcaseUrl}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
