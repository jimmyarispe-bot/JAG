/**
 * OrganizationMission builder (Sprint 030).
 */

import type { OrganizationMissionBuilder as OrganizationMissionBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationMission,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationMissionBuilderImpl
  implements OrganizationMissionBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    now: Date;
  }): OrganizationMission {
    void input.now;
    const seed = input.seed;
    const statement =
      seed.missionHint?.trim() ||
      `Enable ${seed.targetCustomer ?? "customers"} to achieve durable outcomes through ${seed.solutionSummary ?? "a focused operating system"}.`;

    return {
      statement,
      purpose: seed.ideaSummary ?? statement,
      beneficiaries: [
        seed.targetCustomer ?? "Primary customers",
        "Operators and teams",
        "Stakeholders and boards",
      ],
      narrative: `Mission anchors the organization around ${seed.industry ?? "its"} outcomes for ${seed.targetCustomer ?? "customers"}.`,
    };
  }
}

export { OrganizationMissionBuilderImpl as OrganizationMission };
export { OrganizationMissionBuilderImpl as OrganizationMissionBuilder };
