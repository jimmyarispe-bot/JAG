import type { EducationContributorResult } from "../framework";

export const EXECUTIVE_BRIEFING_CONTRIBUTOR_ID =
  "education.cognition.executive_briefing" as const;
export const EXECUTIVE_BRIEFING_INPUT_ATTR =
  "education.executive_briefing" as const;

/** Top-level synthesis contributor for Education Domain v1.0. */
export type ExecutiveBriefingContributorKind = "TOP_LEVEL_SYNTHESIS";

export type ExecutiveBriefingStance =
  | "favorable"
  | "cautionary"
  | "urgent"
  | "insufficient";

export type ExecutiveBriefingRecommendationKind =
  | "publish_executive_brief"
  | "set_strategic_priorities"
  | "mitigate_critical_risks"
  | "pursue_key_opportunities"
  | "gather_upstream_results";

export type ExecutiveBriefingActionProposalKind =
  | "PublishExecutiveBrief"
  | "ScheduleBoardReview"
  | "EscalateStrategicRisk";

export const EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS = {
  PublishExecutiveBrief: "education.executive_briefing.publish_brief",
  ScheduleBoardReview: "education.executive_briefing.schedule_board_review",
  EscalateStrategicRisk: "education.executive_briefing.escalate_risk",
} as const;

export type ExecutiveBriefingEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_school_health"
  | "upstream_campus_performance"
  | "upstream_funding_readiness"
  | "upstream_support_planning"
  | "upstream_operational_readiness"
  | "executive_summary"
  | "strategic_priorities"
  | "key_opportunities"
  | "critical_risks"
  | "briefing_favorable"
  | "briefing_cautionary"
  | "briefing_urgent"
  | "evidence_index"
  | "insufficient_upstream"
  | "policy_signals_present";

export type ExecutiveBriefingIntelligenceResult = EducationContributorResult & {
  stance: ExecutiveBriefingStance;
  briefingConfidence: number;
};
