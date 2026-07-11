/**
 * Goal Execution Engine — scorecard (Sprint 011).
 */

import type { GoalExecutionProgress } from "@/lib/platform/execution/progress";
import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import {
  DEFAULT_EXECUTION_CONFIDENCE,
  type ExecutionScorecard,
} from "@/lib/platform/execution/types";

export interface GoalExecutionScorecardDependencies {
  repository: GoalExecutionRepository;
  progress: GoalExecutionProgress;
  now?: () => Date;
  createId?: (goalId: string) => string;
}

/**
 * Executive scorecards: progress, risk, budget, timeline, ownership, confidence.
 */
export class GoalExecutionScorecardService {
  private readonly repository: GoalExecutionRepository;
  private readonly progress: GoalExecutionProgress;
  private readonly now: () => Date;
  private readonly createId: (goalId: string) => string;

  constructor(dependencies: GoalExecutionScorecardDependencies) {
    this.repository = dependencies.repository;
    this.progress = dependencies.progress;
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((goalId) => `${goalId}:scorecard:${this.now().toISOString()}`);
  }

  async generate(goalId: string): Promise<ExecutionScorecard> {
    const goal = await this.repository.findGoal(goalId);
    if (!goal) {
      throw new Error(`Execution goal not found: ${goalId}`);
    }

    const progress = await this.progress.calculateGoal(goalId);
    const initiatives = await this.repository.listInitiatives({ goalId });
    const owners = await this.repository.findOwners("goal", goalId);
    const tasks = await this.repository.listTasks({ goalId });

    const budgetUtilizationPercent = calculateBudgetUtilization(initiatives);
    const timelineAdherencePercent = calculateTimelineAdherence(
      goal.createdAt,
      goal.targetDate,
      progress.completionPercent,
      this.now().getTime()
    );
    const ownerAccountabilityScore = calculateOwnerAccountability(
      owners !== null,
      tasks
    );

    const confidence = {
      ...DEFAULT_EXECUTION_CONFIDENCE,
      value: Number(
        Math.min(
          1,
          goal.confidence.value * 0.5 +
            (1 - progress.riskScore) * 0.3 +
            ownerAccountabilityScore / 100 * 0.2
        ).toFixed(4)
      ),
      level:
        progress.healthLabel === "healthy"
          ? ("high" as const)
          : progress.healthLabel === "watch"
            ? ("medium" as const)
            : ("low" as const),
      factors: [
        {
          key: "goal_confidence",
          label: "Goal Confidence",
          contribution: goal.confidence.value,
        },
        {
          key: "risk_inverse",
          label: "Inverse Risk",
          contribution: 1 - progress.riskScore,
        },
      ],
    };

    const scorecard: ExecutionScorecard = {
      scorecardId: this.createId(goalId),
      goalId,
      progressPercent: progress.completionPercent,
      riskScore: progress.riskScore,
      budgetUtilizationPercent,
      timelineAdherencePercent,
      ownerAccountabilityScore,
      confidence,
      healthLabel: progress.healthLabel,
      summary: `Goal "${goal.title}" is ${progress.healthLabel} at ${progress.completionPercent}% complete with risk ${progress.riskScore}.`,
      generatedAt: this.now().toISOString(),
      metadata: {
        initiativeCount: initiatives.length,
        taskCount: tasks.length,
        hasOwners: owners !== null,
      },
    };

    return this.repository.saveScorecard(scorecard);
  }

  async list(filter?: { goalId?: string }): Promise<ExecutionScorecard[]> {
    return this.repository.listScorecards(filter);
  }
}

function calculateBudgetUtilization(
  initiatives: Awaited<ReturnType<GoalExecutionRepository["listInitiatives"]>>
): number {
  if (initiatives.length === 0) {
    return 0;
  }
  let budget = 0;
  let spent = 0;
  for (const initiative of initiatives) {
    budget += initiative.budgetAmount;
    spent += initiative.budgetSpent;
  }
  if (budget <= 0) {
    return 0;
  }
  return Math.round(Math.min(200, (spent / budget) * 100));
}

function calculateTimelineAdherence(
  startDate: string,
  endDate: string,
  completionPercent: number,
  nowMs: number
): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return completionPercent;
  }
  const expected = Math.max(0, Math.min(100, ((nowMs - start) / (end - start)) * 100));
  if (expected === 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round((completionPercent / expected) * 100)));
}

function calculateOwnerAccountability(
  hasOwners: boolean,
  tasks: Awaited<ReturnType<GoalExecutionRepository["listTasks"]>>
): number {
  if (!hasOwners) {
    return 40;
  }
  if (tasks.length === 0) {
    return 70;
  }
  const owned = tasks.filter((t) => t.owner.trim().length > 0).length;
  const completed = tasks.filter((t) => t.completionPercent >= 100).length;
  return Math.round((owned / tasks.length) * 70 + (completed / tasks.length) * 30);
}
