/**
 * BusinessModelEngine (Sprint 030).
 */

import type { BusinessModelEngine as BusinessModelEngineContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  BusinessModel,
  BusinessModelArchetype,
  CompanyBuilderSeed,
  CustomerPersona,
  OrganizationStage,
  RevenueModel,
  ValueProposition,
} from "@/lib/platform/intelligence/organization-dna/types";

function archetype(
  seed: CompanyBuilderSeed,
  revenue: RevenueModel
): BusinessModelArchetype {
  if (seed.industry === "education" || seed.sector === "schools")
    return "education";
  if (revenue.primaryKind === "subscription") return "subscription";
  if (revenue.primaryKind === "licensing") return "licensing";
  if (revenue.primaryKind === "grants" || revenue.primaryKind === "donations")
    return "nonprofit";
  if (revenue.primaryKind === "services") return "services";
  return "hybrid";
}

export class BusinessModelEngineImpl implements BusinessModelEngineContract {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    valueProposition: ValueProposition;
    revenueModel: RevenueModel;
    personas: CustomerPersona[];
    now: Date;
  }): BusinessModel {
    void input.now;
    const seed = input.seed;
    return {
      archetype: archetype(seed, input.revenueModel),
      valueProposition: input.valueProposition,
      customerSegments: input.personas.map((p) => p.segment),
      channels: seed.channelHints?.length
        ? seed.channelHints
        : ["direct", "partners"],
      revenueModel: input.revenueModel,
      costDrivers: [
        "Talent",
        "Product / platform",
        "Customer acquisition",
        "Compliance / governance",
      ],
      keyPartners: [
        "Channel partners",
        "Technology providers",
        "Advisors / board",
      ],
      keyActivities: [
        "DNA / profile maintenance",
        "Customer discovery and delivery",
        "Operating cadence and reporting",
      ],
      keyResources: [
        "Organizational DNA",
        "Team capabilities",
        "Intelligence platform",
      ],
      narrative: `Business model for ${input.stage} stage (${archetype(seed, input.revenueModel)}).`,
    };
  }
}

export { BusinessModelEngineImpl as BusinessModelEngine };
