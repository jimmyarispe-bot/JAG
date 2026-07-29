/**
 * Student Success synthesis analysis.
 * Consumes upstream contributor outputs — does not re-run enrollment /
 * attendance / progress reasoning.
 */

import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import {
  countUpstreamResults,
  type StudentSuccessInputs,
} from "./StudentSuccessInputs";
import type {
  StudentSuccessEvidenceCode,
  StudentSuccessTrajectory,
} from "./StudentSuccessTypes";
import type { EducationContributorResult } from "../framework";

export interface StudentSuccessAnalysis {
  trajectory: StudentSuccessTrajectory;
  signals: StudentSuccessEvidenceCode[];
  riskIndicators: string[];
  strengthIndicators: string[];
  advancementReady: boolean;
  interventionNeeded: boolean;
  conflictDetected: boolean;
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    enrollment?: UpstreamSlice;
    attendance?: UpstreamSlice;
    progress?: UpstreamSlice;
  };
}

export interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  priority: number;
  blockingCount: number;
  warningCount: number;
  recommendationKinds: readonly string[];
  evidenceCodes: readonly string[];
}

export function validateStudentSuccessInputs(
  inputs: StudentSuccessInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Student success inputs require subjectId");
  }
}

export function analyzeStudentSuccess(
  inputs: StudentSuccessInputs
): StudentSuccessAnalysis {
  const enrollment = sliceUpstream(
    "education.cognition.enrollment",
    inputs.enrollment
  );
  const attendance = sliceUpstream(
    "education.cognition.attendance",
    inputs.attendance
  );
  const progress = sliceUpstream(
    "education.cognition.progress",
    inputs.progress
  );

  const present = [enrollment, attendance, progress].filter(
    Boolean
  ) as UpstreamSlice[];
  const upstreamCount = countUpstreamResults(inputs);

  if (upstreamCount === 0) {
    return {
      trajectory: "insufficient",
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      riskIndicators: ["No upstream contributor results available"],
      strengthIndicators: [],
      advancementReady: false,
      interventionNeeded: false,
      conflictDetected: false,
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const riskIndicators: string[] = [];
  const strengthIndicators: string[] = [];
  const signals: StudentSuccessEvidenceCode[] = ["synthesis_inputs_bound"];

  if (enrollment) {
    signals.push("upstream_enrollment");
    collectSliceIndicators(enrollment, riskIndicators, strengthIndicators);
  }
  if (attendance) {
    signals.push("upstream_attendance");
    collectSliceIndicators(attendance, riskIndicators, strengthIndicators);
  }
  if (progress) {
    signals.push("upstream_progress");
    collectSliceIndicators(progress, riskIndicators, strengthIndicators);
  }

  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
    for (const v of inputs.policyResult.violated) {
      riskIndicators.push(`Policy violated: ${v.policyId}`);
    }
    for (const s of inputs.policyResult.satisfied) {
      strengthIndicators.push(`Policy satisfied: ${s.policyId}`);
    }
  }

  const attendanceConcern =
    attendance !== undefined &&
    (attendance.readiness === "blocked" ||
      attendance.evidenceCodes.some((c) =>
        [
          "chronic_absenteeism",
          "attendance_below_threshold",
          "five_consecutive_absences",
        ].includes(c)
      ) ||
      attendance.recommendationKinds.some((k) =>
        k.includes("intervention") || k.includes("attendance")
      ));

  const highAcademicRisk =
    progress !== undefined &&
    (progress.readiness === "blocked" ||
      progress.evidenceCodes.some((c) =>
        [
          "behind_expectations",
          "stalled_progress",
          "intervention_indicated",
          "policy_graduation_violated",
        ].includes(c)
      ) ||
      progress.recommendationKinds.some((k) =>
        k.includes("intervention")
      ));

  // True cross-domain conflict: competing risk domains, or
  // strength signals contradicted by a hard blocker elsewhere.
  const readinessSet = new Set(present.map((p) => p.readiness));
  const contradictoryStrength =
    Boolean(
      progress?.evidenceCodes.some((c) =>
        ["exceptional_growth", "ahead_of_expectations"].includes(c)
      )
    ) && attendanceConcern;
  const conflictDetected =
    (highAcademicRisk && attendanceConcern) ||
    contradictoryStrength ||
    (readinessSet.has("ready") &&
      readinessSet.has("blocked") &&
      highAcademicRisk &&
      attendanceConcern);

  const outstanding =
    progress !== undefined &&
    (progress.evidenceCodes.some((c) =>
      ["exceptional_growth", "ahead_of_expectations"].includes(c)
    ) ||
      progress.recommendationKinds.some((k) =>
        ["accelerate_learning", "celebrate_growth"].includes(k)
      )) &&
    !highAcademicRisk &&
    !attendanceConcern;

  const improving =
    present.some((p) =>
      p.evidenceCodes.some((c) =>
        ["improving_trend", "recovery_pattern", "positive_momentum"].includes(
          c
        )
      ) ||
      p.recommendationKinds.some((k) => k.includes("improvement") || k.includes("recognize"))
    ) &&
    !highAcademicRisk;

  const allReady = present.every((p) => p.readiness === "ready");
  const avgConfidence =
    present.reduce((n, p) => n + p.confidence, 0) / present.length;

  const advancementReady =
    allReady &&
    avgConfidence >= 0.75 &&
    !attendanceConcern &&
    !highAcademicRisk &&
    (progress?.evidenceCodes.includes("assessment_ready") ||
      progress?.evidenceCodes.includes("expected_progress") ||
      progress?.evidenceCodes.includes("ahead_of_expectations") ||
      false);

  const interventionNeeded =
    highAcademicRisk ||
    attendanceConcern ||
    present.some((p) =>
      p.recommendationKinds.some((k) => k.includes("intervention"))
    );

  let trajectory: StudentSuccessTrajectory = "healthy";
  if (conflictDetected) {
    trajectory = "conflicting";
    signals.push("conflicting_outputs");
  } else if (outstanding) {
    trajectory = "outstanding";
    signals.push("outstanding_achievement");
  } else if (highAcademicRisk) {
    trajectory = "high_academic_risk";
    signals.push("high_academic_risk");
  } else if (attendanceConcern) {
    trajectory = "attendance_concern";
    signals.push("attendance_concern");
  } else if (improving) {
    trajectory = "improving";
    signals.push("improving_trajectory");
  } else if (
    allReady &&
    avgConfidence >= 0.8 &&
    riskIndicators.length === 0
  ) {
    trajectory = "healthy";
    signals.push("healthy_learner");
  } else if (allReady && riskIndicators.length > 0) {
    trajectory = "emerging_risk";
    signals.push("emerging_risk");
  } else if (allReady) {
    trajectory = "positive_momentum";
    signals.push("positive_momentum");
  } else if (interventionNeeded) {
    trajectory = "emerging_risk";
    signals.push("emerging_risk");
  } else {
    trajectory = "emerging_risk";
    signals.push("emerging_risk");
  }

  if (strengthIndicators.length > 0) signals.push("cross_domain_strength");
  if (riskIndicators.length > 0) signals.push("cross_domain_risk");
  if (advancementReady) signals.push("advancement_ready");
  if (interventionNeeded) signals.push("intervention_needed");

  return {
    trajectory,
    signals: unique(signals),
    riskIndicators: unique(riskIndicators),
    strengthIndicators: unique(strengthIndicators),
    advancementReady,
    interventionNeeded,
    conflictDetected,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      enrollment: enrollment,
      attendance: attendance,
      progress: progress,
    },
  };
}

