/**
 * JAG Intelligence — confidence scoring (foundation).
 *
 * Scores hypotheses and recommendations before action is taken.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceHypothesis,
  IntelligenceMetadata,
  IntelligenceRecommendation,
} from "@/lib/platform/intelligence/types";

/** Inputs used to compute a confidence score. */
export interface IntelligenceConfidenceInput {
  evidenceRefs?: IntelligenceEvidenceRef[];
  hypothesis?: IntelligenceHypothesis;
  recommendation?: IntelligenceRecommendation;
  priorScore?: IntelligenceConfidenceScore;
  adjustments?: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/**
 * Confidence calibration for hypotheses and recommendations.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceConfidenceService {
  /**
   * Score confidence for a hypothesis or recommendation.
   * @throws Always — not implemented in the foundation layer.
   */
  score(
    _context: IntelligenceContext,
    _input: IntelligenceConfidenceInput
  ): IntelligenceConfidenceScore {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceConfidenceService.score is not implemented"
    );
  }

  /**
   * Recalibrate confidence after an observed outcome.
   * @throws Always — not implemented in the foundation layer.
   */
  calibrate(
    _context: IntelligenceContext,
    _prior: IntelligenceConfidenceScore,
    _actualSuccess: boolean
  ): IntelligenceConfidenceScore {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceConfidenceService.calibrate is not implemented"
    );
  }
}
