/**
 * JAG Intelligence — persistent memory store (Sprint 009).
 *
 * Thin store over an injected {@link IntelligenceMemoryRepository}.
 * All persistence goes through the repository — no direct DB access.
 */

import type {
  IntelligenceMemoryRepository,
  IntelligenceMemoryRetrievalFilter,
  IntelligencePersistentMemoryRecord,
} from "@/lib/platform/intelligence/memory/types";

/** Dependencies for {@link IntelligenceMemoryStore}. */
export interface IntelligenceMemoryStoreDependencies {
  repository: IntelligenceMemoryRepository;
}

/**
 * Persistent intelligence memory store.
 * Delegates all reads/writes to the injected repository.
 */
export class IntelligenceMemoryStore {
  private readonly repository: IntelligenceMemoryRepository;

  constructor(dependencies: IntelligenceMemoryStoreDependencies) {
    this.repository = dependencies.repository;
  }

  /** Persist (insert or overwrite) a memory record. */
  async save(
    record: IntelligencePersistentMemoryRecord
  ): Promise<IntelligencePersistentMemoryRecord> {
    return this.repository.save(record);
  }

  /** Load a single memory by id. */
  async load(id: string): Promise<IntelligencePersistentMemoryRecord | null> {
    return this.repository.findById(id);
  }

  /** List memories matching a retrieval filter. */
  async find(
    filter: IntelligenceMemoryRetrievalFilter
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.repository.findMany(filter);
  }

  /** Hard-delete a memory by id via the repository. */
  async remove(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  /** Expose the injected repository for advanced callers / tests. */
  getRepository(): IntelligenceMemoryRepository {
    return this.repository;
  }
}

/**
 * In-memory repository for tests and local development.
 * Not a production persistence backend.
 */
export class InMemoryIntelligenceMemoryRepository
  implements IntelligenceMemoryRepository
{
  private readonly records = new Map<string, IntelligencePersistentMemoryRecord>();

  async save(
    record: IntelligencePersistentMemoryRecord
  ): Promise<IntelligencePersistentMemoryRecord> {
    const frozen = Object.freeze({
      ...record,
      observations: Object.freeze([...record.observations]),
      evidence: Object.freeze(record.evidence.map((e) => Object.freeze({ ...e }))),
      assumptions: Object.freeze([...record.assumptions]),
      recommendations: Object.freeze([...record.recommendations]),
      confidence: Object.freeze({
        ...record.confidence,
        factors: Object.freeze(
          record.confidence.factors.map((f) => Object.freeze({ ...f }))
        ),
      }),
      request: { ...record.request },
      contextSnapshot: { ...record.contextSnapshot },
      metadata: { ...record.metadata },
    }) as IntelligencePersistentMemoryRecord;
    this.records.set(frozen.id, frozen);
    return frozen;
  }

  async findById(id: string): Promise<IntelligencePersistentMemoryRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findMany(
    filter: IntelligenceMemoryRetrievalFilter
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    let results = Array.from(this.records.values());

    if (!filter.includeDeleted) {
      results = results.filter((r) => r.status !== "deleted");
    }

    if (filter.statuses && filter.statuses.length > 0) {
      const allowed = new Set(filter.statuses);
      results = results.filter((r) => allowed.has(r.status));
    }

    if (filter.domain !== undefined) {
      results = results.filter((r) => r.domain === filter.domain);
    }

    if (filter.organizationId !== undefined) {
      results = results.filter((r) => r.organizationId === filter.organizationId);
    }

    if (filter.schoolId !== undefined) {
      results = results.filter((r) => r.schoolId === filter.schoolId);
    }

    if (filter.executionId !== undefined) {
      results = results.filter((r) => r.executionId === filter.executionId);
    }

    if (filter.dateRange) {
      const { from, to } = filter.dateRange;
      if (from) {
        results = results.filter((r) => r.timestamp >= from);
      }
      if (to) {
        results = results.filter((r) => r.timestamp <= to);
      }
    }

    results.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));

    if (filter.limit !== undefined && filter.limit >= 0) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  /** Test helper — clear all stored records. */
  clear(): void {
    this.records.clear();
  }

  /** Test helper — current size. */
  size(): number {
    return this.records.size;
  }
}
