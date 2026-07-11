/**
 * JAG Intelligence — knowledge access (foundation).
 *
 * Retrieves and links institutional knowledge for reasoning and learning.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** A knowledge node surfaced to cognitive services. */
export interface IntelligenceKnowledgeNode {
  nodeId: string;
  nodeType: string;
  label: string;
  summary?: string;
  organizationId: string | null;
  schoolId: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: IntelligenceMetadata;
}

/** Query against the knowledge layer / graph. */
export interface IntelligenceKnowledgeQuery {
  text?: string;
  nodeTypes?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  limit?: number;
  metadata?: IntelligenceMetadata;
}

/** Result set from a knowledge query. */
export interface IntelligenceKnowledgeResult {
  nodes: IntelligenceKnowledgeNode[];
  query: IntelligenceKnowledgeQuery;
  retrievedAt: string;
  metadata?: IntelligenceMetadata;
}

/** Input to register or update a knowledge node. */
export interface UpsertIntelligenceKnowledgeInput {
  nodeType: string;
  label: string;
  summary?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: IntelligenceMetadata;
}

/**
 * Knowledge retrieval and registration for JAG cognitive services.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceKnowledgeService {
  /**
   * Query knowledge relevant to the current context.
   * @throws Always — not implemented in the foundation layer.
   */
  query(
    _context: IntelligenceContext,
    _query: IntelligenceKnowledgeQuery
  ): IntelligenceKnowledgeResult {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceKnowledgeService.query is not implemented"
    );
  }

  /**
   * Upsert a knowledge node into institutional memory.
   * @throws Always — not implemented in the foundation layer.
   */
  upsert(
    _context: IntelligenceContext,
    _input: UpsertIntelligenceKnowledgeInput
  ): IntelligenceKnowledgeNode {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceKnowledgeService.upsert is not implemented"
    );
  }
}
