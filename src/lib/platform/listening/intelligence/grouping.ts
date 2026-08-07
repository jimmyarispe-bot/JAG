/**
 * Deterministic thematic grouping.
 * Designed so an AI ListeningThemeGrouper can replace DeterministicThemeGrouper.
 */

import type {
  ListeningNormalizedText,
  ListeningThemeGroup,
  ListeningThemeGrouper,
} from "./types";

/** Shared keyword lexicons — valence hints for signal class (not LLM). */
export const STRENGTH_KEYWORDS = [
  "support",
  "supportive",
  "strong",
  "strength",
  "proud",
  "excellent",
  "great",
  "positive",
  "trust",
  "collabor",
  "appreciate",
  "helpful",
  "clear",
] as const;

export const CONCERN_KEYWORDS = [
  "concern",
  "worried",
  "stress",
  "burnout",
  "overwhelmed",
  "unclear",
  "confus",
  "frustrat",
  "lack",
  "shortage",
  "problem",
  "issue",
  "difficult",
  "hard",
] as const;

export const OPPORTUNITY_KEYWORDS = [
  "opportunit",
  "improve",
  "could",
  "should",
  "suggest",
  "recommend",
  "idea",
  "invest",
  "expand",
  "pilot",
] as const;

export const RISK_KEYWORDS = [
  "risk",
  "unsafe",
  "danger",
  "threat",
  "liability",
  "compliance",
  "legal",
  "attrition",
  "turnover",
  "resign",
] as const;

export const QUESTION_KEYWORDS = [
  "why",
  "how",
  "what",
  "when",
  "who",
  "?",
] as const;

export const SUGGESTION_KEYWORDS = [
  "suggest",
  "recommend",
  "please",
  "need to",
  "we should",
  "consider",
] as const;

function tokenOverlapScore(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const t of a) if (setB.has(t)) hit += 1;
  return hit / Math.max(a.length, b.length);
}

/**
 * Groups near-duplicate / keyword-overlapping free-text answers.
 * Frequency counting is natural via members.length.
 */
export class DeterministicThemeGrouper implements ListeningThemeGrouper {
  readonly id = "deterministic_v1";

  constructor(
    private readonly options: {
      readonly minOverlap?: number;
      readonly minGroupSize?: number;
    } = {}
  ) {}

  group(units: readonly ListeningNormalizedText[]): ListeningThemeGroup[] {
    const minOverlap = this.options.minOverlap ?? 0.45;
    const buckets: {
      key: string;
      label: string;
      members: ListeningNormalizedText[];
      centroid: string[];
    }[] = [];

    for (const unit of units) {
      if (!unit.normalized) continue;

      // Exact normalized duplicate → same group
      const exact = buckets.find((b) => b.key === unit.normalized);
      if (exact) {
        exact.members.push(unit);
        continue;
      }

      let bestIdx = -1;
      let bestScore = 0;
      for (let i = 0; i < buckets.length; i++) {
        const score = tokenOverlapScore(unit.tokens, buckets[i]!.centroid);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0 && bestScore >= minOverlap) {
        const bucket = buckets[bestIdx]!;
        bucket.members.push(unit);
        // Expand centroid with new tokens (bounded)
        const merged = new Set([...bucket.centroid, ...unit.tokens]);
        bucket.centroid = [...merged].slice(0, 24);
      } else {
        buckets.push({
          key: unit.normalized,
          label: unit.rawText.slice(0, 120),
          members: [unit],
          centroid: [...unit.tokens].slice(0, 24),
        });
      }
    }

    const minSize = this.options.minGroupSize ?? 1;
    return buckets
      .filter((b) => b.members.length >= minSize)
      .sort((a, b) => b.members.length - a.members.length)
      .map((b) => ({
        groupKey: b.key,
        label: b.label,
        members: b.members,
      }));
  }
}

export function countKeywordHits(
  text: string,
  keywords: readonly string[]
): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (lower.includes(k)) hits += 1;
  }
  return hits;
}

export function classifyTextValence(
  text: string
): "strength" | "concern" | "opportunity" | "risk" | "question" | "suggestion" | "theme" {
  const scores = {
    strength: countKeywordHits(text, STRENGTH_KEYWORDS),
    concern: countKeywordHits(text, CONCERN_KEYWORDS),
    opportunity: countKeywordHits(text, OPPORTUNITY_KEYWORDS),
    risk: countKeywordHits(text, RISK_KEYWORDS),
    suggestion: countKeywordHits(text, SUGGESTION_KEYWORDS),
    question:
      countKeywordHits(text, QUESTION_KEYWORDS) +
      (text.includes("?") ? 2 : 0),
  } as const;

  let best: keyof typeof scores = "strength";
  let bestScore = 0;
  for (const [k, v] of Object.entries(scores) as [keyof typeof scores, number][]) {
    if (v > bestScore) {
      bestScore = v;
      best = k;
    }
  }
  if (bestScore === 0) return "theme";
  return best;
}
