import { EmbedBuilder } from "discord.js";

import type {
  AuditEntry,
  NdlLeaderboardRow,
  NdlLevel,
  NdlPlayer,
  NdlRecord,
  NdlRules,
  StaffLevelSuggestion,
  StaffRecordSubmission,
  StaffStats,
} from "../ndl-api.js";

export const ndlEmbedColor = 0x0ea5e9;
const maxListRows = 10;

export function levelUrl(baseUrl: string, slug: string) {
  return `${baseUrl.replace(/\/+$/, "")}/levels/${encodeURIComponent(slug)}`;
}

export function playerUrl(baseUrl: string, handle: string) {
  return `${baseUrl.replace(/\/+$/, "")}/players/${encodeURIComponent(handle)}`;
}

export function rulesUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/rules`;
}

export function formatTopLevelsEmbed(levels: NdlLevel[], baseUrl: string) {
  return baseEmbed("NDL Top Levels", "Highest-ranked public NDL levels.")
    .setDescription(
      levels.length
        ? levels
            .slice(0, maxListRows)
            .map(
              (level) =>
                `${rankLabel(level)} **${clean(level.name)}** - ${level.points} pts - ${clean(level.verifier)} - ${level.recordCount} records\n${levelUrl(baseUrl, level.slug)}`,
            )
            .join("\n")
        : "No ranked levels are available yet.",
    )
    .setURL(baseUrl);
}

export function formatLevelEmbed(level: NdlLevel, baseUrl: string) {
  return baseEmbed(
    `${rankLabel(level)} ${level.name}`,
    `${level.status.toLowerCase()} - ${level.points} pts - ${level.recordCount} records`,
  )
    .setURL(levelUrl(baseUrl, level.slug))
    .addFields(
      { name: "Original level", value: clean(level.originalName), inline: true },
      { name: "Verifier", value: clean(level.verifier), inline: true },
      { name: "Nerf creator", value: clean(level.nerfCreator), inline: true },
      { name: "GD ID", value: clean(level.gdLevelId), inline: true },
      {
        name: "Showcase",
        value: level.showcaseUrl ? level.showcaseUrl : "No showcase link.",
        inline: false,
      },
    );
}

export function formatPlayerEmbed(
  player: NdlPlayer,
  summary: NdlLeaderboardRow,
  records: NdlRecord[],
  baseUrl: string,
) {
  const hardest = hardestRecord(records);

  return baseEmbed(
    player.displayName,
    `${summary.points} pts - ${summary.records} accepted records`,
  )
    .setURL(playerUrl(baseUrl, player.handle))
    .addFields(
      {
        name: "Leaderboard rank",
        value: summary.rank ? `#${summary.rank}` : "Unranked",
        inline: true,
      },
      {
        name: "Hardest ranked record",
        value: hardest
          ? `${rankLabel(hardest.level)} ${hardest.level.name} (${hardest.pointsAwarded} pts)`
          : "No ranked records yet.",
        inline: false,
      },
      {
        name: "Profile",
        value: playerUrl(baseUrl, player.handle),
        inline: false,
      },
    );
}

export function formatRecordsEmbed(
  handle: string,
  records: NdlRecord[],
  baseUrl: string,
) {
  const visibleRecords = records.slice(0, maxListRows);
  const suffix =
    records.length > visibleRecords.length
      ? `\nShowing ${visibleRecords.length} of ${records.length}.`
      : "";

  return baseEmbed(
    `Records for ${handle}`,
    visibleRecords.length
      ? `${visibleRecords
          .map(
            (record) =>
              `${rankLabel(record.level)} **${clean(record.level.name)}** - ${record.pointsAwarded} pts - 100%\n${record.videoUrl}`,
          )
          .join("\n")}${suffix}`
      : "No accepted records found.",
  ).setURL(playerUrl(baseUrl, handle));
}

export function formatRecentRecordsEmbed(records: NdlRecord[], baseUrl: string) {
  return baseEmbed(
    "Recent Accepted Records",
    records.length
      ? records
          .slice(0, maxListRows)
          .map(
            (record) =>
              `**${clean(record.player.displayName)}** - ${rankLabel(record.level)} ${clean(record.level.name)} - ${record.pointsAwarded} pts - ${formatDate(record.acceptedAt)}`,
          )
          .join("\n")
      : "No accepted records are available yet.",
  ).setURL(baseUrl);
}

export function formatSearchEmbed(
  query: string,
  levels: NdlLevel[],
  players: NdlPlayer[],
  baseUrl: string,
) {
  return baseEmbed("NDL Search", `Results for "${clean(query)}"`)
    .addFields(
      {
        name: "Levels",
        value: levels.length
          ? levels
              .slice(0, 5)
              .map(
                (level) =>
                  `${rankLabel(level)} [${clean(level.name)}](${levelUrl(baseUrl, level.slug)}) - ${level.points} pts`,
              )
              .join("\n")
          : "No level matches.",
      },
      {
        name: "Players",
        value: players.length
          ? players
              .slice(0, 5)
              .map(
                (player) =>
                  `[${clean(player.displayName)}](${playerUrl(baseUrl, player.handle)})`,
              )
              .join("\n")
          : "No player matches.",
      },
    )
    .setURL(baseUrl);
}

export function formatRulesEmbed(rules: NdlRules, baseUrl: string) {
  return baseEmbed(
    "NDL Rules",
    `${firstParagraph(rules.content)}\n\nRead the full rules: ${rulesUrl(baseUrl)}`,
  ).addFields({
    name: "Version",
    value: `${rules.version} - ${formatDate(rules.publishedAt)}`,
    inline: true,
  });
}

