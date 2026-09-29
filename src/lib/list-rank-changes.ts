export type ListRankChange = {
  levelName: string;
  oldRank: number;
  newRank: number;
};

type RankedSnapshot = { id: string; name: string; rank: number | null };

export function compareListRanks(
  before: RankedSnapshot[],
  after: RankedSnapshot[],
  editedLevelId: string,
): ListRankChange[] {
  const previousRanks = new Map(before.map((level) => [level.id, level.rank]));
  return after.flatMap((level) => {
    const oldRank = previousRanks.get(level.id);
    if (level.id === editedLevelId || oldRank == null || level.rank == null || oldRank === level.rank) return [];
    return [{ levelName: level.name, oldRank, newRank: level.rank }];
  }).sort((a, b) => a.newRank - b.newRank);
}
