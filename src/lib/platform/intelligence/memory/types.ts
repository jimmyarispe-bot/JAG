/**
 * JAG Intelligence — persistent memory contracts (Sprint 009).
 *
 * Extends the foundation memory model with durable, queryable
 * executive/domain intelligence entries. No direct database access —
 * persistence is injected via {@link IntelligenceMemoryRepository}.
 */

import type {
  IntelligenceConfidenceScore,
  IntelligenceDomain,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Lifecycle status for a persistent intelligence memory entry. */
export const INTELLIGENCE_MEMORY_LIFECYCLE_STATUSES = [
  "active",
  "archived",
  "expired",
  "deleted",
] as const;
export type IntelligenceMemoryLifecycleStatus =
  (typeof INTELLIGENCE_MEMORY_LIFECYCLE_STATUSES)[number];

/**
 * A durable intelligence memory entry.
 *
 * Distinct from the foundation {@link IntelligenceMemoryEntry} (session/key-value).
 */
export interface IntelligencePersistentMemoryRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly domain: IntelligenceDomain;
  /** Snapshot of the originating intelligence request. */
  readonly request: IntelligenceMetadata;
  /** Context snapshot captured at write time. */
  readonly contextSnapshot: IntelligenceMetadata;
  readonly observations: readonly string[];
  readonly evidence: readonly IntelligenceEvidenceRef[];
  readonly assumptions: readonly string[];
  readonly recommendations: readonly string[];
  readonly confidence: IntelligenceConfidenceScore;
  readonly metadata: IntelligenceMetadata;
  readonly executionId: string;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly status: IntelligenceMemoryLifecycleStatus;
  readonly updatedAt: string;
  readonly expiresAt?: string | null;
}

/** Input used to create a new persistent memory entry. */
export interface CreateIntelligenceMemoryInput {
  domain: IntelligenceDomain;
  request?: IntelligenceMetadata;
  contextSnapshot?: IntelligenceMetadata;
  observations?: string[];
  evidence?: IntelligenceEvidenceRef[];
  assumptions?: string[];
  recommendations?: string[];
  confidence?: IntelligenceConfidenceScore;
  metadata?: IntelligenceMetadata;
  executionId: string;
  organizationId?: string | null;
  schoolId?: string | null;
  expiresAt?: string | null;
  /** Optional caller-supplied id; generated when omitted. */
  id?: string;
  timestamp?: string;
}

/** Partial update applied to an existing memory. */
export interface UpdateIntelligenceMemoryInput {
  observations?: string[];
  evidence?: IntelligenceEvidenceRef[];
  assumptions?: string[];
  recommendations?: string[];
  confidence?: IntelligenceConfidenceScore;
  metadata?: IntelligenceMetadata;
  contextSnapshot?: IntelligenceMetadata;
  request?: IntelligenceMetadata;
  expiresAt?: string | null;
  status?: IntelligenceMemoryLifecycleStatus;
}

/** Date-range filter for retrieval (ISO-8601 inclusive bounds). */
export interface IntelligenceMemoryDateRange {
  from?: string;
  to?: string;
}

/** Repository / retrieval filter. Soft-deleted entries are excluded by default. */
export interface IntelligenceMemoryRetrievalFilter {
  domain?: IntelligenceDomain;
  organizationId?: string | null;
  schoolId?: string | null;
  executionId?: string;
  dateRange?: IntelligenceMemoryDateRange;
  statuses?: IntelligenceMemoryLifecycleStatus[];
  includeDeleted?: boolean;
  limit?: number;
}

/** Query for relevance-ranked retrieval. */
export interface IntelligenceMemoryRelevanceQuery {
  text?: string;
  domain?: IntelligenceDomain;
  organizationId?: string | null;
  executionId?: string;
  observations?: string[];
  recommendations?: string[];
  assumptions?: string[];
  limit?: number;
  statuses?: IntelligenceMemoryLifecycleStatus[];
}

/** Document shape consumed by the similarity engine. */
export interface IntelligenceMemorySimilarityDocument {
  id: string;
  text: string;
  domain?: IntelligenceDomain;
  metadata?: IntelligenceMetadata;
}

/** Ranked similarity hit. */
export interface IntelligenceMemorySimilarityHit {
  id: string;
  score: number;
}

/** Executive-style summary of related memories. */
export interface IntelligenceMemorySummary {
  readonly summaryId: string;
  readonly generatedAt: string;
  readonly memoryIds: readonly string[];
  readonly domainFocus: IntelligenceDomain | "mixed";
  readonly headline: string;
  readonly narrative: string;
  readonly keyObservations: readonly string[];
  readonly keyRecommendations: readonly string[];
  readonly averageConfidence: number;
  readonly metadata: IntelligenceMetadata;
}

/**
 * Persistence port — inject a concrete repository (in-memory, SQL, etc.).
 * No database calls live in the memory package itself.
 */
export interface IntelligenceMemoryRepository {
  save(
    record: IntelligencePersistentMemoryRecord
  ): Promise<IntelligencePersistentMemoryRecord>;
  findById(id: string): Promise<IntelligencePersistentMemoryRecord | null>;
  findMany(
    filter: IntelligenceMemoryRetrievalFilter
  ): Promise<IntelligencePersistentMemoryRecord[]>;
  delete(id: string): Promise<boolean>;
}

/** Similarity engine port — replaceable with embeddings later. */
export interface IntelligenceMemorySimilarityEngine {
  score(
    a: IntelligenceMemorySimilarityDocument,
    b: IntelligenceMemorySimilarityDocument
  ): number;
  rank(
    query: IntelligenceMemorySimilarityDocument,
    candidates: readonly IntelligenceMemorySimilarityDocument[]
  ): IntelligenceMemorySimilarityHit[];
}

/** Default confidence when none is supplied at create time. */
export const DEFAULT_MEMORY_CONFIDENCE: IntelligenceConfidenceScore = {
  value: 0,
  level: "unknown",
  factors: [],
};
