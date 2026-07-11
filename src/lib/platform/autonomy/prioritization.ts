/**
 * Autonomous Executive Operating Loop — prioritization.
 *
 * Determines highest-value work from diagnosis and plan steps.
 */

import type {
  AutonomyDiagnosisResult,
  AutonomyEscalationSeverity,
  AutonomyLoopRequest,
  AutonomyPlan,
  AutonomyPrioritizationResult,
  AutonomyPriorityDimension,
  AutonomyPriorityItem,
} from "@/lib/platform/autonomy/types";

export interface AutonomyPrioritizationDependencies {
  createId?: (prefix: string) => string;
}

function severityWeight(severity: AutonomyEscalationSeverity): number {
  return { low: 0.25, medium: 0.5, high: 0.75, critical: 1 }[severity];
}

/**
 * PRIORITIZE — rank highest-value work for the executive cycle.
 */
export class AutonomyPrioritization {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyPrioritizationDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  prioritize(
    request: AutonomyLoopRequest,
    diagnosis: AutonomyDiagnosisResult,
    plan: AutonomyPlan
  ): AutonomyPrioritizationResult {
    const items: AutonomyPriorityItem[] = [];

    for (const cause of diagnosis.causes) {
      const urgency = severityWeight(cause.severity);
      const impact = Math.min(1, 0.4 + cause.relatedSignalIds.length * 0.15);
      const risk = urgency;
      const mission = cause.kind === "strategic_misalignment" ? 0.85 : 0.6;
      const cost = 0.45;
      const confidence = cause.confidence.value;
      const dimensions: Record<AutonomyPriorityDimension, number> = {
        impact,
        urgency,
        risk,
        mission_alignment: mission,
        cost,
        confidence,
      };
      const score =
        impact * 0.25 +
        urgency * 0.25 +
        risk * 0.15 +
        mission * 0.15 +
        (1 - cost) * 0.1 +
        confidence * 0.1;

      items.push({
        itemId: this.createId("prio"),
        title: cause.title,
        score,
        dimensions,
        rank: 0,
        linkedCauseId: cause.causeId,
        linkedPlanStepId: plan.steps[0]?.stepId ?? null,
      });
    }

    for (const step of plan.steps) {
      const dimensions: Record<AutonomyPriorityDimension, number> = {
        impact: 0.55,
        urgency: step.order === 1 ? 0.8 : 0.45,
        risk: 0.4,
        mission_alignment: 0.65,
        cost: 0.4,
        confidence: plan.confidence.value,
      };
      const score =
        dimensions.impact * 0.25 +
        dimensions.urgency * 0.25 +
        dimensions.risk * 0.15 +
        dimensions.mission_alignment * 0.15 +
        (1 - dimensions.cost) * 0.1 +
        dimensions.confidence * 0.1;

      items.push({
        itemId: this.createId("prio"),
        title: step.title,
        score,
        dimensions,
        rank: 0,
        linkedCauseId: diagnosis.primaryCauseId,
        linkedPlanStepId: step.stepId,
      });
    }

    // Collaboration ranked recommendations boost prioritization.
    for (const ranked of request.collaboration?.priorities.ranked.slice(0, 3) ?? []) {
      items.push({
        itemId: this.createId("prio"),
        title: ranked.title,
        score: ranked.score,
        dimensions: {
          impact: ranked.dimensions.impact ?? 0.5,
          urgency: ranked.dimensions.urgency ?? 0.5,
          risk: ranked.dimensions.risk ?? 0.5,
          mission_alignment: ranked.dimensions.mission_alignment ?? 0.5,
          cost: ranked.dimensions.cost ?? 0.5,
          confidence: plan.confidence.value,
        },
        rank: 0,
        linkedCauseId: diagnosis.primaryCauseId,
        linkedPlanStepId: null,
      });
    }

    items.sort((a, b) => b.score - a.score);
    const ranked = items.map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      requestId: request.requestId,
      ranked,
      topItemId: ranked[0]?.itemId ?? null,
      summary: ranked[0]
        ? `Top priority: ${ranked[0].title} (score ${ranked[0].score.toFixed(2)})`
        : "No priority items",
    };
  }
}
