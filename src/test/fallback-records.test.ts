import { describe, expect, it } from "vitest";

import {
  FALLBACK_PLAYERS,
  FALLBACK_RECORDS,
  getFallbackPlayer,
  getFallbackPlayers,
  getFallbackRecords,
  getFallbackRecordsForLevel,
} from "../lib/fallback-records";

describe("unverified historical data", () => {
  it("does not present placeholder players or records as live accounts or scores", () => {
    expect(FALLBACK_RECORDS.length).toBeGreaterThan(0);
    expect(FALLBACK_PLAYERS.length).toBeGreaterThan(0);
    expect(getFallbackRecords()).toEqual([]);
    expect(getFallbackPlayers()).toEqual([]);
    expect(getFallbackRecordsForLevel(FALLBACK_RECORDS[0].levelId)).toEqual([]);
    expect(getFallbackPlayer(FALLBACK_PLAYERS[0].playerName)).toBeNull();
  });
});
