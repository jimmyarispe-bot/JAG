/**
 * Family Engagement analysis — consumes Student Success / Attendance / Enrollment.
 */

import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_RELATIONSHIP_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countFamilyEngagementUpstream,
  type FamilyEngagementInputs,
} from "./FamilyEngagementInputs";
import type {
  FamilyCommunicationPriority,
  FamilyEngagementEvidenceCode,
  FamilyEngagementOpportunity,
} from "./FamilyEngagementTypes";

export interface FamilyEngagementAnalysis {
  opportunities: FamilyEngagementOpportunity[];
  communicationPriority: FamilyCommunicationPriority;
  outreachThemes: string[];
  signals: FamilyEngagementEvidenceCode[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    relationshipIds: readonly string[];
  };
  upstreamSummary: {
    studentSuccess?: UpstreamSlice;
    attendance?: UpstreamSlice;
    enrollment?: UpstreamSlice;
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

export function validateFamilyEngagementInputs(
  inputs: FamilyEngagementInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Family engagement inputs require subjectId");
  }
}

export function analyzeFamilyEngagement(
  inputs: FamilyEngagementInputs
): FamilyEngagementAnalysis {
  const studentSuccess = sliceUpstream(
    "education.cognition.student_success",
    inputs.studentSuccess
  );
  const attendance = sliceUpstream(
    "education.cognition.attendance",
    inputs.attendance
  );
  const enrollment = sliceUpstream(
    "education.cognition.enrollment",
    inputs.enrollment
  );

  if (countFamilyEngagementUpstream(inputs) === 0) {
    return {
      opportunities: [],
      communicationPriority: "medium",
      outreachThemes: [],
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: FamilyEngagementEvidenceCode[] = ["synthesis_inputs_bound"];
  if (studentSuccess) signals.push("upstream_student_success");
  if (attendance) signals.push("upstream_attendance");
  if (enrollment) signals.push("upstream_enrollment");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const opportunities: FamilyEngagementOpportunity[] = [];
  const outreachThemes: string[] = [];

  const attendanceConcern =
    hasAny(attendance, [
      "chronic_absenteeism",
      "attendance_below_threshold",
      "five_consecutive_absences",
    ]) ||
    attendance?.readiness === "blocked" ||
    hasAny(studentSuccess, ["attendance_concern"]);

  const riskOutreach =
    hasAny(studentSuccess, [
      "high_academic_risk",
      "emerging_risk",
      "intervention_needed",
      "conflicting_outputs",
    ]) || hasRec(studentSuccess, "intervention");

  const celebration =
    hasAny(studentSuccess, [
      "outstanding_achievement",
      "healthy_learner",
      "positive_momentum",
      "improving_trajectory",
    ]) && !attendanceConcern;

  const enrollmentPartnership =
    enrollment !== undefined &&
    (enrollment.readiness === "conditional" ||
      enrollment.readiness === "blocked" ||
      enrollment.warningCount > 0 ||
      hasRec(enrollment, "enroll"));

  if (attendanceConcern) {
    opportunities.push("attendance_partnership");
    signals.push("attendance_partnership", "engagement_opportunity");
    outreachThemes.push("Attendance partnership and re-engagement");
  }

  if (riskOutreach) {
    opportunities.push("risk_outreach");
    signals.push("risk_outreach", "engagement_opportunity");
    outreachThemes.push("Supportive risk outreach with clear next steps");
  }

  if (riskOutreach || hasAny(studentSuccess, ["high_academic_risk"])) {
    opportunities.push("progress_conference");
    signals.push("progress_conference", "engagement_opportunity");
    outreachThemes.push("Family–school progress conference");
  }

  if (celebration) {
    opportunities.push("celebration_outreach");
    signals.push("celebration_outreach", "engagement_opportunity");
    outreachThemes.push("Celebrate learner momentum with family");
  }

  if (enrollmentPartnership) {
    opportunities.push("enrollment_onboarding");
    signals.push("enrollment_onboarding", "engagement_opportunity");
    outreachThemes.push("Complete enrollment partnership / onboarding");
  }

  if (opportunities.length === 0) {
    opportunities.push("routine_check_in");
    signals.push("engagement_opportunity");
    outreachThemes.push("Routine family check-in");
  }

  let communicationPriority: FamilyCommunicationPriority = "low";
  if (attendanceConcern || hasAny(studentSuccess, ["high_academic_risk"])) {
    communicationPriority = "urgent";
    signals.push("communication_priority_urgent");
  } else if (riskOutreach || enrollmentPartnership) {
    communicationPriority = "high";
    signals.push("communication_priority_high");
  } else if (celebration) {
    communicationPriority = "medium";
  } else {
    communicationPriority = "low";
  }

  return {
    opportunities: unique(opportunities),
    communicationPriority,
    outreachThemes: unique(outreachThemes),
    signals: unique(signals) as FamilyEngagementEvidenceCode[],
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      studentSuccess,
      attendance,
      enrollment,
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

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.familyEngagement,
    entityIds: [EDUCATION_ENTITY_IDS.family, EDUCATION_ENTITY_IDS.student],
    relationshipIds: [EDUCATION_RELATIONSHIP_IDS.familySupportsStudent],
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
