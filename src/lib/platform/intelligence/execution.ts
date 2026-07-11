/**
 * JAG Intelligence — authorized execution (foundation).
 *
 * Executes plan steps only when authority and human gates allow.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type { IntelligencePlan, IntelligencePlanStep } from "@/lib/platform/intelligence/planner";
import type {
  IntelligenceMetadata,
  IntelligenceOutcome,
  IntelligenceRecommendation,
} from "@/lib/platform/intelligence/types";

/** Request to execute a recommendation or plan step. */
export interface IntelligenceExecutionRequest {
  recommendation?: IntelligenceRecommendation;
  plan?: IntelligencePlan;
  step?: IntelligencePlanStep;
  authorizedByUserId?: string | null;
  dryRun?: boolean;
  metadata?: IntelligenceMetadata;
}

/** Result of an execution attempt. */
export interface IntelligenceExecutionResult {
  executionId: string;
  success: boolean;
  skipped: boolean;
  requiresAuthorization: boolean;
  outcome: IntelligenceOutcome | null;
  message: string;
  executedAt: string;
  metadata?: IntelligenceMetadata;
}

/**
 * Executes authorized intelligence actions and records outcomes.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceExecutionService {
  /**
   * Execute a recommendation or plan step under the given context.
   * @throws Always — not implemented in the foundation layer.
   */
  execute(
    _context: IntelligenceContext,
    _request: IntelligenceExecutionRequest
  ): IntelligenceExecutionResult {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceExecutionService.execute is not implemented"
    );
  }

  /**
   * Cancel an in-flight or pending execution.
   * @throws Always — not implemented in the foundation layer.
   */
  cancel(_context: IntelligenceContext, _executionId: string, _reason?: string): void {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceExecutionService.cancel is not implemented"
    );
  }
}
