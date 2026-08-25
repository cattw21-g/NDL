import "dotenv/config";
import { notifyRecordAccepted } from "../src/lib/discord-notify.js";

async function main() {
  console.log("Testing notifyRecordAccepted...");
  console.log("DISCORD_BOT_TOKEN exists:", Boolean(process.env.DISCORD_BOT_TOKEN));
  console.log("DISCORD_GUILD_ID:", process.env.DISCORD_GUILD_ID);

  await notifyRecordAccepted({
    playerName: "TestPlayer",
    playerHandle: "TestPlayer",
    levelName: "Sonic Wave Nerfed",
    levelSlug: "sonic-wave-nerfed",
    levelRank: 1,
    progress: 100,
    pointsAwarded: 250,
    videoUrl: "https://youtube.com",
    reviewerName: "Admin",
  });

  console.log("Finished test call!");
}

main().catch(console.error);
