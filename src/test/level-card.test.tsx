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

  it("renders hovering PENDING status badge and glowing amber theme when run is in review", () => {
    const markup = renderToStaticMarkup(
      <LevelCard
        level={level}
        userSubmission={{
          id: "sub-1",
          status: "PENDING",
          progress: 100,
          submittedAt: new Date().toISOString(),
          moderatorNotes: null,
        }}
      />,
    );

    expect(markup).toContain("PENDING (100%)");
    expect(markup).toContain("border-amber-400");
    expect(markup).toContain("bg-amber-400");
  });

  it("renders hovering ACCEPTED status badge and glowing emerald theme with dismiss button", () => {
    const markup = renderToStaticMarkup(
      <LevelCard
        level={level}
        userSubmission={{
          id: "sub-2",
          status: "ACCEPTED",
          progress: 100,
          submittedAt: new Date().toISOString(),
          moderatorNotes: null,
        }}
      />,
    );

    expect(markup).toContain("ACCEPTED (100%)");
    expect(markup).toContain("border-emerald-500");
    expect(markup).toContain("Remove accepted banner from this level");
  });

  it("renders hovering REJECTED status badge and glowing rose theme with dismiss button", () => {
    const markup = renderToStaticMarkup(
      <LevelCard
        level={level}
        userSubmission={{
          id: "sub-3",
          status: "REJECTED",
          progress: 98,
          submittedAt: new Date().toISOString(),
          moderatorNotes: "Audio desynced",
        }}
      />,
    );

    expect(markup).toContain("REJECTED");
    expect(markup).toContain("border-rose-500");
    expect(markup).toContain("Remove rejected banner from this level");
  });

  it("does not render hovering badge if submission was dismissed by user", () => {
    const markup = renderToStaticMarkup(
      <LevelCard
        level={level}
        userSubmission={{
          id: "sub-4",
          status: "ACCEPTED",
          progress: 100,
          submittedAt: new Date().toISOString(),
          moderatorNotes: null,
        }}
        isDismissed={true}
      />,
    );

    expect(markup).not.toContain("ACCEPTED (100%)");
    expect(markup).not.toContain("ring-emerald-400");
    expect(markup).not.toContain("Remove accepted banner from this level");
  });
});
