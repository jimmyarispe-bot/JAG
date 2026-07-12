/**
 * Market Size Intelligence — TAM / SAM / SOM estimates.
 */

import type { MarketSizeIntelligence as MarketSizeIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp, clamp01 } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  IndustrySuite,
  MarketBaseline,
  MarketSizeEstimate,
  MarketSizeSuite,
} from "@/lib/platform/intelligence/market/types";

export class MarketSizeIntelligence implements MarketSizeIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    industry: IndustrySuite;
    competitive: CompetitiveSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): MarketSizeSuite {
    const { baseline, industry, competitive } = input;
    void input.now;
    void input.createId;

    const tam = Math.round(
      120_000_000 +
        baseline.marketSizeIndex * 2_500_000 +
        industry.attractivenessScore * 1_200_000
    );
    const sam = Math.round(tam * clamp01(0.22 + baseline.demographicFit / 400 + baseline.geographicExpansionReadiness / 500));
    const som = Math.round(sam * clamp01(0.08 + baseline.marketShareEstimate + competitive.positionScore / 800));
    const samToTamRatio = clamp01(sam / Math.max(1, tam));
    const somToSamRatio = clamp01(som / Math.max(1, sam));

    const estimates: MarketSizeEstimate = {
      tam,
      sam,
      som,
      samToTamRatio,
      somToSamRatio,
      currency: "USD",
      narrative: `TAM ${tam.toLocaleString()} → SAM ${sam.toLocaleString()} → SOM ${som.toLocaleString()}.`,
    };
    const sizeIndex = clamp(baseline.marketSizeIndex * 0.55 + industry.attractivenessScore * 0.25 + samToTamRatio * 100 * 0.2);
    const addressableShare = clamp(samToTamRatio * 100);
    const capturePotential = clamp(somToSamRatio * 100 * 0.6 + competitive.positionScore * 0.4);

    return {
      estimates,
      sizeIndex,
      addressableShare,
      capturePotential,
      narrative: `Market size index ${Math.round(sizeIndex)}; capture potential ${Math.round(capturePotential)}. ${estimates.narrative}`,
    };
  }
}
