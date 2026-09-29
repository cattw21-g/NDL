import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", "") || "https");
  const siteUrl = `${proto}://${host}`;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId) {
    // If not yet configured in environment variables, redirect with explanatory notice
    return NextResponse.redirect(
      new URL("/login?error=Google%20OAuth%20is%20pending%20GOOGLE_CLIENT_ID%20setup%20in%20dashboard.", siteUrl),
    );
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
