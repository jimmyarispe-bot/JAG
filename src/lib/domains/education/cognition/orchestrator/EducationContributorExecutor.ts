/**
 * Execute Education cognitive contributors according to an execution plan.
 * Does not modify contributors — calls their public run*Intelligence APIs.
 */

import {
  ATTENDANCE_CONTRIBUTOR_ID,
  runAttendanceIntelligence,
  type AttendanceObservation,
} from "../attendance";
import {
  ENROLLMENT_CONTRIBUTOR_ID,
  runEnrollmentIntelligence,
  type EnrollmentIntelligenceResult,
  type EnrollmentObservation,
} from "../enrollment";
import type { EducationContributorResult } from "../framework";
import type { EducationExecutionPlan } from "../planner";
import {
  PROGRESS_CONTRIBUTOR_ID,
  runAcademicProgressIntelligence,
} from "../progress";
import {
  STUDENT_SUCCESS_CONTRIBUTOR_ID,
  buildStudentSuccessInputs,
  runStudentSuccessIntelligence,
} from "../student-success";
import type { EducationNormalizedObservations } from "./EducationExecutionContext";
import type { EducationContributorExecutionRecord } from "./EducationExecutionResult";
import type {
  EducationContributorFailure,
  EducationSkippedDependent,
} from "./EducationExecutionTelemetry";

export interface EducationContributorExecutorInput {
  plan: EducationExecutionPlan;
  observations: EducationNormalizedObservations;
  now?: string;
  /**
   * Optional overrides for tests / future contributors.
   * Return EducationContributorResult or throw.
   */
  runners?: Readonly<
    Record<
      string,
      (
        observations: EducationNormalizedObservations,
        now?: string,
        priorResults?: ReadonlyArray<{
          contributorId: string;
          result: EducationContributorResult;
        }>
      ) => EducationContributorResult
    >
  >;
}

export interface EducationContributorExecutorOutput {
  records: EducationContributorExecutionRecord[];
  results: Array<{ contributorId: string; result: EducationContributorResult }>;
  failures: EducationContributorFailure[];
  skippedDependents: EducationSkippedDependent[];
  executedContributorIds: string[];
  runtimeSkippedContributorIds: string[];
}

/**
 * Run included contributors stage-by-stage. Failures do not crash the pipeline.
 * Dependents of failed contributors are skipped.
 */
export function executeEducationContributors(
  input: EducationContributorExecutorInput
): EducationContributorExecutorOutput {
  const failedIds = new Set<string>();
  const executedContributorIds: string[] = [];
  const runtimeSkippedContributorIds: string[] = [];
  const failures: EducationContributorFailure[] = [];
  const skippedDependents: EducationSkippedDependent[] = [];
  const records: EducationContributorExecutionRecord[] = [];
  const results: Array<{
    contributorId: string;
    result: EducationContributorResult;
  }> = [];

  const dependsOnById = new Map<string, readonly string[]>();
  for (const node of input.plan.nodes) {
    if (node.decision === "include") {
      dependsOnById.set(node.contributorId, node.dependsOn);
    }
  }

  // Plan-level skips (not executed)
  for (const id of input.plan.skippedContributorIds) {
    const node = input.plan.nodes.find((n) => n.contributorId === id);
    records.push({
      contributorId: id,
      status: "skipped",
      reason: node?.reason ?? "Skipped by planner",
      stage: node?.stage,
    });
  }

  for (const stage of input.plan.stages) {
    for (const contributorId of stage.contributorIds) {
      const deps = dependsOnById.get(contributorId) ?? [];
      const failedDeps = deps.filter((d) => failedIds.has(d));
      if (failedDeps.length > 0) {
        const reason = `Skipped because dependency failed: ${failedDeps.join(", ")}`;
        skippedDependents.push({
          contributorId,
          dueToFailures: failedDeps,
          reason,
        });
        runtimeSkippedContributorIds.push(contributorId);
        records.push({
          contributorId,
          status: "skipped_dependent",
          reason,
          stage: stage.stage,
        });
        failedIds.add(contributorId); // cascade
        continue;
      }

      const started = nowMs();
      try {
        const result = runContributor({
          contributorId,
          observations: input.observations,
          now: input.now,
          runners: input.runners,
          priorResults: results,
        });
        const durationMs = nowMs() - started;
        executedContributorIds.push(contributorId);
        results.push({ contributorId, result });
        records.push({
          contributorId,
          status: "executed",
          result,
          durationMs,
          stage: stage.stage,
        });
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Contributor execution failed";
        failedIds.add(contributorId);
        failures.push({
          contributorId,
          reason,
          stage: stage.stage,
        });
        records.push({
          contributorId,
          status: "failed",
          reason,
          durationMs: nowMs() - started,
          stage: stage.stage,
        });
      }
    }
  }

  return {
    records,
    results,
    failures,
    skippedDependents,
    executedContributorIds,
    runtimeSkippedContributorIds,
  };
}

