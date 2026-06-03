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
  type ApiRecord,
} from "@/lib/api-serializers";
import {
  publicLevelWhere,
  publicRecordWhere,
  publicUserWhere,
} from "@/lib/demo-visibility";

export const discordInteractionEndpointPath = "/api/discord/interactions";
export const discordInteractionEndpointUrl =
  "https://www.nerfeddemonlist.net/api/discord/interactions";

export const DiscordInteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  ApplicationCommandAutocomplete: 4,
} as const;

export const DiscordInteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
  ApplicationCommandAutocompleteResult: 8,
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
const maxPublicLimit = 50;
const maxCompactLimit = 25;
const autocompleteLimit = 25;
const staffPermissionDeniedMessage =
  "You do not have permission to use this command.";

const publicCommandNames = [
  "top",
  "level",
  "player",
  "records",
  "recent",
  "search",
  "rules",
  "level-records",
  "leaderboard",
  "about",
  "status",
] as const;

const staffCommandNames = [
  "pending-records",
  "pending-suggestions",
  "submission",
  "suggestion",
  "audit",
  "stats",
] as const;

type TopStatusFilter = "ranked" | "legacy" | "all-public";

type DiscordCommandChoice = {
  name: string;
  value: string | number;
};

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
    autocomplete?: boolean;
    choices?: DiscordCommandChoice[];
  }>;
};

