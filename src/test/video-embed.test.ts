import { describe, expect, it } from "vitest";

import { parseVideoEmbedUrl } from "@/components/level-video-embed";

describe("parseVideoEmbedUrl", () => {
  it("parses standard YouTube watch URLs", () => {
    const result = parseVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result?.type).toBe("youtube");
    expect(result?.embedUrl).toContain("dQw4w9WgXcQ");
    expect(result?.embedUrl).toContain("autoplay=1");
  });

  it("parses YouTube youtu.be short URLs", () => {
    const result = parseVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=abcdef123");
    expect(result?.type).toBe("youtube");
    expect(result?.embedUrl).toContain("dQw4w9WgXcQ");
  });

  it("parses YouTube with timestamp parameters", () => {
    const result = parseVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s");
    expect(result?.type).toBe("youtube");
    expect(result?.embedUrl).toContain("&start=45");
  });

  it("parses YouTube shorts and embeds", () => {
    const shorts = parseVideoEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ");
    expect(shorts?.type).toBe("youtube");
    expect(shorts?.embedUrl).toContain("dQw4w9WgXcQ");

    const embed = parseVideoEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(embed?.type).toBe("youtube");
    expect(embed?.embedUrl).toContain("dQw4w9WgXcQ");
  });

  it("parses Streamable links", () => {
    const result = parseVideoEmbedUrl("https://streamable.com/abc123");
    expect(result?.type).toBe("iframe");
    expect(result?.embedUrl).toBe("https://streamable.com/e/abc123?autoplay=1");
  });

  it("parses Twitch clip links", () => {
    const result = parseVideoEmbedUrl("https://clips.twitch.tv/GloriousTrophy");
    expect(result?.type).toBe("iframe");
    expect(result?.embedUrl).toContain("GloriousTrophy");
  });

  it("parses direct MP4 video URLs", () => {
    const result = parseVideoEmbedUrl("https://cdn.example.com/runs/completion.mp4");
    expect(result?.type).toBe("video");
    expect(result?.embedUrl).toBe("https://cdn.example.com/runs/completion.mp4");
  });

  it("parses Medal.tv clip URLs", () => {
    const result = parseVideoEmbedUrl("https://medal.tv/games/geometry-dash/clips/iBv42abc123/d1337xyz");
    expect(result?.type).toBe("iframe");
    expect(result?.embedUrl).toBe("https://medal.tv/clip/iBv42abc123?autoplay=1&muted=0&loop=1");
    expect(result?.providerName).toBe("Medal.tv");
  });

  it("parses TikTok video URLs", () => {
    const result = parseVideoEmbedUrl("https://www.tiktok.com/@runner/video/7123456789012345678");
    expect(result?.type).toBe("iframe");
    expect(result?.embedUrl).toBe("https://www.tiktok.com/embed/v2/7123456789012345678");
    expect(result?.providerName).toBe("TikTok");
  });

  it("gracefully falls back to external for non-embeddable links", () => {
    const result = parseVideoEmbedUrl("https://example.com/demo-run");
    expect(result?.type).toBe("external");
    expect(result?.originalUrl).toBe("https://example.com/demo-run");
  });

  it("returns null for null or empty string", () => {
    expect(parseVideoEmbedUrl(null)).toBeNull();
    expect(parseVideoEmbedUrl("")).toBeNull();
  });
});
