import "dotenv/config";
import { prisma } from "../src/lib/db.js";

async function main() {
  console.log("Testing Prisma queries...");

  try {
    const records = await prisma.record.findMany({
      take: 5,
      include: {
        player: true,
        level: true,
      },
    });
    console.log("✅ record.findMany works! Count:", records.length);
  } catch (e) {
    console.error("❌ record.findMany failed:", e);
  }

  try {
    const sessions = await prisma.session.findMany({
      take: 5,
      include: {
        user: true,
      },
    });
    console.log("✅ session.findMany works! Count:", sessions.length);
  } catch (e) {
    console.error("❌ session.findMany failed:", e);
  }

  try {
    const posts = await prisma.changelogPost.findMany({
      take: 5,
      include: {
        author: true,
      },
    });
    console.log("✅ changelogPost.findMany works! Count:", posts.length);
  } catch (e) {
    console.error("❌ changelogPost.findMany failed:", e);
  }
}

main().catch(console.error);
