import { describe, expect, it } from "vitest";

import {
  FALLBACK_PLAYERS,
  FALLBACK_RECORDS,
  getFallbackPlayer,
  getFallbackPlayers,
  getFallbackRecords,
  getFallbackRecordsForLevel,
} from "../lib/fallback-records";

describe("historical player listings", () => {
  it("keeps roster names visible without inventing accepted records or completions", () => {
    expect(FALLBACK_RECORDS.length).toBeGreaterThan(0);
    expect(FALLBACK_PLAYERS.length).toBeGreaterThan(0);
    expect(getFallbackRecords()).toEqual([]);
    expect(getFallbackPlayers()).toEqual(FALLBACK_PLAYERS);
    expect(getFallbackRecordsForLevel(FALLBACK_RECORDS[0].levelId)).toEqual([]);
    const listing = getFallbackPlayer(FALLBACK_PLAYERS[0].playerName);
    expect(listing?.records).toEqual([]);
    expect(listing?.verifiedLevels).toEqual([]);
    expect(listing?.createdLevels).toEqual([]);
  });
});
