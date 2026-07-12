/**
 * OrganizationVision builder (Sprint 030).
 */

import type { OrganizationVisionBuilder as OrganizationVisionBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationStage,
  OrganizationVision,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationVisionBuilderImpl
  implements OrganizationVisionBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    now: Date;
  }): OrganizationVision {
    void input.now;
    const seed = input.seed;
    const horizonYears =
      input.stage === "idea" || input.stage === "startup" ? 5 : 3;
    const statement =
      seed.visionHint?.trim() ||
      `Become the operating system of record for ${seed.industry ?? "organizations"} in ${seed.geography ?? "target markets"}.`;

    return {
      statement,
      horizonYears,
      aspirations: [
        "Clear organizational DNA shared across leadership",
        "Repeatable growth and governance systems",
        "Measurable readiness for the next lifecycle stage",
      ],
      narrative: `Vision looks ${horizonYears} years ahead from the ${input.stage} stage.`,
    };
  }
}

export { OrganizationVisionBuilderImpl as OrganizationVision };
export { OrganizationVisionBuilderImpl as OrganizationVisionBuilder };
