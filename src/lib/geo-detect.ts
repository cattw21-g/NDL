import { COUNTRIES } from "@/lib/countries";

export type DetectedGeo = {
  city: string | null;
  countryCode: string | null;
  subdivision: string | null;
  postalCode?: string | null;
  isp?: string | null;
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
      const cf = ctx.cf as {
        city?: string;
        country?: string;
        region?: string;
        postalCode?: string;
        asOrganization?: string;
      };
      let cfCity = cf.city && cf.city !== "XX" ? cf.city.trim().slice(0, 50) : null;
      if (cfCity && cf.postalCode && cf.postalCode !== "XX") {
        cfCity = `${cfCity} (${cf.postalCode.trim().slice(0, 15)})`;
      }
      const cfCountry = cf.country && cf.country !== "XX" && cf.country !== "T1" ? cf.country.toUpperCase() : null;
      const cfRegion = cf.region && cf.region !== "XX" ? cf.region.trim().slice(0, 50) : null;
      if (cfCity || cfCountry) {
        return {
          city: cfCity,
          countryCode: cfCountry && cfCountry in COUNTRIES ? cfCountry : null,
          subdivision: cfRegion,
          postalCode: cf.postalCode || null,
          isp: cf.asOrganization || null,
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
    const rawIp =
      headers.get("cf-connecting-ip") ||
      headers.get("x-real-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;

    // High-resolution IP lookup via ip-api with postal code & municipality
    if (rawIp && !isPrivateIp(rawIp)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(rawIp)}?fields=status,country,countryCode,regionName,city,zip,isp`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as {
            status?: string;
            city?: string;
            countryCode?: string;
            regionName?: string;
            zip?: string;
            isp?: string;
          };
          if (data.status === "success" && data.city) {
            let cityName = data.city.trim().slice(0, 50);
            if (data.zip && data.zip.trim()) {
              cityName = `${cityName} (${data.zip.trim().slice(0, 15)})`;
            }
            const countryCode =
              data.countryCode && data.countryCode in COUNTRIES ? data.countryCode : null;
            const subdivision = data.regionName ? data.regionName.trim().slice(0, 50) : null;
            return {
              city: cityName,
              countryCode,
              subdivision,
              postalCode: data.zip || null,
              isp: data.isp || null,
            };
          }
        }
      } catch {
        // Fallback network error ignored
      }

      // Secondary fallback: freeipapi
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(rawIp)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as {
            cityName?: string;
            countryCode?: string;
            regionName?: string;
            zipCode?: string;
            asnOrganization?: string;
          };
          let cityName = data.cityName && data.cityName !== "-" ? data.cityName.trim().slice(0, 50) : null;
          if (cityName && data.zipCode && data.zipCode !== "-") {
            cityName = `${cityName} (${data.zipCode.trim().slice(0, 15)})`;
          }
          const countryCode =
            data.countryCode && data.countryCode in COUNTRIES ? data.countryCode : null;
          const subdivision =
            data.regionName && data.regionName !== "-" ? data.regionName.trim().slice(0, 50) : null;
          if (cityName || countryCode) {
            return {
              city: cityName,
              countryCode,
              subdivision,
              postalCode: data.zipCode || null,
              isp: data.asnOrganization || null,
            };
          }
        }
      } catch {
        // Fallback network error ignored
      }
    }

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

    return { city, countryCode, subdivision };
  }

  return { city: null, countryCode: null, subdivision: null };
}
