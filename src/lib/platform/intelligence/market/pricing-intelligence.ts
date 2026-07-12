/**
 * Pricing Intelligence — bands, power, elasticity, premium headroom.
 */

import type { PricingIntelligence as PricingIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  MarketBaseline,
  MarketSizeSuite,
  PricingBandRecord,
  PricingSuite,
} from "@/lib/platform/intelligence/market/types";

const BAND_SEGMENTS = [
  "K-12 Independent Schools",
  "Charter Networks",
  "Early Childhood Education",
  "Specialty Academies",
];

export class PricingIntelligence implements PricingIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    competitive: CompetitiveSuite;
    marketSize: MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): PricingSuite {
    const { baseline, competitive, marketSize, createId } = input;
    void input.now;
    const bands: PricingBandRecord[] = BAND_SEGMENTS.map((segment, index) => {
      const mid = Math.round(8_000 + baseline.pricingPower * 120 + index * 1_500);
      const low = Math.round(mid * 0.78);
      const high = Math.round(mid * 1.28);
      const ourPosition = Math.round(mid * (0.92 + baseline.pricingPower / 500));
      const powerScore = clamp(
        baseline.pricingPower + (index % 2) * 4 - competitive.competitivePressure * 0.15
      );
      return {
        id: createId("mkt-pricing"),
        segment,
        low,
        mid,
        high,
        ourPosition,
        powerScore,
        narrative: `${segment} pricing power ${Math.round(powerScore)}; position ${ourPosition} vs mid ${mid}.`,
      };
    });
    const pricingPower = clamp(
      bands.reduce((sum, band) => sum + band.powerScore, 0) / bands.length
    );
    const elasticityPressure = clamp(
      competitive.competitivePressure * 0.55 + (100 - pricingPower) * 0.45
    );
    const premiumHeadroom = clamp(
      pricingPower * 0.5 + marketSize.capturePotential * 0.3 + (100 - elasticityPressure) * 0.2
    );

    return {
      bands,
      pricingPower,
      elasticityPressure,
      premiumHeadroom,
      narrative: `Pricing power ${Math.round(pricingPower)}; premium headroom ${Math.round(premiumHeadroom)}.`,
    };
  }
}
