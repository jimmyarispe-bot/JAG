/**
 * Executive Intelligence — follow-up actions.
 *
 * Schedules verification / review follow-ups (default: 7 days).
 * Tenant-agnostic; does not persist or call external calendars.
 */

import type {
  ExecutiveAnalysisResult,
  ExecutiveFollowup,
  ExecutiveFollowupAction,
  ExecutiveRecommendationSet,
} from "@/lib/platform/intelligence/domains/executive/types";
import { EXECUTIVE_FOLLOWUP_DAYS } from "@/lib/platform/intelligence/domains/executive/types";

/** Options for executive follow-up scheduling. */
export interface ExecutiveFollowupsOptions {
  daysUntilReview?: number;
}

/**
 * Produces scheduled executive follow-up actions.
 */
export class ExecutiveFollowups {
  private readonly daysUntilReview: number;

  constructor(options: ExecutiveFollowupsOptions = {}) {
    const days = options.daysUntilReview ?? EXECUTIVE_FOLLOWUP_DAYS;
    this.daysUntilReview = days > 0 ? days : EXECUTIVE_FOLLOWUP_DAYS;
  }

  /**
   * Schedule follow-up actions from analysis and recommendations.
   */
  schedule(
    requestId: string,
    analysisId: string,
    analysis: ExecutiveAnalysisResult,
    recommendations: ExecutiveRecommendationSet
  ): ExecutiveFollowup {
    const scheduledAt = new Date();
    const dueAt = new Date(scheduledAt);
    dueAt.setUTCDate(dueAt.getUTCDate() + this.daysUntilReview);

    return {
      followupId: `${requestId}:followup`,
      requestId,
      analysisId,
      status: "scheduled",
      dueAt: dueAt.toISOString(),
      scheduledAt: scheduledAt.toISOString(),
      actions: this.buildActions(analysis, recommendations),
      metadata: {
        daysUntilReview: this.daysUntilReview,
        category: analysis.classification.category,
      },
    };
  }

  /**
   * Build follow-up action list from findings and recommendations.
   */
  buildActions(
    analysis: ExecutiveAnalysisResult,
    recommendations: ExecutiveRecommendationSet
  ): ExecutiveFollowupAction[] {
    const actions: ExecutiveFollowupAction[] = [
      {
        actionId: `${analysis.requestId}:fu:review_findings`,
        label: "Review findings",
        instruction: "Confirm whether primary findings still hold",
        authority: "recommend",
        order: 1,
      },
      {
        actionId: `${analysis.requestId}:fu:check_actions`,
        label: "Check recommended actions",
        instruction: "Verify progress on recommended executive actions",
        authority: "recommend",
        order: 2,
      },
    ];

    if (analysis.primaryFinding) {
      actions.push({
        actionId: `${analysis.requestId}:fu:primary_finding`,
        label: "Revisit primary finding",
        instruction: `Re-evaluate: ${analysis.primaryFinding.title}`,
        authority: "recommend",
        order: 3,
      });
    }

    for (const recommendation of recommendations.recommendations.slice(0, 2)) {
      actions.push({
        actionId: `${analysis.requestId}:fu:${recommendation.actionKey}`,
        label: `Follow up: ${recommendation.label}`,
        instruction: recommendation.instruction,
        authority: recommendation.authority,
        order: actions.length + 1,
      });
    }

    return actions;
  }
}
