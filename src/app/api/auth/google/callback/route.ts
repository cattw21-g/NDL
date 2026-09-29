import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hasCompletedGoogleUsernameSetup } from "@/lib/google-username-setup";
import {
  createGoogleSignupToken,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_SETUP_COOKIE,
  GOOGLE_SETUP_TTL_SECONDS,
} from "@/lib/google-signup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");
  const siteUrl = `${proto}://${host}`;

  const state = searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(new URL("/login?error=Google%20sign-in%20expired.%20Please%20try%20again.", siteUrl));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  }

  const redirectWithoutState = (path: string) => {
    const response = NextResponse.redirect(new URL(path, siteUrl));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  };

  if (!code) {
    return redirectWithoutState("/login?error=Google%20authentication%20was%20cancelled.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return redirectWithoutState("/login?error=Google%20OAuth%20credentials%20missing.");
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return redirectWithoutState("/login?error=Failed%20to%20exchange%20Google%20token.");
    }

    // 2. Fetch Google profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email || profile.verified_email !== true) {
      return redirectWithoutState("/login?error=Google%20did%20not%20provide%20a%20verified%20email.");
    }

    const email = profile.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await hasCompletedGoogleUsernameSetup(user.id))) {
      const response = redirectWithoutState("/complete-google-signup");
      response.cookies.set(GOOGLE_SETUP_COOKIE, createGoogleSignupToken(email, Date.now(), process.env, user?.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: GOOGLE_SETUP_TTL_SECONDS,
      });
      return response;
    }

    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    await createSession(user.id);
    return redirectWithoutState(`/players/${user.playerName}`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return redirectWithoutState("/login?error=Internal%20Google%20OAuth%20error.");
  }
}
