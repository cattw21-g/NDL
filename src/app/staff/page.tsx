import { Shield, ShieldAlert, ShieldCheck, UserCheck, MessageSquare, Mail, HelpCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicUserWhere } from "@/lib/demo-visibility";
import { getCountryMeta } from "@/lib/countries";
import { PageHeader, SectionPanel } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff Directory — Nerfed Demonlist",
  description: "Meet the Nerfed Demonlist team: Administrators, List Editors, Moderators, and Verifiers.",
  openGraph: {
    title: "Staff Directory — Nerfed Demonlist",
    description: "Meet the Nerfed Demonlist team: Administrators, List Editors, Moderators, and Verifiers.",
    siteName: "Nerfed Demonlist",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Staff Directory — Nerfed Demonlist",
    description: "Meet the Nerfed Demonlist team: Administrators, List Editors, Moderators, and Verifiers.",
  },
};

export default async function StaffPage() {
  const staffUsers = await prisma.user.findMany({
    where: {
      ...publicUserWhere(),
      role: {
        in: ["ADMIN", "MODERATOR"],
      },
    },
    select: {
      id: true,
      playerName: true,
      displayName: true,
      role: true,
      bio: true,
      countryCode: true,
      subdivision: true,
      discordUsername: true,
      youtubeUrl: true,
      twitchUrl: true,
      twitterUrl: true,
      createdAt: true,
      _count: {
        select: {
          verifiedLevels: true,
          reviewedSubmissions: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // ADMIN first, then MODERATOR
      { createdAt: "asc" },
    ],
  });

  const admins = staffUsers.filter((u) => u.role === "ADMIN");
  const moderators = staffUsers.filter((u) => u.role === "MODERATOR");

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 via-zinc-900/50 to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">Official Administration</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Staff Directory & Responsibilities
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            The Nerfed Demonlist is maintained by dedicated administrators, list editors, and verifiers.
            Staff members review record submissions, evaluate level nerfs, calculate rankings, and enforce platform guidelines.
          </p>
        </div>
      </div>

      {/* Administrators */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-extrabold text-white">List Administrators</h2>
          <span className="ml-2 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
            {admins.length}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Oversees list placements, platform architecture, community rules, and final appeal reviews.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => {
            const country = admin.countryCode ? getCountryMeta(admin.countryCode) : null;
            return (
              <SectionPanel key={admin.id} className="p-5 flex flex-col justify-between border-amber-500/30 bg-zinc-900/70">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/players/${admin.playerName}`}
                        className="text-lg font-black text-white hover:text-cyan-400 transition"
                      >
                        {admin.displayName}
                      </Link>
                      <p className="text-xs text-zinc-400">@{admin.playerName}</p>
                    </div>
                    <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-black uppercase text-amber-300">
                      Admin
                    </span>
                  </div>

                  {country ? (
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </p>
                  ) : null}

                  {admin.bio ? (
                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {admin.bio}
                    </p>
                  ) : (
                    <p className="text-xs italic text-zinc-500">NDL Core Administrator</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span>{admin._count.reviewedSubmissions} Reviews</span>
                  {admin.discordUsername ? (
                    <span className="font-mono text-[11px] text-cyan-400">
                      {admin.discordUsername}
                    </span>
                  ) : null}
                </div>
              </SectionPanel>
            );
          })}
        </div>
      </section>

      {/* Moderators & List Editors */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Shield className="h-5 w-5 text-cyan-400" />
          <h2 className="text-xl font-extrabold text-white">List Moderators & Reviewers</h2>
          <span className="ml-2 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
            {moderators.length}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Reviews incoming record submissions, validates click audio, FPS authenticity, and verifies legitimate completions.
        </p>

        {moderators.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moderators.map((mod) => {
              const country = mod.countryCode ? getCountryMeta(mod.countryCode) : null;
              return (
                <SectionPanel key={mod.id} className="p-5 flex flex-col justify-between border-zinc-800 bg-zinc-900/60">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/players/${mod.playerName}`}
                          className="text-lg font-black text-white hover:text-cyan-400 transition"
                        >
                          {mod.displayName}
                        </Link>
                        <p className="text-xs text-zinc-400">@{mod.playerName}</p>
                      </div>
                      <span className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-xs font-black uppercase text-cyan-300">
                        Moderator
                      </span>
                    </div>

                    {country ? (
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </p>
                    ) : null}

                    {mod.bio ? (
                      <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                        {mod.bio}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                    <span>{mod._count.reviewedSubmissions} Reviews</span>
                    {mod.discordUsername ? (
                      <span className="font-mono text-[11px] text-cyan-400">
                        {mod.discordUsername}
                      </span>
                    ) : null}
                  </div>
                </SectionPanel>
              );
            })}
          </div>
        ) : (
          <SectionPanel className="p-6 text-center text-zinc-400 text-sm">
            Staff applications for list moderators will open as submission volume expands.
          </SectionPanel>
        )}
      </section>

      {/* Staff Contact Guidelines */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          Contact & Appeal Guidelines
        </h3>
        <div className="grid gap-4 md:grid-cols-3 text-xs leading-relaxed text-zinc-400">
          <div className="space-y-1 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4">
            <h4 className="font-black text-zinc-200">Record Appeals</h4>
            <p>
              If your submission was rejected and you believe a moderator error occurred, prepare your raw unedited recording and click audio, then contact a list moderator via our Discord server.
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4">
            <h4 className="font-black text-zinc-200">Demon Submissions</h4>
            <p>
              To submit a new nerfed demon for placement consideration on the Main or Extended List, use the upcoming verification suggestion workflow or post in the verification showcase channel.
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4">
            <h4 className="font-black text-zinc-200">Security & Bug Reports</h4>
            <p>
              If you uncover a vulnerability or exploit affecting Demonlist point calculations or account security, please message an Administrator directly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
