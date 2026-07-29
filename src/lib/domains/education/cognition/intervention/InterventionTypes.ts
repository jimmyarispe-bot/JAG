/**
 * Intervention Intelligence — support capability contributor types.
 */

import type { EducationContributorResult } from "../framework";

export const INTERVENTION_CONTRIBUTOR_ID =
  "education.cognition.intervention" as const;

export const INTERVENTION_INPUT_ATTR = "education.intervention" as const;

export type InterventionContributorKind = "support";

export type InterventionCandidateType =
  | "academic"
  | "attendance"
  | "behavioral"
  | "multi_domain"
  | "mtss_tier2"
  | "mtss_tier3"
  | "monitor";

export type InterventionPriority = "critical" | "high" | "medium" | "low";

export type InterventionExpectedImpact =
  | "stabilize_attendance"
  | "accelerate_progress"
  | "reduce_multi_domain_risk"
  | "prevent_escalation"
  | "maintain_gains";

export type InterventionRecommendationKind =
  | "propose_academic_intervention"
  | "propose_attendance_intervention"
  | "propose_multi_domain_intervention"
  | "escalate_mtss"
  | "monitor_support_need"
  | "gather_upstream_results";

export type InterventionActionProposalKind =
  | "CreateIntervention"
  | "ScheduleMtssReview"
  | "AssignSupportStrategy"
  | "EscalateTier"
  | "MonitorProgress";

export const INTERVENTION_ACTION_PROPOSAL_IDS = {
  CreateIntervention: "education.intervention.create",
  ScheduleMtssReview: "education.intervention.schedule_mtss_review",
  AssignSupportStrategy: "education.intervention.assign_strategy",
  EscalateTier: "education.intervention.escalate_tier",
  MonitorProgress: "education.intervention.monitor_progress",
} as const;

export type InterventionEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_student_success"
  | "upstream_progress"
  | "upstream_attendance"
  | "intervention_candidate"
  | "academic_intervention_indicated"
  | "attendance_intervention_indicated"
  | "multi_domain_intervention"
  | "mtss_escalation"
  | "monitor_only"
  | "high_priority_support"
  | "expected_impact_bound"
  | "insufficient_upstream"
  | "policy_signals_present";

export type InterventionIntelligenceResult = EducationContributorResult & {
  studentId: string;
  candidates: readonly InterventionCandidateSummary[];
};

export interface InterventionCandidateSummary {
  type: InterventionCandidateType;
  priority: InterventionPriority;
  expectedImpact: InterventionExpectedImpact;
  rationale: string;
}
