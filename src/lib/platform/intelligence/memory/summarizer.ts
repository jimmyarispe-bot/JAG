/**
 * JAG Intelligence — memory summarizer (Sprint 009).
 *
 * Produces executive summaries from related persistent memories.
 * Deterministic, rule-based — no LLM dependency in this sprint.
 */

import type {
  IntelligenceMemorySummary,
  IntelligencePersistentMemoryRecord,
} from "@/lib/platform/intelligence/memory/types";
import type {
  IntelligenceDomain,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Options for summarization. */
export interface SummarizeIntelligenceMemoryOptions {
  maxObservations?: number;
  maxRecommendations?: number;
  metadata?: IntelligenceMetadata;
  summaryId?: string;
  generatedAt?: string;
}

function uniquePreserveOrder(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function resolveDomainFocus(
  memories: readonly IntelligencePersistentMemoryRecord[]
): IntelligenceDomain | "mixed" {
  if (memories.length === 0) {
    return "mixed";
  }
  const domains = new Set(memories.map((m) => m.domain));
  if (domains.size === 1) {
    return memories[0]!.domain;
  }
  return "mixed";
}

function averageConfidence(
  memories: readonly IntelligencePersistentMemoryRecord[]
): number {
  if (memories.length === 0) {
    return 0;
  }
  const sum = memories.reduce((acc, m) => acc + m.confidence.value, 0);
  return Number((sum / memories.length).toFixed(4));
}

/**
 * Generates executive summaries of related intelligence memories.
 */
export class IntelligenceMemorySummarizer {
  summarize(
    memories: readonly IntelligencePersistentMemoryRecord[],
    options: SummarizeIntelligenceMemoryOptions = {}
  ): IntelligenceMemorySummary {
    const maxObservations = options.maxObservations ?? 5;
    const maxRecommendations = options.maxRecommendations ?? 5;
    const generatedAt = options.generatedAt ?? new Date().toISOString();
    const summaryId =
      options.summaryId ?? `mem-summary-${generatedAt.replace(/[:.]/g, "-")}`;

    const domainFocus = resolveDomainFocus(memories);
    const keyObservations = uniquePreserveOrder(
      memories.flatMap((m) => m.observations)
    ).slice(0, maxObservations);
    const keyRecommendations = uniquePreserveOrder(
      memories.flatMap((m) => m.recommendations)
    ).slice(0, maxRecommendations);

    const avg = averageConfidence(memories);
    const headline =
      memories.length === 0
        ? "No related intelligence memories"
        : domainFocus === "mixed"
          ? `Summary of ${memories.length} cross-domain intelligence memories`
          : `Summary of ${memories.length} ${domainFocus} intelligence memories`;

    const observationClause =
      keyObservations.length > 0
        ? `Key observations: ${keyObservations.join("; ")}.`
        : "No observations recorded.";
    const recommendationClause =
      keyRecommendations.length > 0
        ? `Recommended actions: ${keyRecommendations.join("; ")}.`
        : "No recommendations recorded.";

    const narrative =
      memories.length === 0
        ? "There are no memories to summarize."
        : `${headline}. Average confidence ${avg}. ${observationClause} ${recommendationClause}`;

    return {
      summaryId,
      generatedAt,
      memoryIds: memories.map((m) => m.id),
      domainFocus,
      headline,
      narrative,
      keyObservations,
      keyRecommendations,
      averageConfidence: avg,
      metadata: { ...(options.metadata ?? {}) },
    };
  }
}

/** Factory for the default summarizer. */
export function createIntelligenceMemorySummarizer(): IntelligenceMemorySummarizer {
  return new IntelligenceMemorySummarizer();
}
