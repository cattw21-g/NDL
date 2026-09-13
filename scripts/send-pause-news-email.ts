import "dotenv/config";
import fs from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sendNewsBroadcastEmail } from "../src/lib/email";
import { REVIEW_PAUSE_SEPT_2026_POST } from "../src/lib/changelog";

// Read DATABASE_URL from .env.vercel-latest which has the live production Neon DB
const envLatest = fs.existsSync(".env.vercel-latest")
  ? fs.readFileSync(".env.vercel-latest", "utf8")
  : "";
const dbMatch = envLatest.match(/DATABASE_URL=['"]?([^'"\r\n]+)/);
const connectionString = dbMatch ? dbMatch[1] : process.env.DATABASE_URL;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log("📨 Preparing to broadcast Review Pause News Email...\n");

  const recipients = new Map<string, string>();

  // Always include administrator / owner email
  const adminEmail = process.env.SMTP_USER?.trim() || "cattwgd@gmail.com";
  recipients.set(adminEmail, "cattw21");

  // Fetch registered users with real emails from database
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        displayName: true,
        playerName: true,
      },
    });

    for (const u of users) {
      if (u.email && !u.email.endsWith(".local") && u.email.includes("@")) {
        recipients.set(u.email, u.displayName || u.playerName);
      }
    }
  } catch (err) {
    console.warn("Could not query DB for users, defaulting to admin email:", err);
  }

  console.log(`Found ${recipients.size} recipient(s):`);
  for (const [email, name] of recipients.entries()) {
    console.log(`  • ${name} <${email}>`);
  }
  console.log("");

  let successCount = 0;
  let failCount = 0;

  for (const [email, name] of recipients.entries()) {
    try {
      console.log(`Sending email to ${name} <${email}>...`);
      await sendNewsBroadcastEmail({
        to: email,
        recipientName: name,
        title: REVIEW_PAUSE_SEPT_2026_POST.title,
        summary: REVIEW_PAUSE_SEPT_2026_POST.summary,
        category: "MODERATION NOTE",
        articleUrl: `https://www.nerfeddemonlist.net/changelog/${REVIEW_PAUSE_SEPT_2026_POST.slug}`,
      });
      console.log(`  ✅ Successfully sent to ${email}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed to send to ${email}:`, err);
      failCount++;
    }
  }

  console.log(`\nEmail broadcast finished: ${successCount} sent, ${failCount} failed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal broadcast error:", err);
  process.exit(1);
});
