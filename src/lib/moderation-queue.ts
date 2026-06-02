import type { Prisma, PrismaClient } from "../generated/prisma/client";

export const moderationQueueStatuses = ["PENDING", "NEEDS_CHANGES"] as const;

export const recordModerationStatuses = [
  "PENDING",
  "NEEDS_CHANGES",
  "ACCEPTED",
  "REJECTED",
] as const;

export const suggestionModerationStatuses = [
  "PENDING",
  "APPROVED",
  "NEEDS_CHANGES",
  "REJECTED",
  "CONVERTED",
] as const;

export const recordSortOptions = [
  "newest",
  "oldest",
  "rank-high",
  "rank-low",
] as const;

export const suggestionSortOptions = [
  "newest",
  "oldest",
  "approved",
  "pending",
] as const;

export const moderationPageSize = 25;

type RecordModerationStatus = (typeof recordModerationStatuses)[number];
type SuggestionModerationStatus =
  (typeof suggestionModerationStatuses)[number];
type RecordSort = (typeof recordSortOptions)[number];
type SuggestionSort = (typeof suggestionSortOptions)[number];

export type ModerationSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type RecordModerationFilters = {
  statuses: RecordModerationStatus[];
  statusParam: string;
  level: string;
  player: string;
  from: Date | null;
  fromParam: string;
  to: Date | null;
  toParam: string;
  sort: RecordSort;
  page: number;
  pageSize: number;
  q: string;
};

export type SuggestionModerationFilters = {
  statuses: SuggestionModerationStatus[];
  statusParam: string;
  name: string;
  original: string;
  submitter: string;
  from: Date | null;
  fromParam: string;
  to: Date | null;
  toParam: string;
  sort: SuggestionSort;
  page: number;
  pageSize: number;
  q: string;
};

export type ModerationFilters = {
  q: string;
  record: RecordModerationFilters;
  suggestion: SuggestionModerationFilters;
};

type ModerationQueueClient = Pick<
  PrismaClient,
  "recordSubmission" | "levelSuggestion"
>;

export type RecordSubmissionListItem = Prisma.RecordSubmissionGetPayload<{
  include: ReturnType<typeof recordSubmissionInclude>;
}>;

export type LevelSuggestionListItem = Prisma.LevelSuggestionGetPayload<{
  include: ReturnType<typeof levelSuggestionInclude>;
}>;

export function parseModerationFilters(
  params: ModerationSearchParams,
): ModerationFilters {
  const q = cleanTextParam(firstParam(params.q));

  return {
    q,
    record: {
      statuses: parseRecordStatuses(params.recordStatus),
      statusParam: firstParam(params.recordStatus),
      level: cleanTextParam(firstParam(params.recordLevel)),
      player: cleanTextParam(firstParam(params.recordPlayer)),
      from: parseStartDate(firstParam(params.recordFrom)),
      fromParam: firstParam(params.recordFrom),
      to: parseEndDate(firstParam(params.recordTo)),
      toParam: firstParam(params.recordTo),
      sort: parseRecordSort(firstParam(params.recordSort)),
      page: parsePage(firstParam(params.recordPage)),
      pageSize: moderationPageSize,
      q,
    },
    suggestion: {
      statuses: parseSuggestionStatuses(params.suggestionStatus),
      statusParam: firstParam(params.suggestionStatus),
      name: cleanTextParam(firstParam(params.suggestionName)),
      original: cleanTextParam(firstParam(params.suggestionOriginal)),
      submitter: cleanTextParam(firstParam(params.suggestionSubmitter)),
      from: parseStartDate(firstParam(params.suggestionFrom)),
      fromParam: firstParam(params.suggestionFrom),
      to: parseEndDate(firstParam(params.suggestionTo)),
      toParam: firstParam(params.suggestionTo),
      sort: parseSuggestionSort(firstParam(params.suggestionSort)),
      page: parsePage(firstParam(params.suggestionPage)),
      pageSize: moderationPageSize,
      q,
    },
  };
}

export function moderationQueueWhere(
  filters: RecordModerationFilters = parseModerationFilters({}).record,
) {
  return recordSubmissionWhere(filters);
}

export function moderationQueueQuery(
  filters: RecordModerationFilters = parseModerationFilters({}).record,
) {
  return recordSubmissionQuery(filters);
}

