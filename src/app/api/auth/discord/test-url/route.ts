import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = "1541531776097198080";
  const redirectUri = "https://www.nerfeddemonlist.net/api/auth/discord/callback";

  const u = new URL("https://discord.com/oauth2/authorize");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "identify");

  return NextResponse.json({
    clientId,
    redirectUri,
    fullAuthorizeUrl: u.toString(),
    portalUrl: `https://discord.com/developers/applications/${clientId}/oauth2`,
  });
}
