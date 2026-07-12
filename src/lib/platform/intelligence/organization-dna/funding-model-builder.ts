/**
 * FundingModelBuilder (Sprint 030).
 */

import type { FundingModelBuilder as FundingModelBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  FundingModel,
  FundingModelKind,
  OrganizationDnaBaseline,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

function primaryFunding(
  seed: CompanyBuilderSeed,
  stage: OrganizationStage
): FundingModelKind {
  const hint = seed.fundingHints?.[0]?.toLowerCase() ?? "";
  if (hint.includes("venture") || hint.includes("vc")) return "venture";
  if (hint.includes("angel")) return "angel";
  if (hint.includes("grant")) return "grants";
  if (hint.includes("debt")) return "debt";
  if (hint.includes("boot")) return "bootstrapped";
  if (stage === "idea") return "friends_family";
  if (stage === "startup") return "angel";
  if (stage === "growth") return "venture";
  return "revenue";
}

export class FundingModelBuilderImpl implements FundingModelBuilderContract {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    baseline: OrganizationDnaBaseline;
    now: Date;
  }): FundingModel {
    void input.now;
    const primaryKind = primaryFunding(input.seed, input.stage);
    const stages: FundingModel["stages"] = [
      {
        stage: "idea",
        kind: "friends_family",
        amountHint: "seed validation capital",
        purpose: "Validate problem and build first DNA / MVP",
      },
      {
        stage: "startup",
        kind: primaryKind === "venture" ? "angel" : primaryKind,
        amountHint: "runway for product-market discovery",
        purpose: "Reach operating readiness",
      },
      {
        stage: "operating",
        kind: "revenue",
        amountHint: null,
        purpose: "Self-fund operations where possible",
      },
      {
        stage: "growth",
        kind: primaryKind === "bootstrapped" ? "revenue" : "venture",
        amountHint: "scale capital",
        purpose: "Expand market and capabilities",
      },
    ];

    const runwayMonths =
      input.seed.capitalHint != null && input.baseline.revenue === 0
        ? Math.max(3, Math.round(input.seed.capitalHint / 25000))
        : input.baseline.revenue > 0
          ? 12
          : 6;

    return {
      primaryKind,
      stages,
      runwayMonths,
      narrative: `Funding model centered on ${primaryKind} for ${input.stage}.`,
    };
  }
}

export { FundingModelBuilderImpl as FundingModelBuilder };
