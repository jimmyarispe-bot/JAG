/**
 * Autonomous Executive Operating Loop — reflection.
 *
 * Compares expected vs actual outcomes.
 */

import type {
  AutonomyExecutionPackage,
  AutonomyLoopRequest,
  AutonomyMeasurementResult,
  AutonomyPlan,
  AutonomyReflectionResult,
} from "@/lib/platform/autonomy/types";

export interface AutonomyReflectionDependencies {
  createId?: (prefix: string) => string;
}

/**
 * REFLECT — compare expected plan outcomes against measured results.
 */
export class AutonomyReflection {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyReflectionDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  reflect(
    request: AutonomyLoopRequest,
    plan: AutonomyPlan,
    execution: AutonomyExecutionPackage,
    measurement: AutonomyMeasurementResult
  ): AutonomyReflectionResult {
    const expectedOutcome = plan.expectedValue;
    const actualOutcome =
      execution.status === "created"
        ? `Goal created at ${measurement.progressPercent}% progress; health ${measurement.healthScore}`
        : execution.status === "held"
          ? `Held: ${execution.holdReason ?? "approval required"}`
          : `Skipped: ${execution.holdReason ?? "no engine"}`;

    const expectedProgress = execution.status === "created" ? 10 : 0;
    const varianceScore = Math.abs(
      measurement.progressPercent - expectedProgress
    );
    const metExpectation =
      execution.status === "held"
        ? true
        : execution.status === "created" && measurement.healthScore >= 0;

    const insights: string[] = [
      `Expected: ${expectedOutcome}`,
      `Actual: ${actualOutcome}`,
    ];

    if (execution.status === "held") {
      insights.push("Reflection notes approval gate as expected control point");
    }
    if (measurement.progressPercent < expectedProgress) {
      insights.push("Progress behind early-cycle expectation");
    }
    if (request.memories && request.memories.length > 0) {
      insights.push(
        `Compared against ${request.memories.length} related memory record(s)`
      );
    }

    return {
      reflectionId: this.createId("reflect"),
      requestId: request.requestId,
      expectedOutcome,
      actualOutcome,
      deltaSummary: `Variance score ${varianceScore}; metExpectation=${metExpectation}`,
      metExpectation,
      varianceScore,
      insights,
      summary: metExpectation
        ? "Outcomes within expected autonomy band"
        : "Outcomes diverge from expected autonomy band",
    };
  }
}
