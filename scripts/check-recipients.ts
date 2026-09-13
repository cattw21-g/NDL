import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Read DATABASE_URL from .env.vercel-latest which has the live production Neon DB
import fs from "fs";
const envLatest = fs.readFileSync(".env.vercel-latest", "utf8");
const dbMatch = envLatest.match(/DATABASE_URL=['"]?([^'"\r\n]+)/);
const connectionString = dbMatch ? dbMatch[1] : process.env.DATABASE_URL;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      playerName: true,
      role: true,
      isDemo: true,
    },
  });

  console.log(`Total users in DB: ${users.length}`);

  const recipients = new Map<string, string>();
  for (const u of users) {
    if (u.email && !u.email.endsWith(".local") && u.email.includes("@")) {
      recipients.set(u.email, u.displayName || u.playerName);
      console.log(`- ${u.displayName || u.playerName} <${u.email}> (${u.role}, demo=${u.isDemo})`);
    } else {
      console.log(`- [Skipped local/fake] ${u.displayName || u.playerName} <${u.email}>`);
    }
  }

  console.log(`\nTotal real recipient(s): ${recipients.size}`);
  await prisma.$disconnect();
}

main().catch(console.error);
