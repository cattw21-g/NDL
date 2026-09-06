/**
 * Video URL validation, parameter stripping, and canonical normalization
 * Mirrors Pointercrate's automatic video link validation rules.
 */

const TRACKING_PARAMS = new Set([
  "si",
  "feature",
  "pp",
  "fbclid",
  "gclid",
  "ref",
  "source",
  "sub_confirmation",
  "ab_channel",
  "attr_tag",
  "themeRefresh",
]);

export interface VideoNormalizationResult {
  isValid: boolean;
  normalizedUrl: string;
  provider: "youtube" | "twitch" | "medal" | "bilibili" | "streamable" | "tiktok" | "local" | "other" | "invalid";
  error?: string;
}

export function normalizeVideoUrl(rawInput: string): VideoNormalizationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isValid: false,
      normalizedUrl: "",
      provider: "invalid",
      error: "Video URL is required.",
    };
  }

  const trimmed = rawInput.trim();

  // Allow internal/local upload paths
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/completion-videos/")) {
    return {
      isValid: true,
      normalizedUrl: trimmed,
      provider: "local",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      provider: "invalid",
      error: "Invalid URL format.",
    };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const protocol = "https:";

  // Clean tracking search parameters
  const paramsToKeep = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (!TRACKING_PARAMS.has(lowerKey) && !lowerKey.startsWith("utm_")) {
      paramsToKeep.set(key, value);
    }
  }

  // 1. YouTube
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    // Check if it's a Shorts URL: /shorts/:id
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      const videoId = shortsMatch[1];
      const time = paramsToKeep.get("t") || paramsToKeep.get("start");
      const finalUrl = time
        ? `https://www.youtube.com/watch?v=${videoId}&t=${time}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      return {
        isValid: true,
        normalizedUrl: finalUrl,
        provider: "youtube",
      };
    }

    // Embed URL: /embed/:id
    const embedMatch = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      const videoId = embedMatch[1];
      const time = paramsToKeep.get("t") || paramsToKeep.get("start");
      const finalUrl = time
        ? `https://www.youtube.com/watch?v=${videoId}&t=${time}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      return {
        isValid: true,
        normalizedUrl: finalUrl,
        provider: "youtube",
      };
    }

    // Standard Watch URL: /watch?v=:id
    const videoId = paramsToKeep.get("v");
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      const time = paramsToKeep.get("t") || paramsToKeep.get("start");
      const finalUrl = time
        ? `https://www.youtube.com/watch?v=${videoId}&t=${time}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      return {
        isValid: true,
        normalizedUrl: finalUrl,
        provider: "youtube",
      };
    }

    // Live stream URL: /live/:id
    const liveMatch = parsed.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch) {
      const videoId = liveMatch[1];
      return {
        isValid: true,
        normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        provider: "youtube",
      };
    }

    return {
      isValid: false,
      normalizedUrl: trimmed,
      provider: "youtube",
      error: "Could not extract a valid 11-character YouTube video ID.",
    };
  }

  // 2. youtu.be Shortlinks
  if (host === "youtu.be") {
    const videoId = parsed.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      const time = paramsToKeep.get("t") || paramsToKeep.get("start");
      const finalUrl = time
        ? `https://www.youtube.com/watch?v=${videoId}&t=${time}`
        : `https://www.youtube.com/watch?v=${videoId}`;
      return {
        isValid: true,
        normalizedUrl: finalUrl,
        provider: "youtube",
      };
    }

    return {
      isValid: false,
      normalizedUrl: trimmed,
      provider: "youtube",
      error: "Could not extract a valid 11-character YouTube video ID from youtu.be link.",
    };
  }

  // 3. Twitch (videos & clips)
  if (host === "twitch.tv" || host === "clips.twitch.tv") {
    parsed.protocol = protocol;
    parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      provider: "twitch",
    };
  }

  // 4. Medal.tv
  if (host === "medal.tv") {
    parsed.protocol = protocol;
    parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      provider: "medal",
    };
  }

  // 5. Bilibili
  if (host === "bilibili.com") {
    parsed.protocol = protocol;
    parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      provider: "bilibili",
    };
  }

  // 6. Streamable
  if (host === "streamable.com") {
    parsed.protocol = protocol;
    parsed.search = "";
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      provider: "streamable",
    };
  }

  // 7. TikTok
  if (host === "tiktok.com") {
    parsed.protocol = protocol;
    parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      provider: "tiktok",
    };
  }

  // 8. Google Drive or generic video hosts / direct files
  parsed.protocol = protocol;
  parsed.search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
    provider: "other",
  };
}
