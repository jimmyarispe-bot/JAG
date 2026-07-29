import type { EducationContributorResult } from "../framework";

export const SCHEDULING_CONTRIBUTOR_ID =
  "education.cognition.scheduling" as const;
export const SCHEDULING_OBSERVATION_ATTR = "education.scheduling" as const;

export type SchedulingRecommendationKind =
  | "resolve_schedule_conflict"
  | "fill_coverage_gap"
  | "optimize_schedule"
  | "maintain_schedule_health"
  | "gather_schedule_data";

export type SchedulingActionProposalKind =
  | "RescheduleSession"
  | "ReassignRoom"
  | "FillCoverage"
  | "PublishScheduleBrief";

export const SCHEDULING_ACTION_PROPOSAL_IDS = {
  RescheduleSession: "education.scheduling.reschedule_session",
  ReassignRoom: "education.scheduling.reassign_room",
  FillCoverage: "education.scheduling.fill_coverage",
  PublishScheduleBrief: "education.scheduling.publish_brief",
} as const;

export type SchedulingEvidenceCode =
  | "schedule_bound"
  | "schedule_conflict"
  | "coverage_gap"
  | "optimization_opportunity"
  | "schedule_healthy"
  | "insufficient_schedule_data";

export type SchedulingIntelligenceResult = EducationContributorResult & {
  subjectId: string;
  conflictCount: number;
  coverageGapCount: number;
};
