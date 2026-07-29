import type { EducationEvidenceBuilder } from "../framework";
import type { ScholarshipAnalysis } from "./ScholarshipAnalyzer";
import type { ScholarshipObservation } from "./ScholarshipObservation";

export function collectScholarshipEvidence(
  builder: EducationEvidenceBuilder,
  observation: ScholarshipObservation,
  analysis: ScholarshipAnalysis
): void {
  builder.addSupportingEvidence(
    "scholarship_bound",
    "Bound scholarship intelligence to awards, enrollment context, and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      policyIds: analysis.knowledgeRefs.policyIds,
      awardCount: observation.scholarships.length,
      eligibleCount: analysis.eligibleIds.length,
      renewalRiskCount: analysis.renewalRiskIds.length,
    }
  );

  for (const id of analysis.eligibleIds) {
    builder.addFinding("eligible_scholarship", `Eligible scholarship: ${id}`, {
      scholarshipId: id,
    });
  }
  for (const id of analysis.renewalRiskIds) {
    builder.addWarning("renewal_risk", `Scholarship renewal risk: ${id}`, {
      scholarshipId: id,
    });
  }
  for (const opp of analysis.fundingOpportunities) {
    builder.addFinding("funding_opportunity", opp, {});
  }
  if (analysis.signals.includes("scholarship_healthy")) {
    builder.addFinding(
      "scholarship_healthy",
      "Scholarship posture is healthy without renewal blockers",
      {}
    );
  }
  if (analysis.signals.includes("insufficient_scholarship_data")) {
    builder.addBlockingIssue(
      "insufficient_scholarship_data",
      "Insufficient scholarship awards for analysis",
      {}
    );
  }
}
