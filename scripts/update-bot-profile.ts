import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) {
    console.error("❌ DISCORD_BOT_TOKEN is required in .env");
    process.exit(1);
  }

  console.log("🎨 Updating Discord Bot Profile & Avatar...");

  // Check for avatar file in public/logo.png or src/app/icon.png
  let avatarDataUri: string | undefined;
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const iconPath = path.join(process.cwd(), "src", "app", "icon.png");

  const chosenPath = fs.existsSync(logoPath) ? logoPath : fs.existsSync(iconPath) ? iconPath : null;

  if (chosenPath) {
    const fileBuffer = fs.readFileSync(chosenPath);
    const base64 = fileBuffer.toString("base64");
    avatarDataUri = `data:image/png;base64,${base64}`;
    console.log(`🖼️ Loaded official avatar from ${path.basename(chosenPath)}`);
  }

  const payload: Record<string, unknown> = {
    username: "Nerfed Demonlist",
  };

  if (avatarDataUri) {
    payload.avatar = avatarDataUri;
  }

  const res = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`⚠️ Discord returned (${res.status}): ${errorText}`);
    console.log("ℹ️ Note: Discord limits bot username changes to 2 per hour. If username hit rate limit, you can also update it anytime in the Developer Portal.");
    return;
  }

  const user = await res.json();
  console.log("=======================================================");
  console.log("🎉 BOT PROFILE SUCCESSFULLY UPDATED!");
  console.log("=======================================================");
  console.log(`• Username: ${user.username}`);
  console.log(`• Tag: ${user.username}#${user.discriminator || "0"}`);
  console.log(`• Avatar: ${user.avatar ? "Custom NDL Avatar Applied ✅" : "Default"}`);
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("❌ Error updating bot profile:", err);
  process.exit(1);
});
