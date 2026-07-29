import type { EducationEvidenceBuilder } from "../framework";
import type { ComplianceAnalysis } from "./ComplianceAnalyzer";
import type { ComplianceObservation } from "./ComplianceObservation";

export function collectComplianceEvidence(
  builder: EducationEvidenceBuilder,
  observation: ComplianceObservation,
  analysis: ComplianceAnalysis
): void {
  builder.addSupportingEvidence(
    "compliance_bound",
    "Bound compliance intelligence to obligations and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      policyIds: analysis.knowledgeRefs.policyIds,
      obligationCount: observation.obligations.length,
      violationCount: analysis.violatedObligationIds.length,
      outstandingCount: analysis.outstandingObligationIds.length,
    }
  );

  for (const id of analysis.violatedObligationIds) {
    builder.addWarning("compliance_violation", `Compliance violation: ${id}`, {
      obligationId: id,
    });
  }
  for (const id of analysis.outstandingObligationIds) {
    builder.addWarning(
      "outstanding_obligation",
      `Outstanding obligation: ${id}`,
      { obligationId: id }
    );
  }
  for (const risk of analysis.riskIndicators) {
    builder.addWarning("compliance_risk", risk, {});
  }
  if (analysis.signals.includes("compliance_satisfied")) {
    builder.addFinding(
      "compliance_satisfied",
      "Compliance obligations are satisfied",
      {}
    );
  }
  if (analysis.signals.includes("insufficient_compliance_data")) {
    builder.addBlockingIssue(
      "insufficient_compliance_data",
      "Insufficient compliance obligations for analysis",
      {}
    );
  }
}
