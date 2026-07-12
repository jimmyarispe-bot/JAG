/**
 * GoToMarketPlanner (Sprint 030).
 */

import type { GoToMarketPlanner as GoToMarketPlannerContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  CustomerPersona,
  GoToMarketPlan,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class GoToMarketPlannerImpl implements GoToMarketPlannerContract {
  plan(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    personas: CustomerPersona[];
    createId: (prefix: string) => string;
    now: Date;
  }): GoToMarketPlan {
    void input.now;
    const seed = input.seed;
    const channelNames = seed.channelHints?.length
      ? seed.channelHints
      : ["direct sales", "partnerships", "content / thought leadership"];

    const channels = channelNames.map((name, index) => ({
      id: input.createId("channel"),
      name,
      role: (index === 0
        ? "primary"
        : index === 1
          ? "secondary"
          : "experimental") as "primary" | "secondary" | "experimental",
      costBand: (index === 0 ? "medium" : "low") as
        | "critical"
        | "high"
        | "medium"
        | "low"
        | "monitor",
    }));

    return {
      beachhead:
        input.personas[0]?.segment === "primary"
          ? `${input.personas[0].name} in ${seed.geography ?? "local market"}`
          : seed.targetCustomer ?? "Primary beachhead segment",
      channels,
      messaging: [
        seed.solutionSummary ?? "Organizational clarity as a product",
        "Stage-aware company building",
        "Intelligence that compounds across founder → executive → board",
      ],
      milestones: [
        {
          id: input.createId("gtm"),
          title: "Beachhead discovery interviews",
          horizon: "30 days",
          successMetric: "20 qualified conversations",
        },
        {
          id: input.createId("gtm"),
          title: "First paid design partners",
          horizon: "90 days",
          successMetric: "3 design partners",
        },
        {
          id: input.createId("gtm"),
          title: "Repeatable acquisition loop",
          horizon: "180 days",
          successMetric: "Documented CAC / conversion funnel",
        },
      ],
      narrative: `Go-to-market plan for ${input.stage} stage.`,
    };
  }
}

export { GoToMarketPlannerImpl as GoToMarketPlanner };
