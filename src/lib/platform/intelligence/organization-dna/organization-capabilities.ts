/**
 * OrganizationCapabilities builder (Sprint 030).
 */

import type { OrganizationCapabilitiesBuilder as OrganizationCapabilitiesBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import { readinessFromScore } from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  OrganizationCapabilities,
  OrganizationDnaBaseline,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationCapabilitiesBuilderImpl
  implements OrganizationCapabilitiesBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationCapabilities {
    void input.now;
    const hints = input.seed.capabilityHints ?? [];
    const b = input.baseline;

    const catalog =
      hints.length > 0
        ? hints.map((name) => ({
            id: input.createId("capability"),
            domain: "custom",
            name,
            maturity: Math.round(b.executionReadiness),
            status: readinessFromScore(b.executionReadiness),
            evidence: "Founder-stated capability",
          }))
        : [
            {
              id: input.createId("capability"),
              domain: "product",
              name: "Solution delivery",
              maturity: Math.round(b.modelClarity),
              status: readinessFromScore(b.modelClarity),
              evidence: input.seed.solutionSummary ?? "Solution sketch present",
            },
            {
              id: input.createId("capability"),
              domain: "market",
              name: "Customer discovery",
              maturity: Math.round(b.marketClarity),
              status: readinessFromScore(b.marketClarity),
              evidence: input.seed.targetCustomer ?? "Target customer stated",
            },
            {
              id: input.createId("capability"),
              domain: "operations",
              name: "Operating rhythm",
              maturity: Math.round(b.executionReadiness),
              status: readinessFromScore(b.executionReadiness),
              evidence: `Org health ${b.organizationHealthScore}`,
            },
            {
              id: input.createId("capability"),
              domain: "finance",
              name: "Financial stewardship",
              maturity: Math.round(b.financialHealthScore),
              status: readinessFromScore(b.financialHealthScore),
              evidence: `Financial health ${b.financialHealthScore}`,
            },
            {
              id: input.createId("capability"),
              domain: "governance",
              name: "Governance readiness",
              maturity: Math.round(b.complianceScore),
              status: readinessFromScore(b.complianceScore),
              evidence: `Compliance ${b.complianceScore}`,
            },
          ];

    return {
      capabilities: catalog,
      narrative: `Capability map for ${input.stage} stage.`,
    };
  }
}

export { OrganizationCapabilitiesBuilderImpl as OrganizationCapabilities };
export {
  OrganizationCapabilitiesBuilderImpl as OrganizationCapabilitiesBuilder,
};
