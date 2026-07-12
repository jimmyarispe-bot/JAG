/**
 * LeanCanvasGenerator (Sprint 030).
 */

import type { LeanCanvasGenerator as LeanCanvasGeneratorContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderSeed,
  CustomerPersona,
  GoToMarketPlan,
  LeanCanvas,
  RevenueModel,
  ValueProposition,
} from "@/lib/platform/intelligence/organization-dna/types";

export class LeanCanvasGeneratorImpl implements LeanCanvasGeneratorContract {
  generate(input: {
    seed: CompanyBuilderSeed;
    valueProposition: ValueProposition;
    personas: CustomerPersona[];
    revenueModel: RevenueModel;
    goToMarket: GoToMarketPlan;
    now: Date;
  }): LeanCanvas {
    void input.now;
    const seed = input.seed;
    return {
      problem: [
        seed.problemStatement ?? "Fragmented organizational operating data",
        "Unclear stage readiness",
        "Leadership misalignment",
      ],
      customerSegments: input.personas.map((p) => `${p.name} (${p.segment})`),
      uniqueValueProposition: input.valueProposition.statement,
      solution: [
        seed.solutionSummary ?? "Organizational DNA + Company Builder",
        "Lifecycle-aware readiness and roadmap",
        "Integrated executive intelligence substrate",
      ],
      channels: input.goToMarket.channels.map((c) => c.name),
      revenueStreams: input.revenueModel.streams.map((s) => s.name),
      costStructure: [
        "Product / platform development",
        "Go-to-market and partnerships",
        "Talent and operating overhead",
      ],
      keyMetrics: [
        "Organizational readiness score",
        "Activation / retention of design partners",
        "Stage progression rate",
      ],
      unfairAdvantage:
        "Compounding intelligence graph across founder, executive, predictive, and board layers",
      narrative: "Lean canvas generated from Company Builder seed and models.",
    };
  }
}

export { LeanCanvasGeneratorImpl as LeanCanvasGenerator };
