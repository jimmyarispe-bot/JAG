/**
 * Industry Intelligence — segment attractiveness, growth, consolidation.
 */

import type { IndustryIntelligence as IndustryIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  IndustrySegmentRecord,
  IndustrySuite,
  MarketBaseline,
} from "@/lib/platform/intelligence/market/types";

const SEGMENT_TEMPLATES = [
  { name: "K-12 Independent Schools", maturity: "mature" },
  { name: "Charter Networks", maturity: "growth" },
  { name: "Early Childhood Education", maturity: "growth" },
  { name: "Specialty Academies", maturity: "emerging" },
  { name: "Hybrid / Micro-schools", maturity: "emerging" },
];

export class IndustryIntelligence implements IndustryIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): IndustrySuite {
    const { baseline, createId } = input;
    void input.now;
    const segments: IndustrySegmentRecord[] = SEGMENT_TEMPLATES.map((template, index) => {
      const attractiveness = clamp(
        baseline.industryAttractiveness + (index % 3) * 4 - (index % 2) * 5
      );
      const growthRate = clamp(
        baseline.predictiveGrowthSignal * 0.6 + attractiveness * 0.4 + (index % 4) * 3 - 6,
        -5,
        40
      );
      return {
        id: createId("mkt-industry"),
        name: template.name,
        attractiveness,
        growthRate,
        maturity: template.maturity,
        regulatoryPressure: clamp(baseline.legalRegulatoryPressure * 100 + index * 3),
        narrative: `${template.name} attractiveness ${Math.round(attractiveness)} (${template.maturity}).`,
      };
    });
    const attractivenessScore = clamp(
      segments.reduce((sum, segment) => sum + segment.attractiveness, 0) / segments.length
    );
    const growthOutlook = clamp(
      segments.reduce((sum, segment) => sum + segment.growthRate, 0) / segments.length
    );
    const consolidationPressure = clamp(
      baseline.maActivity * 0.5 + baseline.competitivePressure * 50
    );

    return {
      segments,
      attractivenessScore,
      growthOutlook,
      consolidationPressure,
      narrative: `Industry attractiveness ${Math.round(attractivenessScore)} across ${segments.length} segments; consolidation pressure ${Math.round(consolidationPressure)}.`,
    };
  }
}
