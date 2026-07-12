/**
 * Compliance Intelligence — obligation tracking across all compliance scopes.
 */

import type { ComplianceIntelligence as ComplianceIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import { scopeCoverage } from "@/lib/platform/intelligence/legal-compliance-risk/regulatory-intelligence";
import {
  COMPLIANCE_SCOPES,
  type ComplianceObligationRecord,
  type ComplianceScope,
  type ComplianceStatus,
  type ComplianceSuite,
  type ContractSuite,
  type LegalComplianceRiskBaseline,
  type RegulatorySuite,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const SCOPE_REQUIREMENTS: Record<ComplianceScope, { requirement: string; owner: string }> = {
  federal: { requirement: "Federal records and civil-rights compliance", owner: "legal" },
  state: { requirement: "State licensure and mandated reporting", owner: "compliance" },
  local: { requirement: "Facility permits and safety inspections", owner: "operations" },
  industry: { requirement: "Sector safety and quality standards", owner: "operations" },
  board_policies: { requirement: "Board-approved policy enforcement", owner: "governance" },
  internal_policies: { requirement: "Internal policy adherence", owner: "compliance" },
  accreditation: { requirement: "Accreditation standard maintenance", owner: "executive" },
  grant_requirements: { requirement: "Grant reporting and spend compliance", owner: "funding" },
  contract_obligations: { requirement: "Contractual obligation fulfillment", owner: "legal" },
};

export class ComplianceIntelligence implements ComplianceIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    regulatory: RegulatorySuite;
    contracts: ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ComplianceSuite {
    const { baseline, regulatory, now, createId } = input;
    const obligations: ComplianceObligationRecord[] = COMPLIANCE_SCOPES.map((scope, index) => {
      const meta = SCOPE_REQUIREMENTS[scope];
      const coverage = scopeCoverage(scope, baseline);
      const status: ComplianceStatus = coverage >= 75 ? "compliant" : coverage >= 55 ? "at_risk" : "non_compliant";
      const gapScore = clamp(100 - coverage);
      const dueDate = new Date(now.getTime() + (21 + index * 18) * 86_400_000).toISOString();
      return {
        id: createId("lcr-obl"),
        scope,
        requirement: meta.requirement,
        status,
        evidenceRefs: [`evidence-${scope}-1`, `evidence-${scope}-2`],
        owner: meta.owner,
        dueDate,
        gapScore,
        narrative: `${meta.requirement} (${scope}) is ${status}; gap ${Math.round(gapScore)}.`,
      };
    });

    const byScope = Object.fromEntries(
      COMPLIANCE_SCOPES.map((scope) => [scope, Math.round(scopeCoverage(scope, baseline))])
    ) as Record<ComplianceScope, number>;
    const weakestScope = [...COMPLIANCE_SCOPES].sort((a, b) => byScope[a] - byScope[b])[0]!;
    const coverageScore = clamp(
      baseline.complianceCoverage * 0.6 + regulatory.coverageScore * 0.2 + average(Object.values(byScope)) * 0.2
    );
    const gapPressure = clamp01((100 - coverageScore) / 100 + obligations.filter((o) => o.status === "non_compliant").length * 0.03);

    return {
      scopes: [...COMPLIANCE_SCOPES],
      obligations,
      byScope,
      coverageScore,
      gapPressure,
      weakestScope,
      narrative: `Compliance coverage ${Math.round(coverageScore)} across all ${COMPLIANCE_SCOPES.length} scopes; weakest ${weakestScope}.`,
    };
  }
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
