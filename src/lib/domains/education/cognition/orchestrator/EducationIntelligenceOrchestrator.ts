/**
 * Education Intelligence Orchestrator — single domain entry point.
 *
 * Pipeline: Planner → Contributor Executor → Intelligence Graph → Unified Result
 *
 * Applications should call this instead of contributors or the graph directly.
 * Does not modify Core, Runtime, Domain SDK, contributors, or the graph.
 */

import {
  createEducationIntelligenceGraph,
  type EducationIntelligenceGraph,
} from "../graph";
import {
  createEducationPlanner,
  type EducationPlanner,
} from "../planner";
import type { EducationExecutionContext } from "./EducationExecutionContext";
import { executeEducationContributors } from "./EducationContributorExecutor";
import type { EducationExecutionResult } from "./EducationExecutionResult";
import { buildEducationExecutionTelemetry } from "./EducationExecutionTelemetry";

export interface EducationIntelligenceOrchestratorOptions {
  planner?: EducationPlanner;
  graph?: EducationIntelligenceGraph;
  /** Optional contributor runner overrides (tests / future contributors). */
  runners?: Parameters<typeof executeEducationContributors>[0]["runners"];
}

export interface EducationIntelligenceOrchestrator {
  /**
   * Run the full Education intelligence pipeline for the given intent + observations.
   */
  execute(context: EducationExecutionContext): EducationExecutionResult;
}

export function createEducationIntelligenceOrchestrator(
  options: EducationIntelligenceOrchestratorOptions = {}
): EducationIntelligenceOrchestrator {
  const planner = options.planner ?? createEducationPlanner();
  const graph = options.graph ?? createEducationIntelligenceGraph();

  return {
    execute(context) {
      return runEducationIntelligencePipeline(context, {
        planner,
        graph,
        runners: options.runners,
      });
    },
  };
}

/** One-shot helper. */
export function executeEducationIntelligence(
  context: EducationExecutionContext,
  options?: EducationIntelligenceOrchestratorOptions
): EducationExecutionResult {
  return createEducationIntelligenceOrchestrator(options).execute(context);
}

function runEducationIntelligencePipeline(
  context: EducationExecutionContext,
  deps: {
    planner: EducationPlanner;
    graph: EducationIntelligenceGraph;
    runners?: EducationIntelligenceOrchestratorOptions["runners"];
  }
): EducationExecutionResult {
  const started = Date.now();
  const now = context.now ?? new Date().toISOString();

  const planResult = deps.planner.plan({
    intent: context.intent,
    context: context.plannerContext,
    now,
  });

  const execution = executeEducationContributors({
    plan: planResult.plan,
    observations: context.observations,
    now,
    runners: deps.runners,
  });

  const subjectId =
    context.subjectId ??
    context.observations.enrollment?.student?.studentId ??
    context.observations.attendance?.student?.studentId ??
    execution.results[0]?.result.subjectId;

  const organizationId =
    context.organizationId ??
    context.observations.enrollment?.organizationId ??
    context.observations.attendance?.organizationId ??
    context.plannerContext?.organizationId;

  const graphResult = deps.graph.evaluateResults(execution.results, {
    subjectId,
    organizationId,
    now,
  });

  const evidenceCount = execution.results.reduce(
    (n, r) => n + r.result.evidence.length,
    0
  );
  const recommendationCount = execution.results.reduce(
    (n, r) => n + r.result.recommendations.length,
    0
  );
  const actionProposalCount = execution.results.reduce(
    (n, r) => n + r.result.suggestedActions.length,
    0
  );

  const skippedContributorIds = unique([
    ...planResult.plan.skippedContributorIds,
    ...execution.runtimeSkippedContributorIds,
  ]);

  const telemetry = buildEducationExecutionTelemetry({
    executedContributorIds: execution.executedContributorIds,
    skippedContributorIds,
    failures: execution.failures,
    skippedDependents: execution.skippedDependents,
    durationMs: Date.now() - started,
    evidenceCount,
    recommendationCount,
    actionProposalCount,
    stageCount: planResult.plan.stages.length,
    planOk: planResult.ok,
    now,
  });

  const ok =
    planResult.ok &&
    execution.failures.length === 0 &&
    execution.executedContributorIds.length > 0;

  return {
    ok,
    plan: planResult.plan,
    planValidation: planResult.validationIssues,
    contributorRecords: execution.records,
    contributorResults: execution.results,
    graphResult,
    telemetry,
    planResult,
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
