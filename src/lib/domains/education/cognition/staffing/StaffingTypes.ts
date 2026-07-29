import type { EducationContributorResult } from "../framework";

export const STAFFING_CONTRIBUTOR_ID = "education.cognition.staffing" as const;
export const STAFFING_OBSERVATION_ATTR = "education.staffing" as const;

export type StaffingRecommendationKind =
  | "reduce_teacher_load"
  | "fill_qualification_gap"
  | "rebalance_assignments"
  | "maintain_staffing_health"
  | "gather_staffing_data";

export type StaffingActionProposalKind =
  | "ReassignTeacher"
  | "RequestQualifiedCoverage"
  | "PublishStaffingBrief";

export const STAFFING_ACTION_PROPOSAL_IDS = {
  ReassignTeacher: "education.staffing.reassign_teacher",
  RequestQualifiedCoverage: "education.staffing.request_qualified_coverage",
  PublishStaffingBrief: "education.staffing.publish_brief",
} as const;

export type StaffingEvidenceCode =
  | "staffing_bound"
  | "teacher_overload"
  | "qualification_gap"
  | "coverage_ok"
  | "load_balanced"
  | "insufficient_staffing_data";

export type StaffingIntelligenceResult = EducationContributorResult & {
  subjectId: string;
  overloadCount: number;
  qualificationGapCount: number;
};
