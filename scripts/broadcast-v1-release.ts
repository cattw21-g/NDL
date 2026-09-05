import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { sendNewsBroadcastEmail } from "../src/lib/email.js";
import { absoluteSiteUrl } from "../src/lib/site-url.js";
import { DEFAULT_POSTS, ensureLatestChangelogPost } from "../src/lib/changelog.js";

async function main() {
  console.log("🚀 Initializing NDL v1.0.0 Stable Release Broadcast...\n");

  // 1. Sync Changelog Post into Database
  console.log("📝 Upserting v1.0.0 Stable Release Post in database...");
  await ensureLatestChangelogPost(prisma);
  console.log("✅ Changelog post synced to database successfully.\n");

  // 2. Fetch Users with Email + Include Primary Owner Email
  const dbUsers = await prisma.user.findMany({
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

  const recipients = new Map<string, string>();
  recipients.set("cattwgd@gmail.com", "cattw21");

  for (const u of dbUsers) {
    if (u.email && !u.email.endsWith("@ndl.local")) {
      recipients.set(u.email, u.displayName || u.playerName);
    }
  }

  console.log(`👥 Total broadcast recipients: ${recipients.size}`);

  const post = DEFAULT_POSTS[0];
  const title = post.title;
  const summary = post.summary;
  const category = post.category;
  const articleUrl = absoluteSiteUrl(`/changelog/${post.slug}`);

  console.log(`📢 Title: ${title}`);
  console.log(`🔗 Link: ${articleUrl}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const [email, name] of recipients.entries()) {
    try {
      console.log(`📤 Sending v1.0.0 announcement to ${name} <${email}>...`);
      await sendNewsBroadcastEmail({
        to: email,
        recipientName: name,
        title,
        summary,
        category,
        articleUrl,
      });
      console.log(`  ✅ Successfully delivered to ${email}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed delivering to ${email}:`, err);
      failCount++;
    }
  }

  console.log(`\n🎉 Broadcast Complete: ${successCount} sent, ${failCount} failed.`);
}

main().catch(console.error);
