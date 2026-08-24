import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || (user ? `/players/${user.playerName}` : "/login");

  if (!user) {
    // If not logged in, redirect to login first with return url
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`);
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || "1541531776097198080";
  const redirectUri = absoluteSiteUrl("/api/auth/discord/callback");

  // Create state containing userId and returnTo
  const statePayload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      returnTo,
      timestamp: Date.now(),
    }),
  ).toString("base64url");

  const discordAuthUrl = new URL("https://discord.com/oauth2/authorize");
  discordAuthUrl.searchParams.set("client_id", clientId);
  discordAuthUrl.searchParams.set("response_type", "code");
  discordAuthUrl.searchParams.set("redirect_uri", redirectUri);
  discordAuthUrl.searchParams.set("scope", "identify");
  discordAuthUrl.searchParams.set("state", statePayload);
  discordAuthUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(discordAuthUrl);
}
