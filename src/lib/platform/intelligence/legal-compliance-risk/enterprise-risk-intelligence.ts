/**
 * Enterprise Risk Intelligence — full enterprise risk register across
 * all eleven risk categories.
 */

import type { EnterpriseRiskIntelligence as EnterpriseRiskIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { buildLens, clamp, clamp01, priorityFromRisk } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  RISK_CATEGORIES,
  type ComplianceSuite,
  type ContractSuite,
  type EnterpriseRiskRecord,
  type EnterpriseRiskSuite,
  type LegalComplianceRiskBaseline,
  type RiskCategory,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const CATEGORY_META: Record<RiskCategory, { title: string; owner: string; mitigation: string }> = {
  financial: { title: "Financial exposure", owner: "finance", mitigation: "Strengthen reserves and cash-flow controls." },
  operational: { title: "Operational continuity", owner: "operations", mitigation: "Harden critical processes and continuity plans." },
  strategic: { title: "Strategic execution", owner: "executive", mitigation: "Align initiatives to strategy and re-baseline." },
  legal: { title: "Legal / contractual", owner: "legal", mitigation: "Close contractual gaps and legal review." },
  compliance: { title: "Compliance gap", owner: "compliance", mitigation: "Remediate obligations and evidence." },
  human_capital: { title: "Human capital", owner: "human_capital", mitigation: "Address staffing, policy, and succession gaps." },
  cyber: { title: "Cybersecurity", owner: "operations", mitigation: "Implement missing controls and monitoring." },
  reputation: { title: "Reputation", owner: "executive", mitigation: "Manage stakeholder communications proactively." },
  mission: { title: "Mission delivery", owner: "executive", mitigation: "Protect mission-critical programs." },
  funding: { title: "Funding sustainability", owner: "funding", mitigation: "Diversify funding and meet grant compliance." },
  vendor: { title: "Vendor / third-party", owner: "operations", mitigation: "Tier vendors and enforce due diligence." },
};

export class EnterpriseRiskIntelligence implements EnterpriseRiskIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    compliance: ComplianceSuite;
    contracts: ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): EnterpriseRiskSuite {
    const { baseline, now, createId } = input;
    void now;
    const risks = Object.fromEntries(
      RISK_CATEGORIES.map((category) => [category, [buildRisk(category, baseline, createId)]])
    ) as Record<RiskCategory, EnterpriseRiskRecord[]>;
    const byCategory = Object.fromEntries(
      RISK_CATEGORIES.map((category) => [category, Math.round(categoryPressure(category, baseline) * 100)])
    ) as Record<RiskCategory, number>;
    const hottestCategory = [...RISK_CATEGORIES].sort((a, b) => byCategory[b] - byCategory[a])[0]!;
    const overallRiskPressure = clamp(
      baseline.riskPressure * 100 * 0.5 + average(Object.values(byCategory)) * 0.5
    );

    return {
      risks,
      byCategory,
      overallRiskPressure,
      hottestCategory,
      narrative: `Enterprise risk pressure ${Math.round(overallRiskPressure)}; hottest category ${hottestCategory}.`,
    };
  }
}

function buildRisk(
  category: RiskCategory,
  baseline: LegalComplianceRiskBaseline,
  createId: (prefix: string) => string
): EnterpriseRiskRecord {
  const meta = CATEGORY_META[category];
  const pressure = categoryPressure(category, baseline);
  const likelihood = clamp01(0.3 + pressure * 0.5);
  const impact = clamp01(0.4 + pressure * 0.5);
  const inherentScore = clamp(likelihood * impact * 100 + 20);
  const residualScore = clamp(inherentScore * (0.6 + (1 - baseline.executionScore / 100) * 0.3));
  return {
    id: createId("lcr-risk"),
    category,
    title: meta.title,
    likelihood,
    impact,
    inherentScore,
    residualScore,
    velocity: clamp01(0.2 + pressure * 0.4),
    owner: meta.owner,
    mitigation: meta.mitigation,
    narrative: `${meta.title} residual risk ${Math.round(residualScore)} (${priorityFromRisk(pressure)}).`,
    lenses: buildLens({
      regulationOrPolicyApplies: `Enterprise risk policy — ${category} category.`,
      evidenceSupports: `Baseline signals and ${category} indicators.`,
      confidence: `Execution score ${Math.round(baseline.executionScore)}.`,
      organizationalRisk: `${meta.title} residual score ${Math.round(residualScore)}.`,
      ifNoActionTaken: `${meta.title} likely to escalate without mitigation.`,
      correctiveActionRecommended: meta.mitigation,
      whoOwnsAction: meta.owner,
      whenShouldComplete: "Address within current planning cycle.",
    }),
  };
}

function categoryPressure(category: RiskCategory, b: LegalComplianceRiskBaseline): number {
  switch (category) {
    case "financial":
      return clamp01((1 - b.fundingComplianceReadiness / 100) * 0.5 + (1 - b.organizationHealthScore / 100) * 0.5);
    case "operational":
      return clamp01((1 - b.operationsProcessCoverage / 100) * 0.6 + (1 - b.executionScore / 100) * 0.4);
    case "strategic":
      return clamp01((1 - b.organizationHealthScore / 100) * 0.5 + (1 - b.improvementMomentum / 100) * 0.5);
    case "legal":
      return clamp01((1 - b.contractCoverage / 100) * 0.5 + b.litigationExposure * 0.5);
    case "compliance":
      return clamp01((1 - b.complianceCoverage / 100) * 0.7 + (1 - b.regulatoryCoverage / 100) * 0.3);
    case "human_capital":
      return clamp01((1 - b.humanCapitalPolicyCoverage / 100) * 0.7 + (1 - b.executionScore / 100) * 0.3);
    case "cyber":
      return clamp01((1 - b.cyberPosture / 100) * 0.8 + b.vendorRiskPressure * 0.2);
    case "reputation":
      return clamp01((1 - b.customerCommunicationCoverage / 100) * 0.5 + b.litigationExposure * 0.5);
    case "mission":
      return clamp01((1 - b.organizationHealthScore / 100) * 0.5 + (1 - b.operationsProcessCoverage / 100) * 0.5);
    case "funding":
      return clamp01((1 - b.fundingComplianceReadiness / 100) * 0.8 + (1 - b.complianceCoverage / 100) * 0.2);
    case "vendor":
      return clamp01(b.vendorRiskPressure * 0.7 + (1 - b.contractCoverage / 100) * 0.3);
  }
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export { categoryPressure as enterpriseCategoryPressure };
