import Link from "next/link";
import { ArrowLeft, Globe, Share2, User } from "lucide-react";

import { updateProfileAction } from "@/actions/profile";
import { PageMessage } from "@/components/message";
import { SubmitButton } from "@/components/submit-button";
import {
  FieldLabel,
  inputClass,
  PageHeader,
  SectionPanel,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAllCountries } from "@/lib/countries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionUser = await requireUser();
  const [params, user] = await Promise.all([
    searchParams,
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
    }),
  ]);

  const allCountries = getAllCountries();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Profile settings"
          description="Manage the country and region you represent on leaderboards, customize your player details, and update your social profiles."
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/players/${user.playerName}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to public profile
        </Link>
      </div>

      <PageMessage
        searchParams={params}
        successMessage="Profile and country settings updated successfully!"
      />

      <form action={updateProfileAction} className="space-y-6">
        {/* National Representation */}
        <SectionPanel className="space-y-5 p-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                National representation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the nation and region you represent on global country rankings and player profiles.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Represented Country">
              <select
                name="countryCode"
                defaultValue={user.countryCode ?? ""}
                className={inputClass}
              >
                <option value="">🌐 None / Hidden</option>
                {allCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.continent})
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="State / Province / Region (Optional)">
              <input
                type="text"
                name="subdivision"
                defaultValue={user.subdivision ?? ""}
                placeholder="e.g. California, Bavaria, Ontario"
                maxLength={50}
                className={inputClass}
              />
            </FieldLabel>
          </div>
        </SectionPanel>

        {/* Player Identity */}
        <SectionPanel className="space-y-5 p-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Player identity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your username and display details. Username is permanent.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Username (Fixed)">
              <input
                type="text"
                value={user.playerName}
                disabled
                className={`${inputClass} cursor-not-allowed opacity-60`}
              />
            </FieldLabel>

            <FieldLabel label="Display Name">
              <input
                type="text"
                name="displayName"
                defaultValue={user.displayName}
                required
                minLength={2}
                maxLength={32}
                className={inputClass}
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Bio (Optional)">
            <textarea
              name="bio"
              defaultValue={user.bio ?? ""}
              placeholder="A short description about yourself, achievements, or favorite levels..."
              maxLength={500}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </FieldLabel>
        </SectionPanel>

        {/* Social Media Links */}
        <SectionPanel className="space-y-5 p-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <Share2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Social links
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Display social buttons on your public player profile so others can find your channels.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel label="YouTube URL">
              <input
                type="url"
                name="youtubeUrl"
                defaultValue={user.youtubeUrl ?? ""}
                placeholder="https://youtube.com/@channel"
                className={inputClass}
              />
            </FieldLabel>

            <FieldLabel label="Twitch URL">
              <input
                type="url"
                name="twitchUrl"
                defaultValue={user.twitchUrl ?? ""}
                placeholder="https://twitch.tv/channel"
                className={inputClass}
              />
            </FieldLabel>

            <FieldLabel label="Twitter / X URL">
              <input
                type="url"
                name="twitterUrl"
                defaultValue={user.twitterUrl ?? ""}
                placeholder="https://x.com/profile"
                className={inputClass}
              />
            </FieldLabel>
          </div>
        </SectionPanel>

        {/* Account Security & Submission Locking (v1.5.0 Features #7 & #8) */}
        <SectionPanel className="space-y-5 p-6 border-cyan-500/30">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="rounded bg-cyan-500/10 p-1.5 text-cyan-500">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Player Profile Claiming & Submission Locking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect your leaderboard identity against unauthorized or fraudulent submissions.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Verified Claim Status:
              </span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                Claimed as @{user.playerName}
              </span>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white p-4 cursor-pointer hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                name="isSubmissionLocked"
                value="true"
                defaultChecked={user.isSubmissionLocked}
                className="mt-1 h-4 w-4 rounded border-slate-400 text-cyan-600 focus:ring-cyan-500"
              />
              <div className="space-y-1">
                <span className="font-black text-sm text-slate-950 dark:text-slate-100 block">
                  Enable Submission Locking
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When enabled, record submissions under your player name can <strong>only</strong> be submitted while authenticated into this verified account. Any third party attempting to submit runs under your name will be rejected automatically.
                </p>
              </div>
            </label>
          </div>
        </SectionPanel>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/players/${user.playerName}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
          <SubmitButton className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-cyan-500">
            Save changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
