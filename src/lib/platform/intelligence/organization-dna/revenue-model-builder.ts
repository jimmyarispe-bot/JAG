/**
 * RevenueModelBuilder (Sprint 030).
 */

import type { RevenueModelBuilder as RevenueModelBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  OrganizationStage,
  RevenueModel,
  RevenueStreamKind,
} from "@/lib/platform/intelligence/organization-dna/types";

function primaryKind(seed: CompanyBuilderSeed): RevenueStreamKind {
  const hint = seed.revenueHints?.[0]?.toLowerCase() ?? "";
  if (hint.includes("tuition")) return "tuition";
  if (hint.includes("grant")) return "grants";
  if (hint.includes("donat")) return "donations";
  if (hint.includes("sub")) return "subscription";
  if (hint.includes("licen")) return "licensing";
  if (seed.industry === "education" || seed.sector === "schools")
    return "tuition";
  return "subscription";
}

export class RevenueModelBuilderImpl implements RevenueModelBuilderContract {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): RevenueModel {
    void input.now;
    const kind = primaryKind(input.seed);
    const streams = [
      {
        id: input.createId("revenue"),
        kind,
        name: `Primary ${kind} revenue`,
        description:
          input.seed.revenueHints?.[0] ??
          `Core ${kind} stream for ${input.seed.industry ?? "the organization"}`,
        shareEstimate: 0.7,
        pricingModel:
          kind === "subscription"
            ? "monthly / annual recurring"
            : kind === "tuition"
              ? "term / annual tuition"
              : "project or usage pricing",
      },
      {
        id: input.createId("revenue"),
        kind: "ancillary" as const,
        name: "Ancillary services",
        description: "Adjacent services and expansions",
        shareEstimate: 0.3,
        pricingModel: "variable",
      },
    ];

    return {
      primaryKind: kind,
      streams,
      pricingSummary: streams[0]!.pricingModel,
      unitEconomics:
        input.stage === "idea" || input.stage === "startup"
          ? "Early-stage: focus on willingness-to-pay and contribution margin"
          : "Operating: track LTV/CAC or yield per customer segment",
      narrative: `Revenue model for ${input.stage} stage.`,
    };
  }
}

export { RevenueModelBuilderImpl as RevenueModelBuilder };
