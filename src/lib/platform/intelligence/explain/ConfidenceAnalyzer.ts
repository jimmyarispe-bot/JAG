/**
 * ConfidenceAnalyzer — Sprint 208.
 */

import type { ExplainConfidence, ExplainEvidenceRef } from "./types";

function band(score: number): ExplainConfidence["band"] {
  if (score <= 0) return "none";
  if (score >= 0.7) return "high";
  if (score >= 0.45) return "moderate";
  return "low";
}

function freshnessFromDates(
  dates: readonly (string | undefined)[]
): ExplainConfidence["dataFreshness"] {
  const parsed = dates
    .map((d) => (d ? Date.parse(d) : NaN))
    .filter((n) => Number.isFinite(n));
  if (parsed.length === 0) return "unknown";
  const newest = Math.max(...parsed);
  const ageDays = (Date.now() - newest) / (24 * 60 * 60 * 1000);
  if (ageDays <= 7) return "fresh";
  if (ageDays <= 30) return "aging";
  return "stale";
}

export function analyzeConfidence(input: {
  readonly baseConfidence?: number;
  readonly evidence: readonly ExplainEvidenceRef[];
  readonly assumptionCount: number;
  readonly missingInformation: readonly string[];
  readonly timelineDates?: readonly (string | undefined)[];
}): ExplainConfidence {
  const evidenceStrength =
    input.evidence.length === 0
      ? 0
      : Math.min(
          1,
          input.evidence.reduce((a, e) => a + (e.strength ?? 0.55), 0) /
            Math.max(1, input.evidence.length)
        );

  let score =
    (input.baseConfidence ?? 0.5) * 0.45 +
    evidenceStrength * 0.4 -
    input.assumptionCount * 0.03 -
    input.missingInformation.length * 0.04;

  const dataFreshness = freshnessFromDates([
    ...input.evidence.map((e) => e.freshness),
    ...(input.timelineDates ?? []),
  ]);
  if (dataFreshness === "aging") score -= 0.05;
  if (dataFreshness === "stale") score -= 0.12;

  score = Math.max(0, Math.min(0.98, score));

  return {
    score: Number(score.toFixed(3)),
    band: band(score),
    evidenceStrength: Number(evidenceStrength.toFixed(3)),
    dataFreshness,
    assumptionCount: input.assumptionCount,
    missingInformation: input.missingInformation,
    explanation: [
      `Confidence ${band(score)} (${(score * 100).toFixed(0)}%).`,
      `Evidence strength ${(evidenceStrength * 100).toFixed(0)}%.`,
      `Data freshness: ${dataFreshness}.`,
      input.assumptionCount
        ? `${input.assumptionCount} assumption(s).`
        : "No explicit assumptions recorded.",
      input.missingInformation.length
        ? `Missing: ${input.missingInformation.slice(0, 3).join("; ")}.`
        : "No critical gaps flagged.",
    ].join(" "),
  };
}
