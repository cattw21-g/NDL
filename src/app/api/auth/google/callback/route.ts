import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password-hashing";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl();

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Google%20authentication%20was%20cancelled.", siteUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=Google%20OAuth%20credentials%20missing.", siteUrl));
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
      return NextResponse.redirect(new URL("/login?error=Failed%20to%20exchange%20Google%20token.", siteUrl));
    }

    // 2. Fetch Google profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) {
      return NextResponse.redirect(new URL("/login?error=Failed%20to%20fetch%20Google%20profile.", siteUrl));
    }

    const email = profile.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user linked with Google
      const baseHandle = (profile.name || email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "player";
      let playerName = baseHandle;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { playerName } })) {
        playerName = `${baseHandle}${counter++}`;
      }

      const dummyHash = await hashPassword(randomBytes(24).toString("hex"));

      user = await prisma.user.create({
        data: {
          email,
          emailVerifiedAt: new Date(),
          playerName,
          displayName: profile.name || playerName,
          passwordHash: dummyHash,
        },
      });
    } else if (!user.emailVerifiedAt) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    await createSession(user.id);
    return NextResponse.redirect(new URL(`/players/${user.playerName}`, siteUrl));
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(new URL("/login?error=Internal%20Google%20OAuth%20error.", siteUrl));
  }
}
