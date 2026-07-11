/**
 * JAG Intelligence — memory retrieval (Sprint 009).
 *
 * Query helpers over the persistent memory store:
 * domain, date, organization, execution, and relevance ranking.
 */

import {
  memoryRecordToSimilarityDocument,
  relevanceQueryToSimilarityDocument,
} from "@/lib/platform/intelligence/memory/similarity";
import type { IntelligenceMemoryStore } from "@/lib/platform/intelligence/memory/store";
import type {
  IntelligenceMemoryDateRange,
  IntelligenceMemoryRelevanceQuery,
  IntelligenceMemorySimilarityEngine,
  IntelligenceMemoryRetrievalFilter,
  IntelligencePersistentMemoryRecord,
} from "@/lib/platform/intelligence/memory/types";
import type { IntelligenceDomain } from "@/lib/platform/intelligence/types";

/** Dependencies for {@link IntelligenceMemoryRetrieval}. */
export interface IntelligenceMemoryRetrievalDependencies {
  store: IntelligenceMemoryStore;
  similarity: IntelligenceMemorySimilarityEngine;
}

/**
 * Retrieval façade for persistent intelligence memory.
 */
export class IntelligenceMemoryRetrieval {
  private readonly store: IntelligenceMemoryStore;
  private readonly similarity: IntelligenceMemorySimilarityEngine;

  constructor(dependencies: IntelligenceMemoryRetrievalDependencies) {
    this.store = dependencies.store;
    this.similarity = dependencies.similarity;
  }

  /** Retrieve memories for a domain. */
  async byDomain(
    domain: IntelligenceDomain,
    options: Omit<IntelligenceMemoryRetrievalFilter, "domain"> = {}
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.store.find({ ...options, domain });
  }

  /** Retrieve memories within an inclusive date range. */
  async byDate(
    dateRange: IntelligenceMemoryDateRange,
    options: Omit<IntelligenceMemoryRetrievalFilter, "dateRange"> = {}
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.store.find({ ...options, dateRange });
  }

  /** Retrieve memories for an organization. */
  async byOrganization(
    organizationId: string | null,
    options: Omit<IntelligenceMemoryRetrievalFilter, "organizationId"> = {}
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.store.find({ ...options, organizationId });
  }

  /** Retrieve memories tied to an execution id. */
  async byExecution(
    executionId: string,
    options: Omit<IntelligenceMemoryRetrievalFilter, "executionId"> = {}
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.store.find({ ...options, executionId });
  }

  /**
   * Retrieve the most relevant memories for a query.
   * Uses the injected similarity engine (token overlap by default).
   */
  async mostRelevant(
    query: IntelligenceMemoryRelevanceQuery
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    const limit = query.limit ?? 10;
    const candidates = await this.store.find({
      domain: query.domain,
      organizationId: query.organizationId,
      executionId: query.executionId,
      statuses: query.statuses ?? ["active"],
      limit: Math.max(limit * 5, 50),
    });

    if (candidates.length === 0) {
      return [];
    }

    const textParts = [
      query.text ?? "",
      ...(query.observations ?? []),
      ...(query.assumptions ?? []),
      ...(query.recommendations ?? []),
    ];

    const queryDoc = relevanceQueryToSimilarityDocument(
      "query",
      textParts,
      query.domain
    );

    const ranked = this.similarity.rank(
      queryDoc,
      candidates.map(memoryRecordToSimilarityDocument)
    );

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const ordered: IntelligencePersistentMemoryRecord[] = [];
    for (const hit of ranked) {
      if (hit.score <= 0) {
        continue;
      }
      const record = byId.get(hit.id);
      if (record) {
        ordered.push(record);
      }
      if (ordered.length >= limit) {
        break;
      }
    }

    // If nothing scored > 0, fall back to newest candidates within limit.
    if (ordered.length === 0) {
      return candidates.slice(0, limit);
    }

    return ordered;
  }
}
