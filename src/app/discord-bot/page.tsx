import { Bot, MessageSquare, ShieldCheck, Zap, ExternalLink, Terminal, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { SectionPanel } from "@/components/ui";

export const metadata = {
  title: "Official Discord Bot — Nerfed Demonlist",
  description: "Add the official Nerfed Demonlist Discord bot to your server. Real-time demon queries, player leaderboards, and automatic role sync.",
  openGraph: {
    title: "Official Discord Bot — Nerfed Demonlist",
    description: "Add the official Nerfed Demonlist Discord bot to your server. Real-time demon queries, player leaderboards, and automatic role sync.",
    siteName: "Nerfed Demonlist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Discord Bot — Nerfed Demonlist",
    description: "Add the official Nerfed Demonlist Discord bot to your server.",
  },
};

const commands = [
  {
    name: "/top [count]",
    description: "Display the top ranked nerfed demons from the Main List (#1 to #75).",
    example: "/top count: 10",
  },
  {
    name: "/level [name_or_rank]",
    description: "Look up any demon's current list position, points, verifier, GD level ID, and showcase video.",
    example: "/level name_or_rank: silent-clubstep",
  },
  {
    name: "/player [username]",
    description: "View any player's leaderboard rank, points, 100% completions count, and hardest demon.",
    example: "/player username: paqel",
  },
  {
    name: "/records [level]",
    description: "List all accepted 100% victors and verified progress runs for a specified demon.",
    example: "/records level: acheron-nerfed",
  },
  {
    name: "/leaderboard",
    description: "Showcase the global top 10 players and their current Demonlist points.",
    example: "/leaderboard",
  },
  {
    name: "/rules",
    description: "Review official guidelines for submitting runs, click audio criteria, and FPS rules.",
    example: "/rules",
  },
  {
    name: "/sync",
    description: "Synchronize your linked Discord account with your Demonlist profile to claim victor roles.",
    example: "/sync",
  },
];

export default function DiscordBotPage() {
  const botInviteUrl = "https://discord.com/api/oauth2/authorize?client_id=1541531776097198080&permissions=277025778752&scope=bot%20applications.commands";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Bot className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">Official Discord Integration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Nerfed Demonlist Discord Bot
          </h1>
          <p className="max-w-3xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            Equip your Discord community with real-time demon lookups, national rankings, automated victor role management, and instant acceptance embeds.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5865F2] px-5 text-sm font-black text-white hover:bg-[#4752c4] transition shadow-lg shadow-[#5865F2]/25"
            >
              <Bot className="h-4 w-4" />
              Invite Bot to Server &rarr;
            </a>
            <a
              href="https://discord.gg/kyYBkQzTCq"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 text-sm font-black text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
            >
              Join Official NDL Server
            </a>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionPanel className="p-5 border-zinc-800 bg-zinc-900/60 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Zap className="h-5 w-5" />
            <h3 className="font-extrabold text-white text-sm">Instant Slash Commands</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Lookup any demon, player score, or victor record in seconds with full Discord auto-completion.
          </p>
        </SectionPanel>

        <SectionPanel className="p-5 border-zinc-800 bg-zinc-900/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="font-extrabold text-white text-sm">Automated Victor Roles</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Players who link their Discord profile automatically receive server roles based on their beaten demon tiers.
          </p>
        </SectionPanel>

        <SectionPanel className="p-5 border-zinc-800 bg-zinc-900/60 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal className="h-5 w-5" />
            <h3 className="font-extrabold text-white text-sm">Native Embed Cards</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Beautiful Discord embeds featuring level thumbnails, points, verification proof, and hardware specs.
          </p>
        </SectionPanel>
      </div>

      {/* Commands Reference Table */}
      <section className="space-y-4">
        <div className="border-b border-zinc-800 pb-3">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-400" />
            Slash Commands Reference
          </h2>
        </div>

        <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {commands.map((cmd) => (
            <div key={cmd.name} className="p-4 space-y-1.5 hover:bg-zinc-850 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                  {cmd.name}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  Example: <code className="text-zinc-300">{cmd.example}</code>
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {cmd.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Setup Guide */}
      <SectionPanel className="p-6 sm:p-8 border-zinc-800 bg-zinc-900/50 space-y-4">
        <h3 className="text-lg font-black text-white">How to Set Up in Your Server</h3>
        <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300 leading-relaxed">
          <li>
            Click the <strong className="text-white">Invite Bot to Server</strong> button above.
          </li>
          <li>
            Choose your Discord server from the dropdown and grant the required permissions (Send Messages, Embed Links, Use Application Commands).
          </li>
          <li>
            Once invited, type <code className="font-mono text-indigo-400 bg-black/40 px-1 py-0.5 rounded">/top</code> in any text channel to test the integration!
          </li>
        </ol>
      </SectionPanel>
    </div>
  );
}
