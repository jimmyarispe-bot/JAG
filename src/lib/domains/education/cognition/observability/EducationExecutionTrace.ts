/**
 * Diagnostic execution trace — explainability for one Education intelligence run.
 * Pure data; does not affect pipeline behavior.
 */

import type { EducationSelectionDecision } from "../planner";
import type { EducationExecutionPlan } from "../planner";

export interface EducationPlannerDecisionTrace {
  contributorId: string;
  decision: "include" | "skip";
  reason: string;
}

export interface EducationStageTrace {
  stage: number;
  contributorIds: readonly string[];
}

export interface EducationDependencyExpansionTrace {
  contributorId: string;
  dependsOn: readonly string[];
}

export interface EducationExecutionTrace {
  /** Stable id for this run (usually planId). */
  traceId: string;
  intentId: string;
  intentLabel?: string;
  planId: string;
  planOk: boolean;
  /** Planner include/skip decisions with reasons. */
  plannerDecisions: readonly EducationPlannerDecisionTrace[];
  /** Ordered execution stages from the plan. */
  stages: readonly EducationStageTrace[];
  /** Included contributor order. */
  contributorOrder: readonly string[];
  /** Plan-level + runtime skipped contributor ids. */
  skippedContributorIds: readonly string[];
  /** Dependency edges expanded for included contributors. */
  dependencyExpansion: readonly EducationDependencyExpansionTrace[];
  /** True when the pipeline finished (success or partial). */
  completed: boolean;
  completedAt: string;
}

export function buildEducationExecutionTrace(input: {
  plan: EducationExecutionPlan;
  selections: readonly EducationSelectionDecision[];
  skippedContributorIds: readonly string[];
  planOk: boolean;
  intentLabel?: string;
  completed: boolean;
  completedAt: string;
}): EducationExecutionTrace {
  const dependencyExpansion: EducationDependencyExpansionTrace[] =
    input.plan.nodes
      .filter((n) => n.decision === "include")
      .map((n) => ({
        contributorId: n.contributorId,
        dependsOn: [...n.dependsOn],
      }));

  return {
    traceId: input.plan.planId,
    intentId: input.plan.intentId,
    intentLabel: input.intentLabel,
    planId: input.plan.planId,
    planOk: input.planOk,
    plannerDecisions: input.selections.map((s) => ({
      contributorId: s.contributorId,
      decision: s.decision,
      reason: s.reason,
    })),
    stages: input.plan.stages.map((s) => ({
      stage: s.stage,
      contributorIds: [...s.contributorIds],
    })),
    contributorOrder: [...input.plan.orderedContributorIds],
    skippedContributorIds: [...input.skippedContributorIds],
    dependencyExpansion,
    completed: input.completed,
    completedAt: input.completedAt,
  };
}
