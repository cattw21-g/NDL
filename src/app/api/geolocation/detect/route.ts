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

  const rawCity =
    request.headers.get("cf-ipcity") ||
    request.headers.get("x-vercel-ip-city") ||
    request.headers.get("x-city") ||
    (request as unknown as { cf?: { city?: string } }).cf?.city ||
    null;

  let city: string | null = null;
  if (rawCity && rawCity !== "XX") {
    try {
      city = decodeURIComponent(rawCity).trim().slice(0, 50);
    } catch {
      city = rawCity.trim().slice(0, 50);
    }
  }

  const rawRegion =
    request.headers.get("cf-region") ||
    request.headers.get("x-vercel-ip-country-region") ||
    (request as unknown as { cf?: { region?: string } }).cf?.region ||
    null;

  let subdivision: string | null = null;
  if (rawRegion && rawRegion !== "XX") {
    try {
      subdivision = decodeURIComponent(rawRegion).trim().slice(0, 50);
    } catch {
      subdivision = rawRegion.trim().slice(0, 50);
    }
  }

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
        city: city || null,
        subdivision: subdivision || null,
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
