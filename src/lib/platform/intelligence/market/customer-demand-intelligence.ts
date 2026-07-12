/**
 * Customer Demand Intelligence — demand signals and unmet needs.
 */

import type { CustomerDemandIntelligence as CustomerDemandIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CustomerDemandSuite,
  DemandSignalRecord,
  MarketBaseline,
  PricingSuite,
} from "@/lib/platform/intelligence/market/types";

const DEMAND_THEMES = [
  { theme: "Extended learning day", segment: "K-12 Independent Schools" },
  { theme: "STEM enrichment", segment: "Specialty Academies" },
  { theme: "Flexible enrollment models", segment: "Hybrid / Micro-schools" },
  { theme: "Early literacy acceleration", segment: "Early Childhood Education" },
  { theme: "Family experience & communication", segment: "Charter Networks" },
  { theme: "Career pathway programs", segment: "Specialty Academies" },
];

export class CustomerDemandIntelligence implements CustomerDemandIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    pricing: PricingSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): CustomerDemandSuite {
    const { baseline, pricing, createId } = input;
    void input.now;
    const signals: DemandSignalRecord[] = DEMAND_THEMES.map((template, index) => {
      const momentum = clamp(
        baseline.demandMomentum + (index % 3) * 5 - (index % 2) * 4
      );
      const intensity = clamp(momentum * 0.7 + pricing.pricingPower * 0.3);
      return {
        id: createId("mkt-demand"),
        theme: template.theme,
        momentum,
        intensity,
        segment: template.segment,
        narrative: `${template.theme} demand momentum ${Math.round(momentum)} in ${template.segment}.`,
      };
    });
    const demandScore = clamp(
      signals.reduce((sum, signal) => sum + signal.momentum, 0) / signals.length
    );
    const shiftPressure = clamp(
      (100 - demandScore) * 0.4 + baseline.customerDemandProxy * 0.2 + pricing.elasticityPressure * 0.4
    );
    const unmetNeedCount = signals.filter((signal) => signal.momentum < 60).length + Math.round(shiftPressure / 40);

    return {
      signals,
      demandScore,
      shiftPressure,
      unmetNeedCount,
      narrative: `Demand score ${Math.round(demandScore)} with ${unmetNeedCount} unmet-need signals; shift pressure ${Math.round(shiftPressure)}.`,
    };
  }
}
