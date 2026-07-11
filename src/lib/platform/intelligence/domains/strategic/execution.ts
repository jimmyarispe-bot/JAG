/**
 * Strategic Intelligence — execution.
 *
 * Tracks initiative execution status and calculates execution health.
 */

import type {
  StrategicExecutionSnapshot,
  StrategicExecutionStatus,
  StrategicInitiative,
  StrategicObjective,
} from "@/lib/platform/intelligence/domains/strategic/types";

/** Options for execution tracking. */
export interface StrategicExecutionOptions {
  now?: () => Date;
}

/**
 * Tracks planning → completion statuses and derives health scores.
 */
export class StrategicExecution {
  private readonly now: () => Date;

  constructor(options: StrategicExecutionOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  /**
   * Build execution snapshots for initiatives.
   */
  track(
    initiatives: readonly StrategicInitiative[],
    objectives: readonly StrategicObjective[] = []
  ): StrategicExecutionSnapshot[] {
    return initiatives.map((initiative) =>
      this.snapshotFor(initiative, objectives.filter((o) => o.goalId === initiative.goalId))
    );
  }

  /**
   * Update an initiative's status and recompute health.
   */
  updateStatus(
    initiative: StrategicInitiative,
    status: StrategicExecutionStatus,
    objectives: readonly StrategicObjective[] = []
  ): { initiative: StrategicInitiative; snapshot: StrategicExecutionSnapshot } {
    const updated: StrategicInitiative = { ...initiative, status };
    const snapshot = this.snapshotFor(
      updated,
      objectives.filter((o) => o.goalId === initiative.goalId)
    );
    return { initiative: updated, snapshot };
  }

  /**
   * Calculate execution health (0–100) from status, progress, and timeline.
   */
  calculateHealth(
    status: StrategicExecutionStatus,
    progressPercent: number,
    timelinePressure: number
  ): { healthScore: number; healthLabel: StrategicExecutionSnapshot["healthLabel"] } {
    let base = 70;
    switch (status) {
      case "on_track":
        base = 88;
        break;
      case "active":
        base = 75;
        break;
      case "planning":
        base = 65;
        break;
      case "behind":
        base = 45;
        break;
      case "blocked":
        base = 25;
        break;
      case "completed":
        base = 100;
        break;
      case "cancelled":
        base = 0;
        break;
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }

    const progressBoost = Math.min(20, progressPercent * 0.2);
    const pressurePenalty = Math.min(30, timelinePressure * 30);
    const healthScore = Math.max(
      0,
      Math.min(100, Math.round(base + progressBoost - pressurePenalty))
    );

    const healthLabel =
      healthScore >= 80
        ? "healthy"
        : healthScore >= 60
          ? "watch"
          : healthScore >= 35
            ? "at_risk"
            : "critical";

    return { healthScore, healthLabel };
  }

  private snapshotFor(
    initiative: StrategicInitiative,
    objectives: readonly StrategicObjective[]
  ): StrategicExecutionSnapshot {
    const progressPercent = this.progressFromObjectives(objectives, initiative.status);
    const timelinePressure = this.timelinePressure(initiative);
    const status = this.deriveStatus(initiative.status, progressPercent, timelinePressure);
    const { healthScore, healthLabel } = this.calculateHealth(
      status,
      progressPercent,
      timelinePressure
    );

    const blockers: string[] = [];
    if (status === "blocked") {
      blockers.push("Execution blocked — resolve dependencies before continuing");
    }
    if (status === "behind") {
      blockers.push("Timeline pressure exceeds progress trajectory");
    }

    return {
      initiativeId: initiative.id,
      status,
      healthScore,
      healthLabel,
      progressPercent,
      blockers,
      notes: [
        `Timeline ${initiative.timeline.startDate.slice(0, 10)} → ${initiative.timeline.endDate.slice(0, 10)}`,
        `Budget ${initiative.budget.amount} ${initiative.budget.currency}`,
      ],
      updatedAt: this.now().toISOString(),
    };
  }

  private progressFromObjectives(
    objectives: readonly StrategicObjective[],
    status: StrategicExecutionStatus
  ): number {
    if (status === "completed") return 100;
    if (status === "cancelled") return 0;
    if (status === "planning") return 5;
    if (objectives.length === 0) {
      return status === "on_track" ? 55 : status === "active" ? 35 : 20;
    }

    let total = 0;
    for (const objective of objectives) {
      const span = objective.target - objective.baseline;
      if (span === 0) {
        total += objective.currentValue === objective.target ? 100 : 0;
        continue;
      }
      const ratio = (objective.currentValue - objective.baseline) / span;
      total += Math.max(0, Math.min(100, ratio * 100));
    }
    return Math.round(total / objectives.length);
  }

  private timelinePressure(initiative: StrategicInitiative): number {
    const start = Date.parse(initiative.timeline.startDate);
    const end = Date.parse(initiative.timeline.endDate);
    const now = this.now().getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return 0;
    }
    const elapsed = Math.max(0, Math.min(1, (now - start) / (end - start)));
    return elapsed;
  }

  private deriveStatus(
    current: StrategicExecutionStatus,
    progressPercent: number,
    timelinePressure: number
  ): StrategicExecutionStatus {
    if (
      current === "completed" ||
      current === "cancelled" ||
      current === "blocked" ||
      current === "planning"
    ) {
      return current;
    }

    if (timelinePressure > 0.6 && progressPercent < timelinePressure * 100 - 15) {
      return "behind";
    }
    if (current === "active" && progressPercent >= 40) {
      return "on_track";
    }
    return current === "on_track" ? "on_track" : "active";
  }
}
