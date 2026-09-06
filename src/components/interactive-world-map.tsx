"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, RotateCcw, Globe } from "lucide-react";
import { COUNTRIES, type Continent } from "@/lib/countries";

export type CountryPointData = {
  code: string;
  name: string;
  flag: string;
  continent: Continent;
  rank: number;
  totalPoints: number;
  playersCount: number;
  hasTopPlayer?: boolean;
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
  const mapMountRef = useRef<HTMLDivElement>(null);
  const clickedCountryIdRef = useRef<string | null>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryPointData | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [hoveredFlag, setHoveredFlag] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<"nations" | "individual">("nations");

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  // 1. Fetch and inject SVG using safe DOM manipulation into dedicated ref node (zero JSX children)
  useEffect(() => {
    let active = true;
    const container = mapMountRef.current;
    if (!container) return;

    fetch("/world.svg")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((svgText) => {
        if (!active || !container) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = doc.querySelector("svg");

        if (!svgEl) {
          throw new Error("No SVG element found in /world.svg");
        }

        svgEl.removeAttribute("width");
        svgEl.removeAttribute("height");
        svgEl.setAttribute("style", "width: 100%; height: 100%; display: block;");
        svgEl.setAttribute("id", "ndl-world-map-svg");

        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const importedNode = document.importNode(svgEl, true);
        container.appendChild(importedNode);

        if (active) {
          setSvgLoaded(true);
          setSvgError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load /world.svg:", err);
        if (active) {
          setSvgError(err.message || "Failed to load map");
        }
      });

    return () => {
      active = false;
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, []);

  // 2. High-performance styling via single dynamic <style> injection
  useEffect(() => {
    if (!svgLoaded || !mapMountRef.current) return;
    const svg = mapMountRef.current.querySelector("svg");
    if (!svg) return;

    let styleEl = svg.querySelector("style#ndl-map-dynamic-styles") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "ndl-map-dynamic-styles";
      svg.prepend(styleEl);
    }

    const rules: string[] = [];

    // Base styling for all lands & states in world.svg
    rules.push(`
      #ndl-world-map-svg path, #ndl-world-map-svg polygon, #ndl-world-map-svg rect {
        fill: #27272a !important;
        stroke: #18181b !important;
        stroke-width: 0.75px !important;
        cursor: pointer !important;
        transition: fill 0.15s ease, filter 0.15s ease;
      }
      /* Hover ONLY individual country groups (never continent groups) */
      #ndl-world-map-svg g.land:hover path,
      #ndl-world-map-svg g.island:hover path,
      #ndl-world-map-svg g.land-with-states:hover path,
      #ndl-world-map-svg g.land:hover polygon,
      #ndl-world-map-svg g.island:hover polygon,
      #ndl-world-map-svg g.land-with-states:hover polygon {
        fill: #3f3f46 !important;
        stroke: #52525b !important;
      }
    `);

    // Country styling rules
    for (const c of countryData) {
      if (c.playersCount <= 0 && c.totalPoints <= 0) continue;
      const codeLower = c.code.toLowerCase();

      if (c.hasTopPlayer) {
        // GOLDEN YELLOW for the nation with the Top 1 Player!
        rules.push(`
          #ndl-world-map-svg g#${codeLower} path,
          #ndl-world-map-svg g#${codeLower} polygon {
            fill: #facc15 !important;
            stroke: #ca8a04 !important;
            stroke-width: 1.25px !important;
            filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.75)) !important;
          }
          #ndl-world-map-svg g#${codeLower}:hover path,
          #ndl-world-map-svg g#${codeLower}:hover polygon {
            fill: #fde047 !important;
            stroke: #eab308 !important;
            stroke-width: 1.5px !important;
            filter: drop-shadow(0 0 12px rgba(250, 204, 21, 1)) !important;
          }
        `);
      } else {
        // BLUE SHADES for other registered countries based on score
        const ratio = c.totalPoints / maxPoints;
        let fillColor = "#38bdf8"; // Light sky blue
        let strokeColor = "#0284c7";

        if (ratio > 0.5) {
          fillColor = "#0284c7"; // Deep rich blue
          strokeColor = "#0369a1";
        } else if (ratio > 0.15) {
          fillColor = "#0ea5e9"; // Vibrant blue
          strokeColor = "#0284c7";
        }

        rules.push(`
          #ndl-world-map-svg g#${codeLower} path,
          #ndl-world-map-svg g#${codeLower} polygon {
            fill: ${fillColor} !important;
            stroke: ${strokeColor} !important;
            stroke-width: 1px !important;
          }
          #ndl-world-map-svg g#${codeLower}:hover path,
          #ndl-world-map-svg g#${codeLower}:hover polygon {
            fill: #67e8f9 !important;
            filter: drop-shadow(0 0 10px rgba(14, 165, 233, 0.85)) !important;
          }
        `);
      }
    }

    // Selected country glow
    if (selectedCountryCode) {
      const sel = selectedCountryCode.toLowerCase();
      rules.push(`
        #ndl-world-map-svg g#${sel} path, #ndl-world-map-svg g#${sel} polygon {
          stroke: #ffffff !important;
          stroke-width: 2px !important;
          filter: drop-shadow(0 0 12px #38bdf8) !important;
        }
      `);
    }

    styleEl.textContent = rules.join("\n");
  }, [svgLoaded, countryData, maxPoints, selectedCountryCode]);

  // 3. Pointer event handlers
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };

    const target = e.target as Element | null;
    const countryEl = target?.closest("g.land, g.island, g.land-with-states");
    clickedCountryIdRef.current =
      countryEl && countryEl.id && countryEl.id.length === 2
        ? countryEl.id.toUpperCase()
        : null;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (isDragging) {
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

    // Hover detection strictly for 2-letter country groups (never continent)
    const target = e.target as Element | null;
    const countryEl = target?.closest("g.land, g.island, g.land-with-states");
    if (countryEl && countryEl.id && countryEl.id.length === 2) {
      const code = countryEl.id.toUpperCase();
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

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Treat as click if mouse didn't drag
    if (!hasMovedRef.current && clickedCountryIdRef.current) {
      const code = clickedCountryIdRef.current;
      if (onSelectCountry) {
        onSelectCountry(code);
      } else {
        router.push(`/countries/${code.toLowerCase()}`);
      }
    }
  }

  function handlePointerLeave() {
    setIsDragging(false);
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
      {/* Top Controls Bar */}
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
            <span className="h-3 w-3 rounded-sm bg-[#facc15] shadow-md shadow-yellow-500/40 border border-amber-500" />
            <span className="text-yellow-400 font-bold">Top 1 Player</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#0284c7] shadow-sm" />
            <span className="text-zinc-300">Registered</span>
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

      {/* Map Viewport Area */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="relative h-[380px] sm:h-[480px] lg:h-[560px] w-full select-none overflow-hidden bg-zinc-950"
      >
        {/* Loading Spinner: Isolated sibling overlay */}
        {!svgLoaded && !svgError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm text-xs text-zinc-400">
            <Globe className="h-8 w-8 animate-spin text-cyan-400 mb-2" />
            <span>Loading Interactive World Map...</span>
          </div>
        )}

        {/* Error Fallback: Isolated sibling overlay */}
        {svgError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 text-xs text-zinc-400 p-6 text-center">
            <p className="text-zinc-300 font-semibold mb-1">World map visualization preview unavailable</p>
            <p className="text-zinc-500 max-w-sm">Please browse the national standings and continental rankings below.</p>
          </div>
        )}

        {/* Dedicated SVG Container: ZERO JSX children to guarantee no React reconciliation collision */}
        <div
          ref={mapMountRef}
          className="h-full w-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            cursor: isDragging ? "grabbing" : "grab",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        />

        {/* Hover Tooltip Overlay */}
        {hoveredName && (
          <div
            style={{
              left: `${Math.min(Math.max(mousePos.x + 15, 10), 650)}px`,
              top: `${Math.max(mousePos.y - 45, 10)}px`,
              pointerEvents: "none",
            }}
            className="pointer-events-none absolute z-30 rounded-xl border border-cyan-500/50 bg-zinc-950/95 px-3.5 py-2 shadow-2xl backdrop-blur-md text-xs min-w-44"
          >
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-1.5 font-black text-white">
              <span className="text-base">{hoveredFlag}</span>
              <span className="truncate">{hoveredName}</span>
              {hoveredCountry ? (
                hoveredCountry.hasTopPlayer ? (
                  <span className="ml-auto rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-black text-yellow-300 border border-yellow-400/50 shadow-sm shadow-yellow-500/30">
                    👑 Top 1 Player
                  </span>
                ) : (
                  <span className="ml-auto font-mono text-[11px] font-bold text-amber-400">
                    #{hoveredCountry.rank}
                  </span>
                )
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
      </div>

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
