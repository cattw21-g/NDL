import { COUNTRIES } from "@/lib/countries";

export type DetectedGeo = {
  city: string | null;
  countryCode: string | null;
  subdivision: string | null;
};

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const trimmed = ip.trim();
  return (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "localhost" ||
    trimmed.startsWith("10.") ||
    trimmed.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed) ||
    trimmed.startsWith("fc00:") ||
    trimmed.startsWith("fe80:")
  );
}

export async function detectVisitorGeo(headerGetter?: {
  get: (name: string) => string | null;
}): Promise<DetectedGeo> {
  // 1. Try Cloudflare Worker context if running on Cloudflare edge
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.cf) {
      const cf = ctx.cf as { city?: string; country?: string; region?: string };
      const cfCity = cf.city && cf.city !== "XX" ? cf.city.trim().slice(0, 50) : null;
      const cfCountry = cf.country && cf.country !== "XX" && cf.country !== "T1" ? cf.country.toUpperCase() : null;
      const cfRegion = cf.region && cf.region !== "XX" ? cf.region.trim().slice(0, 50) : null;
      if (cfCity || cfCountry) {
        return {
          city: cfCity,
          countryCode: cfCountry && cfCountry in COUNTRIES ? cfCountry : null,
          subdivision: cfRegion,
        };
      }
    }
  } catch {
    // Context unavailable (SSG, local dev, tests)
  }

  // 2. Try headers (either passed in or from next/headers)
  let headers = headerGetter;
  if (!headers) {
    try {
      const { headers: nextHeaders } = await import("next/headers");
      headers = await nextHeaders();
    } catch {
      // Headers unavailable
    }
  }

  if (headers) {
    const rawCity =
      headers.get("cf-ipcity") ||
      headers.get("x-vercel-ip-city") ||
      headers.get("x-city") ||
      null;

    let city: string | null = null;
    if (rawCity && rawCity !== "XX") {
      try {
        city = decodeURIComponent(rawCity).trim().slice(0, 50);
      } catch {
        city = rawCity.trim().slice(0, 50);
      }
    }

    const rawCountry =
      headers.get("x-vercel-ip-country") ||
      headers.get("cf-ipcountry") ||
      headers.get("x-country-code") ||
      null;
    const countryCode =
      rawCountry && rawCountry !== "XX" && rawCountry !== "T1" && rawCountry.toUpperCase() in COUNTRIES
        ? rawCountry.toUpperCase()
        : null;

    const rawRegion =
      headers.get("cf-region") ||
      headers.get("x-vercel-ip-country-region") ||
      null;
    let subdivision: string | null = null;
    if (rawRegion && rawRegion !== "XX") {
      try {
        subdivision = decodeURIComponent(rawRegion).trim().slice(0, 50);
      } catch {
        subdivision = rawRegion.trim().slice(0, 50);
      }
    }

    if (city) {
      return { city, countryCode, subdivision };
    }

    // 3. Fallback: Lookup public IP via freeipapi if city wasn't in headers
    const rawIp =
      headers.get("cf-connecting-ip") ||
      headers.get("x-real-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;

    if (rawIp && !isPrivateIp(rawIp)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(rawIp)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as { cityName?: string; countryCode?: string; regionName?: string };
          const resolvedCity = data.cityName && data.cityName !== "-" ? data.cityName.trim().slice(0, 50) : null;
          const resolvedCountry = data.countryCode && data.countryCode in COUNTRIES ? data.countryCode : countryCode;
          const resolvedRegion = data.regionName && data.regionName !== "-" ? data.regionName.trim().slice(0, 50) : subdivision;
          return {
            city: resolvedCity,
            countryCode: resolvedCountry,
            subdivision: resolvedRegion,
          };
        }
      } catch {
        // Fallback network error ignored
      }
    }

    return { city, countryCode, subdivision };
  }

  return { city: null, countryCode: null, subdivision: null };
}
