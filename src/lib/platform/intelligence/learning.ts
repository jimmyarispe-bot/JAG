/**
 * JAG Intelligence — learning loop (foundation).
 *
 * Captures outcomes so future recommendations improve over time.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceDomain,
  IntelligenceMetadata,
  IntelligenceOutcome,
  IntelligenceRecommendation,
} from "@/lib/platform/intelligence/types";

/** Record of a learning event derived from an outcome. */
export interface IntelligenceLearningRecord {
  learningId: string;
  domain: IntelligenceDomain;
  recommendationId?: string;
  outcomeId: string;
  patternKey?: string;
  summary: string;
  success: boolean;
  organizationId: string | null;
  schoolId: string | null;
  createdAt: string;
  metadata?: IntelligenceMetadata;
}

/** Input to record a learning event. */
export interface RecordIntelligenceLearningInput {
  domain: IntelligenceDomain;
  outcome: IntelligenceOutcome;
  recommendation?: IntelligenceRecommendation;
  patternKey?: string;
  summary?: string;
  metadata?: IntelligenceMetadata;
}

/** Query for prior learning records. */
export interface IntelligenceLearningQuery {
  domain?: IntelligenceDomain;
  patternKey?: string;
  success?: boolean;
  limit?: number;
}

/**
 * Outcome analysis and institutional learning for JAG.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceLearningService {
  /**
   * Record a learning event from a measured outcome.
   * @throws Always — not implemented in the foundation layer.
   */
  record(
    _context: IntelligenceContext,
    _input: RecordIntelligenceLearningInput
  ): IntelligenceLearningRecord {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceLearningService.record is not implemented"
    );
  }

  /**
   * Retrieve prior learning records for pattern reuse.
   * @throws Always — not implemented in the foundation layer.
   */
  query(
    _context: IntelligenceContext,
    _query: IntelligenceLearningQuery
  ): IntelligenceLearningRecord[] {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceLearningService.query is not implemented"
    );
  }
}
