import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || "1541531776097198080";
  const redirectUri = "https://www.nerfeddemonlist.net/api/auth/discord/callback";

  const u = new URL("https://discord.com/oauth2/authorize");
  u.searchParams.set("client_id", clientId.trim());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "identify");

  const botToken = process.env.DISCORD_BOT_TOKEN?.trim() || "";
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "";

  return NextResponse.json({
    status: "ok",
    clientId: clientId.trim(),
    guildId,
    tokenPrefix: botToken.slice(0, 10),
    tokenSuffix: botToken.slice(-6),
  });
}
