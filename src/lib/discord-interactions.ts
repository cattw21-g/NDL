import nacl from "tweetnacl";

import {
  serializeAuditLogEntry,
  serializePublicLeaderboard,
  serializePublicLevel,
  serializePublicPlayer,
  serializePublicRecord,
  serializeStaffLevelSuggestion,
  serializeStaffRecordSubmission,
  type ApiLevel,
} from "@/lib/api-serializers";
import {
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";

export const discordInteractionEndpointPath = "/api/discord/interactions";
export const discordInteractionEndpointUrl =
  "https://nerfeddemonlist.net/api/discord/interactions";

export const DiscordInteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
} as const;

export const DiscordInteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
} as const;

export const DiscordMessageFlags = {
  Ephemeral: 64,
} as const;

const commandOptionType = {
  String: 3,
  Integer: 4,
} as const;

const ndlColor = 0x0ea5e9;
const defaultLimit = 10;
const maxLimit = 50;
const staffPermissionDeniedMessage =
  "You do not have permission to use this command.";

export type DiscordCommandDefinition = {
  name: string;
  description: string;
  options?: Array<{
    name: string;
    description: string;
    type: number;
    required?: boolean;
    min_value?: number;
    max_value?: number;
  }>;
};

export const discordCommandDefinitions: DiscordCommandDefinition[] = [
  {
    name: "top",
    description: "Show the top ranked NDL levels.",
    options: [
      {
        name: "count",
        description: "Number of levels to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 50,
      },
    ],
  },
  {
    name: "level",
    description: "Find an NDL level.",
    options: [
      {
        name: "query",
        description: "Level name, original level, GD ID, creator, or verifier.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "player",
    description: "Show an NDL player summary.",
    options: [
      {
        name: "handle",
        description: "Player username/handle.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "records",
    description: "Show accepted records for an NDL player.",
    options: [
      {
        name: "handle",
        description: "Player username/handle.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "recent",
    description: "Show recent accepted NDL records.",
  },
  {
    name: "search",
    description: "Search NDL levels and players.",
    options: [
      {
        name: "query",
        description: "Search text.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "rules",
    description: "Show the NDL rules link and summary.",
  },
  {
    name: "pending-records",
    description: "Show pending NDL record submissions.",
  },
  {
    name: "pending-suggestions",
    description: "Show pending NDL level suggestions.",
  },
  {
    name: "submission",
    description: "Show one staff-visible record submission.",
    options: [
      {
        name: "id",
        description: "Record submission ID.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "suggestion",
    description: "Show one staff-visible level suggestion.",
    options: [
      {
        name: "id",
        description: "Level suggestion ID.",
        type: commandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "audit",
    description: "Search the NDL admin audit log.",
    options: [
      {
        name: "query",
        description: "Audit search text.",
        type: commandOptionType.String,
      },
    ],
  },
  {
    name: "stats",
    description: "Show NDL staff queue and site stats.",
  },
];

export type DiscordInteraction = {
  type: number;
  data?: {
    name?: string;
    options?: DiscordInteractionOption[];
  };
  member?: {
    roles?: string[];
  };
};

type DiscordInteractionOption = {
  name: string;
  value?: string | number | boolean;
};

type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
};

export type DiscordInteractionResponse =
  | {
      type: typeof DiscordInteractionResponseType.Pong;
    }
  | {
      type: typeof DiscordInteractionResponseType.ChannelMessageWithSource;
      data: {
        content?: string;
        embeds?: DiscordEmbed[];
        flags?: number;
        allowed_mentions: {
          parse: [];
        };
      };
    };

export type DiscordDataService = ReturnType<typeof createDiscordDataService>;

export function verifyDiscordRequestSignature(input: {
  body: string;
  timestamp: string | null;
  signature: string | null;
  publicKey: string | undefined;
}) {
  const timestamp = input.timestamp?.trim();
  const signature = input.signature?.trim();
  const publicKey = input.publicKey?.trim();

  if (!timestamp || !signature || !publicKey) {
    return false;
  }

  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);

  if (
    !signatureBytes ||
    !publicKeyBytes ||
    signatureBytes.length !== 64 ||
    publicKeyBytes.length !== 32
  ) {
    return false;
  }

  const message = new TextEncoder().encode(`${timestamp}${input.body}`);

  try {
    return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export async function handleDiscordInteraction(
  interaction: DiscordInteraction,
  options: {
    service?: DiscordDataService;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<DiscordInteractionResponse> {
  if (interaction.type === DiscordInteractionType.Ping) {
    return {
      type: DiscordInteractionResponseType.Pong,
    };
  }

  if (interaction.type !== DiscordInteractionType.ApplicationCommand) {
    return messageResponse("Unsupported Discord interaction.", true);
  }

  const commandName = interaction.data?.name ?? "";
  const service = options.service ?? createDiscordDataService();
  const env = options.env ?? process.env;

  if (isStaffCommand(commandName) && !hasDiscordStaffRole(interaction, env)) {
    return messageResponse(staffPermissionDeniedMessage, true);
  }

  try {
    switch (commandName) {
      case "top":
        return topCommand(interaction, service, env);
      case "level":
        return levelCommand(interaction, service, env);
      case "player":
        return playerCommand(interaction, service, env);
      case "records":
        return recordsCommand(interaction, service, env);
      case "recent":
        return recentCommand(service, env);
      case "search":
        return searchCommand(interaction, service, env);
      case "rules":
        return rulesCommand(service, env);
      case "pending-records":
        return pendingRecordsCommand(service, env);
      case "pending-suggestions":
        return pendingSuggestionsCommand(service, env);
      case "submission":
        return submissionCommand(interaction, service);
      case "suggestion":
        return suggestionCommand(interaction, service);
      case "audit":
        return auditCommand(interaction, service);
      case "stats":
        return statsCommand(service);
      default:
        return messageResponse("Unknown NDL command.", true);
    }
  } catch (error) {
    return messageResponse(formatDiscordCommandError(error), true);
  }
}

export function createDiscordDataService() {
  return {
    async getTopLevels(limit: number) {
      const db = await getPrisma();
      const levels = await db.level.findMany({
        where: publicLevelWhere({
          status: {
            in: ["RANKED", "LEGACY"],
          },
        }),
        include: {
          _count: {
            select: {
              records: {
                where: publicRecordWhere(),
              },
            },
          },
        },
        orderBy: [{ rank: "asc" }, { name: "asc" }],
        take: limit,
      });

      return levels.map(serializePublicLevel);
    },
    async search(query: string, limit: number) {
      if (!query) {
        return { levels: [], players: [] };
      }

      const db = await getPrisma();
      const [levels, players] = await Promise.all([
        db.level.findMany({
          where: publicLevelWhere({
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { originalName: { contains: query, mode: "insensitive" } },
              { gdLevelId: { contains: query, mode: "insensitive" } },
              { publisher: { contains: query, mode: "insensitive" } },
              { nerfCreator: { contains: query, mode: "insensitive" } },
              { verifier: { contains: query, mode: "insensitive" } },
            ],
          }),
          include: {
            _count: {
              select: {
                records: {
                  where: publicRecordWhere(),
                },
              },
            },
          },
          orderBy: [{ rank: "asc" }, { name: "asc" }],
          take: limit,
        }),
        db.user.findMany({
          where: publicUserWhere({
            OR: [
              { playerName: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
            ],
          }),
          orderBy: { playerName: "asc" },
          take: limit,
        }),
      ]);

      return {
        levels: levels.map(serializePublicLevel),
        players: players.map(serializePublicPlayer),
      };
    },
    async getPlayer(handle: string) {
      const db = await getPrisma();
      const player = await db.user.findFirst({
        where: publicUserWhere({
          playerName: handle,
        }),
        include: {
          records: {
            where: publicRecordWhere({
              level: {
                status: {
                  in: ["RANKED", "LEGACY"],
                },
              },
            }),
            include: {
              player: true,
              level: true,
            },
          },
        },
      });

      if (!player) {
        return null;
      }

      return {
        player: serializePublicPlayer(player),
        summary:
          serializePublicLeaderboard(player.records)[0] ??
          ({
            rank: null,
            handle: player.playerName,
            displayName: player.displayName,
            points: 0,
            records: 0,
            lastRecordAt: null,
          } as const),
        records: player.records.map(serializePublicRecord),
      };
    },
    async getPlayerRecords(handle: string, limit: number) {
      const db = await getPrisma();
      const player = await db.user.findFirst({
        where: publicUserWhere({
          playerName: handle,
        }),
        select: {
          id: true,
        },
      });

      if (!player) {
        return null;
      }

      const records = await db.record.findMany({
        where: publicRecordWhere({
          playerId: player.id,
        }),
        include: {
          player: true,
          level: true,
        },
        orderBy: {
          acceptedAt: "desc",
        },
        take: limit,
      });

      return records.map(serializePublicRecord);
    },
    async getRecentRecords(limit: number) {
      const db = await getPrisma();
      const records = await db.record.findMany({
        where: publicRecordWhere(),
        include: {
          player: true,
          level: true,
        },
        orderBy: {
          acceptedAt: "desc",
        },
        take: limit,
      });

      return records.map(serializePublicRecord);
    },
    async getRules() {
      const db = await getPrisma();
      return db.rulesDocument.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      });
    },
    async getPendingRecords(limit: number) {
      const db = await getPrisma();
      const submissions = await db.recordSubmission.findMany({
        where: {
          status: {
            in: ["PENDING", "NEEDS_CHANGES"],
          },
        },
        include: {
          player: true,
          level: true,
          reviewer: true,
        },
        orderBy: {
          submittedAt: "asc",
        },
        take: limit,
      });

      return submissions.map(serializeStaffRecordSubmission);
    },
    async getPendingSuggestions(limit: number) {
      const db = await getPrisma();
      const suggestions = await db.levelSuggestion.findMany({
        where: {
          OR: [
            { status: "PENDING" },
            { status: "NEEDS_CHANGES" },
            { status: "APPROVED", createdLevelId: null },
          ],
        },
        include: {
          submitter: true,
          reviewer: true,
          createdLevel: true,
        },
        orderBy: {
          submittedAt: "asc",
        },
        take: limit,
      });

      return suggestions.map(serializeStaffLevelSuggestion);
    },
    async getSubmission(id: string) {
      const db = await getPrisma();
      const submission = await db.recordSubmission.findUnique({
        where: { id },
        include: {
          player: true,
          level: true,
          reviewer: true,
        },
      });

      return submission ? serializeStaffRecordSubmission(submission) : null;
    },
    async getSuggestion(id: string) {
      const db = await getPrisma();
      const suggestion = await db.levelSuggestion.findUnique({
        where: { id },
        include: {
          submitter: true,
          reviewer: true,
          createdLevel: true,
        },
      });

      return suggestion ? serializeStaffLevelSuggestion(suggestion) : null;
    },
    async getAudit(query: string, limit: number) {
      const db = await getPrisma();
      const entries = await db.adminAuditLog.findMany({
        where: query
          ? {
              OR: [
                { action: { contains: query, mode: "insensitive" } },
                { entityType: { contains: query, mode: "insensitive" } },
                { entityLabel: { contains: query, mode: "insensitive" } },
                { actorHandle: { contains: query, mode: "insensitive" } },
                { actorName: { contains: query, mode: "insensitive" } },
                { note: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return entries.map(serializeAuditLogEntry);
    },
    async getStats() {
      const db = await getPrisma();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [
        pendingRecords,
        pendingSuggestions,
        rankedLevels,
        users,
        acceptedRecords,
        moderationActions24h,
        auditEvents24h,
      ] = await Promise.all([
        db.recordSubmission.count({
          where: {
            status: {
              in: ["PENDING", "NEEDS_CHANGES"],
            },
          },
        }),
        db.levelSuggestion.count({
          where: {
            OR: [
              { status: "PENDING" },
              { status: "NEEDS_CHANGES" },
              { status: "APPROVED", createdLevelId: null },
            ],
          },
        }),
        db.level.count({
          where: {
            status: "RANKED",
          },
        }),
        db.user.count(),
        db.record.count(),
        db.moderationAction.count({
          where: {
            createdAt: {
              gte: since,
            },
          },
        }),
        db.adminAuditLog.count({
          where: {
            createdAt: {
              gte: since,
            },
          },
        }),
      ]);

      return {
        pendingRecords,
        pendingSuggestions,
        rankedLevels,
        users,
        acceptedRecords,
        moderationActions24h,
        auditEvents24h,
        generatedAt: new Date().toISOString(),
      };
    },
  };
}

export function hasDiscordStaffRole(
  interaction: Pick<DiscordInteraction, "member">,
  env: Record<string, string | undefined> = process.env,
) {
  const staffRoleId = env.DISCORD_STAFF_ROLE_ID?.trim();

  if (!staffRoleId) {
    return false;
  }

  return interaction.member?.roles?.includes(staffRoleId) ?? false;
}

export function containsSensitiveDiscordOutput(value: unknown) {
  return /\b(email|password|session|token|secret|database_url|smtp|rawFootageUrl|moderatorNotes)\b/i.test(
    JSON.stringify(value),
  );
}

async function topCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const levels = await service.getTopLevels(getIntegerOption(interaction, "count", defaultLimit));
  return embedResponse(
    [
      embed(
        "NDL Top Levels",
        levels.length
          ? levels
              .slice(0, defaultLimit)
              .map(
                (level) =>
                  `${rankLabel(level)} **${clean(level.name)}** - ${level.points} pts - ${clean(level.verifier)} - ${level.recordCount} records\n${levelUrl(env, level.slug)}`,
              )
              .join("\n")
          : "No ranked levels are available yet.",
        getSiteBaseUrl(env),
      ),
    ],
    false,
  );
}

async function levelCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const query = getStringOption(interaction, "query");

  if (!query) {
    return messageResponse("Provide a level search query.", true);
  }

  const { levels } = await service.search(query, 5);
  const level = levels[0];

  if (!level) {
    return messageResponse(`No public level matched "${clean(query)}".`, true);
  }

  return embedResponse([levelEmbed(level, env)], false);
}

async function playerCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const handle = getStringOption(interaction, "handle");

  if (!handle) {
    return messageResponse("Provide a player username.", true);
  }

  const profile = await service.getPlayer(handle);

  if (!profile) {
    return messageResponse("Player not found.", true);
  }

  const hardest = profile.records
    .filter((record) => record.level.status === "RANKED" && record.level.rank)
    .sort((a, b) => (a.level.rank ?? 99999) - (b.level.rank ?? 99999))[0];

  return embedResponse(
    [
      embed(
        profile.player.displayName,
        `${profile.summary.points} pts - ${profile.summary.records} accepted records`,
        playerUrl(env, profile.player.handle),
        [
          {
            name: "Leaderboard rank",
            value: profile.summary.rank ? `#${profile.summary.rank}` : "Unranked",
            inline: true,
          },
          {
            name: "Hardest ranked record",
            value: hardest
              ? `${rankLabel(hardest.level)} ${hardest.level.name} (${hardest.pointsAwarded} pts)`
              : "No ranked records yet.",
          },
        ],
      ),
    ],
    false,
  );
}

async function recordsCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const handle = getStringOption(interaction, "handle");

  if (!handle) {
    return messageResponse("Provide a player username.", true);
  }

  const records = await service.getPlayerRecords(handle, maxLimit);

  if (!records) {
    return messageResponse("Player not found.", true);
  }

  return embedResponse(
    [
      embed(
        `Records for ${handle}`,
        records.length
          ? records
              .slice(0, defaultLimit)
              .map(
                (record) =>
                  `${rankLabel(record.level)} **${clean(record.level.name)}** - ${record.pointsAwarded} pts - 100%\n${record.videoUrl}`,
              )
              .join("\n")
          : "No accepted records found.",
        playerUrl(env, handle),
      ),
    ],
    false,
  );
}

async function recentCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const records = await service.getRecentRecords(defaultLimit);
  return embedResponse(
    [
      embed(
        "Recent Accepted Records",
        records.length
          ? records
              .map(
                (record) =>
                  `**${clean(record.player.displayName)}** - ${rankLabel(record.level)} ${clean(record.level.name)} - ${record.pointsAwarded} pts - ${formatDate(record.acceptedAt)}`,
              )
              .join("\n")
          : "No accepted records are available yet.",
        getSiteBaseUrl(env),
      ),
    ],
    false,
  );
}

async function searchCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const query = getStringOption(interaction, "query");

  if (!query) {
    return messageResponse("Provide a search query.", true);
  }

  const { levels, players } = await service.search(query, defaultLimit);
  return embedResponse(
    [
      embed("NDL Search", `Results for "${clean(query)}"`, getSiteBaseUrl(env), [
        {
          name: "Levels",
          value: levels.length
            ? levels
                .slice(0, 5)
                .map(
                  (level) =>
                    `${rankLabel(level)} [${clean(level.name)}](${levelUrl(env, level.slug)}) - ${level.points} pts`,
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
                    `[${clean(player.displayName)}](${playerUrl(env, player.handle)})`,
                )
                .join("\n")
            : "No player matches.",
        },
      ]),
    ],
    false,
  );
}

async function rulesCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const rules = await service.getRules();

  if (!rules) {
    return messageResponse("Rules document not found.", true);
  }

  return embedResponse(
    [
      embed(
        "NDL Rules",
        `${firstParagraph(rules.content)}\n\nRead the full rules: ${getSiteBaseUrl(env)}/rules`,
        `${getSiteBaseUrl(env)}/rules`,
        [
          {
            name: "Version",
            value: `${rules.version} - ${formatDate(rules.publishedAt.toISOString())}`,
            inline: true,
          },
        ],
      ),
    ],
    false,
  );
}

async function pendingRecordsCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const submissions = await service.getPendingRecords(defaultLimit);
  return embedResponse(
    [
      embed(
        "Pending Record Submissions",
        submissions.length
          ? submissions
              .map(
                (submission) =>
                  `\`${submission.id}\` - **${clean(submission.player.displayName)}** on ${rankLabel(submission.level)} ${clean(submission.level.name)} - ${submission.status}\nVideo: ${submission.videoUrl}`,
              )
              .join("\n")
          : "No pending record submissions.",
        `${getSiteBaseUrl(env)}/moderation`,
      ),
    ],
    true,
  );
}

async function pendingSuggestionsCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const suggestions = await service.getPendingSuggestions(defaultLimit);
  return embedResponse(
    [
      embed(
        "Pending Level Suggestions",
        suggestions.length
          ? suggestions
              .map(
                (suggestion) =>
                  `\`${suggestion.id}\` - **${clean(suggestion.name)}** by ${clean(suggestion.submitter.displayName)} - ${suggestion.status}`,
              )
              .join("\n")
          : "No pending level suggestions.",
        `${getSiteBaseUrl(env)}/moderation`,
      ),
    ],
    true,
  );
}

async function submissionCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
) {
  const id = getStringOption(interaction, "id");

  if (!id) {
    return messageResponse("Provide a submission ID.", true);
  }

  const submission = await service.getSubmission(id);

  if (!submission) {
    return messageResponse("Submission not found.", true);
  }

  return embedResponse(
    [
      embed(`Submission ${submission.id}`, `${submission.status} - ${submission.player.displayName} on ${submission.level.name}`, undefined, [
        { name: "Video", value: submission.videoUrl },
        { name: "Raw footage", value: submission.rawFootageUrl ?? "No raw footage link." },
        { name: "Proof", value: `${submission.fps} FPS\nCBF: ${yesNo(submission.cbfUsed)}\nClick audio: ${yesNo(submission.clickAudioIncluded)}` },
        { name: "Moderator notes", value: submission.moderatorNotes ?? "No moderator notes." },
      ]),
    ],
    true,
  );
}

async function suggestionCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
) {
  const id = getStringOption(interaction, "id");

  if (!id) {
    return messageResponse("Provide a suggestion ID.", true);
  }

  const suggestion = await service.getSuggestion(id);

  if (!suggestion) {
    return messageResponse("Suggestion not found.", true);
  }

  return embedResponse(
    [
      embed(`Suggestion ${suggestion.id}`, `${suggestion.status} - ${suggestion.name}`, undefined, [
        { name: "Original level", value: suggestion.originalName, inline: true },
        { name: "Submitter", value: suggestion.submitter.displayName, inline: true },
        { name: "GD ID", value: suggestion.gdLevelId, inline: true },
        { name: "Showcase", value: suggestion.showcaseUrl },
        {
          name: "Compatibility notes",
          value: suggestion.compatibilityNotes || "No compatibility notes.",
        },
        { name: "Moderator notes", value: suggestion.moderatorNotes ?? "No moderator notes." },
      ]),
    ],
    true,
  );
}

async function auditCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
) {
  const query = getStringOption(interaction, "query");
  const entries = await service.getAudit(query, defaultLimit);
  return embedResponse(
    [
      embed(
        "NDL Audit",
        entries.length
          ? entries
              .map(
                (entry) =>
                  `\`${entry.action}\` - ${clean(entry.entityType)}:${clean(entry.entityLabel)} - ${clean(entry.actor.displayName)} - ${formatDate(entry.createdAt)}`,
              )
              .join("\n")
          : `No audit entries found${query ? ` for "${clean(query)}"` : ""}.`,
      ),
    ],
    true,
  );
}

async function statsCommand(service: DiscordDataService) {
  const stats = await service.getStats();
  return embedResponse(
    [
      embed("NDL Staff Stats", `Generated ${formatDate(stats.generatedAt)}`, undefined, [
        { name: "Pending records", value: String(stats.pendingRecords), inline: true },
        { name: "Pending suggestions", value: String(stats.pendingSuggestions), inline: true },
        { name: "Ranked levels", value: String(stats.rankedLevels), inline: true },
        { name: "Users", value: String(stats.users), inline: true },
        { name: "Accepted records", value: String(stats.acceptedRecords), inline: true },
        { name: "Moderation actions 24h", value: String(stats.moderationActions24h), inline: true },
      ]),
    ],
    true,
  );
}

function isStaffCommand(commandName: string) {
  return [
    "pending-records",
    "pending-suggestions",
    "submission",
    "suggestion",
    "audit",
    "stats",
  ].includes(commandName);
}

function messageResponse(
  content: string,
  ephemeral: boolean,
): DiscordInteractionResponse {
  return {
    type: DiscordInteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags: ephemeral ? DiscordMessageFlags.Ephemeral : undefined,
      allowed_mentions: { parse: [] },
    },
  };
}

function embedResponse(
  embeds: DiscordEmbed[],
  ephemeral: boolean,
): DiscordInteractionResponse {
  return {
    type: DiscordInteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds,
      flags: ephemeral ? DiscordMessageFlags.Ephemeral : undefined,
      allowed_mentions: { parse: [] },
    },
  };
}

function embed(
  title: string,
  description: string,
  url?: string,
  fields?: DiscordEmbed["fields"],
): DiscordEmbed {
  return {
    title: truncate(title, 256),
    description: truncate(description, 4096),
    color: ndlColor,
    url,
    fields: fields?.map((field) => ({
      ...field,
      name: truncate(field.name, 256),
      value: truncate(field.value, 1024),
    })),
  };
}

function levelEmbed(level: ApiLevel, env: Record<string, string | undefined>) {
  return embed(
    `${rankLabel(level)} ${level.name}`,
    `${level.status.toLowerCase()} - ${level.points} pts - ${level.recordCount} records`,
    levelUrl(env, level.slug),
    [
      { name: "Original level", value: level.originalName, inline: true },
      { name: "Verifier", value: level.verifier, inline: true },
      { name: "Nerf creator", value: level.nerfCreator, inline: true },
      { name: "GD ID", value: level.gdLevelId, inline: true },
      { name: "Showcase", value: level.showcaseUrl || "No showcase link." },
    ],
  );
}

function getStringOption(interaction: DiscordInteraction, name: string) {
  const value = interaction.data?.options?.find((option) => option.name === name)?.value;
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

function getIntegerOption(
  interaction: DiscordInteraction,
  name: string,
  fallback: number,
) {
  const value = interaction.data?.options?.find((option) => option.name === name)?.value;
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return fallback;
  }

  return Math.min(numberValue, maxLimit);
}

function getSiteBaseUrl(env: Record<string, string | undefined>) {
  return (
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.APP_URL?.trim() ||
    "https://nerfeddemonlist.net"
  ).replace(/\/+$/, "");
}

function levelUrl(env: Record<string, string | undefined>, slug: string) {
  return `${getSiteBaseUrl(env)}/levels/${encodeURIComponent(slug)}`;
}

function playerUrl(env: Record<string, string | undefined>, handle: string) {
  return `${getSiteBaseUrl(env)}/players/${encodeURIComponent(handle)}`;
}

function rankLabel(level: Pick<ApiLevel, "rank" | "status">) {
  return level.rank && level.status === "RANKED" ? `#${level.rank}` : level.status;
}

function firstParagraph(content: string) {
  return truncate(
    content
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
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
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

function formatDiscordCommandError(error: unknown) {
  if (error instanceof Error) {
    console.error("Discord interaction command failed", {
      message: error.message,
      name: error.name,
    });
  } else {
    console.error("Discord interaction command failed", { error });
  }

  return "NDL could not answer that Discord command. Try again later.";
}

async function getPrisma() {
  const { prisma } = await import("@/lib/db");
  return prisma;
}

function hexToBytes(value: string) {
  if (!/^[\da-f]+$/i.test(value) || value.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}
