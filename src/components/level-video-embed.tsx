"use client";

import { ExternalLink, Play, Shield, Video } from "lucide-react";
import { useMemo, useState } from "react";

import { cx } from "@/components/ui";

function parseVideoEmbedUrl(url: string | null | undefined): {
  type: "youtube" | "video" | "link";
  embedUrl?: string;
  originalUrl: string;
} | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();

  // YouTube standard watch URL: youtube.com/watch?v=xyz
  const ytWatchMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  );
  if (ytWatchMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?autoplay=1&rel=0`,
      originalUrl: trimmed,
    };
  }

  // YouTube short URL: youtu.be/xyz
  const ytShortMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  );
  if (ytShortMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytShortMatch[1]}?autoplay=1&rel=0`,
      originalUrl: trimmed,
    };
  }

  // YouTube shorts URL: youtube.com/shorts/xyz
  const ytShortsMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  );
  if (ytShortsMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytShortsMatch[1]}?autoplay=1&rel=0`,
      originalUrl: trimmed,
    };
  }

  // Direct MP4 / WebM video files
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return {
    type: "link",
    originalUrl: trimmed,
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
  // Default to verification if available, otherwise showcase
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

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] dark:border-slate-700">
      {/* Video Source Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {verificationUrl ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab("verification");
                setIsPlaying(false);
              }}
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
              onClick={() => {
                setActiveTab("showcase");
                setIsPlaying(false);
              }}
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
            className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Open in new tab
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {/* Video Player Area */}
      <div className="relative aspect-video w-full bg-slate-950">
        {parsed?.type === "youtube" && isPlaying ? (
          <iframe
            src={parsed.embedUrl}
            title={`${levelName} ${activeTab} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : parsed?.type === "video" && isPlaying ? (
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
                onClick={() => setIsPlaying(true)}
                className="group flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                aria-label={`Play ${activeTab} video`}
              >
                <Play className="h-7 w-7 translate-x-0.5 fill-current" />
              </button>
              <div className="max-w-md space-y-1">
                <p className="text-base font-black text-slate-100">
                  {activeTab === "verification"
                    ? "Official Verification Proof"
                    : "Level Showcase"}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  Click to watch the full completion of {levelName} directly inside NDL
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
