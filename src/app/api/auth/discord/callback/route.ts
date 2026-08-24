import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncDiscordRolesForUser } from "@/lib/discord-role-sync";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const fallbackRedirect = absoluteSiteUrl("/players");

  if (error || !code) {
    console.error("Discord OAuth error or denied:", error);
    return NextResponse.redirect(`${fallbackRedirect}?discord_error=access_denied`);
  }

  let stateData: { userId?: string; returnTo?: string; redirectUri?: string } = {};
  if (state) {
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
    } catch {
      // Ignore corrupted state
    }
  }

  const currentUser = (await getCurrentUser()) || (stateData.userId ? await prisma.user.findUnique({ where: { id: stateData.userId } }) : null);

  if (!currentUser) {
    return NextResponse.redirect(absoluteSiteUrl("/login?error=session_expired"));
  }

  const clientId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || "1541531776097198080";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim() || "";
  const redirectUri = stateData.redirectUri || absoluteSiteUrl("/api/auth/discord/callback");

  if (!clientSecret) {
    console.error("Missing DISCORD_CLIENT_SECRET in environment variables.");
    return NextResponse.redirect(
      `${absoluteSiteUrl(`/players/${currentUser.playerName}`)}?discord_error=missing_client_secret`,
    );
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Failed to exchange Discord OAuth code:", errText);
      return NextResponse.redirect(
        `${absoluteSiteUrl(`/players/${currentUser.playerName}`)}?discord_error=token_exchange_failed`,
      );
    }

    const tokenData: { access_token: string } = await tokenRes.json();

    // 2. Fetch Discord user profile
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        `${absoluteSiteUrl(`/players/${currentUser.playerName}`)}?discord_error=user_fetch_failed`,
      );
    }

    const discordUser: { id: string; username: string; global_name?: string } = await userRes.json();

    // 3. Clear any conflicting links for this discord user
    await prisma.user.updateMany({
      where: { discordUserId: discordUser.id },
      data: {
        discordUserId: null,
        discordUsername: null,
        discordLinkedAt: null,
      },
    });

    // 4. Link Discord to current user
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        discordUserId: discordUser.id,
        discordUsername: discordUser.global_name || discordUser.username,
        discordLinkedAt: new Date(),
      },
    });

    // 5. Automatically assign Discord roles
    await syncDiscordRolesForUser(currentUser.id);

    const destination = stateData.returnTo ? absoluteSiteUrl(stateData.returnTo) : absoluteSiteUrl(`/players/${currentUser.playerName}?discord_linked=1`);
    return NextResponse.redirect(destination);
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return NextResponse.redirect(
      `${absoluteSiteUrl(`/players/${currentUser.playerName}`)}?discord_error=unexpected`,
    );
  }
}
