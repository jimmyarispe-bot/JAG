/**
 * Mergers & Acquisitions Intelligence — targets and consolidation pressure.
 */

import type { MergersAcquisitionsIntelligence as MergersAcquisitionsIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  IndustrySuite,
  MaTargetRecord,
  MarketBaseline,
  MergersAcquisitionsSuite,
} from "@/lib/platform/intelligence/market/types";

const TARGETS = [
  { name: "Harbor Day Academy", rationale: "Geographic adjacency and brand fit" },
  { name: "Pathways Learning Center", rationale: "Early childhood feeder pipeline" },
  { name: "Summit Online Collective", rationale: "Hybrid delivery capability" },
  { name: "Civic STEM Lab Schools", rationale: "Specialty program depth" },
];

export class MergersAcquisitionsIntelligence implements MergersAcquisitionsIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    competitive: CompetitiveSuite;
    industry: IndustrySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): MergersAcquisitionsSuite {
    const { baseline, competitive, industry, createId } = input;
    void input.now;
    const targets: MaTargetRecord[] = TARGETS.map((template, index) => {
      const strategicFit = clamp(
        baseline.maActivity + industry.attractivenessScore * 0.25 + (index % 2) * 6 - index * 3
      );
      const valuationIndex = clamp(55 + index * 7 + competitive.competitivePressure * 0.2);
      const riskScore = clamp(100 - strategicFit + competitive.competitivePressure * 0.25);
      const status =
        strategicFit >= 70 ? ("advancing" as const) : strategicFit >= 50 ? ("assessed" as const) : ("deferred" as const);
      return {
        id: createId("mkt-ma"),
        name: template.name,
        rationale: template.rationale,
        strategicFit,
        valuationIndex,
        riskScore,
        status,
        narrative: `${template.name} fit ${Math.round(strategicFit)}; risk ${Math.round(riskScore)}.`,
        lenses: buildLens({
          marketOpportunityExists: `M&A opportunity: ${template.name}.`,
          evidenceSupports: template.rationale,
          competitorsInvolved: competitive.competitors.slice(0, 2).map((c) => c.name).join(", ") || "Regional peers",
          estimatedMarketSize: `Tied to industry attractiveness ${Math.round(industry.attractivenessScore)}.`,
          risksExist: `Integration and valuation risk ${Math.round(riskScore)}.`,
          investmentRequired: `Valuation index ${Math.round(valuationIndex)}.`,
          expectedReturn: "Market share, capability, and geographic coverage lift.",
          organizationalCapabilitiesRequired: "Diligence, integration management, capital access.",
        }),
      };
    });
    const activityScore = clamp(
      targets.reduce((sum, target) => sum + target.strategicFit, 0) / targets.length
    );
    const consolidationPressure = clamp(
      industry.consolidationPressure * 0.6 + baseline.competitivePressure * 40
    );

    return {
      targets,
      activityScore,
      consolidationPressure,
      narrative: `M&A activity ${Math.round(activityScore)}; consolidation pressure ${Math.round(consolidationPressure)}.`,
    };
  }
}
