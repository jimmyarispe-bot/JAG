/**
 * Legal, Compliance & Risk reasoning intelligence.
 */

import type { LegalComplianceRiskReasoner as LegalComplianceRiskReasonerContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import type {
  ComplianceSuite,
  ContractSuite,
  EnterpriseRiskSuite,
  LegalComplianceRiskBaseline,
  LegalComplianceRiskReasoningResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export class LegalComplianceRiskReasoner implements LegalComplianceRiskReasonerContract {
  reason(input: {
    baseline: LegalComplianceRiskBaseline;
    compliance: ComplianceSuite;
    enterpriseRisk: EnterpriseRiskSuite;
    contracts: ContractSuite;
    question?: string;
    now: Date;
  }): LegalComplianceRiskReasoningResult {
    void input.now;
    const connectedObligations = input.compliance.obligations
      .filter((obligation) => obligation.status !== "compliant")
      .map((obligation) => `${obligation.scope}:${obligation.requirement}`)
      .slice(0, 12);
    const risks = Object.values(input.enterpriseRisk.risks)
      .flat()
      .sort((a, b) => b.residualScore - a.residualScore)
      .slice(0, 6);
    const missingTopics = [
      ...(input.compliance.coverageScore < 60 ? ["compliance obligations"] : []),
      ...(input.contracts.coverageScore < 60 ? ["contract clause coverage"] : []),
      ...(input.baseline.cyberPosture < 60 ? ["cyber governance controls"] : []),
      ...(input.baseline.insuranceAdequacy < 60 ? ["insurance adequacy"] : []),
    ];
    const confidence = buildConfidence([
      { key: "compliance", label: "Compliance coverage", contribution: input.compliance.coverageScore / 100 },
      { key: "contracts", label: "Contract coverage", contribution: input.contracts.coverageScore / 100 },
      { key: "risk", label: "Risk containment", contribution: 1 - input.enterpriseRisk.overallRiskPressure / 100 },
    ]);
    const answer =
      input.question ??
      `Legal, compliance & risk intelligence identified ${connectedObligations.length} at-risk obligations with ${input.enterpriseRisk.hottestCategory} as the hottest enterprise risk.`;

    return {
      answer,
      connectedObligations,
      risks,
      missingTopics,
      confidence,
      narrative: `Reasoning confidence ${confidence.level}; ${connectedObligations.length} at-risk obligations and ${risks.length} risks considered.`,
    };
  }
}
