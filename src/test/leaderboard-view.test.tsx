import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LeaderboardView } from "../components/leaderboard-view";

describe("player leaderboard", () => {
  it("does not list unranked accounts when there are no accepted records", () => {
    const html = renderToStaticMarkup(createElement(LeaderboardView, {
      rows: [{
        playerId: "account-1",
        playerName: "unranked-user",
        displayName: "Unranked User",
        rank: null,
        points: 0,
        recordsCount: 0,
      }],
    }));

    expect(html).toContain("No accepted player records yet.");
    expect(html).not.toContain("Unranked User");
  });
});
