/**
 * Goal Execution Engine — progress (Sprint 011).
 *
 * Calculates completion, health, risk, velocity, and forecast.
 */

import type { GoalExecutionObjectives } from "@/lib/platform/execution/objectives";
import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type {
  ExecutionGoal,
  ExecutionInitiative,
  ExecutionObjective,
  ExecutionProgressSnapshot,
  ExecutionTask,
  GoalExecutionEntityKind,
  GoalExecutionHealthLabel,
} from "@/lib/platform/execution/types";

export interface GoalExecutionProgressDependencies {
  repository: GoalExecutionRepository;
  objectives: GoalExecutionObjectives;
  now?: () => Date;
}

/**
 * Automatic progress analytics for goals, initiatives, and tasks.
 */
export class GoalExecutionProgress {
  private readonly repository: GoalExecutionRepository;
  private readonly objectives: GoalExecutionObjectives;
  private readonly now: () => Date;

  constructor(dependencies: GoalExecutionProgressDependencies) {
    this.repository = dependencies.repository;
    this.objectives = dependencies.objectives;
    this.now = dependencies.now ?? (() => new Date());
  }

  async calculateGoal(goalId: string): Promise<ExecutionProgressSnapshot> {
    const goal = await this.repository.findGoal(goalId);
    if (!goal) {
      throw new Error(`Execution goal not found: ${goalId}`);
    }
    const objectives = await this.repository.listObjectives({ goalId });
    const tasks = await this.repository.listTasks({ goalId });
    const initiatives = await this.repository.listInitiatives({ goalId });

    const objectiveCompletion =
      objectives.length === 0
        ? 0
        : objectives.reduce(
            (sum, o) => sum + this.objectives.completionPercent(o),
            0
          ) / objectives.length;

    const taskCompletion =
      tasks.length === 0
        ? objectiveCompletion
        : tasks.reduce((sum, t) => sum + t.completionPercent, 0) / tasks.length;

    const completionPercent = Math.round(
      objectives.length + tasks.length === 0
        ? statusToCompletion(goal.status)
        : objectiveCompletion * 0.6 + taskCompletion * 0.4
    );

    return this.persistSnapshot({
      subjectKind: "goal",
      subjectId: goalId,
      completionPercent,
      startDate: goal.createdAt,
      endDate: goal.targetDate,
      blocked: goal.status === "blocked",
      cancelled: goal.status === "cancelled" || goal.archived,
      relatedCount: objectives.length + initiatives.length + tasks.length,
      notes: [
        `Objectives avg ${Math.round(objectiveCompletion)}%`,
        `Tasks avg ${Math.round(taskCompletion)}%`,
      ],
    });
  }

  async calculateInitiative(
    initiativeId: string
  ): Promise<ExecutionProgressSnapshot> {
    const initiative = await this.repository.findInitiative(initiativeId);
    if (!initiative) {
      throw new Error(`Execution initiative not found: ${initiativeId}`);
    }
    const tasks = await this.repository.listTasks({ initiativeId });
    const milestones = await this.repository.listMilestones({ initiativeId });

    const taskCompletion =
      tasks.length === 0
        ? 0
        : tasks.reduce((sum, t) => sum + t.completionPercent, 0) / tasks.length;
    const milestoneCompletion =
      milestones.length === 0
        ? taskCompletion
        : milestones.reduce((sum, m) => sum + m.completionPercent, 0) /
          milestones.length;

    const completionPercent = Math.round(
      tasks.length + milestones.length === 0
        ? statusToCompletion(initiative.status)
        : taskCompletion * 0.7 + milestoneCompletion * 0.3
    );

    return this.persistSnapshot({
      subjectKind: "initiative",
      subjectId: initiativeId,
      completionPercent,
      startDate: initiative.startDate,
      endDate: initiative.endDate,
      blocked: initiative.status === "blocked",
      cancelled: initiative.status === "cancelled",
      relatedCount: tasks.length + milestones.length,
      notes: [
        `Budget spent ${initiative.budgetSpent}/${initiative.budgetAmount} ${initiative.budgetCurrency}`,
      ],
    });
  }

  async calculateTask(taskId: string): Promise<ExecutionProgressSnapshot> {
    const task = await this.repository.findTask(taskId);
    if (!task) {
      throw new Error(`Execution task not found: ${taskId}`);
    }
    return this.persistSnapshot({
      subjectKind: "task",
      subjectId: taskId,
      completionPercent: task.completionPercent,
      startDate: task.createdAt,
      endDate: task.dueDate,
      blocked: task.status === "blocked",
      cancelled: task.status === "cancelled",
      relatedCount: task.dependencyIds.length,
      notes: task.notes.slice(0, 3),
    });
  }

  healthLabel(healthScore: number): GoalExecutionHealthLabel {
    if (healthScore >= 80) return "healthy";
    if (healthScore >= 60) return "watch";
    if (healthScore >= 35) return "at_risk";
    return "critical";
  }

  private async persistSnapshot(input: {
    subjectKind: GoalExecutionEntityKind;
    subjectId: string;
    completionPercent: number;
    startDate: string;
    endDate: string;
    blocked: boolean;
    cancelled: boolean;
    relatedCount: number;
    notes: string[];
  }): Promise<ExecutionProgressSnapshot> {
    const now = this.now();
    const timelinePressure = computeTimelinePressure(
      input.startDate,
      input.endDate,
      now.getTime()
    );
    const riskScore = Number(
      Math.min(
        1,
        (input.blocked ? 0.4 : 0) +
          (input.cancelled ? 0.2 : 0) +
          Math.max(0, timelinePressure - input.completionPercent / 100) +
          (input.completionPercent < 20 && timelinePressure > 0.4 ? 0.2 : 0)
      ).toFixed(4)
    );

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          input.cancelled
            ? 0
            : input.completionPercent * 0.7 + (1 - riskScore) * 30
        )
      )
    );

    const elapsedDays = Math.max(
      1,
      (now.getTime() - Date.parse(input.startDate)) / (1000 * 60 * 60 * 24)
    );
    const velocity = Number((input.completionPercent / elapsedDays).toFixed(4));

    const remaining = Math.max(0, 100 - input.completionPercent);
    const forecastCompletionDate =
      velocity > 0
        ? new Date(now.getTime() + (remaining / velocity) * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const snapshot: ExecutionProgressSnapshot = {
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      completionPercent: input.completionPercent,
      healthScore,
      healthLabel: this.healthLabel(healthScore),
      riskScore,
      velocity,
      forecastCompletionDate,
      calculatedAt: now.toISOString(),
      notes: Object.freeze([...input.notes]),
      metadata: { relatedCount: input.relatedCount },
    };

    return this.repository.saveProgress(snapshot);
  }
}

function statusToCompletion(status: string): number {
  switch (status) {
    case "completed":
      return 100;
    case "on_track":
      return 60;
    case "active":
      return 40;
    case "planning":
    case "approved":
      return 10;
    case "draft":
      return 0;
    default:
      return 20;
  }
}

function computeTimelinePressure(
  startDate: string,
  endDate: string,
  nowMs: number
): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.max(0, Math.min(1, (nowMs - start) / (end - start)));
}

/** Convenience re-exports for progress consumers. */
export type {
  ExecutionGoal,
  ExecutionInitiative,
  ExecutionObjective,
  ExecutionTask,
};
