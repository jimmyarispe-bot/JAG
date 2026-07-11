/**
 * JAG Intelligence — memory similarity abstraction (Sprint 009).
 *
 * Semantic-style similarity without a vector database.
 * Token-overlap Jaccard scoring is the default; swap in embeddings later
 * by injecting a different {@link IntelligenceMemorySimilarityEngine}.
 */

import type {
  IntelligenceMemorySimilarityDocument,
  IntelligenceMemorySimilarityEngine,
  IntelligenceMemorySimilarityHit,
  IntelligencePersistentMemoryRecord,
} from "@/lib/platform/intelligence/memory/types";

/** Tokenize text for overlap scoring. */
export function tokenizeMemoryText(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 1)
  );
}

/** Jaccard similarity between two token sets (0..1). */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Default similarity engine — replaceable with embedding cosine similarity.
 */
export class TokenOverlapSimilarityEngine implements IntelligenceMemorySimilarityEngine {
  score(
    a: IntelligenceMemorySimilarityDocument,
    b: IntelligenceMemorySimilarityDocument
  ): number {
    const tokensA = tokenizeMemoryText(a.text);
    const tokensB = tokenizeMemoryText(b.text);
    let score = jaccardSimilarity(tokensA, tokensB);

    // Soft domain boost when both sides declare the same domain.
    if (a.domain && b.domain && a.domain === b.domain) {
      score = Math.min(1, score + 0.05);
    }

    return score;
  }

  rank(
    query: IntelligenceMemorySimilarityDocument,
    candidates: readonly IntelligenceMemorySimilarityDocument[]
  ): IntelligenceMemorySimilarityHit[] {
    return candidates
      .map((candidate) => ({
        id: candidate.id,
        score: this.score(query, candidate),
      }))
      .sort((x, y) => y.score - x.score);
  }
}

/** Flatten a persistent memory into a similarity document. */
export function memoryRecordToSimilarityDocument(
  record: IntelligencePersistentMemoryRecord
): IntelligenceMemorySimilarityDocument {
  const parts = [
    ...record.observations,
    ...record.assumptions,
    ...record.recommendations,
    ...record.evidence.map((e) => e.label ?? e.evidenceId),
  ];
  return {
    id: record.id,
    text: parts.join(" "),
    domain: record.domain,
    metadata: record.metadata,
  };
}

/** Build a similarity document from free-form relevance query fields. */
export function relevanceQueryToSimilarityDocument(
  id: string,
  textParts: readonly string[],
  domain?: IntelligenceMemorySimilarityDocument["domain"]
): IntelligenceMemorySimilarityDocument {
  return {
    id,
    text: textParts.filter(Boolean).join(" "),
    domain,
  };
}

/** Factory for the default (non-embedding) similarity engine. */
export function createDefaultSimilarityEngine(): IntelligenceMemorySimilarityEngine {
  return new TokenOverlapSimilarityEngine();
}
