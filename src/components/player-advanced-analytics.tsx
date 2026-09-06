"use client";

import { useState } from "react";
import { BarChart3, X, Zap, Cpu, Award, ShieldCheck, Flame, PieChart } from "lucide-react";

type Props = {
  playerName: string;
  totalPoints: number;
  globalRank: number | null;
  mainListCount: number;
  extendedListCount: number;
  legacyCount: number;
  progressCount: number;
  verifiedCount: number;
  createdCount: number;
  fpsStats: { fps: number; count: number }[];
  cbfCount: number;
  totalCompletions: number;
};

export function PlayerAdvancedAnalytics(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const cbfPercentage = props.totalCompletions > 0
    ? Math.round((props.cbfCount / props.totalCompletions) * 100)
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3.5 text-xs font-black text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300 transition"
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Advanced Stats
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl text-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white">
                  Advanced Analytics: {props.playerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Core Analytics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Global Rank</p>
                <p className="mt-1 text-xl font-black text-amber-400">
                  {props.globalRank ? `#${props.globalRank}` : "Unranked"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Total Points</p>
                <p className="mt-1 text-xl font-black text-cyan-400">
                  {props.totalPoints} pts
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Completions</p>
                <p className="mt-1 text-xl font-black text-emerald-400">
                  {props.totalCompletions}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">CBF Usage</p>
                <p className="mt-1 text-xl font-black text-purple-400">
                  {cbfPercentage}%
                </p>
              </div>
            </div>

            {/* List Tier Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                Demon Distribution Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <p className="text-2xl font-black text-amber-300">{props.mainListCount}</p>
                  <p className="text-[11px] font-bold text-amber-200/80">Main List (#1–75)</p>
                </div>
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
                  <p className="text-2xl font-black text-cyan-300">{props.extendedListCount}</p>
                  <p className="text-[11px] font-bold text-cyan-200/80">Extended (#76–150)</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-center">
                  <p className="text-2xl font-black text-zinc-200">{props.legacyCount}</p>
                  <p className="text-[11px] font-bold text-zinc-400">Legacy List</p>
                </div>
              </div>
            </div>

            {/* Hardware & Settings Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-cyan-400" />
                Frame Rate & Physics Modifiers
              </h4>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Click Between Frames (CBF) Runs:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {props.cbfCount} of {props.totalCompletions} ({cbfPercentage}%)
                  </span>
                </div>
                {props.fpsStats.length > 0 ? (
                  <div className="space-y-1.5 border-t border-zinc-800/80 pt-2">
                    <p className="text-[11px] font-bold text-zinc-400">FPS Distribution:</p>
                    <div className="flex flex-wrap gap-2">
                      {props.fpsStats.map((item) => (
                        <span
                          key={item.fps}
                          className="rounded bg-zinc-800 px-2 py-1 text-xs font-mono text-zinc-200 border border-zinc-700"
                        >
                          {item.fps} FPS: <strong className="text-white">{item.count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Verifier & Creator Stats */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
              <span className="text-zinc-400">Verifications & Nerf Creations:</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> {props.verifiedCount} Verified
                </span>
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> {props.createdCount} Created
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
