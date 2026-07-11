/**
 * Goal Execution Engine — impact (Sprint 011).
 *
 * Measures actual vs planned impact across key dimensions.
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import {
  GOAL_EXECUTION_IMPACT_DIMENSIONS,
  type ExecutionImpactAssessment,
  type ExecutionImpactScore,
  type GoalExecutionImpactDimension,
} from "@/lib/platform/execution/types";

export interface GoalExecutionImpactDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
}

/**
 * Actual impact measurement across financial, operational, academic, etc.
 */
export class GoalExecutionImpact {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;

  constructor(dependencies: GoalExecutionImpactDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
  }

  async assess(goalId: string): Promise<ExecutionImpactAssessment> {
    const goal = await this.repository.findGoal(goalId);
    if (!goal) {
      throw new Error(`Execution goal not found: ${goalId}`);
    }

    const objectives = await this.repository.listObjectives({ goalId });
    const progressList = await this.repository.listProgress({ subjectId: goalId });
    const progress = progressList[0];
    const completionFactor = (progress?.completionPercent ?? 0) / 100;

    const scores: ExecutionImpactScore[] = GOAL_EXECUTION_IMPACT_DIMENSIONS.map(
      (dimension) => {
        const planned = plannedFor(dimension, goal.priority);
        const actual = Number((planned * completionFactor * objectiveBoost(objectives, dimension)).toFixed(4));
        return {
          dimension,
          planned,
          actual,
          delta: Number((actual - planned).toFixed(4)),
          rationale: `${dimension} impact at ${Math.round(completionFactor * 100)}% goal completion`,
        };
      }
    );

    const overallPlanned = average(scores.map((s) => s.planned));
    const overallActual = average(scores.map((s) => s.actual));

    const assessment: ExecutionImpactAssessment = {
      goalId,
      scores: Object.freeze(scores),
      overallActual,
      overallPlanned,
      summary: `Actual impact ${overallActual} vs planned ${overallPlanned} for "${goal.title}".`,
      assessedAt: this.now().toISOString(),
      metadata: {
        objectiveCount: objectives.length,
        healthLabel: progress?.healthLabel ?? null,
      },
    };

    return this.repository.saveImpact(assessment);
  }

  async list(filter?: { goalId?: string }): Promise<ExecutionImpactAssessment[]> {
    return this.repository.listImpact(filter);
  }
}

function plannedFor(
  dimension: GoalExecutionImpactDimension,
  priority: string
): number {
  const base =
    priority === "critical" ? 0.9 : priority === "high" ? 0.75 : priority === "medium" ? 0.6 : 0.45;
  const weights: Record<GoalExecutionImpactDimension, number> = {
    financial: 1,
    operational: 0.95,
    academic: 0.9,
    mission: 0.92,
    employee: 0.85,
    customer: 0.88,
    community: 0.8,
  };
  return Number((base * weights[dimension]).toFixed(4));
}

function objectiveBoost(
  objectives: Awaited<ReturnType<GoalExecutionRepository["listObjectives"]>>,
  dimension: GoalExecutionImpactDimension
): number {
  if (objectives.length === 0) {
    return 1;
  }
  const text = objectives.map((o) => `${o.title} ${o.description}`.toLowerCase()).join(" ");
  const cues: Record<GoalExecutionImpactDimension, string[]> = {
    financial: ["cash", "budget", "revenue", "cost"],
    operational: ["process", "cycle", "ops", "throughput"],
    academic: ["learning", "academic", "student outcome"],
    mission: ["mission", "impact", "equity"],
    employee: ["staff", "retention", "hiring", "workforce"],
    customer: ["family", "parent", "customer", "satisfaction"],
    community: ["community", "partner", "outreach"],
  };
  const hits = cues[dimension].filter((cue) => text.includes(cue)).length;
  return 1 + Math.min(0.2, hits * 0.05);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4));
}
