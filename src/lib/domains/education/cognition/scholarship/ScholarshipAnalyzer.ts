import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
} from "../../knowledge";
import type { ScholarshipObservation } from "./ScholarshipObservation";
import type { ScholarshipEvidenceCode } from "./ScholarshipTypes";

export interface ScholarshipAnalysis {
  signals: ScholarshipEvidenceCode[];
  eligibleIds: string[];
  renewalRiskIds: string[];
  fundingOpportunities: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    policyIds: readonly string[];
  };
}

export function analyzeScholarship(
  observation: ScholarshipObservation
): ScholarshipAnalysis {
  const awards = observation.scholarships ?? [];
  const signals: ScholarshipEvidenceCode[] = ["scholarship_bound"];

  if (awards.length === 0) {
    return {
      signals: ["insufficient_scholarship_data", "scholarship_bound"],
      eligibleIds: [],
      renewalRiskIds: [],
      fundingOpportunities: [],
      knowledgeRefs: knowledgeRefs(),
    };
  }

  const gpa = observation.student.gpa;
  const eligibleIds: string[] = [];
  const renewalRiskIds: string[] = [];
  const fundingOpportunities: string[] = [];

  for (const a of awards) {
    const gpaOk =
      a.minimumGpa === undefined || gpa === undefined || gpa >= a.minimumGpa;
    if (a.status === "eligible" && gpaOk) {
      eligibleIds.push(a.scholarshipId);
      fundingOpportunities.push(`Eligible: ${a.name ?? a.scholarshipId}`);
    }
    if (a.status === "pending" && gpaOk) {
      fundingOpportunities.push(`Pending review: ${a.name ?? a.scholarshipId}`);
    }
    if (
      a.status === "renewal_due" ||
      a.status === "expired" ||
      (a.minimumGpa !== undefined && gpa !== undefined && gpa < a.minimumGpa) ||
      (a.missingDocuments?.length ?? 0) > 0
    ) {
      renewalRiskIds.push(a.scholarshipId);
    }
    if (
      a.status === "awarded" &&
      (a.utilizationRatio ?? 1) < 0.5
    ) {
      fundingOpportunities.push(
        `Under-utilized award: ${a.name ?? a.scholarshipId}`
      );
    }
  }

  if (eligibleIds.length > 0) signals.push("eligible_scholarship");
  if (renewalRiskIds.length > 0) signals.push("renewal_risk");
  if (fundingOpportunities.length > 0) signals.push("funding_opportunity");
  if (
    renewalRiskIds.length === 0 &&
    awards.some((a) => a.status === "awarded" || a.status === "eligible")
  ) {
    signals.push("scholarship_healthy");
  }

  return {
    signals: [...new Set(signals)],
    eligibleIds,
    renewalRiskIds,
    fundingOpportunities,
    knowledgeRefs: knowledgeRefs(),
  };
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.scholarships,
    entityIds: [
      EDUCATION_ENTITY_IDS.scholarship,
      EDUCATION_ENTITY_IDS.scholarshipAward,
      EDUCATION_ENTITY_IDS.fundingSource,
      EDUCATION_ENTITY_IDS.eligibilityRule,
      EDUCATION_ENTITY_IDS.renewalCycle,
      EDUCATION_ENTITY_IDS.fundingPeriod,
    ],
    policyIds: [
      EDUCATION_POLICY_IDS.scholarshipEligibility,
      EDUCATION_POLICY_IDS.fundingRenewalRequirements,
      EDUCATION_POLICY_IDS.fundingDeadlines,
    ],
  };
}
