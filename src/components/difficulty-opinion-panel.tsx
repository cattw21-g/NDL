"use client";

import { useState } from "react";
import { Scale, ThumbsUp, ChevronDown, Check, Star, ShieldCheck } from "lucide-react";
import { SectionPanel } from "@/components/ui";

type Opinion = {
  playerName: string;
  suggestedRank: number;
  difficultyCategory: string;
  notes?: string;
  submittedAt: string;
};

type Props = {
  levelId: string;
  levelName: string;
  currentRank: number | null;
  victorCount: number;
  initialOpinions?: Opinion[];
};

export function DifficultyOpinionPanel({
  levelId,
  levelName,
  currentRank,
  victorCount,
  initialOpinions = [],
}: Props) {
  const [opinions, setOpinions] = useState<Opinion[]>(initialOpinions);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedRank, setSuggestedRank] = useState(currentRank ?? 1);
  const [difficultyCategory, setDifficultyCategory] = useState("EXTREME");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avgRank = opinions.length > 0
    ? (opinions.reduce((sum, o) => sum + o.suggestedRank, 0) / opinions.length).toFixed(1)
    : currentRank ? currentRank.toString() : "N/A";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newOpinion: Opinion = {
      playerName: "You (Victor Opinion)",
      suggestedRank: Number(suggestedRank),
      difficultyCategory,
      notes: notes.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    setOpinions([newOpinion, ...opinions]);
    setSubmitted(true);
    setNotes("");
  }

  return (
    <SectionPanel className="p-5 border-zinc-800 bg-zinc-900/60 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-amber-400" />
          <div>
            <h3 className="text-base font-black text-white">
              Victor Difficulty Opinions & Consensus
            </h3>
            <p className="text-xs text-zinc-400">
              Community placement ratings submitted by verified victors of {levelName}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-black text-amber-300 hover:bg-amber-500/20 transition"
        >
          {isOpen ? "Close Form" : "Submit Placement Opinion"}
        </button>
      </div>

      {/* Consensus Metrics Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-[11px] font-bold text-zinc-400 uppercase">Official Rank</p>
          <p className="mt-0.5 text-xl font-black text-white">
            {currentRank ? `#${currentRank}` : "Legacy"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-[11px] font-bold text-zinc-400 uppercase">Victor Consensus Rank</p>
          <p className="mt-0.5 text-xl font-black text-amber-400">
            #{avgRank}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-zinc-400 uppercase">Victor Opinions</p>
          <p className="mt-0.5 text-xl font-black text-cyan-400">
            {opinions.length} {opinions.length === 1 ? "Rating" : "Ratings"}
          </p>
        </div>
      </div>

      {/* Victor Opinion Submission Form */}
      {isOpen ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-amber-500/30 bg-zinc-950/70 p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            Submit Your Difficulty Evaluation
          </h4>

          {submitted ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Thank you! Your difficulty opinion has been recorded in the placement consensus.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Suggested List Rank (#1 to #150)
              </label>
              <input
                type="number"
                min={1}
                max={150}
                value={suggestedRank}
                onChange={(e) => setSuggestedRank(Number(e.target.value))}
                className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Estimated Difficulty Category
              </label>
              <select
                value={difficultyCategory}
                onChange={(e) => setDifficultyCategory(e.target.value)}
                className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold text-zinc-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ENTRY">Entry Extreme</option>
                <option value="ADVANCED">Advanced Demon</option>
                <option value="EXTREME">Extreme Demon</option>
                <option value="MYTHIC">Mythic Demon</option>
                <option value="ASCENT">Ascent Tier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">
              Placement Rationale (e.g. &apos;Easier than Silent Clubstep due to consistent ship&apos;)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide comparison notes against other ranked demons..."
              maxLength={120}
              className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-amber-500 px-4 text-xs font-black text-slate-950 hover:bg-amber-400 transition"
            >
              Post Opinion
            </button>
          </div>
        </form>
      ) : null}

      {/* List of Submitted Opinions */}
      {opinions.length > 0 ? (
        <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950/40">
          {opinions.map((op, i) => (
            <div key={i} className="p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white">{op.playerName}</span>
                <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                  Suggests #{op.suggestedRank}
                </span>
                {op.notes ? (
                  <p className="mt-1 text-zinc-400 italic">&ldquo;{op.notes}&rdquo;</p>
                ) : null}
              </div>
              <span className="text-[11px] text-zinc-500">
                {new Date(op.submittedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-zinc-500 text-center py-2">
          No difficulty opinions submitted yet. Verified victors can cast their rating above!
        </p>
      )}
    </SectionPanel>
  );
}
