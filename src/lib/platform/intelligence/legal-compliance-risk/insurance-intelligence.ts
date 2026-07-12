/**
 * Insurance Intelligence — coverage adequacy and renewal monitoring.
 */

import type { InsuranceIntelligence as InsuranceIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type EnterpriseRiskSuite,
  type InsurancePolicyRecord,
  type InsuranceStatus,
  type InsuranceSuite,
  type LegalComplianceRiskBaseline,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const INSURANCE_TEMPLATES: Array<{ name: string; carrier: string; coverageType: string; owner: string }> = [
  { name: "General Liability", carrier: "Assurance Mutual", coverageType: "liability", owner: "legal" },
  { name: "Property Insurance", carrier: "Assurance Mutual", coverageType: "property", owner: "operations" },
  { name: "Directors & Officers", carrier: "Governance Underwriters", coverageType: "management", owner: "governance" },
  { name: "Cyber Liability", carrier: "CyberGuard", coverageType: "cyber", owner: "operations" },
  { name: "Workers Compensation", carrier: "WorkSafe", coverageType: "workforce", owner: "human_capital" },
  { name: "Professional Liability", carrier: "Advisory Underwriters", coverageType: "professional", owner: "legal" },
];

export class InsuranceIntelligence implements InsuranceIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    enterpriseRisk: EnterpriseRiskSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): InsuranceSuite {
    const { baseline, enterpriseRisk, now, createId } = input;
    const policies: InsurancePolicyRecord[] = INSURANCE_TEMPLATES.map((template, index) => {
      const adequacyScore = clamp(baseline.insuranceAdequacy + (index % 3) * 5 - (index % 2) * 9 - enterpriseRisk.overallRiskPressure * 0.1);
      const renewsInDays = Math.round((adequacyScore - 50) * 4) + (index % 4) * 30;
      const renewsAt = new Date(now.getTime() + renewsInDays * 86_400_000).toISOString();
      const status: InsuranceStatus = renewsInDays < 0 ? "lapsed" : renewsInDays <= 60 ? "expiring" : "active";
      return {
        id: createId("lcr-insurance"),
        name: template.name,
        carrier: template.carrier,
        coverageType: template.coverageType,
        coverageLimit: Math.round(1_000_000 + adequacyScore * 40_000),
        premium: Math.round(12_000 + index * 4_000 + (100 - adequacyScore) * 200),
        status,
        renewsAt,
        adequacyScore,
        owner: template.owner,
        narrative: `${template.name} (${template.carrier}) is ${status}; adequacy ${Math.round(adequacyScore)}.`,
      };
    });

    const coverageGaps = policies
      .filter((policy) => policy.adequacyScore < 55 || policy.status === "lapsed")
      .map((policy) => `${policy.name}:${policy.status}`);
    const expiringSoon = policies.filter((policy) => policy.status === "expiring" || policy.status === "lapsed").length;
    const adequacyScore = clamp(
      baseline.insuranceAdequacy * 0.7 + (1 - coverageGaps.length / Math.max(1, policies.length)) * 30
    );

    return {
      policies,
      adequacyScore,
      coverageGaps,
      expiringSoon,
      narrative: `Insurance adequacy ${Math.round(adequacyScore)} across ${policies.length} policies; ${coverageGaps.length} coverage gaps.`,
    };
  }
}
