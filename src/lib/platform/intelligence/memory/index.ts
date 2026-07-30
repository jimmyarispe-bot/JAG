/**
 * JAG Intelligence — persistent memory public API (Sprint 009).
 *
 * Extends the foundation memory layer. Import from this module (or
 * `@/lib/platform/intelligence/memory/*` subpaths) — do not replace
 * `@/lib/platform/intelligence/memory` (foundation `memory.ts`).
 */

import { IntelligenceMemoryLifecycle } from "@/lib/platform/intelligence/memory/lifecycle";
import { IntelligenceMemoryRetrieval } from "@/lib/platform/intelligence/memory/retrieval";
import {
  createDefaultSimilarityEngine,
} from "@/lib/platform/intelligence/memory/similarity";
import {
  InMemoryIntelligenceMemoryRepository,
  IntelligenceMemoryStore,
} from "@/lib/platform/intelligence/memory/store";
import {
  createIntelligenceMemorySummarizer,
  IntelligenceMemorySummarizer,
  type SummarizeIntelligenceMemoryOptions,
} from "@/lib/platform/intelligence/memory/summarizer";
import type {
  CreateIntelligenceMemoryInput,
  IntelligenceMemoryRelevanceQuery,
  IntelligenceMemoryRepository,
  IntelligenceMemorySimilarityEngine,
  IntelligenceMemorySummary,
  IntelligencePersistentMemoryRecord,
  UpdateIntelligenceMemoryInput,
} from "@/lib/platform/intelligence/memory/types";

export type {
  CreateIntelligenceMemoryInput,
  IntelligenceMemoryDateRange,
  IntelligenceMemoryLifecycleStatus,
  IntelligenceMemoryRelevanceQuery,
  IntelligenceMemoryRepository,
  IntelligenceMemoryRetrievalFilter,
  IntelligenceMemorySimilarityDocument,
  IntelligenceMemorySimilarityEngine,
  IntelligenceMemorySimilarityHit,
  IntelligenceMemorySummary,
  IntelligencePersistentMemoryRecord,
  UpdateIntelligenceMemoryInput,
} from "@/lib/platform/intelligence/memory/types";
export {
  DEFAULT_MEMORY_CONFIDENCE,
  INTELLIGENCE_MEMORY_LIFECYCLE_STATUSES,
} from "@/lib/platform/intelligence/memory/types";

export {
  InMemoryIntelligenceMemoryRepository,
  IntelligenceMemoryStore,
  type IntelligenceMemoryStoreDependencies,
} from "@/lib/platform/intelligence/memory/store";

export {
  IntelligenceMemoryRetrieval,
  type IntelligenceMemoryRetrievalDependencies,
} from "@/lib/platform/intelligence/memory/retrieval";

export {
  TokenOverlapSimilarityEngine,
  createDefaultSimilarityEngine,
  jaccardSimilarity,
  memoryRecordToSimilarityDocument,
  relevanceQueryToSimilarityDocument,
  tokenizeMemoryText,
} from "@/lib/platform/intelligence/memory/similarity";

export {
  IntelligenceMemorySummarizer,
  createIntelligenceMemorySummarizer,
  type SummarizeIntelligenceMemoryOptions,
} from "@/lib/platform/intelligence/memory/summarizer";

export {
  IntelligenceMemoryLifecycle,
  type IntelligenceMemoryLifecycleDependencies,
} from "@/lib/platform/intelligence/memory/lifecycle";

/** Injected collaborators for {@link PersistentIntelligenceMemory}. */
export interface PersistentIntelligenceMemoryDependencies {
  repository?: IntelligenceMemoryRepository;
  store?: IntelligenceMemoryStore;
  similarity?: IntelligenceMemorySimilarityEngine;
  summarizer?: IntelligenceMemorySummarizer;
  lifecycle?: IntelligenceMemoryLifecycle;
  retrieval?: IntelligenceMemoryRetrieval;
  now?: () => Date;
  createId?: () => string;
}

