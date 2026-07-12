/**
 * OrganizationalGoals builder (Sprint 030).
 */

import type { OrganizationalGoalsBuilder as OrganizationalGoalsBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationStage,
  OrganizationalGoals,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationalGoalsBuilderImpl
  implements OrganizationalGoalsBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationalGoals {
    void input.now;
    const seed = input.seed;
    const hints = seed.goalHints ?? [];
    const defaults = [
      {
        title: "Validate problem–solution fit",
        horizon: "near" as const,
        metric: "customer interviews",
        target: "25",
        priority: "high" as const,
      },
      {
        title: "Establish operating rhythm",
        horizon: "mid" as const,
        metric: "weekly scorecard cadence",
        target: "100%",
        priority: "medium" as const,
      },
      {
        title: "Reach next lifecycle stage readiness",
        horizon: "long" as const,
        metric: "readiness score",
        target: "80+",
        priority: "high" as const,
      },
    ];

    const goals =
      hints.length > 0
        ? hints.map((title, index) => ({
            id: input.createId("goal"),
            title,
            horizon: (index === 0 ? "near" : index === 1 ? "mid" : "long") as
              | "near"
              | "mid"
              | "long",
            metric: null,
            target: null,
            priority: (index === 0 ? "high" : "medium") as
              | "critical"
              | "high"
              | "medium"
              | "low"
              | "monitor",
          }))
        : defaults.map((g) => ({
            id: input.createId("goal"),
            ...g,
          }));

    return {
      northStar:
        seed.visionHint?.trim() ||
        `Become the default operating system for ${seed.industry ?? "the organization"}.`,
      goals,
      narrative: `Goals aligned to ${input.stage} stage priorities.`,
    };
  }
}

export { OrganizationalGoalsBuilderImpl as OrganizationalGoals };
export { OrganizationalGoalsBuilderImpl as OrganizationalGoalsBuilder };
