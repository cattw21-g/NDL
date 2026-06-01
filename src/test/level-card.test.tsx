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
  points: 320,
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
      "md:grid-cols-[4.75rem_15rem_minmax(0,1fr)_10rem]",
    );
    expect(markup).toContain("md:w-60");
    expect(markup).toContain("aspect-video");
    expect(markup).toContain("md:items-center");
    expect(markup).toContain("md:col-auto");
    expect(markup).not.toContain("md:col-span-1");
    expect(markup).not.toContain("Reviewed list entry");
    expect(markup).not.toContain("RANKED");
  });

  it("keeps long names and metadata in the flexible content area", () => {
    const markup = renderToStaticMarkup(
      <LevelCard
        level={{
          ...level,
          name: "A Very Long Uploaded Thumbnail Level Name That Must Not Overlap The Actions",
          originalName:
            "A Very Long Original Level Name That Should Stay Inside Metadata",
        }}
      />,
    );

    expect(markup).toContain("min-w-0");
    expect(markup).toContain("truncate text-lg");
    expect(markup).toContain("md:grid-cols-[4.75rem_15rem_minmax(0,1fr)_10rem]");
    expect(markup).toContain("grid-cols-3");
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
