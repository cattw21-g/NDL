"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, MapPin, Trophy, Users, ChevronRight, ExternalLink } from "lucide-react";
import { COUNTRIES, type Continent, type CountryMeta } from "@/lib/countries";

export type CountryPointData = {
  code: string;
  name: string;
  flag: string;
  continent: Continent;
  rank: number;
  totalPoints: number;
  playersCount: number;
  topPlayer?: {
    playerName: string;
    displayName: string;
    points: number;
  };
};

type Props = {
  countryData: CountryPointData[];
};

export function InteractiveWorldMap({ countryData }: Props) {
  const [selectedContinent, setSelectedContinent] = useState<Continent | "All">("All");
  const [hoveredCountry, setHoveredCountry] = useState<CountryPointData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const dataMap = new Map<string, CountryPointData>();
  for (const c of countryData) {
    dataMap.set(c.code.toUpperCase(), c);
  }

  const filteredCountries = countryData.filter((c) => {
    if (selectedContinent !== "All" && c.continent !== selectedContinent) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    }
    return true;
  });

  const topTen = [...countryData].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  const maxPoints = topTen[0]?.totalPoints || 1;

  // Heat map color helper
  function getHeatColor(points: number): string {
    if (points === 0) return "bg-zinc-800/40 border-zinc-700/50 text-zinc-500";
    const ratio = points / maxPoints;
    if (ratio > 0.6) return "bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30";
    if (ratio > 0.3) return "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/30";
    return "bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20";
  }

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {(["All", "Europe", "North America", "South America", "Asia", "Oceania", "Africa"] as const).map((cont) => (
            <button
              key={cont}
              type="button"
              onClick={() => setSelectedContinent(cont)}
              className={`rounded-md px-3 py-1.5 transition ${
                selectedContinent === cont
                  ? "bg-cyan-600 text-white font-black"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {cont}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Main Map & Standings Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Heatmap Geo Grid Matrix */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white">Global Activity Heat Map</h2>
            </div>
            <span className="text-xs text-zinc-400">
              {filteredCountries.length} active territories
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filteredCountries.map((country) => {
              const heatClass = getHeatColor(country.totalPoints);
              return (
                <Link
                  key={country.code}
                  href={`/countries/${country.code.toLowerCase()}`}
                  onMouseEnter={() => setHoveredCountry(country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 hover:scale-[1.02] hover:shadow-lg ${heatClass}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] font-black">
                      #{country.rank}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-extrabold text-white group-hover:text-cyan-300 transition text-sm">
                      {country.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-black text-cyan-400">
                      {country.totalPoints.toLocaleString()} pts
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-zinc-400">
                    <span>{country.playersCount} players</span>
                    <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Interactive Inspection Tooltip / Summary Panel */}
          {hoveredCountry ? (
            <div className="rounded-xl border border-cyan-500/40 bg-zinc-950 p-4 shadow-xl text-xs space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="flex items-center gap-2 text-sm font-black text-white">
                  <span>{hoveredCountry.flag}</span>
                  <span>{hoveredCountry.name}</span>
                </span>
                <span className="font-bold text-amber-400">Rank #{hoveredCountry.rank}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block">Total Points</span>
                  <strong className="text-cyan-400 font-mono text-sm">{hoveredCountry.totalPoints}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Victors</span>
                  <strong className="text-white text-sm">{hoveredCountry.playersCount}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Top Player</span>
                  <strong className="text-white text-sm truncate block">
                    {hoveredCountry.topPlayer?.displayName || "None"}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Top 10 International Rankings Sidebar */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-black text-white">International Top 10</h3>
          </div>

          <div className="space-y-2">
            {topTen.map((c) => (
              <Link
                key={c.code}
                href={`/countries/${c.code.toLowerCase()}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 hover:bg-zinc-800/60 hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-black text-zinc-500">
                    #{c.rank}
                  </span>
                  <span className="text-lg">{c.flag}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white group-hover:text-cyan-400 truncate">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {c.playersCount} victors
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs font-black text-cyan-400">
                  {c.totalPoints} pts
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
