import type { EducationContributorResult } from "../framework";

export const SCHOLARSHIP_CONTRIBUTOR_ID =
  "education.cognition.scholarship" as const;
export const SCHOLARSHIP_OBSERVATION_ATTR = "education.scholarship" as const;

export type ScholarshipRecommendationKind =
  | "pursue_eligible_scholarship"
  | "address_renewal_risk"
  | "complete_funding_docs"
  | "maintain_scholarship_health"
  | "gather_scholarship_data";

export type ScholarshipActionProposalKind =
  | "ApplyScholarship"
  | "RenewScholarship"
  | "RequestFundingDocs"
  | "PublishScholarshipBrief";

export const SCHOLARSHIP_ACTION_PROPOSAL_IDS = {
  ApplyScholarship: "education.scholarship.apply",
  RenewScholarship: "education.scholarship.renew",
  RequestFundingDocs: "education.scholarship.request_docs",
  PublishScholarshipBrief: "education.scholarship.publish_brief",
} as const;

export type ScholarshipEvidenceCode =
  | "scholarship_bound"
  | "eligible_scholarship"
  | "renewal_risk"
  | "funding_opportunity"
  | "scholarship_healthy"
  | "insufficient_scholarship_data";

export type ScholarshipIntelligenceResult = EducationContributorResult & {
  subjectId: string;
  eligibleCount: number;
  renewalRiskCount: number;
};
