import type { EducationContributorResult } from "../framework";

export const OPERATIONAL_READINESS_CONTRIBUTOR_ID =
  "education.cognition.operational_readiness" as const;
export const OPERATIONAL_READINESS_INPUT_ATTR =
  "education.operational_readiness" as const;

export type OperationalReadinessStance =
  | "ready"
  | "at_risk"
  | "blocked"
  | "insufficient";

export type OperationalReadinessRecommendationKind =
  | "publish_operations_brief"
  | "stabilize_operations"
  | "prioritize_ops_actions"
  | "maintain_operational_readiness"
  | "gather_upstream_results";

export type OperationalReadinessActionProposalKind =
  | "PublishOperationsBrief"
  | "ScheduleOperationsReview"
  | "EscalateOperationsRisk";

export const OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS = {
  PublishOperationsBrief: "education.operational_readiness.publish_brief",
  ScheduleOperationsReview:
    "education.operational_readiness.schedule_review",
  EscalateOperationsRisk: "education.operational_readiness.escalate_risk",
} as const;

export type OperationalReadinessEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_scheduling"
  | "upstream_staffing"
  | "upstream_capacity"
  | "ops_ready"
  | "ops_at_risk"
  | "ops_blocked"
  | "readiness_score"
  | "ops_risks"
  | "ops_strengths"
  | "insufficient_upstream"
  | "policy_signals_present";

export type OperationalReadinessIntelligenceResult =
  EducationContributorResult & {
    stance: OperationalReadinessStance;
    readinessScore: number;
  };