function runContributor(input: {
  contributorId: string;
  observations: EducationNormalizedObservations;
  now?: string;
  runners?: EducationContributorExecutorInput["runners"];
  priorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
}): EducationContributorResult {
  const custom = input.runners?.[input.contributorId];
  if (custom) {
    return custom(input.observations, input.now, input.priorResults);
  }

  if (input.contributorId === ENROLLMENT_CONTRIBUTOR_ID) {
    const observation = input.observations.enrollment;
    if (!observation) {
      throw new Error("Missing enrollment observation");
    }
    return mapEnrollmentResult(
      runEnrollmentIntelligence(observation, { now: input.now }),
      observation
    );
  }

  if (input.contributorId === ATTENDANCE_CONTRIBUTOR_ID) {
    const observation = input.observations.attendance;
    if (!observation) {
      throw new Error("Missing attendance observation");
    }
    return runAttendanceIntelligence(observation, { now: input.now });
  }

  if (input.contributorId === PROGRESS_CONTRIBUTOR_ID) {
    const observation = input.observations.progress;
    if (!observation) {
      throw new Error("Missing academic progress observation");
    }
    return runAcademicProgressIntelligence(observation, { now: input.now });
  }

  if (input.contributorId === STUDENT_SUCCESS_CONTRIBUTOR_ID) {
    const subjectId =
      input.priorResults[0]?.result.subjectId ??
      input.observations.progress?.student.studentId ??
      input.observations.attendance?.student.studentId ??
      input.observations.enrollment?.student?.studentId ??
      "unknown";
    const organizationId =
      input.observations.progress?.organizationId ??
      input.observations.attendance?.organizationId ??
      input.observations.enrollment?.organizationId;
    const synthesisInputs = buildStudentSuccessInputs({
      subjectId,
      organizationId,
      upstream: input.priorResults,
    });
    if (
      !synthesisInputs.enrollment &&
      !synthesisInputs.attendance &&
      !synthesisInputs.progress
    ) {
      throw new Error(
        "Student success synthesis requires upstream contributor results"
      );
    }
    return runStudentSuccessIntelligence(synthesisInputs, { now: input.now });
  }

  throw new Error(
    `No executor registered for contributor ${input.contributorId}`
  );
}

/** Map EnrollmentIntelligenceResult → EducationContributorResult for the graph. */
export function mapEnrollmentResult(
  result: EnrollmentIntelligenceResult,
  observation?: EnrollmentObservation
): EducationContributorResult {
  return {
    subjectId:
      observation?.student?.studentId ?? result.enrollmentRequestId,
    evidence: result.evidence,
    recommendations: result.recommendations.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      explanation: r.explanation,
      confidence: r.confidence,
      priority: r.priority,
      evidenceIds: r.evidenceIds,
      suggestedActions: r.suggestedActions.map((a) => ({
        kind: a.kind,
        actionId: a.actionId,
        label: a.label,
        priority: a.priority,
        rationale: a.rationale,
      })),
      constitutionalTrace: {
        domainPackageId: "education",
        contributorId: r.constitutionalTrace.contributorId,
        laws: r.constitutionalTrace.laws,
        rationale: r.constitutionalTrace.rationale,
      },
      attributes: r.attributes,
    })),
    confidence: result.confidence,
    explanation: result.explanation,
    priority: result.priority,
    blockingIssues: result.blockingIssues,
    warnings: result.warnings,
    suggestedActions: result.suggestedActions.map((a) => ({
      kind: a.kind,
      actionId: a.actionId,
      label: a.label,
      priority: a.priority,
      rationale: a.rationale,
    })),
    readiness: result.readiness,
    analyzedAt: result.analyzedAt,
    attributes: {
      enrollmentRequestId: result.enrollmentRequestId,
    },
  };
}

/** Exported for tests that need attendance observation typing. */
export type { AttendanceObservation };

function nowMs(): number {
  return Date.now();
}
