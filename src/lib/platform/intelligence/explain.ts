/**
 * JAG Intelligence — explainability (foundation).
 *
 * Every recommendation must answer: what, why, evidence, confidence,
 * alternatives, expected impact, and recommended next step.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceExplanation,
  IntelligenceHypothesis,
  IntelligenceMetadata,
  IntelligenceRecommendation,
  IntelligenceRunSnapshot,
} from "@/lib/platform/intelligence/types";

/** Input used to build an explanation. */
export interface BuildIntelligenceExplanationInput {
  run?: IntelligenceRunSnapshot;
  recommendation?: IntelligenceRecommendation;
  hypotheses?: IntelligenceHypothesis[];
  metadata?: IntelligenceMetadata;
}

/**
 * Builds human-readable explanations for intelligence outputs.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceExplainService {
  /**
   * Build a structured explanation for a recommendation or run.
   * @throws Always — not implemented in the foundation layer.
   */
  explain(
    _context: IntelligenceContext,
    _input: BuildIntelligenceExplanationInput
  ): IntelligenceExplanation {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceExplainService.explain is not implemented"
    );
  }

  /**
   * Produce a short narrative summary suitable for UI surfaces.
   * @throws Always — not implemented in the foundation layer.
   */
  summarize(_context: IntelligenceContext, _explanation: IntelligenceExplanation): string {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceExplainService.summarize is not implemented"
    );
  }
}
