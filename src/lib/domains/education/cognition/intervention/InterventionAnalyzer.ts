/**
 * Intervention analysis — consumes Student Success / Progress / Attendance outputs.
 * Does not re-run foundational domain reasoning.
 */

import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_CLASSIFICATION_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countInterventionUpstream,
  type InterventionInputs,
} from "./InterventionInputs";
import type {
  InterventionCandidateSummary,
  InterventionEvidenceCode,
  InterventionExpectedImpact,
  InterventionPriority,
} from "./InterventionTypes";

export interface InterventionAnalysis {
  candidates: InterventionCandidateSummary[];
  signals: InterventionEvidenceCode[];
  overallPriority: InterventionPriority;
  expectedImpacts: InterventionExpectedImpact[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    classificationId: string;
  };
  upstreamSummary: {
    studentSuccess?: UpstreamSlice;
    progress?: UpstreamSlice;
    attendance?: UpstreamSlice;
  };
}

interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  priority: number;
  blockingCount: number;
  warningCount: number;
  recommendationKinds: readonly string[];
  evidenceCodes: readonly string[];
}

export function validateInterventionInputs(inputs: InterventionInputs): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Intervention inputs require subjectId");
  }
}

export function analyzeIntervention(
  inputs: InterventionInputs
): InterventionAnalysis {
  const studentSuccess = sliceUpstream(
    "education.cognition.student_success",
    inputs.studentSuccess
  );
  const progress = sliceUpstream(
    "education.cognition.progress",
    inputs.progress
  );
  const attendance = sliceUpstream(
    "education.cognition.attendance",
    inputs.attendance
  );

  const upstreamCount = countInterventionUpstream(inputs);
  if (upstreamCount === 0) {
    return {
      candidates: [],
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      overallPriority: "medium",
      expectedImpacts: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: InterventionEvidenceCode[] = ["synthesis_inputs_bound"];
  if (studentSuccess) signals.push("upstream_student_success");
  if (progress) signals.push("upstream_progress");
  if (attendance) signals.push("upstream_attendance");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const candidates: InterventionCandidateSummary[] = [];

  const academicRisk =
    hasAny(progress, [
      "behind_expectations",
      "stalled_progress",
      "intervention_indicated",
      "policy_graduation_violated",
    ]) ||
    hasRec(progress, "intervention") ||
    progress?.readiness === "blocked";

  const attendanceRisk =
    hasAny(attendance, [
      "chronic_absenteeism",
      "attendance_below_threshold",
      "five_consecutive_absences",
    ]) ||
    hasRec(attendance, "intervention") ||
    attendance?.readiness === "blocked";

  const successRisk =
    hasAny(studentSuccess, [
      "high_academic_risk",
      "attendance_concern",
      "intervention_needed",
      "emerging_risk",
      "conflicting_outputs",
    ]) || hasRec(studentSuccess, "intervention");

  if (academicRisk && attendanceRisk) {
    candidates.push({
      type: "multi_domain",
      priority: "critical",
      expectedImpact: "reduce_multi_domain_risk",
      rationale:
        "Progress and Attendance upstream outputs both indicate support need.",
    });
    signals.push(
      "multi_domain_intervention",
      "intervention_candidate",
      "high_priority_support"
    );
  } else if (academicRisk) {
    candidates.push({
      type: "academic",
      priority: successRisk ? "high" : "high",
      expectedImpact: "accelerate_progress",
      rationale:
        "Academic Progress upstream indicates intervention; Student Success synthesis reinforces risk.",
    });
    signals.push(
      "academic_intervention_indicated",
      "intervention_candidate",
      "high_priority_support"
    );
  } else if (attendanceRisk) {
    candidates.push({
      type: "attendance",
      priority: "high",
      expectedImpact: "stabilize_attendance",
      rationale:
        "Attendance upstream indicates chronic or threshold risk requiring support strategies.",
    });
    signals.push(
      "attendance_intervention_indicated",
      "intervention_candidate",
      "high_priority_support"
    );
  } else if (successRisk) {
    candidates.push({
      type: "mtss_tier2",
      priority: "medium",
      expectedImpact: "prevent_escalation",
      rationale:
        "Student Success synthesis signals emerging or coordinated risk without hard domain blockers.",
    });
    signals.push("mtss_escalation", "intervention_candidate");
  } else {
    candidates.push({
      type: "monitor",
      priority: "low",
      expectedImpact: "maintain_gains",
      rationale:
        "Upstream contributors are stable; continue light monitoring rather than new intervention.",
    });
    signals.push("monitor_only");
  }

  if (
    candidates.some((c) => c.type === "multi_domain") ||
    (academicRisk && successRisk && attendanceRisk)
  ) {
    candidates.push({
      type: "mtss_tier3",
      priority: "critical",
      expectedImpact: "reduce_multi_domain_risk",
      rationale:
        "Multi-domain risk profile warrants MTSS tier escalation review.",
    });
    if (!signals.includes("mtss_escalation")) signals.push("mtss_escalation");
  }

  for (const c of candidates) {
    if (!signals.includes("expected_impact_bound")) {
      signals.push("expected_impact_bound");
    }
    void c;
  }

  const overallPriority = highestPriority(candidates.map((c) => c.priority));
  const expectedImpacts = unique(
    candidates.map((c) => c.expectedImpact)
  ) as InterventionExpectedImpact[];

  return {
    candidates,
    signals: unique(signals) as InterventionEvidenceCode[],
    overallPriority,
    expectedImpacts,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      studentSuccess,
      progress,
      attendance,
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

function hasAny(
  slice: UpstreamSlice | undefined,
  codes: readonly string[]
): boolean {
  if (!slice) return false;
  return codes.some((c) => slice.evidenceCodes.includes(c));
}

function hasRec(
  slice: UpstreamSlice | undefined,
  fragment: string
): boolean {
  if (!slice) return false;
  return slice.recommendationKinds.some((k) => k.includes(fragment));
}

function highestPriority(
  priorities: readonly InterventionPriority[]
): InterventionPriority {
  const rank: Record<InterventionPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  let best: InterventionPriority = "low";
  for (const p of priorities) {
    if (rank[p] > rank[best]) best = p;
  }
  return best;
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.interventions,
    entityIds: [
      EDUCATION_ENTITY_IDS.student,
      EDUCATION_ENTITY_IDS.intervention,
      EDUCATION_ENTITY_IDS.attendanceRecord,
      EDUCATION_ENTITY_IDS.progressRecord,
    ],
    classificationId: EDUCATION_CLASSIFICATION_IDS.interventionType,
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
