/**
 * JAG Intelligence — action planner (foundation).
 *
 * Turns ranked hypotheses into ordered, authority-aware action plans.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceActionAuthority,
  IntelligenceHypothesis,
  IntelligenceMetadata,
  IntelligenceRecommendation,
} from "@/lib/platform/intelligence/types";

/** A single step in an intelligence action plan. */
export interface IntelligencePlanStep {
  stepId: string;
  actionKey: string;
  label: string;
  description?: string;
  authority: IntelligenceActionAuthority;
  dependsOnStepIds?: string[];
  metadata?: IntelligenceMetadata;
}

/** Ordered plan produced from reasoning output. */
export interface IntelligencePlan {
  planId: string;
  steps: IntelligencePlanStep[];
  primaryRecommendation: IntelligenceRecommendation | null;
  summary: string;
  metadata?: IntelligenceMetadata;
}

/** Input to the planner. */
export interface IntelligencePlanInput {
  intent: string;
  hypotheses: IntelligenceHypothesis[];
  constraints?: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/**
 * Builds authorized action plans from reasoning results.
 * Business logic deferred — foundation stub only.
 */
export class IntelligencePlannerService {
  /**
   * Create an action plan from ranked hypotheses.
   * @throws Always — not implemented in the foundation layer.
   */
  plan(_context: IntelligenceContext, _input: IntelligencePlanInput): IntelligencePlan {
    throw new Error(
      "JAG Intelligence foundation: IntelligencePlannerService.plan is not implemented"
    );
  }

  /**
   * Re-plan after an outcome or authorization change.
   * @throws Always — not implemented in the foundation layer.
   */
  replan(
    _context: IntelligenceContext,
    _plan: IntelligencePlan,
    _reason: string
  ): IntelligencePlan {
    throw new Error(
      "JAG Intelligence foundation: IntelligencePlannerService.replan is not implemented"
    );
  }
}
