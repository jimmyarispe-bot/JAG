/**
 * Policy Intelligence — policy coverage, staleness, and ownership.
 */

import type { PolicyIntelligence as PolicyIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type ComplianceScope,
  type LegalComplianceRiskBaseline,
  type PolicyRecord,
  type PolicyStatus,
  type PolicySuite,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const POLICY_TEMPLATES: Array<{ name: string; scope: ComplianceScope; owner: string }> = [
  { name: "Data Privacy Policy", scope: "federal", owner: "legal" },
  { name: "Acceptable Use Policy", scope: "internal_policies", owner: "operations" },
  { name: "Code of Conduct", scope: "board_policies", owner: "governance" },
  { name: "Whistleblower Policy", scope: "board_policies", owner: "governance" },
  { name: "Conflict of Interest Policy", scope: "board_policies", owner: "governance" },
  { name: "Records Retention Policy", scope: "internal_policies", owner: "compliance" },
  { name: "Safety & Emergency Policy", scope: "local", owner: "operations" },
  { name: "Grant Management Policy", scope: "grant_requirements", owner: "funding" },
];

export class PolicyIntelligence implements PolicyIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): PolicySuite {
    const { baseline, now, createId } = input;
    const policies: PolicyRecord[] = POLICY_TEMPLATES.map((template, index) => {
      const coverageScore = clamp(baseline.policyCoverage + (index % 3) * 5 - (index % 2) * 8);
      const reviewAgeDays = Math.round((100 - coverageScore) * 4) + index * 20;
      const stale = reviewAgeDays > 365;
      const status: PolicyStatus = stale ? "stale" : coverageScore >= 60 ? "active" : "draft";
      const lastReviewedAt = new Date(now.getTime() - reviewAgeDays * 86_400_000).toISOString();
      const nextReviewAt = new Date(now.getTime() + (365 - Math.min(365, reviewAgeDays)) * 86_400_000).toISOString();
      return {
        id: createId("lcr-policy"),
        name: template.name,
        scope: template.scope,
        status,
        owner: template.owner,
        lastReviewedAt,
        nextReviewAt,
        coverageScore,
        narrative: `${template.name} is ${status}; coverage ${Math.round(coverageScore)}.`,
      };
    });

    const staleCount = policies.filter((policy) => policy.status === "stale").length;
    const ownerGaps = policies.filter((policy) => policy.owner === "operations").length === 0 ? 1 : 0;
    const coverageScore = clamp(
      baseline.policyCoverage * 0.75 + (1 - staleCount / Math.max(1, policies.length)) * 25
    );

    return {
      policies,
      coverageScore,
      staleCount,
      ownerGaps,
      narrative: `Policy coverage ${Math.round(coverageScore)} across ${policies.length} policies; ${staleCount} stale.`,
    };
  }
}
