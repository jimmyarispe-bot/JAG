/**
 * Autonomous Executive Operating Loop — planning.
 *
 * Generates executable plans from diagnosis and intelligence context.
 */

import type {
  AutonomyDiagnosisResult,
  AutonomyLoopRequest,
  AutonomyPlan,
  AutonomyPlanStep,
} from "@/lib/platform/autonomy/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

export interface AutonomyPlanningDependencies {
  createId?: (prefix: string) => string;
}

function confidence(value: number): IntelligenceConfidenceScore {
  const level =
    value >= 0.8 ? "high" : value >= 0.55 ? "medium" : ("low" as const);
  return { value, level, factors: [] };
}

/**
 * PLAN — generate executable plans for diagnosed causes.
 */
export class AutonomyPlanning {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyPlanningDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  plan(
    request: AutonomyLoopRequest,
    diagnosis: AutonomyDiagnosisResult
  ): AutonomyPlan {
    const primary =
      diagnosis.causes.find((c) => c.causeId === diagnosis.primaryCauseId) ??
      diagnosis.causes[0]!;

    const steps: AutonomyPlanStep[] = [];
    let order = 1;

    steps.push({
      stepId: this.createId("step"),
      order: order++,
      title: `Stabilize: ${primary.title}`,
      instruction: `Address root cause "${primary.kind}" — ${primary.explanation}`,
      ownerRole: "executive",
      dependsOn: [],
      expectedOutcome: `Reduced severity for ${primary.kind}`,
    });

    const strategicActions =
      request.strategic?.recommendations[0]?.recommendedActions ?? [];
    for (const action of strategicActions.slice(0, 3)) {
      const prev = steps[steps.length - 1]!;
      steps.push({
        stepId: this.createId("step"),
        order: order++,
        title: action.slice(0, 80),
        instruction: action,
        ownerRole: "strategic",
        dependsOn: [prev.stepId],
        expectedOutcome: "Strategic recommendation progress",
      });
    }

    const collabSteps =
      request.collaboration?.plan.steps.slice(0, 3) ?? [];
    for (const collab of collabSteps) {
      const prev = steps[steps.length - 1]!;
      steps.push({
        stepId: this.createId("step"),
        order: order++,
        title: collab.title,
        instruction: collab.instruction,
        ownerRole: collab.ownerRole,
        dependsOn: [prev.stepId],
        expectedOutcome: "Collaboration plan step complete",
      });
    }

    if (request.decision?.recommendation) {
      const prev = steps[steps.length - 1]!;
      steps.push({
        stepId: this.createId("step"),
        order: order++,
        title: `Decide: ${request.decision.recommendation.recommendedOption}`,
        instruction: request.decision.recommendation.rationale[0] ??
          request.decision.recommendation.expectedValue,
        ownerRole: "decision",
        dependsOn: [prev.stepId],
        expectedOutcome: request.decision.recommendation.expectedValue,
      });
    }

    const expectedValue =
      request.strategic?.recommendations[0]?.expectedImpact ??
      request.decision?.recommendation.expectedValue ??
      `Mitigate ${primary.kind}`;

    return {
      planId: this.createId("plan"),
      requestId: request.requestId,
      title: `Plan for ${request.subject}`,
      summary: `Executable plan with ${steps.length} steps targeting ${primary.kind}`,
      steps,
      linkedCauseIds: diagnosis.causes.map((c) => c.causeId),
      expectedValue,
      confidence: confidence(
        Math.min(
          0.9,
          (diagnosis.confidence.value +
            (request.decision?.recommendation.confidence.value ?? 0.6)) /
            2
        )
      ),
    };
  }
}