/**
 * Public persistent-memory façade.
 *
 * Implements: createMemory, saveMemory, loadMemory, findRelatedMemory,
 * summarizeMemory, archiveMemory, deleteMemory.
 */
export class PersistentIntelligenceMemory {
  readonly store: IntelligenceMemoryStore;
  readonly retrieval: IntelligenceMemoryRetrieval;
  readonly similarity: IntelligenceMemorySimilarityEngine;
  readonly summarizer: IntelligenceMemorySummarizer;
  readonly lifecycle: IntelligenceMemoryLifecycle;
  readonly repository: IntelligenceMemoryRepository;

  constructor(dependencies: PersistentIntelligenceMemoryDependencies = {}) {
    this.repository =
      dependencies.repository ?? new InMemoryIntelligenceMemoryRepository();
    this.store =
      dependencies.store ?? new IntelligenceMemoryStore({ repository: this.repository });
    this.similarity = dependencies.similarity ?? createDefaultSimilarityEngine();
    this.summarizer =
      dependencies.summarizer ?? createIntelligenceMemorySummarizer();
    this.lifecycle =
      dependencies.lifecycle ??
      new IntelligenceMemoryLifecycle({
        store: this.store,
        now: dependencies.now,
        createId: dependencies.createId,
      });
    this.retrieval =
      dependencies.retrieval ??
      new IntelligenceMemoryRetrieval({
        store: this.store,
        similarity: this.similarity,
      });
  }

  /** Create a new memory record (not persisted until {@link saveMemory}). */
  createMemory(input: CreateIntelligenceMemoryInput): IntelligencePersistentMemoryRecord {
    return this.lifecycle.create(input);
  }

  /** Persist a memory record. */
  async saveMemory(
    record: IntelligencePersistentMemoryRecord
  ): Promise<IntelligencePersistentMemoryRecord> {
    return this.lifecycle.save(record);
  }

  /** Load a memory by id. */
  async loadMemory(id: string): Promise<IntelligencePersistentMemoryRecord | null> {
    return this.lifecycle.load(id);
  }

  /** Find related memories via relevance ranking. */
  async findRelatedMemory(
    query: IntelligenceMemoryRelevanceQuery
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.retrieval.mostRelevant(query);
  }

  /** Summarize a set of related memories (or load + summarize by ids). */
  async summarizeMemory(
    memoriesOrIds: readonly IntelligencePersistentMemoryRecord[] | readonly string[],
    options?: SummarizeIntelligenceMemoryOptions
  ): Promise<IntelligenceMemorySummary> {
    if (memoriesOrIds.length === 0) {
      return this.summarizer.summarize([], options);
    }

    const first = memoriesOrIds[0];
    if (typeof first === "string") {
      const loaded: IntelligencePersistentMemoryRecord[] = [];
      for (const id of memoriesOrIds as readonly string[]) {
        const record = await this.loadMemory(id);
        if (record) {
          loaded.push(record);
        }
      }
      return this.summarizer.summarize(loaded, options);
    }

    return this.summarizer.summarize(
      memoriesOrIds as readonly IntelligencePersistentMemoryRecord[],
      options
    );
  }

  /** Soft-archive a memory. */
  async archiveMemory(id: string): Promise<IntelligencePersistentMemoryRecord> {
    return this.lifecycle.archive(id);
  }

  /** Soft-delete (default) or hard-delete a memory. */
  async deleteMemory(
    id: string,
    options: { hard?: boolean } = {}
  ): Promise<boolean> {
    return this.lifecycle.delete(id, options);
  }

  /** Update an existing memory and persist. */
  async updateMemory(
    id: string,
    patch: UpdateIntelligenceMemoryInput
  ): Promise<IntelligencePersistentMemoryRecord> {
    return this.lifecycle.update(id, patch);
  }

  /** Expire a memory or all due memories. */
  async expireMemory(
    target: string | { asOf?: string }
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    return this.lifecycle.expire(target);
  }
}

