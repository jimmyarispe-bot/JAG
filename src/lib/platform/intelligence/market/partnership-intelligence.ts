/**
 * Partnership Intelligence — strategic partner density and pipeline.
 */

import type { PartnershipIntelligence as PartnershipIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  GeographicExpansionSuite,
  MarketBaseline,
  PartnershipRecord,
  PartnershipSuite,
} from "@/lib/platform/intelligence/market/types";

const PARTNERS = [
  { partner: "Regional Employer Alliance", type: "workforce" },
  { partner: "Municipal Education Compact", type: "civic" },
  { partner: "University Articulation Network", type: "academic" },
  { partner: "EdTech Platform Consortium", type: "technology" },
  { partner: "Community Foundation Circle", type: "philanthropy" },
];

export class PartnershipIntelligence implements PartnershipIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    competitive: CompetitiveSuite;
    geographicExpansion: GeographicExpansionSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): PartnershipSuite {
    const { baseline, competitive, geographicExpansion, createId } = input;
    void input.now;
    const partnerships: PartnershipRecord[] = PARTNERS.map((template, index) => {
      const strategicFit = clamp(
        baseline.partnershipDensity + (index % 3) * 5 - competitive.competitivePressure * 0.1
      );
      const densityContribution = clamp(strategicFit * 0.8 + geographicExpansion.readinessScore * 0.2);
      const status =
        strategicFit >= 75 ? ("advancing" as const) : strategicFit >= 55 ? ("monitored" as const) : ("draft" as const);
      return {
        id: createId("mkt-partner"),
        partner: template.partner,
        type: template.type,
        strategicFit,
        densityContribution,
        status,
        narrative: `${template.partner} (${template.type}) fit ${Math.round(strategicFit)}.`,
        lenses: buildLens({
          marketOpportunityExists: `Partnership with ${template.partner} expands market reach.`,
          evidenceSupports: `Strategic fit ${Math.round(strategicFit)}.`,
          competitorsInvolved: competitive.competitors.slice(0, 2).map((c) => c.name).join(", ") || "Peer networks",
          estimatedMarketSize: `Supports expansion toward SAM ${geographicExpansion.candidates[0]?.marketAttractiveness ?? baseline.marketSizeIndex}.`,
          risksExist: "Partner misalignment and dependency concentration.",
          investmentRequired: "Relationship management capacity and shared program funding.",
          expectedReturn: "Enrollment pipeline and brand lift.",
          organizationalCapabilitiesRequired: "Partnership ops, legal review, program design.",
        }),
      };
    });
    const densityScore = clamp(
      partnerships.reduce((sum, partnership) => sum + partnership.densityContribution, 0) /
        partnerships.length
    );
    const pipelineCount = partnerships.filter((partnership) => partnership.status !== "captured").length;

    return {
      partnerships,
      densityScore,
      pipelineCount,
      narrative: `Partnership density ${Math.round(densityScore)} across ${partnerships.length} partners (${pipelineCount} in pipeline).`,
    };
  }
}
