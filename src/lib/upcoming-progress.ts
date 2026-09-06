/**
 * Parses and formats the verification progress percentage for upcoming levels.
 *
 * Upcoming demons can have progress stored in their versionNotes tag (e.g. `[Progress: 74%]`),
 * or in minimumProgress if customized. If no progress was explicitly tracked yet and
 * minimumProgress is the Prisma default of 50, it safely returns 0%.
 */
export function parseUpcomingProgress(
  versionNotes?: string | null,
  minimumProgress?: number | null,
): number {
  if (versionNotes) {
    const match = versionNotes.match(/(?:\[Progress:\s*|progress:\s*)(\d{1,3})%/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) return val;
    }
  }
  if (
    typeof minimumProgress === "number" &&
    minimumProgress !== 50 &&
    minimumProgress >= 0 &&
    minimumProgress <= 100
  ) {
    return minimumProgress;
  }
  return 0;
}
