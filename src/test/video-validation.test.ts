import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "@/lib/video-validation";

describe("normalizeVideoUrl", () => {
  it("strips tracking parameters from standard YouTube watch links", () => {
    const raw = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=123456&feature=share&utm_source=twitter";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.provider).toBe("youtube");
  });

  it("preserves timestamp in YouTube links while stripping tracking params", () => {
    const raw = "https://youtu.be/dQw4w9WgXcQ?si=abcdef&t=42s";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s");
  });

  it("converts YouTube Shorts URLs to canonical watch URLs", () => {
    const raw = "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("handles Twitch clips and videos", () => {
    const raw = "https://www.twitch.tv/videos/123456789";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.provider).toBe("twitch");
  });

  it("handles Medal.tv links", () => {
    const raw = "https://medal.tv/games/geometry-dash/clips/abc123xyz";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.provider).toBe("medal");
  });

  it("allows local completion video uploads", () => {
    const raw = "/uploads/completion-videos/my-run.mp4";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(true);
    expect(res.provider).toBe("local");
  });

  it("rejects invalid youtube URLs without video IDs", () => {
    const raw = "https://www.youtube.com/watch?v=";
    const res = normalizeVideoUrl(raw);
    expect(res.isValid).toBe(false);
  });
});
