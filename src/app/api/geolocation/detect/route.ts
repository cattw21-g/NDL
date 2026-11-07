import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countries";
import { detectVisitorGeo } from "@/lib/geo-detect";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const geo = await detectVisitorGeo(request.headers);

  if (geo.countryCode && geo.countryCode in COUNTRIES) {
    const meta = COUNTRIES[geo.countryCode];
    return NextResponse.json({
      success: true,
      countryCode: geo.countryCode,
      countryName: meta.name,
      flag: meta.flag,
      continent: meta.continent,
      city: geo.city || null,
      subdivision: geo.subdivision || null,
    });
  }

  // Fallback if running on local dev or unheadered proxy
  return NextResponse.json({
    success: false,
    countryCode: null,
    message: "Country could not be automatically determined from connection headers.",
  });
}
