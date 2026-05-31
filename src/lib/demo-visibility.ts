import type { Prisma } from "../generated/prisma/client";
export function demoModeEnabled(env: Record<string, string | undefined> = process.env) {
  return env.ENABLE_DEMO_SEED === "true";
}

export function publicLevelWhere(
  where: Prisma.LevelWhereInput = {},
  env: Record<string, string | undefined> = process.env,
) {
  if (demoModeEnabled(env)) {
    return where;
  }

  return {
    AND: [
      where,
      { isDemo: false },
      { name: { not: { startsWith: "[DEMO]" } } },
      { thumbnailUrl: { not: { startsWith: "/demo-thumbnails" } } },
      { showcaseUrl: { not: { contains: "example.com" } } },
    ],
  } satisfies Prisma.LevelWhereInput;
}

export function publicUserWhere(
  where: Prisma.UserWhereInput = {},
  env: Record<string, string | undefined> = process.env,
) {
  if (demoModeEnabled(env)) {
    return where;
  }

  return {
    AND: [
      where,
      { isDemo: false },
      { email: { not: { endsWith: "@ndl.local" } } },
    ],
  } satisfies Prisma.UserWhereInput;
}

export function publicRecordWhere(
  where: Prisma.RecordWhereInput = {},
  env: Record<string, string | undefined> = process.env,
) {
  if (demoModeEnabled(env)) {
    return where;
  }

  return {
    AND: [
      where,
      { isDemo: false },
      { level: publicLevelWhere({}, env) },
      { player: publicUserWhere({}, env) },
      { videoUrl: { not: { contains: "example.com" } } },
    ],
  } satisfies Prisma.RecordWhereInput;
}

export function publicChangelogWhere(
  where: Prisma.ChangelogPostWhereInput = {},
  env: Record<string, string | undefined> = process.env,
) {
  if (demoModeEnabled(env)) {
    return where;
  }

  return {
    AND: [
      where,
      { isDemo: false },
      { title: { not: { contains: "Demo" } } },
    ],
  } satisfies Prisma.ChangelogPostWhereInput;
}
