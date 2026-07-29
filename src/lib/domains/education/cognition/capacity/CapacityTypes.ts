import type { EducationContributorResult } from "../framework";

export const CAPACITY_CONTRIBUTOR_ID = "education.cognition.capacity" as const;
export const CAPACITY_OBSERVATION_ATTR = "education.capacity" as const;

export type CapacityRecommendationKind =
  | "address_over_capacity"
  | "expand_capacity"
  | "consolidate_underutilized"
  | "maintain_capacity_health"
  | "gather_capacity_data";

export type CapacityActionProposalKind =
  | "OpenSection"
  | "CloseSection"
  | "ExpandSeats"
  | "PublishCapacityBrief";

export const CAPACITY_ACTION_PROPOSAL_IDS = {
  OpenSection: "education.capacity.open_section",
  CloseSection: "education.capacity.close_section",
  ExpandSeats: "education.capacity.expand_seats",
  PublishCapacityBrief: "education.capacity.publish_brief",
} as const;

export type CapacityEvidenceCode =
  | "capacity_bound"
  | "over_capacity"
  | "under_utilized"
  | "capacity_healthy"
  | "insufficient_capacity_data";

export type CapacityIntelligenceResult = EducationContributorResult & {
  subjectId: string;
  utilization: number;
  overCapacityCount: number;
  underUtilizedCount: number;
};
