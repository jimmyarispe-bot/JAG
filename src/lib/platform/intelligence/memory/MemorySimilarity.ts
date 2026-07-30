/**
 * Similarity model for “similar situations” — Sprint 204.
 */

import type { MemoryRecord } from "./MemoryRecord";

export type MemorySimilarityQuery = {
  readonly organizationId: string;
  readonly title?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly type?: string;
  readonly decisionId?: string;
  readonly contributorIds?: readonly string[];
};

export type MemorySimilarityHit = {
  readonly memory: MemoryRecord;
  readonly score: number;
  readonly reasons: readonly string[];
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function scoreMemorySimilarity(
  query: MemorySimilarityQuery,
  record: MemoryRecord
): MemorySimilarityHit | null {
  if (record.organizationId !== query.organizationId) return null;

  const reasons: string[] = [];
  let score = 0;

  const qTokens = tokenize(
    `${query.title ?? ""} ${query.description ?? ""} ${(query.tags ?? []).join(" ")}`
  );
  const rTokens = tokenize(
    `${record.title} ${record.description} ${record.tags.join(" ")}`
  );
  const textScore = jaccard(qTokens, rTokens);
  if (textScore > 0) {
    score += textScore * 0.55;
    if (textScore >= 0.15) reasons.push("Overlapping situation language");
  }

  if (query.type && query.type === record.type) {
    score += 0.12;
    reasons.push("Same memory type");
  }

  if (query.decisionId && record.relatedDecisionIds.includes(query.decisionId)) {
    score += 0.25;
    reasons.push("Linked to the same decision");
  }

  const qTags = new Set((query.tags ?? []).map((t) => t.toLowerCase()));
  const tagHits = record.tags.filter((t) => qTags.has(t.toLowerCase())).length;
  if (tagHits > 0) {
    score += Math.min(0.2, tagHits * 0.07);
    reasons.push(`${tagHits} shared tag(s)`);
  }

  const contribs = new Set(query.contributorIds ?? []);
  const contribHits = record.relatedContributorIds.filter((c) =>
    contribs.has(c)
  ).length;
  if (contribHits > 0) {
    score += Math.min(0.15, contribHits * 0.05);
    reasons.push("Shared contributors");
  }

  if (score < 0.12) return null;

  return {
    memory: record,
    score: Number(Math.min(1, score).toFixed(3)),
    reasons,
  };
}

export function findSimilarMemories(
  query: MemorySimilarityQuery,
  records: readonly MemoryRecord[],
  limit = 5
): readonly MemorySimilarityHit[] {
  return records
    .map((r) => scoreMemorySimilarity(query, r))
    .filter((h): h is MemorySimilarityHit => h != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
