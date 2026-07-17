/**
 * Market competitive intelligence — competitors, pricing and launch signals.
 * Named MarketCompetitiveIntelligence (Phase B / H-A3) to avoid collision with
 * the competitive domain package class CompetitiveIntelligence.
 */

import type { MarketCompetitiveIntelligence as MarketCompetitiveIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp, clamp01 } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitorRecord,
  CompetitiveSuite,
  IndustrySuite,
  MarketBaseline,
} from "@/lib/platform/intelligence/market/types";

const COMPETITOR_TEMPLATES = [
  { name: "Northbridge Academy Network", segment: "K-12 Independent Schools", pricing: "premium" },
  { name: "Horizon Charter Collective", segment: "Charter Networks", pricing: "mid" },
  { name: "BrightStart Early Learning", segment: "Early Childhood Education", pricing: "value" },
  { name: "Summit STEM Academies", segment: "Specialty Academies", pricing: "premium" },
  { name: "FlexPath Micro Schools", segment: "Hybrid / Micro-schools", pricing: "mid" },
  { name: "Regional Catholic Consortium", segment: "K-12 Independent Schools", pricing: "mid" },
  { name: "Urban Promise Schools", segment: "Charter Networks", pricing: "value" },
  { name: "Innovation Lab Academy", segment: "Specialty Academies", pricing: "premium" },
];

export class MarketCompetitiveIntelligence implements MarketCompetitiveIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    industry: IndustrySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): CompetitiveSuite {
    const { baseline, industry, createId } = input;
    void input.now;
    const count = Math.max(4, Math.min(COMPETITOR_TEMPLATES.length, baseline.competitorCount));
    const competitors: CompetitorRecord[] = COMPETITOR_TEMPLATES.slice(0, count).map((template, index) => {
      const threatScore = clamp(
        baseline.competitivePressure * 100 + (index % 3) * 6 - baseline.competitivePosition * 0.2
      );
      const marketShare = clamp01(
        0.04 + (1 - threatScore / 200) * 0.08 + index * 0.01
      );
      const launchSignals =
        threatScore > 55
          ? [`${template.name} program expansion`, `${template.name} campus announcement`]
          : [`${template.name} curriculum refresh`];
      const pricingSignals =
        template.pricing === "premium"
          ? [`${template.name} tuition increase signal`]
          : [`${template.name} promotional pricing`];
      return {
        id: createId("mkt-competitor"),
        name: template.name,
        segment: template.segment,
        marketShare,
        pricingPosition: template.pricing,
        launchSignals,
        pricingSignals,
        threatScore,
        narrative: `${template.name} threat ${Math.round(threatScore)} with ${template.pricing} pricing.`,
      };
    });
    const competitivePressure = clamp(
      competitors.reduce((sum, competitor) => sum + competitor.threatScore, 0) / competitors.length
    );
    const positionScore = clamp(
      baseline.competitivePosition * 0.6 +
        (100 - competitivePressure) * 0.25 +
        industry.attractivenessScore * 0.15
    );
    const launchSignalCount = competitors.reduce((sum, competitor) => sum + competitor.launchSignals.length, 0);
    const pricingSignalCount = competitors.reduce((sum, competitor) => sum + competitor.pricingSignals.length, 0);

    return {
      competitors,
      competitivePressure,
      positionScore,
      launchSignalCount,
      pricingSignalCount,
      narrative: `Competitive position ${Math.round(positionScore)} vs ${competitors.length} peers; ${launchSignalCount} launch and ${pricingSignalCount} pricing signals.`,
    };
  }
}

/** @deprecated Use MarketCompetitiveIntelligence — alias retained for compatibility. */
export { MarketCompetitiveIntelligence as CompetitiveIntelligence };
