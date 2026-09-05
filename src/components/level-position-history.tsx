import { LevelPositionSnapshot } from "@/generated/prisma/client";

type Props = {
  currentRank: number | null;
  snapshots: LevelPositionSnapshot[];
  placementDate?: Date | null;
  levelName?: string;
};

export function LevelPositionHistory({
  currentRank,
  snapshots,
  placementDate,
  levelName,
}: Props) {
  // Sort chronologically (oldest to newest)
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  // Determine peak rank achieved
  const allRanks = sorted
    .map((s) => s.rank)
    .filter((r): r is number => typeof r === "number" && r > 0);
  if (currentRank) allRanks.push(currentRank);
  const peakRank = allRanks.length > 0 ? Math.min(...allRanks) : currentRank;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Position History {levelName ? <span className="text-xs font-normal text-zinc-400">({levelName})</span> : null}
          </h3>
          <p className="text-xs text-zinc-400">Track ranking movements and milestones over time</p>
        </div>

        <div className="flex items-center gap-2">
          {peakRank && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs">
              <span className="text-zinc-400">Peak Rank: </span>
              <span className="font-bold text-amber-400">#{peakRank}</span>
            </div>
          )}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs">
            <span className="text-zinc-400">Current: </span>
            <span className="font-bold text-white">#{currentRank ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Table */}
      <div className="mt-4">
        {sorted.length === 0 ? (
          <div className="py-4 text-center text-xs text-zinc-500">
            {placementDate ? (
              <p>
                Placed on {new Date(placementDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at #{currentRank ?? "—"}.
              </p>
            ) : (
              <p>Rank history tracking active. Movements will be logged automatically.</p>
            )}
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {sorted.map((event, eventIdx) => {
                const isLast = eventIdx === sorted.length - 1;
                const formattedDate = new Date(event.recordedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const isPlaced = event.action === "PLACED";
                const isPromoted = event.action === "PROMOTED";
                const isDemoted = event.action === "DEMOTED";
                const isLegacy = event.action === "LEGACY";

                return (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-800"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex items-center space-x-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-zinc-950 ${
                            isPlaced
                              ? "bg-emerald-500 text-zinc-950"
                              : isPromoted
                                ? "bg-amber-400 text-zinc-950"
                                : isDemoted
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                  : isLegacy
                                    ? "bg-zinc-700 text-zinc-300"
                                    : "bg-blue-500 text-white"
                          }`}
                        >
                          {isPlaced ? "★" : isPromoted ? "↑" : isDemoted ? "↓" : "•"}
                        </div>

                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-xs font-medium text-zinc-200">
                              <span className="font-bold text-white">
                                {isPlaced
                                  ? `Placed at #${event.rank}`
                                  : isPromoted
                                    ? `Promoted to #${event.rank}`
                                    : isDemoted
                                      ? `Moved down to #${event.rank}`
                                      : isLegacy
                                        ? "Demoted to Legacy"
                                        : `Position updated to #${event.rank}`}
                              </span>
                              {event.notes && (
                                <span className="text-zinc-500 ml-2 font-normal">
                                  ({event.notes})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-xs text-zinc-500">
                            <time dateTime={event.recordedAt.toString()}>{formattedDate}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
