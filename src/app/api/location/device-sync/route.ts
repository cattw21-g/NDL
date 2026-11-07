import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lat?: unknown; lon?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
  const lon = typeof body.lon === "number" ? body.lon : Number(body.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  let exactCity: string | null = null;
  let exactStreet: string | null = null;
  let subdivision: string | null = null;
  let countryCode: string | null = null;

  // 1. High-precision reverse geocoding via OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NerfedDemonlistApp/1.6 (support@nerfeddemonlist.net)",
        "Accept-Language": "en,pl;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as {
        address?: {
          road?: string;
          street?: string;
          pedestrian?: string;
          footway?: string;
          path?: string;
          neighbourhood?: string;
          house_number?: string;
          suburb?: string;
          hamlet?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          state?: string;
          postcode?: string;
          country_code?: string;
          [key: string]: string | undefined;
        };
      };

      const addr = data.address;
      if (addr) {
        // Street name + optional house number if present
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || addr.neighbourhood || null;
        if (road) {
          exactStreet = addr.house_number ? `${road} ${addr.house_number}`.trim().slice(0, 100) : road.trim().slice(0, 100);
        }

        // Exact town, village, or city
        const rawCity = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.suburb || null;
        if (rawCity) {
          exactCity = addr.postcode ? `${rawCity.trim()} (${addr.postcode.trim()})`.slice(0, 60) : rawCity.trim().slice(0, 50);
        }

        if (addr.state) {
          subdivision = addr.state.trim().slice(0, 50);
        }

        if (addr.country_code) {
          const upper = addr.country_code.toUpperCase();
          if (upper in COUNTRIES) {
            countryCode = upper;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err);
  }

  // 2. Secondary fallback via BigDataCloud client reverse geocode API
  if (!exactCity || !exactStreet) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const res = await fetch(bdcUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          locality?: string;
          city?: string;
          principalSubdivision?: string;
          countryCode?: string;
          postcode?: string;
        };

        if (!exactCity) {
          const c = data.city || data.locality || null;
          if (c) {
            exactCity = data.postcode ? `${c.trim()} (${data.postcode.trim()})`.slice(0, 60) : c.trim().slice(0, 50);
          }
        }

        if (!subdivision && data.principalSubdivision) {
          subdivision = data.principalSubdivision.trim().slice(0, 50);
        }

        if (!countryCode && data.countryCode && data.countryCode in COUNTRIES) {
          countryCode = data.countryCode;
        }
      }
    } catch {
      // Fallback ignored
    }
  }

  if (exactCity || exactStreet) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(exactCity ? { city: exactCity } : {}),
        ...(exactStreet ? { street: exactStreet } : {}),
        ...(subdivision ? { subdivision } : {}),
        ...(countryCode ? { countryCode } : {}),
        latitude: lat,
        longitude: lon,
        locationAccuracy: "GPS_HIGH_ACCURACY",
      },
    });
  }

  return NextResponse.json({
    success: true,
    city: exactCity,
    street: exactStreet,
    subdivision,
    countryCode,
    accuracy: "GPS_HIGH_ACCURACY",
  });
}
