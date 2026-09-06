"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, RotateCcw, Globe, Trophy, Users, ChevronRight, ExternalLink } from "lucide-react";
import { COUNTRIES, type Continent } from "@/lib/countries";

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
  onSelectCountry?: (code: string) => void;
  selectedCountryCode?: string | null;
};

export function InteractiveWorldMap({ countryData, onSelectCountry, selectedCountryCode }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<CountryPointData | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [hoveredFlag, setHoveredFlag] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<"nations" | "individual">("nations");

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const dataMap = useMemo(() => {
    const map = new Map<string, CountryPointData>();
    for (const c of countryData) {
      map.set(c.code.toLowerCase(), c);
      map.set(c.code.toUpperCase(), c);
    }
    return map;
  }, [countryData]);

  const maxPoints = useMemo(() => {
    return Math.max(...countryData.map((c) => c.totalPoints), 1);
  }, [countryData]);

  // 1. Fetch and inject SVG
  useEffect(() => {
    let active = true;

    fetch("/world.svg")
      .then((res) => res.text())
      .then((svgText) => {
        if (!active || !containerRef.current) return;

        // Clean out any old content
        containerRef.current.innerHTML = svgText;
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.setAttribute("style", "width: 100%; height: 100%; display: block;");
          svgEl.classList.add("ndl-world-svg");
        }

        setSvgLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load /world.svg", err);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Color countries whenever SVG is loaded or countryData changes
  useEffect(() => {
    if (!svgLoaded || !containerRef.current) return;

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    // Apply styles to all groups and paths
    const countryGroups = svg.querySelectorAll("g[id]");
    countryGroups.forEach((group) => {
      const id = group.id.toLowerCase();
      // Only process 2-letter country IDs
      if (id.length !== 2) return;

      const code = id.toUpperCase();
      const country = dataMap.get(code);

      if (country && country.playersCount > 0) {
        // BLUE SHADES for registered countries based on score
        const ratio = country.totalPoints / maxPoints;
        let fillColor = "#38bdf8"; // Light sky blue
        let strokeColor = "#0284c7";

        if (ratio > 0.5) {
          fillColor = "#0284c7"; // Deep rich blue
          strokeColor = "#0369a1";
        } else if (ratio > 0.15) {
          fillColor = "#0ea5e9"; // Vibrant sky blue
          strokeColor = "#0284c7";
        }

        group.setAttribute("data-registered", "true");
        group.setAttribute("data-country-code", code);
        group.classList.add("ndl-country-active");

        const paths = group.querySelectorAll("path, polygon, rect");
        paths.forEach((p) => {
          (p as SVGElement).style.fill = fillColor;
          (p as SVGElement).style.stroke = strokeColor;
          (p as SVGElement).style.strokeWidth = "1px";
          (p as SVGElement).style.cursor = "pointer";
          (p as SVGElement).style.transition = "fill 0.15s ease, filter 0.15s ease";
        });
      } else {
        // Unregistered countries: clean dark slate
        group.setAttribute("data-registered", "false");
        group.setAttribute("data-country-code", code);

        const paths = group.querySelectorAll("path, polygon, rect");
        paths.forEach((p) => {
          (p as SVGElement).style.fill = "#27272a"; // Zinc-800
          (p as SVGElement).style.stroke = "#18181b";
          (p as SVGElement).style.strokeWidth = "0.75px";
          (p as SVGElement).style.cursor = "pointer";
          (p as SVGElement).style.transition = "fill 0.15s ease, filter 0.15s ease";
        });
      }
    });
  }, [svgLoaded, dataMap, maxPoints]);

  // 3. Highlight selected country if any
  useEffect(() => {
    if (!svgLoaded || !containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll(".ndl-selected-country").forEach((el) => {
      el.classList.remove("ndl-selected-country");
    });

    if (selectedCountryCode) {
      const el = svg.querySelector(`#${selectedCountryCode.toLowerCase()}`);
      if (el) {
        el.classList.add("ndl-selected-country");
        el.querySelectorAll("path").forEach((p) => {
          (p as SVGElement).style.filter = "drop-shadow(0 0 8px #38bdf8)";
        });
      }
    }
  }, [svgLoaded, selectedCountryCode]);

  // 4. Mouse and Drag Handlers
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return; // only left click
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  }

  function handleMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
      return;
    }

    // Hover detection
    const target = e.target as SVGElement;
    if (!target) return;

    // Find country group
    const group = target.closest("g[id]") as SVGGElement | null;
    if (group && group.id && group.id.length === 2) {
      const code = group.id.toUpperCase();
      const meta = COUNTRIES[code];
      const data = dataMap.get(code);

      if (data) {
        setHoveredCountry(data);
        setHoveredName(data.name);
        setHoveredFlag(data.flag);
      } else if (meta) {
        setHoveredCountry(null);
        setHoveredName(meta.name);
        setHoveredFlag(meta.flag);
      } else {
        setHoveredCountry(null);
        setHoveredName(code);
        setHoveredFlag("🌍");
      }
    } else {
      setHoveredCountry(null);
      setHoveredName(null);
      setHoveredFlag(null);
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    isDraggingRef.current = false;

    // If mouse didn't drag, treat as click
    if (!hasMovedRef.current) {
      const target = e.target as SVGElement;
      if (!target) return;
      const group = target.closest("g[id]") as SVGGElement | null;
      if (group && group.id && group.id.length === 2) {
        const code = group.id.toUpperCase();
        if (onSelectCountry) {
          onSelectCountry(code);
        } else {
          router.push(`/countries/${code.toLowerCase()}`);
        }
      }
    }
  }

  function handleMouseLeave() {
    isDraggingRef.current = false;
    setHoveredCountry(null);
    setHoveredName(null);
    setHoveredFlag(null);
  }

  function zoomIn() {
    setZoom((z) => Math.min(z + 0.3, 4));
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - 0.3, 0.8));
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Top Controls Bar (Matching Pointercrate Individual / Nations toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-900/60 px-5 py-3">
        {/* Toggle Mode: Individual / Nations */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`rounded-md px-3 py-1 transition ${
              viewMode === "individual"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setViewMode("nations")}
            className={`rounded-md px-3 py-1 transition ${
              viewMode === "nations"
                ? "bg-cyan-600 text-white shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Nations
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#0284c7] shadow-sm" />
            <span className="text-zinc-300">Top Points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#38bdf8] shadow-sm" />
            <span className="text-zinc-300">Registered Players</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#27272a] border border-zinc-700" />
            <span>Unregistered</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in map"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out map"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset map view"
            title="Reset view"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: "center center",
          transition: isDraggingRef.current ? "none" : "transform 0.1s ease-out",
          cursor: isDraggingRef.current ? "grabbing" : "grab",
        }}
        className="relative h-[380px] sm:h-[480px] lg:h-[560px] w-full select-none overflow-hidden"
      >
        {!svgLoaded && (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            <Globe className="h-6 w-6 animate-spin mr-2 text-cyan-400" />
            Loading World Map...
          </div>
        )}
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredName && (
        <div
          style={{
            left: `${Math.min(Math.max(mousePos.x + 15, 10), 650)}px`,
            top: `${Math.max(mousePos.y - 45, 10)}px`,
            pointerEvents: "none",
          }}
          className="pointer-events-none absolute z-30 rounded-xl border border-cyan-500/50 bg-zinc-950/95 px-3.5 py-2 shadow-2xl backdrop-blur-md transition-all duration-75 text-xs min-w-44"
        >
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-1.5 font-black text-white">
            <span className="text-base">{hoveredFlag}</span>
            <span className="truncate">{hoveredName}</span>
            {hoveredCountry ? (
              <span className="ml-auto font-mono text-[11px] font-bold text-amber-400">
                #{hoveredCountry.rank}
              </span>
            ) : null}
          </div>

          {hoveredCountry ? (
            <div className="mt-1.5 space-y-1 text-[11px] text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Points</span>
                <strong className="font-mono text-cyan-400 font-black">
                  {hoveredCountry.totalPoints.toLocaleString()} pts
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Victors</span>
                <strong className="text-white font-bold">{hoveredCountry.playersCount}</strong>
              </div>
              {hoveredCountry.topPlayer ? (
                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-1 text-[10px]">
                  <span className="text-zinc-500">Top Victor</span>
                  <span className="text-amber-300 font-bold truncate max-w-28">
                    {hoveredCountry.topPlayer.displayName}
                  </span>
                </div>
              ) : null}
              <p className="pt-1 text-[10px] font-semibold text-cyan-400">
                Click to view National Leaderboard &rarr;
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-zinc-400">
              No registered victors yet • Click to explore
            </p>
          )}
        </div>
      )}

      {/* Interactive Helper Footer Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 text-xs text-zinc-400">
        <span>
          💡 <strong>Tip:</strong> Click and drag to pan across regions. Click any blue nation to view its leaderboard.
        </span>
        <span className="font-mono text-[11px] text-zinc-500">
          {countryData.length} Nations Active
        </span>
      </div>
    </div>
  );
}
