import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { sendNewsBroadcastEmail } from "../src/lib/email.js";
import { absoluteSiteUrl } from "../src/lib/site-url.js";

async function main() {
  console.log("📧 Checking User Email Accounts & Broadcasting News...\n");

  // 1. Check SMTP Environment
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();

  console.log("⚙️ SMTP Configuration Status:");
  console.log(`• Host: ${smtpHost || "Not configured"}`);
  console.log(`• Port: ${smtpPort || "Not configured"}`);
  console.log(`• User: ${smtpUser || "Not configured"}`);
  console.log(`• From: ${smtpFrom || "Not configured"}`);
  console.log(`• Has Password: ${Boolean(process.env.SMTP_PASSWORD?.trim())}`);

  // 2. Fetch Users with Email
  const users = await prisma.user.findMany({
    where: {
      email: { not: "" },
      isDemo: false,
    },
    select: {
      id: true,
      email: true,
      playerName: true,
      displayName: true,
      emailVerifiedAt: true,
    },
  });

  console.log(`\n👥 Registered Users with Email (${users.length}):`);
  for (const u of users) {
    console.log(`  - ${u.displayName || u.playerName} <${u.email}> (Verified: ${u.emailVerifiedAt ? "Yes" : "No"})`);
  }

  // 3. Send Broadcast Email to All Users
  const title = "🎉 Official Nerfed Demonlist Discord Server & Bot is Live!";
  const summary =
    "We are thrilled to officially launch the Nerfed Demonlist Discord Server, featuring 24/7 automated record broadcasts, live bot commands, interactive role selection, and an active community hub for Geometry Dash nerfed extremes!";
  const category = "ANNOUNCEMENT";
  const slug = "official-discord-server-and-bot-launched";
  const articleUrl = absoluteSiteUrl(`/changelog/${slug}`);

  console.log(`\n🚀 Broadcasting email to ${users.length} user(s)...`);
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    if (user.email && !user.email.endsWith("@ndl.local")) {
      try {
        await sendNewsBroadcastEmail({
          to: user.email,
          recipientName: user.displayName || user.playerName,
          title,
          summary,
          category,
          articleUrl,
        });
        console.log(`  ✅ Successfully sent announcement email to ${user.email}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Failed sending to ${user.email}:`, err);
        failCount++;
      }
    }
  }

  console.log(`\n📊 Broadcast Summary: ${successCount} sent, ${failCount} failed.`);
}

main().catch(console.error);
