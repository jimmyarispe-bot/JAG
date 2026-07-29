import type { EducationContributorResult } from "../framework";

export const COMPLIANCE_CONTRIBUTOR_ID =
  "education.cognition.compliance" as const;
export const COMPLIANCE_OBSERVATION_ATTR = "education.compliance" as const;

export type ComplianceRecommendationKind =
  | "resolve_compliance_violation"
  | "complete_outstanding_obligations"
  | "schedule_required_review"
  | "maintain_compliance_posture"
  | "gather_compliance_data";

export type ComplianceActionProposalKind =
  | "CompleteObligation"
  | "ScheduleComplianceReview"
  | "PublishComplianceBrief";

export const COMPLIANCE_ACTION_PROPOSAL_IDS = {
  CompleteObligation: "education.compliance.complete_obligation",
  ScheduleComplianceReview: "education.compliance.schedule_review",
  PublishComplianceBrief: "education.compliance.publish_brief",
} as const;

export type ComplianceEvidenceCode =
  | "compliance_bound"
  | "compliance_satisfied"
  | "compliance_violation"
  | "outstanding_obligation"
  | "compliance_risk"
  | "insufficient_compliance_data";

export type ComplianceIntelligenceResult = EducationContributorResult & {
  subjectId: string;
  violationCount: number;
  outstandingCount: number;
};
