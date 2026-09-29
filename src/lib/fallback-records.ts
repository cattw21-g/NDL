import { FALLBACK_RANKED_LEVELS, type FallbackLevel } from "./fallback-levels";
import type { Role, LevelStatus } from "@/generated/prisma/client";
import type { ScoredLevelStatus } from "./points";

export type FallbackPlayer = {
  id: string;
  playerName: string;
  displayName: string;
  countryCode: string | null;
  subdivision: string | null;
  bio: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  twitterUrl: string | null;
  role: "PLAYER" | "ADMIN" | "MODERATOR";
  createdAt: Date;
  isDemo: boolean;
};

export type FallbackRecord = {
  id: string;
  playerId: string;
  levelId: string;
  progress: number;
  isVerifier: boolean;
  videoUrl: string;
  rawFootageUrl: string | null;
  fps: number;
  cbfUsed: boolean;
  pointsAwarded: number;
  acceptedAt: Date;
  player: {
    id: string;
    playerName: string;
    displayName: string;
    countryCode: string | null;
    subdivision: string | null;
  };
  level: {
    id: string;
    slug: string;
    name: string;
    originalName: string;
    rank: number | null;
    status: ScoredLevelStatus;
    points: number;
    thumbnailUrl: string;
  };
};

export const FALLBACK_PLAYERS: FallbackPlayer[] = [
  {
    id: "cmquxmw4c000104jmbib91dxg",
    playerName: "sambor",
    displayName: "Sambor",
    countryCode: "PL",
    subdivision: null,
    bio: "NDL #1 Champion and top verifier of Andromeda, KOCMOC, Acheron, and Sakupen Circles.",
    youtubeUrl: "https://medal.tv",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-05-15T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmquxmw4c000004jmaaaa1aaa",
    playerName: "cattw21",
    displayName: "cattw21",
    countryCode: "DE",
    subdivision: null,
    bio: "Nerfed Demonlist Founder, Administrator & Top Runner.",
    youtubeUrl: "https://youtube.com/@cattw21",
    twitchUrl: null,
    twitterUrl: null,
    role: "ADMIN",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmt67sgb3000104k0gf5qzfad",
    playerName: "alalrbw",
    displayName: "alalrbw",
    countryCode: "US",
    subdivision: null,
    bio: "Verifier and creator of silent clubstep easy and Nerfed Sakupen Hell.",
    youtubeUrl: "https://www.youtube.com/@alalrbw",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-05-20T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmquxmw4c000204jmcattwgdx",
    playerName: "cattwgdx",
    displayName: "cattwgdx",
    countryCode: "DE",
    subdivision: null,
    bio: "Verifier and creator of #1 Kocmoc Unleashed ULDM Nerfed.",
    youtubeUrl: "https://www.tiktok.com/@cattw_gd",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-05-20T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmquxmw4c000304jmploggixx",
    playerName: "ploggix",
    displayName: "Ploggix",
    countryCode: "US",
    subdivision: null,
    bio: "Verifier of Thinking Space II Easy.",
    youtubeUrl: "https://youtu.be/piCzVYS2Zm4",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-05-25T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmquxmw4c000404jmhanxinnn",
    playerName: "hanxin",
    displayName: "Han Xin",
    countryCode: "US",
    subdivision: null,
    bio: "Verifier of BOOBAWAMBA Nerfed.",
    youtubeUrl: "https://youtu.be/sj22eAqjJoY",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    isDemo: false,
  },
  {
    id: "cmshyd43f000204kvgsmjs7ta_tarrex",
    playerName: "tarrex",
    displayName: "TarReX",
    countryCode: "US",
    subdivision: null,
    bio: "Creator and Verifier of Nerfed Cataclysm.",
    youtubeUrl: "https://youtu.be/hjdkeXOAjs4",
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-05-28T00:00:00.000Z"),
    isDemo: false,
  },
];

