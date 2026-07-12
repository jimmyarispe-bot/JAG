/**
 * White Space Intelligence — unmet needs and capture opportunities.
 */

import type { WhiteSpaceIntelligence as WhiteSpaceIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  CustomerDemandSuite,
  MarketBaseline,
  MarketSizeSuite,
  WhiteSpaceOpportunityRecord,
  WhiteSpaceSuite,
} from "@/lib/platform/intelligence/market/types";

const UNMET_NEEDS = [
  { unmetNeed: "Affordable extended-day care integrated with academics", segment: "Early Childhood Education" },
  { unmetNeed: "Career-linked high school pathways with employer partners", segment: "Specialty Academies" },
  { unmetNeed: "Hybrid micro-school model for suburban corridors", segment: "Hybrid / Micro-schools" },
  { unmetNeed: "Multilingual family onboarding experience", segment: "Charter Networks" },
  { unmetNeed: "Specialized STEM enrichment without full tuition premium", segment: "K-12 Independent Schools" },
];

export class WhiteSpaceIntelligence implements WhiteSpaceIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    customerDemand: CustomerDemandSuite;
    competitive: CompetitiveSuite;
    marketSize: MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): WhiteSpaceSuite {
    const { baseline, customerDemand, competitive, marketSize, createId } = input;
    void input.now;
    const opportunities: WhiteSpaceOpportunityRecord[] = UNMET_NEEDS.map((template, index) => {
      const competitiveGap = clamp(
        55 + customerDemand.unmetNeedCount * 4 + index * 3 - competitive.positionScore * 0.15
      );
      const sizeEstimate = Math.round(
        marketSize.estimates.som * (0.08 + index * 0.03) + baseline.whiteSpaceScore * 12_000
      );
      const captureScore = clamp(
        baseline.whiteSpaceScore * 0.4 + competitiveGap * 0.35 + customerDemand.demandScore * 0.25
      );
      return {
        id: createId("mkt-whitespace"),
        unmetNeed: template.unmetNeed,
        segment: template.segment,
        sizeEstimate,
        competitiveGap,
        captureScore,
        narrative: `${template.unmetNeed} capture ${Math.round(captureScore)} in ${template.segment}.`,
        lenses: buildLens({
          marketOpportunityExists: template.unmetNeed,
          evidenceSupports: `Demand score ${Math.round(customerDemand.demandScore)}; unmet needs ${customerDemand.unmetNeedCount}.`,
          competitorsInvolved: competitive.competitors.slice(0, 3).map((c) => c.name).join(", "),
          estimatedMarketSize: `Approx $${sizeEstimate.toLocaleString()} addressable white space.`,
          risksExist: "Capability gaps and competitor fast-follow.",
          investmentRequired: "Program design, staffing, and go-to-market investment.",
          expectedReturn: `Capture score ${Math.round(captureScore)}.`,
          organizationalCapabilitiesRequired: "Product design, partnerships, operations capacity.",
        }),
      };
    });
    const whiteSpaceScore = clamp(
      opportunities.reduce((sum, opportunity) => sum + opportunity.captureScore, 0) /
        opportunities.length
    );
    const unmetNeedCount = opportunities.length + customerDemand.unmetNeedCount;

    return {
      opportunities,
      whiteSpaceScore,
      unmetNeedCount,
      narrative: `White space score ${Math.round(whiteSpaceScore)} across ${opportunities.length} unmet-need opportunities.`,
    };
  }
}
