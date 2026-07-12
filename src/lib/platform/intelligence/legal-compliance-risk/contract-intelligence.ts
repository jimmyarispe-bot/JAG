/**
 * Contract Intelligence — obligations, renewals, expirations, missing clauses.
 */

import type { ContractIntelligence as ContractIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import type {
  ContractRecord,
  ContractStatus,
  ContractSuite,
  LegalComplianceRiskBaseline,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const CONTRACT_TEMPLATES: Array<{ title: string; counterparty: string; owner: string; autoRenew: boolean }> = [
  { title: "Facilities Lease Agreement", counterparty: "Property Holdings LLC", owner: "operations", autoRenew: true },
  { title: "Student Information System License", counterparty: "EdTech Systems Inc", owner: "operations", autoRenew: true },
  { title: "Food Service Agreement", counterparty: "Nutrition Partners", owner: "operations", autoRenew: false },
  { title: "Transportation Services Contract", counterparty: "SafeRide Transit", owner: "operations", autoRenew: false },
  { title: "Professional Services Master Agreement", counterparty: "Advisory Group", owner: "legal", autoRenew: false },
  { title: "Cloud Hosting Agreement", counterparty: "CloudScale", owner: "operations", autoRenew: true },
  { title: "Insurance Broker Agreement", counterparty: "Assurance Brokers", owner: "legal", autoRenew: true },
];

const REQUIRED_CLAUSES = ["termination", "indemnification", "data_protection", "liability_cap", "renewal_terms"];

export class ContractIntelligence implements ContractIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): ContractSuite {
    const { baseline, now, createId } = input;
    const contracts: ContractRecord[] = CONTRACT_TEMPLATES.map((template, index) => {
      const health = clamp(baseline.contractCoverage + (index % 3) * 4 - (index % 2) * 6);
      const expiresInDays = Math.round((health - 45) * 5) + (index % 4) * 30;
      const expiresAt = new Date(now.getTime() + expiresInDays * 86_400_000).toISOString();
      const expired = new Date(expiresAt).getTime() < now.getTime();
      const missingClauses = REQUIRED_CLAUSES.filter((_, clauseIndex) => (health + clauseIndex * 7) % 100 < 30 + clauseIndex * 6);
      const riskScore = clamp(100 - health + missingClauses.length * 8);
      const status: ContractStatus = expired
        ? "expired"
        : expiresInDays <= 90
          ? "expiring"
          : template.autoRenew && expiresInDays <= 180
            ? "renewing"
            : "active";
      return {
        id: createId("lcr-contract"),
        title: template.title,
        counterparty: template.counterparty,
        status,
        annualValue: Math.round(80_000 + health * 2_500 + index * 15_000),
        startsAt: new Date(now.getTime() - (400 + index * 40) * 86_400_000).toISOString(),
        expiresAt,
        autoRenew: template.autoRenew,
        obligations: [`Deliver ${template.title.toLowerCase()} obligations`, "Maintain compliance evidence", "Provide periodic reporting"],
        missingClauses,
        riskScore,
        owner: template.owner,
        narrative: `${template.title} with ${template.counterparty} is ${status}; risk ${Math.round(riskScore)}.`,
        lenses: buildLens({
          regulationOrPolicyApplies: "Contract obligations and internal procurement policy.",
          evidenceSupports: `${template.title} record and executed agreement.`,
          confidence: `Contract coverage ${Math.round(baseline.contractCoverage)}.`,
          organizationalRisk: `Contractual and vendor exposure at ${Math.round(riskScore)}.`,
          ifNoActionTaken: missingClauses.length ? "Unprotected terms and unmanaged renewals increase legal exposure." : "Renewal lapses risk service disruption.",
          correctiveActionRecommended: missingClauses.length ? `Add missing clauses: ${missingClauses.join(", ")}.` : "Confirm renewal calendar and owner.",
          whoOwnsAction: template.owner,
          whenShouldComplete: expiresAt,
        }),
      };
    });

    const expiringSoon = contracts.filter((contract) => contract.status === "expiring" || contract.status === "expired");
    const missingClauses = contracts
      .flatMap((contract) => contract.missingClauses.map((clause) => `${contract.title}:${clause}`))
      .slice(0, 12);
    const autoRenewRisk = clamp(
      (contracts.filter((contract) => contract.autoRenew).length / Math.max(1, contracts.length)) * 100
    );
    const coverageScore = clamp(
      baseline.contractCoverage * 0.7 +
        (1 - missingClauses.length / Math.max(1, contracts.length * REQUIRED_CLAUSES.length)) * 30
    );

    return {
      contracts,
      coverageScore,
      expiringSoon,
      missingClauses,
      autoRenewRisk,
      narrative: `Contract coverage ${Math.round(coverageScore)} across ${contracts.length} contracts; ${expiringSoon.length} expiring soon.`,
    };
  }
}