function sliceUpstream(
  contributorId: string,
  result?: EducationContributorResult
): UpstreamSlice | undefined {
  if (!result) return undefined;
  const evidenceCodes = result.evidence
    .map((e) =>
      typeof e.attributes?.code === "string" ? e.attributes.code : ""
    )
    .filter(Boolean);
  return {
    contributorId,
    readiness: result.readiness,
    confidence: result.confidence,
    priority: result.priority,
    blockingCount: result.blockingIssues.length,
    warningCount: result.warnings.length,
    recommendationKinds: result.recommendations.map((r) => r.kind),
    evidenceCodes,
  };
}

function collectSliceIndicators(
  slice: UpstreamSlice,
  risks: string[],
  strengths: string[]
): void {
  if (slice.readiness === "blocked" || slice.blockingCount > 0) {
    risks.push(
      `${slice.contributorId}: blocked (${slice.blockingCount} issue(s))`
    );
  } else if (slice.readiness === "conditional" || slice.warningCount > 0) {
    risks.push(
      `${slice.contributorId}: conditional/warnings (${slice.warningCount})`
    );
  } else if (slice.readiness === "ready" && slice.confidence >= 0.8) {
    strengths.push(
      `${slice.contributorId}: ready (confidence ${slice.confidence.toFixed(2)})`
    );
  } else if (slice.readiness === "ready") {
    strengths.push(`${slice.contributorId}: ready`);
  }
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.academicProgress,
    entityIds: [
      EDUCATION_ENTITY_IDS.student,
      EDUCATION_ENTITY_IDS.program,
      EDUCATION_ENTITY_IDS.goal,
      EDUCATION_ENTITY_IDS.intervention,
    ],
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
