import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirectUrl = new URL("/verify-email", request.url);

  if (!token) {
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const result = await verifyEmailToken(prisma, token);

  if (result.status === "verified") {
    redirectUrl.searchParams.set("email", result.email);
    redirectUrl.searchParams.set("verified", "1");
  } else {
    redirectUrl.searchParams.set("error", result.status);
  }

  return NextResponse.redirect(redirectUrl);
}
