import { Code2, Terminal, ExternalLink, Zap, ShieldCheck, Database } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { SectionPanel } from "@/components/ui";

export const metadata = {
  title: "Public Developer API — Nerfed Demonlist",
  description: "Official REST API documentation for querying demons, player rankings, records, and statistics.",
  openGraph: {
    title: "Public Developer API — Nerfed Demonlist",
    description: "Official REST API documentation for querying demons, player rankings, records, and statistics.",
    siteName: "Nerfed Demonlist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Public Developer API — Nerfed Demonlist",
    description: "Official REST API documentation for querying demons, player rankings, records, and statistics.",
  },
};

const endpoints = [
  {
    path: "/api/public/levels",
    method: "GET",
    description: "Retrieve all ranked and legacy nerfed demons, including current point calculations, assigned verifiers, and creators.",
    params: [
      { name: "status", type: "string", description: "Filter by status: RANKED or LEGACY" },
      { name: "limit", type: "number", description: "Maximum levels to return (default: 100)" },
    ],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/levels?limit=10",
  },
  {
    path: "/api/public/players",
    method: "GET",
    description: "Retrieve the official global player leaderboard, ranking points, national flags, and completion totals.",
    params: [
      { name: "limit", type: "number", description: "Number of top players to retrieve (default: 50, max: 100)" },
    ],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/players?limit=25",
  },
  {
    path: "/api/public/records",
    method: "GET",
    description: "Query accepted demon completions and progress runs with filters for specific levels, players, or verifiers.",
    params: [
      { name: "levelId", type: "string", description: "Filter records for a specific level ID" },
      { name: "playerId", type: "string", description: "Filter records by player ID" },
      { name: "isVerifier", type: "boolean", description: "Filter for verification runs only (true/false)" },
      { name: "limit", type: "number", description: "Results per page (default: 50, max: 100)" },
      { name: "page", type: "number", description: "Page number for pagination" },
    ],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/records?limit=10",
  },
  {
    path: "/api/public/recent-records",
    method: "GET",
    description: "Fetch the latest accepted runs recently verified by the Demonlist moderation team.",
    params: [
      { name: "limit", type: "number", description: "Number of recent records to return (default: 10)" },
    ],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/recent-records?limit=5",
  },
  {
    path: "/api/public/countries",
    method: "GET",
    description: "Query international country and continental rankings with aggregated points and player counts.",
    params: [],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/countries",
  },
  {
    path: "/api/public/stats",
    method: "GET",
    description: "Get comprehensive platform metrics: total demons, total points, CBF adoption rate, and difficulty distribution.",
    params: [],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/stats",
  },
  {
    path: "/api/public/search",
    method: "GET",
    description: "Perform fast autocomplete or full-text searches across demons and player profiles.",
    params: [
      { name: "q", type: "string", description: "Search query string (e.g. 'silent' or 'paqel')" },
    ],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/search?q=silent",
  },
  {
    path: "/api/public/rules",
    method: "GET",
    description: "Retrieve the active official Demonlist submission rules and guidelines in raw markdown format.",
    params: [],
    exampleUrl: "https://www.nerfeddemonlist.net/api/public/rules",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">Developer Ecosystem</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Official Public REST API
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            Integrate Nerfed Demonlist rankings, demon stats, and player data directly into your Discord bots, external websites, or analytic dashboards without scraping.
          </p>
        </div>
      </div>

      {/* Base URL & Specifications */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionPanel className="p-4 border-zinc-800 bg-zinc-900/60">
          <p className="text-xs font-bold text-zinc-400 uppercase">Base API URL</p>
          <p className="mt-1 font-mono text-sm font-black text-cyan-400">
            https://www.nerfeddemonlist.net/api/public
          </p>
        </SectionPanel>
        <SectionPanel className="p-4 border-zinc-800 bg-zinc-900/60">
          <p className="text-xs font-bold text-zinc-400 uppercase">Data Format</p>
          <p className="mt-1 font-mono text-sm font-black text-emerald-400">
            application/json (UTF-8)
          </p>
        </SectionPanel>
        <SectionPanel className="p-4 border-zinc-800 bg-zinc-900/60">
          <p className="text-xs font-bold text-zinc-400 uppercase">Rate Limit</p>
          <p className="mt-1 font-mono text-sm font-black text-amber-400">
            60 req / min (Public)
          </p>
        </SectionPanel>
      </div>

      {/* Interactive Endpoints List */}
      <div className="space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-400" />
            Endpoints Reference
          </h2>
        </div>

        <div className="space-y-4">
          {endpoints.map((ep) => (
            <SectionPanel key={ep.path} className="p-5 border-zinc-800 bg-zinc-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-black text-cyan-400 border border-cyan-500/30">
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {ep.path}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton
                    text={`curl -s "${ep.exampleUrl}"`}
                    label="Copy cURL"
                    copiedLabel="cURL Copied!"
                  />
                  <a
                    href={ep.exampleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                  >
                    Test in browser <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {ep.description}
              </p>

              {ep.params.length > 0 ? (
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs space-y-1.5">
                  <p className="font-bold text-zinc-400 uppercase text-[10px]">Query Parameters:</p>
                  <div className="grid gap-1">
                    {ep.params.map((p) => (
                      <div key={p.name} className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">{p.name}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">({p.type})</span>
                        <span className="text-zinc-400">— {p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </SectionPanel>
          ))}
        </div>
      </div>
    </div>
  );
}