export function recordSubmissionWhere(filters: RecordModerationFilters) {
  const and: Prisma.RecordSubmissionWhereInput[] = [
    {
      status: {
        in: filters.statuses,
      },
    },
  ];

  if (filters.level) {
    and.push({
      level: {
        OR: [
          { name: contains(filters.level) },
          { originalName: contains(filters.level) },
        ],
      },
    });
  }

  if (filters.player) {
    and.push({
      player: {
        OR: [
          { displayName: contains(filters.player) },
          { playerName: contains(filters.player) },
        ],
      },
    });
  }

  const submittedAt = dateRange(filters.from, filters.to);
  if (submittedAt) {
    and.push({ submittedAt });
  }

  if (filters.q) {
    and.push({
      OR: [
        { videoUrl: contains(filters.q) },
        { proofNotes: contains(filters.q) },
        { moderatorNotes: contains(filters.q) },
        {
          player: {
            OR: [
              { displayName: contains(filters.q) },
              { playerName: contains(filters.q) },
            ],
          },
        },
        {
          level: {
            OR: [
              { name: contains(filters.q) },
              { originalName: contains(filters.q) },
            ],
          },
        },
      ],
    });
  }

  return { AND: and } satisfies Prisma.RecordSubmissionWhereInput;
}

export function recordSubmissionOrderBy(filters: RecordModerationFilters) {
  if (filters.sort === "oldest") {
    return [{ submittedAt: "asc" as const }];
  }

  if (filters.sort === "rank-high") {
    return [
      { level: { rank: "asc" as const } },
      { submittedAt: "desc" as const },
    ];
  }

  if (filters.sort === "rank-low") {
    return [
      { level: { rank: "desc" as const } },
      { submittedAt: "desc" as const },
    ];
  }

  return [{ submittedAt: "desc" as const }];
}

export function recordSubmissionQuery(filters: RecordModerationFilters) {
  return {
    where: recordSubmissionWhere(filters),
    include: recordSubmissionInclude(),
    orderBy: recordSubmissionOrderBy(filters),
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  } satisfies Prisma.RecordSubmissionFindManyArgs;
}

export function levelSuggestionWhere(filters: SuggestionModerationFilters) {
  const and: Prisma.LevelSuggestionWhereInput[] = [
    {
      OR: filters.statuses.map((status) =>
        status === "APPROVED"
          ? { status, createdLevelId: null }
          : { status },
      ),
    },
  ];

  if (filters.name) {
    and.push({ name: contains(filters.name) });
  }

  if (filters.original) {
    and.push({ originalName: contains(filters.original) });
  }

  if (filters.submitter) {
    and.push({
      submitter: {
        OR: [
          { displayName: contains(filters.submitter) },
          { playerName: contains(filters.submitter) },
        ],
      },
    });
  }

  const submittedAt = dateRange(filters.from, filters.to);
  if (submittedAt) {
    and.push({ submittedAt });
  }

  if (filters.q) {
    and.push({
      OR: [
        { name: contains(filters.q) },
        { originalName: contains(filters.q) },
        { gdLevelId: contains(filters.q) },
        { nerfCreator: contains(filters.q) },
        { verifier: contains(filters.q) },
        { versionNotes: contains(filters.q) },
        { compatibilityNotes: contains(filters.q) },
        { moderatorNotes: contains(filters.q) },
        {
          submitter: {
            OR: [
              { displayName: contains(filters.q) },
              { playerName: contains(filters.q) },
            ],
          },
        },
      ],
    });
  }

  return { AND: and } satisfies Prisma.LevelSuggestionWhereInput;
}

export function levelSuggestionOrderBy(filters: SuggestionModerationFilters) {
  if (filters.sort === "oldest") {
    return [{ submittedAt: "asc" as const }];
  }

  return [{ submittedAt: "desc" as const }];
}

export function levelSuggestionQuery(filters: SuggestionModerationFilters) {
  return {
    where: levelSuggestionWhere(filters),
    include: levelSuggestionInclude(),
    orderBy: levelSuggestionOrderBy(filters),
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  } satisfies Prisma.LevelSuggestionFindManyArgs;
}

async function getClient(client?: ModerationQueueClient) {
  if (client) {
    return client;
  }

  const db = await import("./db");
  return db.prisma;
}

export async function getModerationQueue(client?: ModerationQueueClient) {
  const db = await getClient(client);
  return db.recordSubmission.findMany(moderationQueueQuery());
}

export async function countModerationQueue(client?: ModerationQueueClient) {
  const db = await getClient(client);
  return db.recordSubmission.count({
    where: moderationQueueWhere(),
  });
}

