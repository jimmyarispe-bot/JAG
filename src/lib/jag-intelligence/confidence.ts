import type { ConfidenceBreakdown, NormalizedEvent } from "./types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

export function scoreFreshness(occurredAt: string, now = new Date()): number {
  const ageMs = now.getTime() - new Date(occurredAt).getTime();
  const ageHours = ageMs / 3_600_000;
  if (ageHours <= 6) return 1;
  if (ageHours <= 24) return 0.85;
  if (ageHours <= 72) return 0.65;
  if (ageHours <= 168) return 0.4;
  return 0.2;
}

export function scoreDataQuality(events: NormalizedEvent[]): number {
  if (!events.length) return 0.3;
  const withEntity = events.filter((e) => e.entityId).length;
  const withSummary = events.filter((e) => e.summary).length;
  const entityRatio = withEntity / events.length;
  const summaryRatio = withSummary / events.length;
  return clamp01(0.4 + entityRatio * 0.35 + summaryRatio * 0.25);
}

export function scoreExplainability(input: {
  evidenceCount: number;
  hasWhy: boolean;
  factorCount?: number;
}): number {
  const evidence = Math.min(1, input.evidenceCount / 5);
  const why = input.hasWhy ? 0.35 : 0;
  const factors = Math.min(0.25, (input.factorCount ?? 0) * 0.05);
  return clamp01(0.25 + evidence * 0.4 + why + factors);
}

/**
 * Confidence Engine — every recommendation exposes a full breakdown.
 */
export function scoreConfidence(input: {
  events: NormalizedEvent[];
  evidenceCount: number;
  baseConfidence?: number;
  explanation?: string;
  factorCount?: number;
  now?: Date;
}): ConfidenceBreakdown {
  const now = input.now ?? new Date();
  const dataQuality = scoreDataQuality(input.events);
  const freshness =
    input.events.length === 0
      ? 0.4
      : clamp01(
          input.events.reduce((a, e) => a + scoreFreshness(e.occurredAt, now), 0) /
            input.events.length
        );
  const explainability = scoreExplainability({
    evidenceCount: input.evidenceCount,
    hasWhy: Boolean(input.explanation && input.explanation.length > 10),
    factorCount: input.factorCount,
  });
  const base = input.baseConfidence ?? 0.55;
  const confidence = clamp01(
    base * 0.45 + dataQuality * 0.2 + freshness * 0.15 + explainability * 0.2
  );

  return {
    confidence,
    dataQuality,
    evidenceCount: input.evidenceCount,
    freshness,
    explainability,
  };
}
