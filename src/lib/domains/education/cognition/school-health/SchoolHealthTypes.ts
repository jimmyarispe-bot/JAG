import type { EducationContributorResult } from "../framework";

export const SCHOOL_HEALTH_CONTRIBUTOR_ID =
  "education.cognition.school_health" as const;
export const SCHOOL_HEALTH_INPUT_ATTR = "education.school_health" as const;

export type SchoolHealthStance =
  | "healthy"
  | "watch"
  | "at_risk"
  | "critical"
  | "insufficient";

export type SchoolHealthRecommendationKind =
  | "publish_health_brief"
  | "stabilize_organizational_health"
  | "reinforce_strengths"
  | "prioritize_health_actions"
  | "gather_upstream_results";

export type SchoolHealthActionProposalKind =
  | "PublishSchoolHealthBrief"
  | "ScheduleLeadershipReview"
  | "EscalateOrganizationalRisk";

export const SCHOOL_HEALTH_ACTION_PROPOSAL_IDS = {
  PublishSchoolHealthBrief: "education.school_health.publish_brief",
  ScheduleLeadershipReview: "education.school_health.schedule_review",
  EscalateOrganizationalRisk: "education.school_health.escalate_risk",
} as const;

export type SchoolHealthEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_student_success"
  | "upstream_support_planning"
  | "upstream_operational_readiness"
  | "upstream_funding_readiness"
  | "health_healthy"
  | "health_watch"
  | "health_at_risk"
  | "health_critical"
  | "health_risks"
  | "health_strengths"
  | "insufficient_upstream"
  | "policy_signals_present";

export type SchoolHealthIntelligenceResult = EducationContributorResult & {
  stance: SchoolHealthStance;
  healthScore: number;
};
