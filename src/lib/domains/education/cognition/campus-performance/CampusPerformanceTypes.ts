import type { EducationContributorResult } from "../framework";

export const CAMPUS_PERFORMANCE_CONTRIBUTOR_ID =
  "education.cognition.campus_performance" as const;
export const CAMPUS_PERFORMANCE_INPUT_ATTR =
  "education.campus_performance" as const;

export type CampusPerformanceStance =
  | "strong"
  | "mixed"
  | "underperforming"
  | "insufficient";

export type CampusPerformanceRecommendationKind =
  | "publish_performance_brief"
  | "close_performance_gaps"
  | "replicate_high_performers"
  | "prioritize_campus_actions"
  | "gather_upstream_results";

export type CampusPerformanceActionProposalKind =
  | "PublishCampusPerformanceBrief"
  | "ScheduleCampusReview"
  | "EscalateCampusGap";

export const CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS = {
  PublishCampusPerformanceBrief:
    "education.campus_performance.publish_brief",
  ScheduleCampusReview: "education.campus_performance.schedule_review",
  EscalateCampusGap: "education.campus_performance.escalate_gap",
} as const;

export type CampusPerformanceEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_student_success"
  | "upstream_support_planning"
  | "upstream_operational_readiness"
  | "upstream_funding_readiness"
  | "campus_units_bound"
  | "performance_strong"
  | "performance_mixed"
  | "performance_underperforming"
  | "comparative_insights"
  | "trend_summaries"
  | "insufficient_upstream"
  | "policy_signals_present";

export type CampusPerformanceIntelligenceResult = EducationContributorResult & {
  stance: CampusPerformanceStance;
  performanceScore: number;
};
