/**
 * Autonomous Executive Operating Loop — measurement.
 *
 * Tracks outcomes continuously from Goal Execution progress.
 */

import type {
  AutonomyExecutionPackage,
  AutonomyLoopRequest,
  AutonomyMeasurementResult,
} from "@/lib/platform/autonomy/types";

export interface AutonomyMeasurementDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * MEASURE — track outcomes from execution and organization health.
 */
export class AutonomyMeasurement {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyMeasurementDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  measure(
    request: AutonomyLoopRequest,
    execution: AutonomyExecutionPackage,
    organizationHealthScore?: number
  ): AutonomyMeasurementResult {
    const progressPercent =
      execution.progress?.completionPercent ??
      request.executionProgress?.[0]?.completionPercent ??
      0;

    const healthScore =
      execution.progress?.healthScore ??
      organizationHealthScore ??
      request.executionProgress?.[0]?.healthScore ??
      0;

    const outcomeSignals: string[] = [];
    if (execution.status === "created" && execution.goal) {
      outcomeSignals.push(`Goal ${execution.goal.id} active`);
    }
    if (execution.status === "held") {
      outcomeSignals.push(`Execution held: ${execution.holdReason ?? "approval"}`);
    }
    if (execution.scorecard) {
      outcomeSignals.push(
        `Scorecard health ${execution.scorecard.healthLabel}; risk ${execution.scorecard.riskScore}`
      );
    }
    for (const snap of request.executionProgress ?? []) {
      outcomeSignals.push(
        `${snap.subjectId}: ${snap.completionPercent}% (${snap.healthLabel})`
      );
    }

    return {
      measurementId: this.createId("measure"),
      requestId: request.requestId,
      measuredAt: this.now().toISOString(),
      progressPercent,
      healthScore,
      outcomeSignals,
      summary: `Progress ${progressPercent}%; health ${healthScore}; ${outcomeSignals.length} outcome signal(s)`,
    };
  }
}
