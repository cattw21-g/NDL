import "dotenv/config";
import { prisma } from "../src/lib/db.js";

async function main() {
  console.log("🛠️ Adding missing Discord columns directly to PostgreSQL `User` table...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" 
    ADD COLUMN IF NOT EXISTS "discordUserId" TEXT,
    ADD COLUMN IF NOT EXISTS "discordUsername" TEXT,
    ADD COLUMN IF NOT EXISTS "discordLinkedAt" TIMESTAMP(3);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_discordUserId_key" ON "User"("discordUserId");
  `);

  console.log("✅ Columns successfully created on PostgreSQL database!");

  const testUser = await prisma.user.findFirst();
  console.log("Verified Prisma query works:", testUser ? "OK" : "No users");
}

main().catch(console.error);