export function formatPendingRecordsEmbed(
  submissions: StaffRecordSubmission[],
  baseUrl: string,
) {
  return baseEmbed(
    "Pending Record Submissions",
    submissions.length
      ? submissions
          .slice(0, maxListRows)
          .map(
            (submission) =>
              `\`${submission.id}\` - **${clean(submission.player.displayName)}** on ${rankLabel(submission.level)} ${clean(submission.level.name)} - ${submission.status}\nVideo: ${submission.videoUrl}`,
          )
          .join("\n")
      : "No pending record submissions.",
  ).setURL(`${baseUrl.replace(/\/+$/, "")}/moderation`);
}

export function formatPendingSuggestionsEmbed(
  suggestions: StaffLevelSuggestion[],
  baseUrl: string,
) {
  return baseEmbed(
    "Pending Level Suggestions",
    suggestions.length
      ? suggestions
          .slice(0, maxListRows)
          .map(
            (suggestion) =>
              `\`${suggestion.id}\` - **${clean(suggestion.name)}** by ${clean(suggestion.submitter.displayName)} - ${suggestion.status}`,
          )
          .join("\n")
      : "No pending level suggestions.",
  ).setURL(`${baseUrl.replace(/\/+$/, "")}/moderation`);
}

export function formatSubmissionEmbed(submission: StaffRecordSubmission) {
  return baseEmbed(
    `Submission ${submission.id}`,
    `${submission.status} - ${submission.player.displayName} on ${submission.level.name}`,
  ).addFields(
    { name: "Video", value: submission.videoUrl, inline: false },
    {
      name: "Raw footage",
      value: submission.rawFootageUrl ?? "No raw footage link.",
      inline: false,
    },
    {
      name: "Proof",
      value: [
        `${submission.fps} FPS`,
        `CBF: ${yesNo(submission.cbfUsed)}`,
        `Click audio: ${yesNo(submission.clickAudioIncluded)}`,
        `Separate mic/click track: ${yesNo(submission.separateMicClickTrack)}`,
      ].join("\n"),
      inline: false,
    },
    {
      name: "Moderator notes",
      value: submission.moderatorNotes ?? "No moderator notes.",
      inline: false,
    },
  );
}

export function formatSuggestionEmbed(suggestion: StaffLevelSuggestion) {
  return baseEmbed(
    `Suggestion ${suggestion.id}`,
    `${suggestion.status} - ${suggestion.name}`,
  ).addFields(
    { name: "Original level", value: clean(suggestion.originalName), inline: true },
    { name: "Submitter", value: clean(suggestion.submitter.displayName), inline: true },
    { name: "GD ID", value: clean(suggestion.gdLevelId), inline: true },
    { name: "Showcase", value: suggestion.showcaseUrl, inline: false },
    {
      name: "Compatibility notes",
      value: clean(suggestion.compatibilityNotes || "No compatibility notes."),
      inline: false,
    },
    {
      name: "Moderator notes",
      value: suggestion.moderatorNotes ?? "No moderator notes.",
      inline: false,
    },
  );
}

export function formatAuditEmbed(entries: AuditEntry[], query: string) {
  return baseEmbed(
    "NDL Audit",
    entries.length
      ? entries
          .slice(0, maxListRows)
          .map(
            (entry) =>
              `\`${entry.action}\` - ${clean(entry.entityType)}:${clean(entry.entityLabel)} - ${clean(entry.actor.displayName)} - ${formatDate(entry.createdAt)}`,
          )
          .join("\n")
      : `No audit entries found${query ? ` for "${clean(query)}"` : ""}.`,
  );
}

export function formatStatsEmbed(stats: StaffStats) {
  return baseEmbed("NDL Staff Stats", `Generated ${formatDate(stats.generatedAt)}`)
    .addFields(
      { name: "Pending records", value: String(stats.pendingRecords), inline: true },
      {
        name: "Pending suggestions",
        value: String(stats.pendingSuggestions),
        inline: true,
      },
      { name: "Ranked levels", value: String(stats.rankedLevels), inline: true },
      { name: "Users", value: String(stats.users), inline: true },
      {
        name: "Accepted records",
        value: String(stats.acceptedRecords),
        inline: true,
      },
      {
        name: "Moderation actions 24h",
        value: String(stats.moderationActions24h),
        inline: true,
      },
    );
}

export function formatBotError(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const apiError = error as {
      code: string;
      message: string;
      retryAfterSeconds?: number;
    };

    if (apiError.code === "rate_limited") {
      return `NDL API is rate limited. Try again in ${apiError.retryAfterSeconds ?? "a few"} seconds.`;
    }

    if (apiError.code === "not_found") {
      return apiError.message;
    }

    if (apiError.code === "unauthorized") {
      return "The staff bot token is invalid or missing.";
    }

    return apiError.message;
  }

  return "NDL API is unavailable. Try again later.";
}

export function containsSensitiveOutput(value: unknown) {
  return /\b(email|password|session|token|secret|database_url|smtp|rawFootageUrl)\b/i.test(
    JSON.stringify(value),
  );
}

function baseEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(ndlEmbedColor)
    .setTitle(truncate(title, 256))
    .setDescription(truncate(description, 4096));
}

function rankLabel(level: Pick<NdlLevel, "rank" | "status">) {
  return level.rank && level.status === "RANKED" ? `#${level.rank}` : level.status;
}

function hardestRecord(records: NdlRecord[]) {
  return records
    .filter((record) => record.level.status === "RANKED" && record.level.rank)
    .sort((a, b) => (a.level.rank ?? 99999) - (b.level.rank ?? 99999))[0];
}

function firstParagraph(value: string) {
  return truncate(
    value
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .find(Boolean) ?? "NDL rules are available on the website.",
    500,
  );
}

function clean(value: string) {
  return truncate(value.replace(/\s+/g, " ").trim(), 900);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}
