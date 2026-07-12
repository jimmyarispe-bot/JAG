/**
 * OrganizationCulture builder (Sprint 030).
 */

import type { OrganizationCultureBuilder as OrganizationCultureBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationCulture,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationCultureBuilderImpl
  implements OrganizationCultureBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    now: Date;
  }): OrganizationCulture {
    void input.now;
    const hints = input.seed.cultureHints ?? [];
    const stage = input.stage;
    const style =
      hints[0] ??
      (stage === "idea" || stage === "startup"
        ? "builder"
        : stage === "turnaround"
          ? "disciplined"
          : "operator");

    return {
      style,
      traits:
        hints.length > 0
          ? hints
          : ["bias to action", "evidence-led", "customer proximity", "candor"],
      decisionStyle:
        stage === "idea" || stage === "startup"
          ? "founder-led with rapid experiments"
          : "distributed ownership with clear escalation",
      communicationStyle: "direct, written-first, decision-logged",
      riskTolerance:
        stage === "idea" || stage === "startup"
          ? "high"
          : stage === "turnaround"
            ? "medium"
            : "low",
      narrative: `Culture profile tuned for the ${stage} stage.`,
    };
  }
}

export { OrganizationCultureBuilderImpl as OrganizationCulture };
export { OrganizationCultureBuilderImpl as OrganizationCultureBuilder };
