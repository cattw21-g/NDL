import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LevelCard, type LevelCardLevel } from "../components/level-card";

const level: LevelCardLevel = {
  slug: "uploaded-thumb",
  rank: 1,
  name: "Uploaded Thumbnail",
  originalName: "Original",
  publisher: "Host",
  nerfCreator: "Nerfer",
  verifier: "Verifier",
  thumbnailUrl: "/uploads/thumbnails/uploaded-thumb.webp",
  status: "RANKED",
  difficulty: "EXTREME",
  points: 1000,
  _count: {
    records: 2,
  },
};

describe("LevelCard", () => {
  it("renders uploaded local thumbnails with a visible rank", () => {
    const markup = renderToStaticMarkup(<LevelCard level={level} />);

    expect(markup).toContain("#1");
    expect(markup).toContain("/uploads/thumbnails/uploaded-thumb.webp");
    expect(markup).toContain(
      "md:grid-cols-[4.75rem_12.5rem_minmax(0,1fr)_9.75rem]",
    );
    expect(markup).toContain("md:h-28");
    expect(markup).not.toContain("RANKED");
  });

  it("keeps thumbnail sources safe across common list row cases", () => {
    for (const thumbnailUrl of [
      "/uploads/thumbnails/uploaded-thumb.webp",
      "/demo-thumbnails/level-1.svg",
      "https://placehold.co/320x180.png",
      "C:\\Users\\bad\\thumbnail.png",
    ]) {
      const markup = renderToStaticMarkup(
        <LevelCard level={{ ...level, thumbnailUrl }} />,
      );

      expect(markup).toContain("#1");
      expect(markup).toContain("object-cover");
      expect(markup).toContain(
        thumbnailUrl.includes("\\") ? "/thumbnails/fallback.svg" : thumbnailUrl,
      );
    }
  });
});