export const discordCommandDefinitions: DiscordCommandDefinition[] = [
  {
    name: "top",
    description: "Show top NDL levels.",
    options: [
      {
        name: "count",
        description: "Number of levels to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 50,
      },
      {
        name: "status",
        description: "Which public levels to include.",
        type: commandOptionType.String,
        choices: [
          { name: "ranked", value: "ranked" },
          { name: "legacy", value: "legacy" },
          { name: "all-public", value: "all-public" },
        ],
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
        autocomplete: true,
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
        autocomplete: true,
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
        autocomplete: true,
      },
      {
        name: "limit",
        description: "Number of records to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  {
    name: "recent",
    description: "Show recent accepted NDL records.",
    options: [
      {
        name: "count",
        description: "Number of records to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
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
    name: "level-records",
    description: "Show accepted records for an NDL level.",
    options: [
      {
        name: "level",
        description: "Level name, original level, GD ID, creator, or verifier.",
        type: commandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: "limit",
        description: "Number of records to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "Show top NDL players by points.",
    options: [
      {
        name: "count",
        description: "Number of players to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 50,
      },
    ],
  },
  {
    name: "about",
    description: "Show what NDL and this bot do.",
  },
  {
    name: "status",
    description: "Show safe NDL API and bot status.",
  },
  {
    name: "pending-records",
    description: "Show pending NDL record submissions.",
    options: [
      {
        name: "limit",
        description: "Number of submissions to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  {
    name: "pending-suggestions",
    description: "Show pending NDL level suggestions.",
    options: [
      {
        name: "limit",
        description: "Number of suggestions to show.",
        type: commandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
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
  focused?: boolean;
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
  footer?: {
    text: string;
  };
  timestamp?: string;
};

type DiscordAutocompleteChoice = {
  name: string;
  value: string;
};

type StaffRecordSubmission = ReturnType<typeof serializeStaffRecordSubmission>;
type StaffLevelSuggestion = ReturnType<typeof serializeStaffLevelSuggestion>;
type ApiAuditLogEntry = ReturnType<typeof serializeAuditLogEntry>;

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
    }
  | {
      type: typeof DiscordInteractionResponseType.ApplicationCommandAutocompleteResult;
      data: {
        choices: DiscordAutocompleteChoice[];
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

  const service = options.service ?? createDiscordDataService();
  const env = options.env ?? process.env;

  if (interaction.type === DiscordInteractionType.ApplicationCommandAutocomplete) {
    return autocompleteCommand(interaction, service);
  }

  if (interaction.type !== DiscordInteractionType.ApplicationCommand) {
    return messageResponse("Unsupported Discord interaction.", true);
  }

  const commandName = interaction.data?.name ?? "";

  if (isStaffCommand(commandName) && !hasDiscordStaffRole(interaction, env)) {
    return messageResponse(staffPermissionDeniedMessage, true);
  }

  try {
    switch (commandName) {
      case "top":
        return await topCommand(interaction, service, env);
      case "level":
        return await levelCommand(interaction, service, env);
      case "player":
        return await playerCommand(interaction, service, env);
      case "records":
        return await recordsCommand(interaction, service, env);
      case "recent":
        return await recentCommand(interaction, service, env);
      case "search":
        return await searchCommand(interaction, service, env);
      case "rules":
        return await rulesCommand(service, env);
      case "level-records":
        return await levelRecordsCommand(interaction, service, env);
      case "leaderboard":
        return await leaderboardCommand(interaction, service, env);
      case "about":
        return aboutCommand(env);
      case "status":
        return await statusCommand(service, env);
      case "pending-records":
        return await pendingRecordsCommand(interaction, service, env);
      case "pending-suggestions":
        return await pendingSuggestionsCommand(interaction, service, env);
      case "submission":
        return await submissionCommand(interaction, service, env);
      case "suggestion":
        return await suggestionCommand(interaction, service, env);
      case "audit":
        return await auditCommand(interaction, service, env);
      case "stats":
        return await statsCommand(service, env);
      default:
        return messageResponse("Unknown NDL command.", true);
    }
  } catch (error) {
    return messageResponse(formatDiscordCommandError(error), true);
  }
}

export function createDiscordDataService() {
  return {
    async getTopLevels(limit: number, statusFilter: TopStatusFilter) {
      const db = await getPrisma();
      const where =
        statusFilter === "legacy"
          ? publicLevelWhere({ status: "LEGACY" })
          : statusFilter === "all-public"
            ? publicLevelWhere({ status: { in: ["RANKED", "LEGACY"] } })
            : publicLevelWhere({ status: "RANKED" });

      const levels = await db.level.findMany({
        where,
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
        take: statusFilter === "all-public" ? limit * 2 : limit,
      });

      return levels
        .map(serializePublicLevel)
        .sort(sortPublicLevels)
        .slice(0, limit);
    },
    async search(query: string, limit: number) {
      const normalizedQuery = query.trim();

      if (!normalizedQuery) {
        return { levels: [], players: [] };
      }

      const db = await getPrisma();
      const [levels, players] = await Promise.all([
        db.level.findMany({
          where: publicLevelWhere({
            OR: [
              { slug: { contains: normalizedQuery, mode: "insensitive" } },
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { originalName: { contains: normalizedQuery, mode: "insensitive" } },
              { gdLevelId: { contains: normalizedQuery, mode: "insensitive" } },
              { publisher: { contains: normalizedQuery, mode: "insensitive" } },
              { nerfCreator: { contains: normalizedQuery, mode: "insensitive" } },
              { verifier: { contains: normalizedQuery, mode: "insensitive" } },
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
              { playerName: { contains: normalizedQuery, mode: "insensitive" } },
              { displayName: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          }),
          orderBy: { playerName: "asc" },
          take: limit,
        }),
      ]);

      return {
        levels: levels.map(serializePublicLevel).sort(sortPublicLevels),
        players: players.map(serializePublicPlayer),
      };
    },
    async getLevelRecords(query: string, limit: number) {
      const normalizedQuery = query.trim();

      if (!normalizedQuery) {
        return null;
      }

      const db = await getPrisma();
      const levels = await db.level.findMany({
        where: publicLevelWhere({
          OR: [
            { slug: { contains: normalizedQuery, mode: "insensitive" } },
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            { originalName: { contains: normalizedQuery, mode: "insensitive" } },
            { gdLevelId: { contains: normalizedQuery, mode: "insensitive" } },
            { publisher: { contains: normalizedQuery, mode: "insensitive" } },
            { nerfCreator: { contains: normalizedQuery, mode: "insensitive" } },
            { verifier: { contains: normalizedQuery, mode: "insensitive" } },
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
        take: 3,
      });

      const [level] = levels.map(serializePublicLevel).sort(sortPublicLevels);

      if (!level) {
        return null;
      }

      const records = await db.record.findMany({
        where: publicRecordWhere({
          levelId: level.id,
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

      return {
        level,
        matches: levels.map(serializePublicLevel).sort(sortPublicLevels),
        records: records.map(serializePublicRecord),
      };
    },
    async getLeaderboard(limit: number) {
      const db = await getPrisma();
      const records = await db.record.findMany({
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
      });

      return serializePublicLeaderboard(records).slice(0, limit);
    },
    async getPlayer(handle: string) {
      const db = await getPrisma();
      const [player, leaderboardRecords] = await Promise.all([
        db.user.findFirst({
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
        }),
        db.record.findMany({
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
        }),
      ]);

      if (!player) {
        return null;
      }

      const summary = serializePublicLeaderboard(leaderboardRecords).find(
        (row) => row.handle === player.playerName,
      );

      return {
        player: serializePublicPlayer(player),
        summary:
          summary ??
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
    async getStatusStats() {
      const db = await getPrisma();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [
        rankedLevels,
        legacyLevels,
        acceptedRecords7d,
        latestAcceptedRecord,
      ] = await Promise.all([
        db.level.count({
          where: publicLevelWhere({
            status: "RANKED",
          }),
        }),
        db.level.count({
          where: publicLevelWhere({
            status: "LEGACY",
          }),
        }),
        db.record.count({
          where: publicRecordWhere({
            acceptedAt: {
              gte: sevenDaysAgo,
            },
          }),
        }),
        db.record.findFirst({
          where: publicRecordWhere(),
          orderBy: {
            acceptedAt: "desc",
          },
          select: {
            acceptedAt: true,
          },
        }),
      ]);

      return {
        apiReachable: true,
        rankedLevels,
        legacyLevels,
        acceptedRecords7d,
        latestAcceptedAt: latestAcceptedRecord?.acceptedAt.toISOString() ?? null,
        botMode: "Vercel HTTP interactions",
        generatedAt: new Date().toISOString(),
      };
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
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [
        pendingRecords,
        pendingSuggestions,
        rankedLevels,
        legacyLevels,
        users,
        acceptedRecords,
        acceptedRecords7d,
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
        db.level.count({
          where: {
            status: "LEGACY",
          },
        }),
        db.user.count(),
        db.record.count(),
        db.record.count({
          where: {
            acceptedAt: {
              gte: since7d,
            },
          },
        }),
        db.moderationAction.count({
          where: {
            createdAt: {
              gte: since24h,
            },
          },
        }),
        db.adminAuditLog.count({
          where: {
            createdAt: {
              gte: since24h,
            },
          },
        }),
      ]);

      return {
        pendingRecords,
        pendingSuggestions,
        rankedLevels,
        legacyLevels,
        users,
        acceptedRecords,
        acceptedRecords7d,
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
  return /\b(email|password|session|token|secret|database_url|smtp|rawFootageUrl|moderatorNotes|adminNotes)\b/i.test(
    JSON.stringify(value),
  );
}

async function autocompleteCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
): Promise<DiscordInteractionResponse> {
  const commandName = interaction.data?.name ?? "";
  const focusedOption = getFocusedOption(interaction);
  const query = typeof focusedOption?.value === "string" ? focusedOption.value : "";

  if (!query.trim()) {
    return autocompleteResponse([]);
  }

  try {
    if (
      (commandName === "level" && focusedOption?.name === "query") ||
      (commandName === "level-records" && focusedOption?.name === "level")
    ) {
      const { levels } = await service.search(query, autocompleteLimit);

      return autocompleteResponse(
        levels.slice(0, autocompleteLimit).map((level) => ({
          name: truncate(
            `${rankLabel(level)} ${level.name} - ${level.verifier}`,
            100,
          ),
          value: truncate(level.name, 100),
        })),
      );
    }

    if (
      (commandName === "player" || commandName === "records") &&
      focusedOption?.name === "handle"
    ) {
      const { players } = await service.search(query, autocompleteLimit);

      return autocompleteResponse(
        players.slice(0, autocompleteLimit).map((player) => ({
          name: truncate(`${player.displayName} (${player.handle})`, 100),
          value: truncate(player.handle, 100),
        })),
      );
    }
  } catch {
    return autocompleteResponse([]);
  }

  return autocompleteResponse([]);
}

async function topCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const count = getIntegerOption(interaction, "count", defaultLimit, maxPublicLimit);
  const status = getTopStatusOption(interaction);
  const levels = await service.getTopLevels(count, status);
  const title =
    status === "legacy"
      ? "NDL Legacy Levels"
      : status === "all-public"
        ? "NDL Public Levels"
        : "NDL Top Ranked Levels";

  return embedResponse(
    [
      embed(
        title,
        levels.length
          ? `${formatLevelList(levels)}\n\n${markdownLink("View full ranked list", getSiteBaseUrl(env))}`
          : "No public levels are available yet.",
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

  return embedResponse([levelEmbed(level, env, levels.slice(1, 3))], false);
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
    return messageResponse("No public player found for that handle.", true);
  }

  const topRecords = sortRecordsByRankAndPoints(profile.records).slice(0, 5);
  const hardest = topRecords.find(
    (record) => record.level.status === "RANKED" && record.level.rank,
  );

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
          {
            name: "Top records",
            value: topRecords.length
              ? topRecords
                  .map(
                    (record) =>
                      `${rankLabel(record.level)} ${record.level.name} - ${record.pointsAwarded} pts`,
                  )
                  .join("\n")
              : "No accepted records yet.",
          },
          {
            name: "View more",
            value: markdownLink("Open player page", playerUrl(env, profile.player.handle)),
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
  const limit = getIntegerOption(interaction, "limit", defaultLimit, maxCompactLimit);

  if (!handle) {
    return messageResponse("Provide a player username.", true);
  }

  const records = await service.getPlayerRecords(handle, limit);

  if (!records) {
    return messageResponse("No public player found for that handle.", true);
  }

  return embedResponse(
    [
      embed(
        `Records for ${handle}`,
        records.length
          ? `${formatRecordList(records)}\n\n${markdownLink("View more on NDL", playerUrl(env, handle))}`
          : "No accepted records found.",
        playerUrl(env, handle),
      ),
    ],
    false,
  );
}

async function recentCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const count = getIntegerOption(interaction, "count", defaultLimit, maxCompactLimit);
  const records = await service.getRecentRecords(count);

  return embedResponse(
    [
      embed(
        "Recent Accepted Records",
        records.length
          ? `${records
              .map(
                (record) =>
                  `${markdownLink(record.player.displayName, playerUrl(env, record.player.handle))} - ${markdownLink(`${rankLabel(record.level)} ${record.level.name}`, levelUrl(env, record.level.slug))} - ${record.pointsAwarded} pts - ${formatDate(record.acceptedAt)}`,
              )
              .join("\n")}\n\n${markdownLink("View NDL", getSiteBaseUrl(env))}`
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
                    `${rankLabel(level)} ${markdownLink(level.name, levelUrl(env, level.slug))} - ${level.points} pts`,
                )
                .join("\n")
            : "No level matches.",
        },
        {
          name: "Players",
          value: players.length
            ? players
                .slice(0, 5)
                .map((player) =>
                  markdownLink(player.displayName, playerUrl(env, player.handle)),
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
  const fields: DiscordEmbed["fields"] = [
    {
      name: "Core summary",
      value:
        "Accepted NDL versions are required.\nVideo proof is required.\nHigh-ranked records need raw footage for staff review.\nMacros, replay bots, noclip, and equivalent completion cheats are banned.\nCBF is currently allowed.",
    },
    {
      name: "Read the full rules",
      value: markdownLink("Open NDL rules", `${getSiteBaseUrl(env)}/rules`),
    },
  ];

  if (rules) {
    fields.push({
      name: "Version",
      value: `${rules.version} - ${formatDate(rules.publishedAt.toISOString())}`,
      inline: true,
    });
  }

  return embedResponse(
    [
      embed(
        "NDL Rules",
        "A concise summary for Discord. The website rules are the source of truth.",
        `${getSiteBaseUrl(env)}/rules`,
        fields,
      ),
    ],
    false,
  );
}

async function levelRecordsCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const query = getStringOption(interaction, "level");
  const limit = getIntegerOption(interaction, "limit", defaultLimit, maxCompactLimit);

  if (!query) {
    return messageResponse("Provide a level search query.", true);
  }

  const result = await service.getLevelRecords(query, limit);

  if (!result) {
    return messageResponse(`No public level matched "${clean(query)}".`, true);
  }

  return embedResponse(
    [
      embed(
        `Records for ${result.level.name}`,
        result.records.length
          ? `${formatRecordList(result.records)}\n\n${markdownLink("Open level page", levelUrl(env, result.level.slug))}`
          : "No accepted records found for this level.",
        levelUrl(env, result.level.slug),
        result.matches.length > 1
          ? [
              {
                name: "Other matches",
                value: formatLevelSuggestions(result.matches.slice(1, 3), env),
              },
            ]
          : undefined,
      ),
    ],
    false,
  );
}

async function leaderboardCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const count = getIntegerOption(interaction, "count", defaultLimit, maxPublicLimit);
  const players = await service.getLeaderboard(count);

  return embedResponse(
    [
      embed(
        "NDL Player Leaderboard",
        players.length
          ? `${players
              .map(
                (player) =>
                  `#${player.rank} ${markdownLink(player.displayName, playerUrl(env, player.handle))} - ${player.points} pts - ${player.records} records`,
              )
              .join("\n")}\n\n${markdownLink("View full leaderboard", `${getSiteBaseUrl(env)}/players`)}`
          : "No accepted records are available yet.",
        `${getSiteBaseUrl(env)}/players`,
      ),
    ],
    false,
  );
}

function aboutCommand(env: Record<string, string | undefined>) {
  const siteUrl = getSiteBaseUrl(env);

  return embedResponse(
    [
      embed(
        "About Nerfed Demonlist",
        "NDL is a community-ranked list for approved nerfed Geometry Dash demon versions.",
        siteUrl,
        [
          {
            name: "Site",
            value: markdownLink("Open Nerfed Demonlist", siteUrl),
            inline: true,
          },
          {
            name: "Bot commands",
            value:
              "/top, /level, /player, /records, /recent, /search, /rules, /level-records, /leaderboard, /about, /status",
          },
          {
            name: "Non-affiliation",
            value:
              "Nerfed Demonlist is not affiliated with RobTopGames, Geometry Dash, Pointercrate, or the official Demonlist.",
          },
        ],
      ),
    ],
    false,
  );
}

async function statusCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const stats = await service.getStatusStats();

  return embedResponse(
    [
      embed("NDL Status", "Safe public status for the Discord integration.", getSiteBaseUrl(env), [
        { name: "API reachable", value: yesNo(stats.apiReachable), inline: true },
        { name: "Ranked levels", value: String(stats.rankedLevels), inline: true },
        {
          name: "Recent accepted records",
          value: `${stats.acceptedRecords7d} in the last 7 days`,
          inline: true,
        },
        { name: "Bot mode", value: stats.botMode, inline: true },
        {
          name: "Latest accepted record",
          value: stats.latestAcceptedAt ? formatDate(stats.latestAcceptedAt) : "None yet.",
          inline: true,
        },
      ]),
    ],
    false,
  );
}

async function pendingRecordsCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const limit = getIntegerOption(interaction, "limit", defaultLimit, maxCompactLimit);
  const submissions = await service.getPendingRecords(limit);

  return embedResponse(
    [
      embed(
        "Pending Record Submissions",
        submissions.length
          ? `${submissions
              .map(formatPendingRecordLine)
              .join("\n")}\n\n${markdownLink("Open moderation queue", `${getSiteBaseUrl(env)}/moderation`)}`
          : "No pending record submissions.",
        `${getSiteBaseUrl(env)}/moderation`,
      ),
    ],
    true,
  );
}

async function pendingSuggestionsCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const limit = getIntegerOption(interaction, "limit", defaultLimit, maxCompactLimit);
  const suggestions = await service.getPendingSuggestions(limit);

  return embedResponse(
    [
      embed(
        "Pending Level Suggestions",
        suggestions.length
          ? `${suggestions
              .map(formatPendingSuggestionLine)
              .join("\n")}\n\n${markdownLink("Open moderation queue", `${getSiteBaseUrl(env)}/moderation`)}`
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
  env: Record<string, string | undefined>,
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
      embed(
        `Submission ${submission.id}`,
        `${submission.status} - ${submission.player.displayName} on ${submission.level.name}`,
        `${getSiteBaseUrl(env)}/moderation?q=${encodeURIComponent(submission.id)}`,
        [
          { name: "Level", value: `${rankLabel(submission.level)} ${submission.level.name}`, inline: true },
          { name: "Player", value: submission.player.displayName, inline: true },
          { name: "Submitted", value: formatDate(submission.submittedAt), inline: true },
          {
            name: "Proof summary",
            value: `${submission.fps} FPS\nCBF: ${yesNo(submission.cbfUsed)}\nClick audio: ${yesNo(submission.clickAudioIncluded)}\nPrivate proof on file: ${yesNo(Boolean(submission.rawFootageUrl || submission.proofImageUrl))}`,
          },
          {
            name: "Review on NDL",
            value: markdownLink("Open moderation queue", `${getSiteBaseUrl(env)}/moderation?q=${encodeURIComponent(submission.id)}`),
          },
        ],
      ),
    ],
    true,
  );
}

async function suggestionCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
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
      embed(
        `Suggestion ${suggestion.id}`,
        `${suggestion.status} - ${suggestion.name}`,
        `${getSiteBaseUrl(env)}/moderation?q=${encodeURIComponent(suggestion.id)}`,
        [
          { name: "Original level", value: suggestion.originalName, inline: true },
          { name: "Submitter", value: suggestion.submitter.displayName, inline: true },
          { name: "GD ID", value: suggestion.gdLevelId, inline: true },
          { name: "Nerf creator", value: suggestion.nerfCreator, inline: true },
          { name: "Verifier", value: suggestion.verifier, inline: true },
          { name: "Showcase", value: suggestion.showcaseUrl || "No showcase link." },
          {
            name: "Review on NDL",
            value: markdownLink("Open moderation queue", `${getSiteBaseUrl(env)}/moderation?q=${encodeURIComponent(suggestion.id)}`),
          },
        ],
      ),
    ],
    true,
  );
}

async function auditCommand(
  interaction: DiscordInteraction,
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const query = getStringOption(interaction, "query");
  const entries = await service.getAudit(query, defaultLimit);

  return embedResponse(
    [
      embed(
        "NDL Audit",
        entries.length
          ? `${entries
              .map(formatAuditLine)
              .join("\n")}\n\n${markdownLink("Open audit log", `${getSiteBaseUrl(env)}/admin/audit`)}`
          : `No audit entries found${query ? ` for "${clean(query)}"` : ""}.`,
        `${getSiteBaseUrl(env)}/admin/audit`,
      ),
    ],
    true,
  );
}

async function statsCommand(
  service: DiscordDataService,
  env: Record<string, string | undefined>,
) {
  const stats = await service.getStats();

  return embedResponse(
    [
      embed("NDL Staff Stats", `Generated ${formatDate(stats.generatedAt)}`, `${getSiteBaseUrl(env)}/admin`, [
        { name: "Pending records", value: String(stats.pendingRecords), inline: true },
        { name: "Pending suggestions", value: String(stats.pendingSuggestions), inline: true },
        { name: "Ranked levels", value: String(stats.rankedLevels), inline: true },
        { name: "Legacy levels", value: String(stats.legacyLevels), inline: true },
        { name: "Users", value: String(stats.users), inline: true },
        { name: "Accepted records 7d", value: String(stats.acceptedRecords7d), inline: true },
      ]),
    ],
    true,
  );
}

function isStaffCommand(commandName: string) {
  return (staffCommandNames as readonly string[]).includes(commandName);
}

function messageResponse(
  content: string,
  ephemeral: boolean,
): DiscordInteractionResponse {
  return {
    type: DiscordInteractionResponseType.ChannelMessageWithSource,
    data: {
      content: truncate(content, 2000),
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
      embeds: embeds.slice(0, 10),
      flags: ephemeral ? DiscordMessageFlags.Ephemeral : undefined,
      allowed_mentions: { parse: [] },
    },
  };
}

function autocompleteResponse(
  choices: DiscordAutocompleteChoice[],
): DiscordInteractionResponse {
  return {
    type: DiscordInteractionResponseType.ApplicationCommandAutocompleteResult,
    data: {
      choices: choices.slice(0, autocompleteLimit).map((choice) => ({
        name: truncate(choice.name, 100),
        value: truncate(choice.value, 100),
      })),
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
    fields: fields?.slice(0, 25).map((field) => ({
      ...field,
      name: truncate(field.name, 256),
      value: truncate(field.value || "None.", 1024),
    })),
    footer: {
      text: "Nerfed Demonlist",
    },
    timestamp: new Date().toISOString(),
  };
}

function levelEmbed(
  level: ApiLevel,
  env: Record<string, string | undefined>,
  otherMatches: ApiLevel[] = [],
) {
  const fields: DiscordEmbed["fields"] = [
    { name: "Rank/status", value: rankLabel(level), inline: true },
    { name: "Points", value: `${level.points} pts`, inline: true },
    { name: "Records", value: String(level.recordCount), inline: true },
    { name: "Original level", value: level.originalName, inline: true },
    { name: "Publisher/host", value: level.publisher, inline: true },
    { name: "Nerf creator", value: level.nerfCreator, inline: true },
    { name: "Verifier", value: level.verifier, inline: true },
    { name: "GD level ID", value: level.gdLevelId, inline: true },
    { name: "Showcase", value: level.showcaseUrl || "No showcase link." },
  ];

  if (otherMatches.length > 0) {
    fields.push({
      name: "Other matches",
      value: formatLevelSuggestions(otherMatches, env),
    });
  }

  fields.push({
    name: "View on NDL",
    value: markdownLink("Open level page", levelUrl(env, level.slug)),
  });

  return embed(level.name, `${level.status.toLowerCase()} - ${level.points} pts`, levelUrl(env, level.slug), fields);
}

function formatLevelList(levels: ApiLevel[]) {
  return levels
    .map(
      (level) =>
        `${rankLabel(level)} **${clean(level.name)}** - ${level.points} pts - ${clean(level.verifier)} - ${level.recordCount} records`,
    )
    .join("\n");
}

function formatRecordList(records: ApiRecord[]) {
  return records
    .map(
      (record) =>
        `${rankLabel(record.level)} **${clean(record.level.name)}** - ${record.pointsAwarded} pts - 100% - ${formatDate(record.acceptedAt)}\n${record.videoUrl}`,
    )
    .join("\n");
}

function formatLevelSuggestions(levels: ApiLevel[], env: Record<string, string | undefined>) {
  return levels
    .map(
      (level) =>
        `${rankLabel(level)} ${markdownLink(level.name, levelUrl(env, level.slug))} - ${level.points} pts`,
    )
    .join("\n");
}

function formatPendingRecordLine(submission: StaffRecordSubmission) {
  return `\`${submission.id}\` - **${clean(submission.player.displayName)}** on ${rankLabel(submission.level)} ${clean(submission.level.name)} - ${submission.status} - ${formatDate(submission.submittedAt)}`;
}

function formatPendingSuggestionLine(suggestion: StaffLevelSuggestion) {
  return `\`${suggestion.id}\` - **${clean(suggestion.name)}** by ${clean(suggestion.submitter.displayName)} - ${suggestion.status} - ${formatDate(suggestion.submittedAt)}`;
}

function formatAuditLine(entry: ApiAuditLogEntry) {
  return `\`${clean(entry.action)}\` - ${clean(entry.entityType)}:${clean(entry.entityLabel)} - ${clean(entry.actor.displayName)} - ${formatDate(entry.createdAt)}`;
}

function getStringOption(interaction: DiscordInteraction, name: string) {
  const value = interaction.data?.options?.find((option) => option.name === name)?.value;
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

function getIntegerOption(
  interaction: DiscordInteraction,
  name: string,
  fallback: number,
  maximum: number,
) {
  const value = interaction.data?.options?.find((option) => option.name === name)?.value;
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return fallback;
  }

  return Math.min(numberValue, maximum);
}

function getFocusedOption(interaction: DiscordInteraction) {
  return interaction.data?.options?.find((option) => option.focused);
}

function getTopStatusOption(interaction: DiscordInteraction): TopStatusFilter {
  const status = getStringOption(interaction, "status");

  return status === "legacy" || status === "all-public" ? status : "ranked";
}

function getSiteBaseUrl(env: Record<string, string | undefined>) {
  return (
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.APP_URL?.trim() ||
    "https://www.nerfeddemonlist.net"
  ).replace(/\/+$/, "");
}

function levelUrl(env: Record<string, string | undefined>, slug: string) {
  return `${getSiteBaseUrl(env)}/levels/${encodeURIComponent(slug)}`;
}

function playerUrl(env: Record<string, string | undefined>, handle: string) {
  return `${getSiteBaseUrl(env)}/players/${encodeURIComponent(handle)}`;
}

function markdownLink(label: string, url: string) {
  return `[${clean(label).replace(/[[\]]/g, "")}](${url})`;
}

function rankLabel(level: Pick<ApiLevel, "rank" | "status">) {
  return level.rank && level.status === "RANKED" ? `#${level.rank}` : level.status;
}

function clean(value: string) {
  return truncate(value.replace(/\s+/g, " ").trim(), 900);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
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

function sortPublicLevels(first: ApiLevel, second: ApiLevel) {
  const firstStatus = first.status === "RANKED" ? 0 : 1;
  const secondStatus = second.status === "RANKED" ? 0 : 1;

  return (
    firstStatus - secondStatus ||
    (first.rank ?? 99999) - (second.rank ?? 99999) ||
    first.name.localeCompare(second.name)
  );
}

function sortRecordsByRankAndPoints(records: ApiRecord[]) {
  return [...records].sort(
    (first, second) =>
      (first.level.rank ?? 99999) - (second.level.rank ?? 99999) ||
      second.pointsAwarded - first.pointsAwarded ||
      first.level.name.localeCompare(second.level.name),
  );
}

function formatDiscordCommandError(error: unknown) {
  if (error instanceof Error) {
    console.error("Discord interaction command failed", {
      message: error.message,
      name: error.name,
    });

    if (/\b429\b|rate/i.test(error.message)) {
      return "NDL is rate limiting requests. Wait a bit and try again.";
    }

    if (/\b404\b|not found/i.test(error.message)) {
      return "NDL could not find that result.";
    }
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

export function getDiscordCommandGroups() {
  return {
    public: [...publicCommandNames],
    staff: [...staffCommandNames],
  };
}
