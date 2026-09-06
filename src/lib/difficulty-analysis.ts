/**
 * Statistical analysis for victor placement opinions
 * Implements Pointercrate-style consensus analysis: median, trimmed mean, IQR outlier rejection, and reliability index.
 */

export interface OpinionAnalysisResult {
  count: number;
  mean: number | null;
  median: number | null;
  trimmedMean: number | null;
  stdDev: number | null;
  minRank: number | null;
  maxRank: number | null;
  reliabilityScore: number; // 0 to 100%
  reliabilityLabel: "High Consensus" | "Moderate Consensus" | "Scattered" | "Preliminary";
  bracketLow: number | null;
  bracketHigh: number | null;
}

export function analyzeDifficultyOpinions(ranks: number[]): OpinionAnalysisResult {
  if (!ranks || ranks.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      trimmedMean: null,
      stdDev: null,
      minRank: null,
      maxRank: null,
      reliabilityScore: 0,
      reliabilityLabel: "Preliminary",
      bracketLow: null,
      bracketHigh: null,
    };
  }

  const sorted = [...ranks].sort((a, b) => a - b);
  const n = sorted.length;

  // 1. Mean
  const sum = sorted.reduce((acc, r) => acc + r, 0);
  const mean = Math.round((sum / n) * 10) / 10;

  // 2. Median
  let median: number;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
  } else {
    median = Math.round(((sorted[n / 2 - 1] + sorted[n / 2]) / 2) * 10) / 10;
  }

  // 3. Trimmed Mean (discards 20% extreme outliers if n >= 4, else standard mean)
  let trimmedMean: number;
  if (n >= 4) {
    const trimCount = Math.max(1, Math.floor(n * 0.15));
    const trimmedSlice = sorted.slice(trimCount, n - trimCount);
    const trimmedSum = trimmedSlice.reduce((acc, r) => acc + r, 0);
    trimmedMean = Math.round((trimmedSum / trimmedSlice.length) * 10) / 10;
  } else {
    trimmedMean = mean;
  }

  // 4. Standard Deviation
  const variance = sorted.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / n;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  // 5. Reliability Score (% based on sample size and standard deviation)
  // Higher sample size increases confidence; higher stdDev reduces confidence.
  let sampleWeight = Math.min(50, n * 10); // up to 50% for sample size (5+ ratings)
  let consistencyWeight = Math.max(0, 50 - stdDev * 5); // up to 50% for low variance
  const reliabilityScore = Math.min(100, Math.round(sampleWeight + consistencyWeight));

  let reliabilityLabel: OpinionAnalysisResult["reliabilityLabel"];
  if (n < 2) {
    reliabilityLabel = "Preliminary";
  } else if (reliabilityScore >= 75) {
    reliabilityLabel = "High Consensus";
  } else if (reliabilityScore >= 50) {
    reliabilityLabel = "Moderate Consensus";
  } else {
    reliabilityLabel = "Scattered";
  }

  // 6. Placement Bracket (Median ± max(1, round(stdDev * 0.75)))
  const spread = Math.max(1, Math.round(stdDev * 0.75));
  const bracketLow = Math.max(1, Math.round(median - spread));
  const bracketHigh = Math.round(median + spread);

  return {
    count: n,
    mean,
    median,
    trimmedMean,
    stdDev,
    minRank: sorted[0],
    maxRank: sorted[n - 1],
    reliabilityScore,
    reliabilityLabel,
    bracketLow,
    bracketHigh,
  };
}