/** Factory — defaults to an in-memory repository for local/dev/tests. */
export function createPersistentIntelligenceMemory(
  dependencies: PersistentIntelligenceMemoryDependencies = {}
): PersistentIntelligenceMemory {
  return new PersistentIntelligenceMemory(dependencies);
}

// --- Standalone public API functions (bound to a shared default instance) ---

let defaultMemory: PersistentIntelligenceMemory | null = null;

function getDefaultMemory(): PersistentIntelligenceMemory {
  if (!defaultMemory) {
    defaultMemory = createPersistentIntelligenceMemory();
  }
  return defaultMemory;
}

/** Reset the module-level default instance (tests). */
export function resetDefaultPersistentIntelligenceMemory(): void {
  defaultMemory = null;
}

/** Configure the module-level default instance (DI). */
export function setDefaultPersistentIntelligenceMemory(
  instance: PersistentIntelligenceMemory
): void {
  defaultMemory = instance;
}

export function createMemory(
  input: CreateIntelligenceMemoryInput
): IntelligencePersistentMemoryRecord {
  return getDefaultMemory().createMemory(input);
}

export async function saveMemory(
  record: IntelligencePersistentMemoryRecord
): Promise<IntelligencePersistentMemoryRecord> {
  return getDefaultMemory().saveMemory(record);
}

export async function loadMemory(
  id: string
): Promise<IntelligencePersistentMemoryRecord | null> {
  return getDefaultMemory().loadMemory(id);
}

export async function findRelatedMemory(
  query: IntelligenceMemoryRelevanceQuery
): Promise<IntelligencePersistentMemoryRecord[]> {
  return getDefaultMemory().findRelatedMemory(query);
}

export async function summarizeMemory(
  memoriesOrIds: readonly IntelligencePersistentMemoryRecord[] | readonly string[],
  options?: SummarizeIntelligenceMemoryOptions
): Promise<IntelligenceMemorySummary> {
  return getDefaultMemory().summarizeMemory(memoriesOrIds, options);
}

export async function archiveMemory(
  id: string
): Promise<IntelligencePersistentMemoryRecord> {
  return getDefaultMemory().archiveMemory(id);
}

export async function deleteMemory(
  id: string,
  options: { hard?: boolean } = {}
): Promise<boolean> {
  return getDefaultMemory().deleteMemory(id, options);
}

// --- Sprint 204 — Organizational Memory & Learning (institutional experience) ---

export {
  MEMORY_TYPES,
  MEMORY_TYPE_LABELS,
  type MemoryType,
  type MemoryOutcomeKind,
  type MemoryEvidenceRef,
  type MemoryLesson,
  type MemoryRecord,
  type MemoryCreateInput,
} from "./MemoryRecord";

export {
  buildMemoryTimeline,
  type MemoryTimeline,
  type MemoryTimelineEntry,
} from "./MemoryTimeline";

export {
  MEMORY_PATTERN_KINDS,
  detectMemoryPatterns,
  type MemoryPatternKind,
  type MemoryPattern,
} from "./MemoryPattern";

export {
  scoreMemorySimilarity,
  findSimilarMemories,
  type MemorySimilarityQuery,
  type MemorySimilarityHit,
} from "./MemorySimilarity";

export { searchMemories, type MemorySearchFilters } from "./MemorySearch";

export {
  buildMemoryInsights,
  buildSimilarSituationViews,
  type MemoryInsight,
  type SimilarSituationView,
} from "./MemoryInsights";

export { MemoryRegistry, type MemoryTypeDefinition } from "./MemoryRegistry";

export {
  resetMemoryEngineForTests,
  listMemoryRecords,
  getMemoryRecord,
  createMemoryRecord,
  runMemoryEngine,
} from "./MemoryEngine";

export {
  MemoryService,
  type MemoryServiceSearchResult,
} from "./MemoryService";

export {
  recordMemoryObservation,
  listMemoryObservations,
  clearMemoryObservationsForTests,
  type MemoryObservation,
  type MemoryObservationKind,
} from "./observability";
