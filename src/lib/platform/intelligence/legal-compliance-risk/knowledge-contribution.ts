/**
 * Legal/compliance/risk to knowledge contribution intelligence.
 */

import type { LegalComplianceRiskKnowledgeContributionEngine as LegalComplianceRiskKnowledgeContributionEngineContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import type {
  ComplianceSuite,
  ContractSuite,
  EnterpriseRiskSuite,
  LegalComplianceRiskBaseline,
  LegalComplianceRiskKnowledgeContribution,
  LegalComplianceRiskKnowledgeDraft,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export class LegalComplianceRiskKnowledgeContributionEngine
  implements LegalComplianceRiskKnowledgeContributionEngineContract
{
  contribute(input: {
    baseline: LegalComplianceRiskBaseline;
    compliance: ComplianceSuite;
    enterpriseRisk: EnterpriseRiskSuite;
    contracts: ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): LegalComplianceRiskKnowledgeContribution {
    const { baseline, compliance, enterpriseRisk, contracts, createId } = input;
    const groups: Array<{ group: string; artifactType: string; sourceRef: string; seed: number }> = [
      { group: "compliance obligations", artifactType: "compliance_knowledge", sourceRef: compliance.obligations[0]?.id ?? "compliance", seed: compliance.coverageScore },
      { group: "enterprise risk register", artifactType: "risk_knowledge", sourceRef: enterpriseRisk.hottestCategory, seed: 100 - enterpriseRisk.overallRiskPressure },
      { group: "contract obligations", artifactType: "contract_knowledge", sourceRef: contracts.contracts[0]?.id ?? "contracts", seed: contracts.coverageScore },
      { group: "regulatory obligations", artifactType: "regulatory_knowledge", sourceRef: "regulatory", seed: baseline.regulatoryCoverage },
    ];
    const artifacts: LegalComplianceRiskKnowledgeDraft[] = groups.map((group) => {
      const confidence = clamp(baseline.knowledgeContributionScore * 0.55 + group.seed * 0.45);
      return {
        id: createId("lcr-knowledge"),
        type: group.artifactType,
        title: `${group.group} knowledge`,
        confidence,
        sourceRef: group.sourceRef,
        validated: confidence >= 60,
        metadata: { group: group.group, complianceCoverage: compliance.coverageScore },
      };
    });
    const validatedCount = artifacts.filter((artifact) => artifact.validated).length;
    const contributionScore = clamp(
      baseline.knowledgeContributionScore * 0.7 + (validatedCount / Math.max(1, artifacts.length)) * 30
    );

    return {
      artifacts,
      contributionScore,
      validatedCount,
      narrative: `Legal/compliance/risk knowledge contribution ${Math.round(contributionScore)} with ${validatedCount} validated drafts.`,
    };
  }
}
