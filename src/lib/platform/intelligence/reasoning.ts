/**
 * JAG Intelligence — reasoning engine (foundation).
 *
 * Generates and ranks hypotheses from observed signals and evidence.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceEvidenceRef,
  IntelligenceHypothesis,
  IntelligenceMetadata,
  IntelligencePipelineStage,
} from "@/lib/platform/intelligence/types";

/** Input to a reasoning pass. */
export interface IntelligenceReasoningInput {
  intent: string;
  observations?: string[];
  evidenceRefs?: IntelligenceEvidenceRef[];
  stage?: IntelligencePipelineStage;
  metadata?: IntelligenceMetadata;
}

/** Result of a reasoning pass. */
export interface IntelligenceReasoningResult {
  hypotheses: IntelligenceHypothesis[];
  primaryHypothesis: IntelligenceHypothesis | null;
  reasoningNotes: string[];
  metadata?: IntelligenceMetadata;
}

/**
 * Hypothesis generation and ranking for the decision pipeline.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceReasoningService {
  /**
   * Generate ranked hypotheses from observations and evidence.
   * @throws Always — not implemented in the foundation layer.
   */
  reason(
    _context: IntelligenceContext,
    _input: IntelligenceReasoningInput
  ): IntelligenceReasoningResult {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceReasoningService.reason is not implemented"
    );
  }

  /**
   * Refine an existing hypothesis set with additional evidence.
   * @throws Always — not implemented in the foundation layer.
   */
  refine(
    _context: IntelligenceContext,
    _hypotheses: IntelligenceHypothesis[],
    _evidenceRefs: IntelligenceEvidenceRef[]
  ): IntelligenceReasoningResult {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceReasoningService.refine is not implemented"
    );
  }
}
