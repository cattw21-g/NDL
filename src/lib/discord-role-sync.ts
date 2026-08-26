import { prisma } from "@/lib/db";

export type RoleSyncResult = {
  discordUserId: string;
  playerName: string;
  addedRoles: string[];
  removedRoles: string[];
  success: boolean;
  error?: string;
};

type DiscordRole = {
  id: string;
  name: string;
};

async function fetchGuildRoles(guildId: string, token: string): Promise<DiscordRole[]> {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

type DiscordGuildMember = {
  roles?: string[];
  nick?: string | null;
  user?: {
    id: string;
    username: string;
    global_name?: string | null;
  };
};

async function fetchMemberDetails(
  guildId: string,
  userId: string,
  token: string,
): Promise<DiscordGuildMember | null> {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function syncDiscordRolesForUser(
  userId: string,
  options: { guildId?: string; token?: string } = {},
): Promise<RoleSyncResult> {
  const token = options.token || process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = options.guildId || process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token || !guildId) {
    return {
      discordUserId: "",
      playerName: "",
      addedRoles: [],
      removedRoles: [],
      success: false,
      error: "Missing Discord bot configuration",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      records: {
        where: { isDemo: false },
        select: {
          progress: true,
          pointsAwarded: true,
        },
      },
      verifiedLevels: {
        where: { isDemo: false },
        select: { id: true },
      },
    },
  });

  if (!user || !user.discordUserId) {
    return {
      discordUserId: user?.discordUserId || "",
      playerName: user?.playerName || "",
      addedRoles: [],
      removedRoles: [],
      success: false,
      error: "User has not linked their Discord account",
    };
  }

  const guildRoles = await fetchGuildRoles(guildId, token);
  const memberData = await fetchMemberDetails(guildId, user.discordUserId, token);
  const currentMemberRoleIds = memberData?.roles || [];

  // Automatically update Discord server nickname to: "discord username (ndl username)"
  if (memberData) {
    try {
      const discordDisplayName =
        memberData.user?.global_name ||
        memberData.user?.username ||
        user.discordUsername?.replace(/#0$/, "") ||
        user.playerName;

      const ndlDisplayName = user.displayName || user.playerName;

      let targetNick = `${discordDisplayName} (${ndlDisplayName})`;

      if (targetNick.length > 32) {
        const maxBase = Math.max(8, 32 - ndlDisplayName.length - 3);
        targetNick = `${discordDisplayName.slice(0, maxBase)} (${ndlDisplayName})`.slice(0, 32);
      }

      if (memberData.nick !== targetNick) {
        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.discordUserId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nick: targetNick }),
        }).catch(() => {});
      }
    } catch {
      // Ignore nickname edit errors (e.g. server owner or higher hierarchy role permissions)
    }
  }

  const roleMap: Record<string, string> = {};
  for (const r of guildRoles) {
    const lower = r.name.toLowerCase();
    if (lower.includes("top 100") || lower.includes("top100")) roleMap["top100"] = r.id;
    else if (lower.includes("top 50") || lower.includes("top50")) roleMap["top50"] = r.id;
    else if (lower.includes("top 10") || lower.includes("top10")) roleMap["top10"] = r.id;
    else if (lower.includes("top 1") || lower.includes("top1")) roleMap["top1"] = r.id;
    else if (lower.includes("victor")) roleMap["victor"] = r.id;
    else if (lower.includes("list player")) roleMap["player"] = r.id;
    else if (lower.includes("level creator")) roleMap["creator"] = r.id;
    else if (lower.includes("verified member")) roleMap["verified"] = r.id;
    else if (lower.includes("admin")) roleMap["admin"] = r.id;
    else if (lower.includes("moderator")) roleMap["mod"] = r.id;
    else if (lower.includes("reviewer")) roleMap["reviewer"] = r.id;
    else if (lower.includes("owner")) roleMap["owner"] = r.id;
  }

  // Calculate Player Standing across NDL Leaderboard
  const allPlayers = await prisma.user.findMany({
    where: { isDemo: false },
    select: {
      id: true,
      records: {
        where: { isDemo: false },
        select: {
          pointsAwarded: true,
        },
      },
    },
  });

  const playerPoints = allPlayers
    .map((p) => ({
      id: p.id,
      totalPoints: p.records.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
    }))
    .filter((p) => p.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const rankIndex = playerPoints.findIndex((p) => p.id === user.id);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  const totalPoints = user.records.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
  const completionsCount = user.records.filter((r) => r.progress === 100).length;

  const targetRoleKeys = new Set<string>();

  // 1. Verified Member
  targetRoleKeys.add("verified");

  // 2. Staff Roles
  if (user.role === "ADMIN") {
    targetRoleKeys.add("admin");
  } else if (user.role === "MODERATOR") {
    targetRoleKeys.add("mod");
  }

  // 3. Top Player Hierarchy (Mutually exclusive: only 1 top tier role)
  if (rank === 1) {
    targetRoleKeys.add("top1");
  } else if (rank && rank >= 2 && rank <= 10) {
    targetRoleKeys.add("top10");
  } else if (rank && rank > 10 && rank <= 50) {
    targetRoleKeys.add("top50");
  } else if (rank && rank > 50 && rank <= 100) {
    targetRoleKeys.add("top100");
  }

  // 4. List Victor (at least 1 100% completion)
  if (completionsCount > 0) {
    targetRoleKeys.add("victor");
  }

  // 5. List Player (any ranked record / points)
  if (totalPoints > 0) {
    targetRoleKeys.add("player");
  }

  // 6. Level Creator / Verifier
  if (user.verifiedLevels.length > 0) {
    targetRoleKeys.add("creator");
  }

  const addedRoles: string[] = [];
  const removedRoles: string[] = [];

  const rolesToManage = ["top1", "top10", "top50", "top100", "victor", "player", "creator", "verified", "admin", "mod"];

  for (const key of rolesToManage) {
    const roleId = roleMap[key];
    if (!roleId) continue;

    const shouldHave = targetRoleKeys.has(key);
    const currentlyHas = currentMemberRoleIds.includes(roleId);

    if (shouldHave && !currentlyHas) {
      const addRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${user.discordUserId}/roles/${roleId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${token}` },
        },
      );
      if (addRes.ok) {
        const rName = guildRoles.find((r) => r.id === roleId)?.name || key;
        addedRoles.push(rName);
      }
    } else if (!shouldHave && currentlyHas) {
      const delRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${user.discordUserId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bot ${token}` },
        },
      );
      if (delRes.ok) {
        const rName = guildRoles.find((r) => r.id === roleId)?.name || key;
        removedRoles.push(rName);
      }
    }
  }

  return {
    discordUserId: user.discordUserId,
    playerName: user.playerName,
    addedRoles,
    removedRoles,
    success: true,
  };
}

export async function syncAllLinkedDiscordUsers(): Promise<{
  totalSynced: number;
  results: RoleSyncResult[];
}> {
  const users = await prisma.user.findMany({
    where: {
      discordUserId: { not: null },
    },
    select: { id: true },
  });

  const results: RoleSyncResult[] = [];
  for (const u of users) {
    const res = await syncDiscordRolesForUser(u.id);
    results.push(res);
  }

  return {
    totalSynced: users.length,
    results,
  };
}
