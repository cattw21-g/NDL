import "dotenv/config";
import { prisma } from "../src/lib/db.js";

async function main() {
  console.log("📰 Publishing Official Discord Server Announcement...");

  // Find or create admin author
  let author = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (!author) {
    author = await prisma.user.findFirst();
  }

  if (!author) {
    console.error("❌ No user found in database to author the announcement.");
    process.exit(1);
  }

  const slug = "official-discord-server-and-bot-launched";
  const title = "🎉 Official Nerfed Demonlist Discord Server & Bot is Live!";
  const summary =
    "We are thrilled to officially launch the Nerfed Demonlist Discord Server, featuring 24/7 automated record broadcasts, live bot commands, interactive role selection, and an active community hub for Geometry Dash nerfed extremes!";
  const category = "ANNOUNCEMENT";
  const content = `## Welcome to the Official Nerfed Demonlist Community!

We are excited to announce that the **Official Nerfed Demonlist Discord Server & Bot** is now fully launched and open to the entire Geometry Dash community!

### 🌟 What's New in the Server?
- **🔴 24/7 Live Website Auto-Broadcasting**: All newly accepted list records, upcoming demon previews, and list updates are automatically broadcast directly to our Discord channels in real-time!
- **🤖 High-Powered Bot Commands**: Use \`/top\`, \`/level\`, \`/player\`, \`/leaderboard\`, \`/rules\`, and \`/changelog\` directly inside Discord to pull live data from the website.
- **🎭 Self-Assignable Notification Roles**: Check out the \`#🎭・roles\` channel to click and toggle \`🔔 Announcements Ping\` and \`📰 List Updates Ping\` with zero hassle.
- **💬 Active Community & Demon Discussion**: Dedicated channels for sharing your progress runs, click audio showcases, nerfed demon balance discussions, and creative artwork.

### 🔗 Join the Server Now
Click the Discord icon at the top of the website or join via our direct server link:
**[Join the Official Nerfed Demonlist Discord](https://discord.com/channels/1541532007304003595)**

Thank you for your incredible support as we continue pushing the limits of nerfed demon tracking!

*— The Nerfed Demonlist Team & @cattw_gd*`;

  const existing = await prisma.changelogPost.findUnique({
    where: { slug },
  });

  if (existing) {
    await prisma.changelogPost.update({
      where: { slug },
      data: {
        title,
        summary,
        category,
        content,
        isPublished: true,
        isPinned: true,
        publishedAt: new Date(),
      },
    });
    console.log("✅ Updated and re-pinned existing Discord announcement!");
  } else {
    await prisma.changelogPost.create({
      data: {
        slug,
        title,
        summary,
        category,
        content,
        isPublished: true,
        isPinned: true,
        publishedAt: new Date(),
        authorId: author.id,
      },
    });
    console.log("✅ Created and published new Discord announcement!");
  }
}

main().catch(console.error);
