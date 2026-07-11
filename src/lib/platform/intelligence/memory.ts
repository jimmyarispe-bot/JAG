/**
 * JAG Intelligence — memory model (foundation).
 *
 * Short-term: session / conversation / current workflow.
 * Long-term: historical decisions, patterns, institutional knowledge.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceMemoryKind,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** A single memory entry stored by the cognitive layer. */
export interface IntelligenceMemoryEntry {
  memoryId: string;
  kind: IntelligenceMemoryKind;
  key: string;
  content: string;
  embeddingRef?: string;
  organizationId: string | null;
  schoolId: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  expiresAt?: string | null;
  metadata?: IntelligenceMetadata;
}

/** Query filters for memory retrieval. */
export interface IntelligenceMemoryQuery {
  kind?: IntelligenceMemoryKind;
  key?: string;
  organizationId?: string | null;
  schoolId?: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  limit?: number;
}

/** Input to store a new memory entry. */
export interface StoreIntelligenceMemoryInput {
  kind: IntelligenceMemoryKind;
  key: string;
  content: string;
  embeddingRef?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: string | null;
  metadata?: IntelligenceMetadata;
}

/**
 * Short-term and long-term memory for JAG cognitive services.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceMemoryService {
  /**
   * Persist a memory entry within the given context scope.
   * @throws Always — not implemented in the foundation layer.
   */
  store(
    _context: IntelligenceContext,
    _input: StoreIntelligenceMemoryInput
  ): IntelligenceMemoryEntry {
    throw new Error("JAG Intelligence foundation: IntelligenceMemoryService.store is not implemented");
  }

  /**
   * Retrieve memory entries matching a query.
   * @throws Always — not implemented in the foundation layer.
   */
  recall(
    _context: IntelligenceContext,
    _query: IntelligenceMemoryQuery
  ): IntelligenceMemoryEntry[] {
    throw new Error("JAG Intelligence foundation: IntelligenceMemoryService.recall is not implemented");
  }

  /**
   * Forget (invalidate) a memory entry by id.
   * @throws Always — not implemented in the foundation layer.
   */
  forget(_context: IntelligenceContext, _memoryId: string): void {
    throw new Error("JAG Intelligence foundation: IntelligenceMemoryService.forget is not implemented");
  }
}
