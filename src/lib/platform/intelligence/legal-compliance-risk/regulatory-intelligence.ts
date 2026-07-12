/**
 * Regulatory Intelligence — regulatory requirements across compliance scopes.
 */

import type { RegulatoryIntelligence as RegulatoryIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  COMPLIANCE_SCOPES,
  type ComplianceScope,
  type ComplianceStatus,
  type LegalComplianceRiskBaseline,
  type RegulatoryRequirementRecord,
  type RegulatorySuite,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const SCOPE_REGULATIONS: Record<ComplianceScope, { regulation: string; obligation: string; owner: string }> = {
  federal: { regulation: "FERPA / Title IX", obligation: "Protect student records and civil-rights compliance.", owner: "legal" },
  state: { regulation: "State Education Code", obligation: "Maintain state licensure and reporting.", owner: "compliance" },
  local: { regulation: "Local Zoning & Safety Ordinances", obligation: "Maintain facility permits and safety inspections.", owner: "operations" },
  industry: { regulation: "Industry Safety Standards", obligation: "Meet sector safety and quality standards.", owner: "operations" },
  board_policies: { regulation: "Board Policy Manual", obligation: "Enforce board-approved governance policies.", owner: "governance" },
  internal_policies: { regulation: "Internal Policy Handbook", obligation: "Maintain and enforce internal policies.", owner: "compliance" },
  accreditation: { regulation: "Accreditation Standards", obligation: "Sustain accreditation requirements.", owner: "executive" },
  grant_requirements: { regulation: "Grant Award Terms", obligation: "Meet grant reporting and spending rules.", owner: "funding" },
  contract_obligations: { regulation: "Contractual Commitments", obligation: "Fulfill contractual obligations and SLAs.", owner: "legal" },
};

export class RegulatoryIntelligence implements RegulatoryIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): RegulatorySuite {
    const { baseline, now, createId } = input;
    const requirements: RegulatoryRequirementRecord[] = COMPLIANCE_SCOPES.map((scope, index) => {
      const meta = SCOPE_REGULATIONS[scope];
      const scopeScore = scopeCoverage(scope, baseline);
      const status: ComplianceStatus = scopeScore >= 75 ? "compliant" : scopeScore >= 55 ? "at_risk" : "non_compliant";
      const dueDate = new Date(now.getTime() + (30 + index * 21) * 86_400_000).toISOString();
      return {
        id: createId("lcr-reg"),
        regulation: meta.regulation,
        scope,
        obligation: meta.obligation,
        applies: true,
        status,
        owner: meta.owner,
        dueDate,
        narrative: `${meta.regulation} (${scope}) is ${status} at ${Math.round(scopeScore)}.`,
      };
    });

    const byScope = Object.fromEntries(
      COMPLIANCE_SCOPES.map((scope) => [scope, Math.round(scopeCoverage(scope, baseline))])
    ) as Record<ComplianceScope, number>;
    const weakestScope = [...COMPLIANCE_SCOPES].sort((a, b) => byScope[a] - byScope[b])[0]!;
    const coverageScore = clamp(baseline.regulatoryCoverage * 0.7 + average(Object.values(byScope)) * 0.3);

    return {
      requirements,
      coverageScore,
      byScope,
      weakestScope,
      narrative: `Regulatory coverage ${Math.round(coverageScore)}; weakest scope ${weakestScope}.`,
    };
  }
}

export function scopeCoverage(scope: ComplianceScope, baseline: LegalComplianceRiskBaseline): number {
  switch (scope) {
    case "federal":
    case "state":
      return clamp(baseline.complianceCoverage * 0.6 + baseline.regulatoryCoverage * 0.4);
    case "local":
    case "industry":
      return clamp(baseline.licensePermitCoverage * 0.5 + baseline.operationsProcessCoverage * 0.5);
    case "board_policies":
      return clamp(baseline.boardGovernanceScore * 0.7 + baseline.policyCoverage * 0.3);
    case "internal_policies":
      return clamp(baseline.policyCoverage * 0.7 + baseline.humanCapitalPolicyCoverage * 0.3);
    case "accreditation":
      return clamp(baseline.organizationHealthScore * 0.5 + baseline.complianceCoverage * 0.5);
    case "grant_requirements":
      return clamp(baseline.fundingComplianceReadiness * 0.8 + baseline.complianceCoverage * 0.2);
    case "contract_obligations":
      return clamp(baseline.contractCoverage * 0.7 + baseline.complianceCoverage * 0.3);
  }
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}
