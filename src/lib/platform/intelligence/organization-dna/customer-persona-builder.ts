/**
 * CustomerPersonaBuilder (Sprint 030).
 */

import type { CustomerPersonaBuilder as CustomerPersonaBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  CustomerPersona,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class CustomerPersonaBuilderImpl
  implements CustomerPersonaBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): CustomerPersona[] {
    void input.now;
    const seed = input.seed;
    const primaryName =
      seed.targetCustomer?.split(",")[0]?.trim() || "Primary Buyer";

    const personas: CustomerPersona[] = [
      {
        id: input.createId("persona"),
        name: primaryName,
        role: "Economic buyer / champion",
        segment: "primary",
        pains: [
          seed.problemStatement ?? "Fragmented operating information",
          "Unclear priorities across leadership",
          "Reactive decision-making",
        ],
        gains: [
          "Single source of organizational truth",
          "Faster, higher-confidence decisions",
          "Stage-appropriate roadmap",
        ],
        jobs: [
          "Align leadership on strategy",
          "Allocate scarce resources",
          "Measure organizational readiness",
        ],
        channels: seed.channelHints?.length
          ? seed.channelHints
          : ["direct outreach", "referrals", "industry networks"],
        narrative: `Primary persona for ${input.stage} stage go-to-market.`,
      },
      {
        id: input.createId("persona"),
        name: "Operator / Program Lead",
        role: "Day-to-day user",
        segment: "secondary",
        pains: [
          "Too many tools, not enough clarity",
          "Status reporting overhead",
        ],
        gains: ["Actionable weekly priorities", "Less firefighting"],
        jobs: ["Execute plans", "Report progress", "Escalate risks"],
        channels: ["internal champions", "product onboarding"],
        narrative: "Secondary persona who lives inside the operating system.",
      },
    ];

    if (input.stage === "operating" || input.stage === "growth") {
      personas.push({
        id: input.createId("persona"),
        name: "Board / Governance Stakeholder",
        role: "Oversight",
        segment: "governance",
        pains: ["Packet noise", "Lagging risk visibility"],
        gains: ["Board-ready summaries", "Clear initiative status"],
        jobs: ["Approve strategy", "Monitor risk", "Ensure mission fidelity"],
        channels: ["board packets", "executive briefings"],
        narrative: "Governance persona for mature operating stages.",
      });
    }

    return personas;
  }
}

export { CustomerPersonaBuilderImpl as CustomerPersonaBuilder };
