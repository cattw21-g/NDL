import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Check standard serverless / CDN edge geolocation headers
  const headerCountry =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    null;

  if (headerCountry && headerCountry !== "XX" && headerCountry !== "T1") {
    const code = headerCountry.toUpperCase();
    const meta = COUNTRIES[code];
    if (meta) {
      return NextResponse.json({
        success: true,
        countryCode: code,
        countryName: meta.name,
        flag: meta.flag,
        continent: meta.continent,
      });
    }
  }

  // Fallback if running on local dev or unheadered proxy
  return NextResponse.json({
    success: false,
    countryCode: null,
    message: "Country could not be automatically determined from connection headers.",
  });
}
