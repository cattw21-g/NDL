type Props = {
  gdLevelId: string;
  songName?: string | null;
  songArtist?: string | null;
  songId?: string | null;
  songLink?: string | null;
  levelLength?: string | null;
  objectCount?: number | null;
  gameVersion?: string | null;
  inGameDifficulty?: string | null;
  copyPassword?: string | null;
  minimumProgress?: number | null;
};

export function LevelGdMetadata({
  gdLevelId,
  songName,
  songArtist,
  songId,
  songLink,
  levelLength,
  objectCount,
  gameVersion,
  inGameDifficulty,
  copyPassword,
  minimumProgress = 50,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
      <div className="border-b border-zinc-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🎮</span> Geometry Dash Metadata
        </h3>
        <p className="text-xs text-zinc-400">In-game attributes, song details, and level specs</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* GD ID */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Level ID</p>
          <p className="mt-1 font-mono text-sm font-bold text-white">{gdLevelId}</p>
        </div>

        {/* In-Game Difficulty */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">In-Game Rating</p>
          <p className="mt-1 text-sm font-bold text-rose-400">
            {inGameDifficulty || "Extreme Demon"}
          </p>
        </div>

        {/* Game Version */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Game Version</p>
          <p className="mt-1 text-sm font-bold text-zinc-200">{gameVersion || "2.2"}</p>
        </div>

        {/* Level Length */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Length</p>
          <p className="mt-1 text-sm font-bold text-zinc-200">{levelLength || "XL (> 2m)"}</p>
        </div>

        {/* Object Count */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Objects</p>
          <p className="mt-1 text-sm font-bold text-zinc-200">
            {objectCount ? objectCount.toLocaleString() : "Optimized"}
          </p>
        </div>

        {/* Copy Password */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Copy / Password</p>
          <p className="mt-1 text-sm font-bold text-amber-400">
            {copyPassword || "Free Copy"}
          </p>
        </div>
      </div>

      {/* Song Info Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm">
            🎵
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-400">Soundtrack</p>
            <p className="text-sm font-semibold text-white truncate">
              {songName ? `${songName} by ${songArtist || "Unknown"}` : "Official GD Soundtrack"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {songId && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
              ID: {songId}
            </span>
          )}
          {songLink && (
            <a
              href={songLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              Listen ↗
            </a>
          )}
        </div>
      </div>

      {/* Qualifying Requirement Bar */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
        <span className="text-zinc-400">
          Qualifying Progress Requirement:
        </span>
        <span className="font-bold text-amber-400">
          {minimumProgress ?? 50}% (Qualifies for partial points)
        </span>
      </div>
    </div>
  );
}
