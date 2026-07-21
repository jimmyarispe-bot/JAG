/**
 * Sprint 062 — priority ordering by severity/confidence/impact/urgency/alignment (not chronology).
 */

import type { BriefingCard, BriefingPriorityScores } from "@/lib/platform/intelligence/briefing/types";

export function computePriorityScore(scores: {
  severity: number;
  urgency: number;
  confidence: number;
  businessImpact: number;
  strategicAlignment: number;
}): number {
  return Math.round(
    scores.severity * 0.28 +
      scores.urgency * 0.24 +
      scores.businessImpact * 0.22 +
      scores.confidence * 0.14 +
      scores.strategicAlignment * 0.12
  );
}

export function scoresFromLight(light?: BriefingPriorityScores): {
  severity: number;
  urgency: number;
  confidence: number;
  businessImpact: number;
  strategicAlignment: number;
} {
  return {
    severity: light?.severity ?? 50,
    urgency: light?.urgency ?? 50,
    confidence: light?.confidence ?? 50,
    businessImpact: light?.businessImpact ?? light?.financialImpact ?? 50,
    strategicAlignment: light?.strategicAlignment ?? 55,
  };
}

export function sortByPriority<T extends BriefingCard>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (b.severity !== a.severity) return b.severity - a.severity;
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    if (b.businessImpact !== a.businessImpact) return b.businessImpact - a.businessImpact;
    return b.confidence - a.confidence;
  });
}
