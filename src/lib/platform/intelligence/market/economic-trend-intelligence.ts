/**
 * Economic Trend Intelligence — indicators, tailwinds, volatility.
 */

import type { EconomicTrendIntelligence as EconomicTrendIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  EconomicIndicatorRecord,
  EconomicTrendSuite,
  MarketBaseline,
} from "@/lib/platform/intelligence/market/types";

const INDICATORS: Array<{ indicator: string; direction: "improving" | "stable" | "worsening" }> = [
  { indicator: "Regional employment", direction: "improving" },
  { indicator: "Household income growth", direction: "stable" },
  { indicator: "Education spending index", direction: "improving" },
  { indicator: "Cost of living pressure", direction: "worsening" },
  { indicator: "Local construction permits", direction: "stable" },
];

export class EconomicTrendIntelligence implements EconomicTrendIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): EconomicTrendSuite {
    const { baseline, createId } = input;
    void input.now;
    const indicators: EconomicIndicatorRecord[] = INDICATORS.map((template, index) => {
      const value = clamp(
        baseline.economicTailwind + (template.direction === "improving" ? 8 : template.direction === "worsening" ? -8 : 0) + (index % 2) * 3
      );
      const impactScore = clamp(value * 0.7 + baseline.fundingCapacity * 0.3);
      return {
        id: createId("mkt-econ"),
        indicator: template.indicator,
        value,
        direction: template.direction,
        impactScore,
        narrative: `${template.indicator} is ${template.direction} at ${Math.round(value)}.`,
      };
    });
    const tailwindScore = clamp(
      indicators.reduce((sum, indicator) => sum + indicator.impactScore, 0) / indicators.length
    );
    const volatilityPressure = clamp(
      indicators.filter((indicator) => indicator.direction === "worsening").length * 18 +
        (100 - tailwindScore) * 0.35
    );

    return {
      indicators,
      tailwindScore,
      volatilityPressure,
      narrative: `Economic tailwind ${Math.round(tailwindScore)}; volatility pressure ${Math.round(volatilityPressure)}.`,
    };
  }
}