function getPlayerByName(name: string): FallbackPlayer {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const found = FALLBACK_PLAYERS.find(
    (p) =>
      p.playerName.toLowerCase() === norm ||
      p.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") === norm,
  );
  if (found) return found;

  return {
    id: `user_${norm}`,
    playerName: norm,
    displayName: name,
    countryCode: "US",
    subdivision: null,
    bio: `NDL Verifier: ${name}`,
    youtubeUrl: null,
    twitchUrl: null,
    twitterUrl: null,
    role: "PLAYER",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    isDemo: false,
  };
}

export const FALLBACK_RECORDS: FallbackRecord[] = FALLBACK_RANKED_LEVELS.map((lvl) => {
  const player = getPlayerByName(lvl.verifier);
  return {
    id: `rec_verifier_${lvl.slug}`,
    playerId: player.id,
    levelId: lvl.id,
    progress: 100,
    isVerifier: true,
    videoUrl: lvl.showcaseUrl || "https://youtu.be",
    rawFootageUrl: null,
    fps: 240,
    cbfUsed: true,
    pointsAwarded: lvl.points,
    acceptedAt: new Date(2026, 5, 15 - lvl.rank),
    player: {
      id: player.id,
      playerName: player.playerName,
      displayName: player.displayName,
      countryCode: player.countryCode,
      subdivision: player.subdivision,
    },
    level: {
      id: lvl.id,
      slug: lvl.slug,
      name: lvl.name,
      originalName: lvl.originalName,
      rank: lvl.rank,
      status: lvl.status,
      points: lvl.points,
      thumbnailUrl: lvl.thumbnailUrl,
    },
  };
});

export function getFallbackRecords(): FallbackRecord[] {
  return FALLBACK_RECORDS;
}

export function getFallbackPlayers(): FallbackPlayer[] {
  return FALLBACK_PLAYERS;
}

export function getFallbackRecordsForLevel(levelId: string): FallbackRecord[] {
  return FALLBACK_RECORDS.filter(
    (r) => r.levelId === levelId || r.level.slug === levelId,
  );
}

export function getFallbackPlayer(playerName: string) {
  const norm = playerName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const player = FALLBACK_PLAYERS.find(
    (p) =>
      p.playerName.toLowerCase() === norm ||
      p.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") === norm,
  );

  if (!player) return null;

  const playerRecords = FALLBACK_RECORDS.filter(
    (r) => r.playerId === player.id || r.player.playerName.toLowerCase() === norm,
  );

  const verifiedLevels = FALLBACK_RANKED_LEVELS.filter((lvl) => {
    const lvlVerifierNorm = lvl.verifier.toLowerCase().replace(/[^a-z0-9]/g, "");
    return lvlVerifierNorm === norm || lvl.verifier.toLowerCase() === player.displayName.toLowerCase();
  }).map((lvl) => ({
    id: lvl.id,
    slug: lvl.slug,
    name: lvl.name,
    originalName: lvl.originalName,
    rank: lvl.rank,
    status: lvl.status as LevelStatus,
    points: lvl.points,
    thumbnailUrl: lvl.thumbnailUrl,
    verificationVideoUrl: lvl.showcaseUrl || null,
    showcaseUrl: lvl.showcaseUrl,
  }));

  const createdLevels = FALLBACK_RANKED_LEVELS.filter((lvl) => {
    const creatorNorm = lvl.nerfCreator.toLowerCase().replace(/[^a-z0-9]/g, "");
    return creatorNorm === norm || lvl.nerfCreator.toLowerCase() === player.displayName.toLowerCase();
  }).map((lvl) => ({ id: lvl.id }));

  return {
    ...player,
    createdLevels,
    verifiedLevels,
    records: playerRecords.map((r) => ({
      ...r,
      level: {
        ...r.level,
        id: r.level.id,
        slug: r.level.slug,
        name: r.level.name,
        originalName: r.level.originalName,
        rank: r.level.rank,
        status: r.level.status as LevelStatus,
        points: r.level.points,
        thumbnailUrl: r.level.thumbnailUrl,
        publisher: "",
        nerfCreator: "",
        verifier: player.displayName,
        verificationVideoUrl: r.videoUrl,
        showcaseUrl: r.videoUrl,
        description: "",
      },
    })),
    submissions: [],
  };
}
