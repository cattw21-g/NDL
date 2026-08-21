"use client";

import { ExternalLink, Play, Shield, Video } from "lucide-react";
import { useMemo, useState } from "react";

import { cx } from "@/components/ui";

export function parseVideoEmbedUrl(url: string | null | undefined): {
  type: "youtube" | "iframe" | "video" | "external";
  embedUrl?: string;
  originalUrl: string;
  providerName: string;
} | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // 1. YouTube: extract 11-char video ID from any format
  const ytMatch =
    trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?.*v=))([\w-]{11})/i,
    ) || trimmed.match(/[?&]v=([\w-]{11})/i);

  if (ytMatch) {
    const videoId = ytMatch[1];
    let startSeconds: number | null = null;
    const timeMatch = trimmed.match(
      /[?&](?:t|start)=((?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?|(\d+))/i,
    );
    if (timeMatch) {
      if (timeMatch[5]) {
        startSeconds = parseInt(timeMatch[5], 10);
      } else {
        const hours = parseInt(timeMatch[2] || "0", 10);
        const mins = parseInt(timeMatch[3] || "0", 10);
        const secs = parseInt(timeMatch[4] || "0", 10);
        startSeconds = hours * 3600 + mins * 60 + secs;
      }
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0${startSeconds ? `&start=${startSeconds}` : ""}`;

    return {
      type: "youtube",
      embedUrl,
      originalUrl: trimmed,
      providerName: "YouTube",
    };
  }

  // 2. Streamable
  const streamableMatch = trimmed.match(/streamable\.com\/([a-zA-Z0-9]+)/i);
  if (streamableMatch) {
    return {
      type: "iframe",
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1`,
      originalUrl: trimmed,
      providerName: "Streamable",
    };
  }

  // 3. Twitch Clips & VODs
  const twitchClip = trimmed.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/i);
  if (twitchClip) {
    return {
      type: "iframe",
      embedUrl: `https://clips.twitch.tv/embed?clip=${twitchClip[1]}&parent=nerfeddemonlist.net&parent=localhost&autoplay=true`,
      originalUrl: trimmed,
      providerName: "Twitch",
    };
  }

  // 4. Direct video files (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      embedUrl: trimmed,
      originalUrl: trimmed,
      providerName: "Direct Video",
    };
  }

  // 5. External site fallback
  return {
    type: "external",
    originalUrl: trimmed,
    providerName: "External Link",
  };
}

export function LevelVideoEmbed({
  verificationUrl,
  showcaseUrl,
  levelName,
}: {
  verificationUrl?: string | null;
  showcaseUrl?: string | null;
  levelName: string;
}) {
  const defaultTab = verificationUrl ? "verification" : "showcase";
  const [activeTab, setActiveTab] = useState<"verification" | "showcase">(
    defaultTab,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const activeUrl = activeTab === "verification" ? verificationUrl : showcaseUrl;
  const parsed = useMemo(() => parseVideoEmbedUrl(activeUrl), [activeUrl]);

  if (!verificationUrl && !showcaseUrl) {
    return null;
  }

  const handleTabChange = (tab: "verification" | "showcase") => {
    setActiveTab(tab);
    setIsPlaying(false);
  };

  const handlePlayClick = () => {
    if (parsed?.type === "external") {
      window.open(parsed.originalUrl, "_blank", "noopener,noreferrer");
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] dark:border-slate-700">
      {/* Video Source Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {verificationUrl ? (
            <button
              type="button"
              onClick={() => handleTabChange("verification")}
              className={cx(
                "inline-flex min-h-8 items-center gap-1.5 rounded px-3 text-xs font-black transition",
                activeTab === "verification"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Verification Video
            </button>
          ) : null}
          {showcaseUrl ? (
            <button
              type="button"
              onClick={() => handleTabChange("showcase")}
              className={cx(
                "inline-flex min-h-8 items-center gap-1.5 rounded px-3 text-xs font-black transition",
                activeTab === "showcase"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Video className="h-3.5 w-3.5" />
              Showcase Video
            </button>
          ) : null}
        </div>

        {activeUrl ? (
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center gap-1.5 rounded border border-slate-700 bg-slate-800/60 px-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <span>Open on {parsed?.providerName ?? "Provider"}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {/* Video Player Area */}
      <div className="relative aspect-video w-full bg-slate-950">
        {(parsed?.type === "youtube" || parsed?.type === "iframe") && isPlaying && parsed.embedUrl ? (
          <iframe
            src={parsed.embedUrl}
            title={`${levelName} ${activeTab} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : parsed?.type === "video" && isPlaying && parsed.embedUrl ? (
          <video
            src={parsed.embedUrl}
            controls
            autoPlay
            className="h-full w-full object-contain"
          >
            Your browser does not support HTML video playback.
          </video>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
            {/* Ambient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

            <div className="relative z-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handlePlayClick}
                className="group flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                aria-label={`Play ${activeTab} video`}
              >
                {parsed?.type === "external" ? (
                  <ExternalLink className="h-7 w-7" />
                ) : (
                  <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                )}
              </button>
              <div className="max-w-md space-y-1">
                <p className="text-base font-black text-slate-100">
                  {activeTab === "verification"
                    ? "Official Verification Proof"
                    : "Level Showcase"}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  {parsed?.type === "external"
                    ? `Click to watch on ${parsed.providerName}`
                    : `Click to watch ${levelName} directly inside NDL`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