export async function getFilteredRecordSubmissions(
  filters: RecordModerationFilters,
  client?: ModerationQueueClient,
) {
  const db = await getClient(client);
  return db.recordSubmission.findMany(recordSubmissionQuery(filters));
}

export async function countFilteredRecordSubmissions(
  filters: RecordModerationFilters,
  client?: ModerationQueueClient,
) {
  const db = await getClient(client);
  return db.recordSubmission.count({
    where: recordSubmissionWhere(filters),
  });
}

export async function getFilteredLevelSuggestions(
  filters: SuggestionModerationFilters,
  client?: ModerationQueueClient,
) {
  const db = await getClient(client);
  const priority = suggestionStatusPriority(filters);

  if (!priority) {
    return db.levelSuggestion.findMany(levelSuggestionQuery(filters));
  }

  return getPrioritySortedLevelSuggestions(db, filters, priority);
}

export async function countFilteredLevelSuggestions(
  filters: SuggestionModerationFilters,
  client?: ModerationQueueClient,
) {
  const db = await getClient(client);
  return db.levelSuggestion.count({
    where: levelSuggestionWhere(filters),
  });
}

async function getPrioritySortedLevelSuggestions(
  db: ModerationQueueClient,
  filters: SuggestionModerationFilters,
  priority: SuggestionModerationStatus[],
) {
  const results: LevelSuggestionListItem[] = [];
  let skip = (filters.page - 1) * filters.pageSize;
  let take = filters.pageSize;

  for (const status of priority) {
    if (take <= 0) {
      break;
    }

    const statusFilters = {
      ...filters,
      statuses: [status],
      page: 1,
    } satisfies SuggestionModerationFilters;
    const where = levelSuggestionWhere(statusFilters);
    const count = await db.levelSuggestion.count({ where });

    if (skip >= count) {
      skip -= count;
      continue;
    }

    const rows = await db.levelSuggestion.findMany({
      where,
      include: levelSuggestionInclude(),
      orderBy: [{ submittedAt: "desc" }],
      skip,
      take: Math.min(take, count - skip),
    });

    results.push(...rows);
    take -= rows.length;
    skip = 0;
  }

  return results;
}

function suggestionStatusPriority(filters: SuggestionModerationFilters) {
  if (filters.sort === "approved") {
    return suggestionModerationStatuses.filter((status) =>
      filters.statuses.includes(status),
    ).sort((left, right) => {
      const priority = ["APPROVED", "PENDING", "NEEDS_CHANGES", "REJECTED", "CONVERTED"];
      return priority.indexOf(left) - priority.indexOf(right);
    });
  }

  if (filters.sort === "pending") {
    return suggestionModerationStatuses.filter((status) =>
      filters.statuses.includes(status),
    ).sort((left, right) => {
      const priority = ["PENDING", "NEEDS_CHANGES", "APPROVED", "REJECTED", "CONVERTED"];
      return priority.indexOf(left) - priority.indexOf(right);
    });
  }

  return null;
}

function recordSubmissionInclude() {
  return {
    player: true,
    level: true,
    reviewer: true,
  } satisfies Prisma.RecordSubmissionInclude;
}

function levelSuggestionInclude() {
  return {
    submitter: true,
    reviewer: true,
    createdLevel: true,
  } satisfies Prisma.LevelSuggestionInclude;
}

function parseRecordStatuses(value: string | string[] | undefined) {
  const status = firstParam(value);

  if (
    recordModerationStatuses.includes(status as RecordModerationStatus)
  ) {
    return [status as RecordModerationStatus];
  }

  return [...moderationQueueStatuses];
}

function parseSuggestionStatuses(value: string | string[] | undefined) {
  const status = firstParam(value);

  if (
    suggestionModerationStatuses.includes(status as SuggestionModerationStatus)
  ) {
    return [status as SuggestionModerationStatus];
  }

  return ["PENDING", "NEEDS_CHANGES", "APPROVED"] satisfies SuggestionModerationStatus[];
}

function parseRecordSort(value: string) {
  if (recordSortOptions.includes(value as RecordSort)) {
    return value as RecordSort;
  }

  return "newest";
}

function parseSuggestionSort(value: string) {
  if (suggestionSortOptions.includes(value as SuggestionSort)) {
    return value as SuggestionSort;
  }

  return "newest";
}

function parsePage(value: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function parseStartDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRange(from: Date | null, to: Date | null) {
  if (!from && !to) {
    return null;
  }

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  } satisfies Prisma.DateTimeFilter;
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function cleanTextParam(value: string) {
  return value.trim().slice(0, 160);
}

function contains(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}
