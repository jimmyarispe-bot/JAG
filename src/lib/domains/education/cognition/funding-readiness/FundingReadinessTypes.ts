import type { EducationContributorResult } from "../framework";

export const FUNDING_READINESS_CONTRIBUTOR_ID =
  "education.cognition.funding_readiness" as const;
export const FUNDING_READINESS_INPUT_ATTR =
  "education.funding_readiness" as const;

export type FundingReadinessStance =
  | "ready"
  | "at_risk"
  | "blocked"
  | "insufficient";

export type FundingReadinessRecommendationKind =
  | "publish_funding_brief"
  | "stabilize_funding_posture"
  | "prioritize_funding_actions"
  | "maintain_funding_readiness"
  | "gather_upstream_results";

export type FundingReadinessActionProposalKind =
  | "PublishFundingBrief"
  | "ScheduleFundingReview"
  | "EscalateFundingRisk";

export const FUNDING_READINESS_ACTION_PROPOSAL_IDS = {
  PublishFundingBrief: "education.funding_readiness.publish_brief",
  ScheduleFundingReview: "education.funding_readiness.schedule_review",
  EscalateFundingRisk: "education.funding_readiness.escalate_risk",
} as const;

export type FundingReadinessEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_scholarship"
  | "upstream_compliance"
  | "upstream_enrollment"
  | "funding_ready"
  | "funding_at_risk"
  | "funding_blocked"
  | "funding_risks"
  | "insufficient_upstream"
  | "policy_signals_present";

export type FundingReadinessIntelligenceResult = EducationContributorResult & {
  stance: FundingReadinessStance;
  fundingPriority: number;
};
