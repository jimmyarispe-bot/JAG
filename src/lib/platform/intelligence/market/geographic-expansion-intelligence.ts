/**
 * Geographic Expansion Intelligence — expansion candidates and readiness.
 */

import type { GeographicExpansionIntelligence as GeographicExpansionIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/market/models";
import type {
  DemographicSuite,
  ExpansionCandidateRecord,
  GeographicExpansionSuite,
  MarketBaseline,
  MarketSizeSuite,
} from "@/lib/platform/intelligence/market/types";

const REGIONS = [
  "North Metro Corridor",
  "Coastal Growth Belt",
  "Inland Suburban Ring",
  "Secondary City Cluster",
  "Emerging Exurban Zone",
];

export class GeographicExpansionIntelligence implements GeographicExpansionIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    demographic: DemographicSuite;
    marketSize: MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): GeographicExpansionSuite {
    const { baseline, demographic, marketSize, createId } = input;
    void input.now;
    const count = Math.max(3, Math.min(REGIONS.length, baseline.expansionCandidateCount + 1));
    const candidates: ExpansionCandidateRecord[] = REGIONS.slice(0, count).map((region, index) => {
      const readiness = clamp(
        baseline.geographicExpansionReadiness + (index % 3) * 5 - index * 3
      );
      const marketAttractiveness = clamp(
        demographic.fitScore * 0.4 + marketSize.sizeIndex * 0.4 + readiness * 0.2
      );
      const competitiveIntensity = clamp(40 + index * 8 + baseline.competitivePressure * 30);
      const investmentEstimate = Math.round(250_000 + (100 - readiness) * 8_000 + index * 75_000);
      const expectedReturn = Math.round(investmentEstimate * (0.9 + readiness / 100));
      return {
        id: createId("mkt-geo"),
        region,
        readiness,
        marketAttractiveness,
        competitiveIntensity,
        investmentEstimate,
        expectedReturn,
        narrative: `${region} readiness ${Math.round(readiness)}; attractiveness ${Math.round(marketAttractiveness)}.`,
        lenses: buildLens({
          marketOpportunityExists: `Expansion opportunity in ${region}.`,
          evidenceSupports: `Demographic fit ${Math.round(demographic.fitScore)} and market size index ${Math.round(marketSize.sizeIndex)}.`,
          competitorsInvolved: `Competitive intensity ${Math.round(competitiveIntensity)}.`,
          estimatedMarketSize: `Regional SAM share tied to TAM ${marketSize.estimates.tam.toLocaleString()}.`,
          risksExist: "Execution, brand dilution, and local competitive response.",
          investmentRequired: `Approx $${investmentEstimate.toLocaleString()}.`,
          expectedReturn: `Approx $${expectedReturn.toLocaleString()} over planning horizon.`,
          organizationalCapabilitiesRequired: "Operations capacity, local partnerships, funding runway.",
        }),
      };
    });
    const readinessScore = clamp(
      candidates.reduce((sum, candidate) => sum + candidate.readiness, 0) / candidates.length
    );
    const ranked = [...candidates].sort((a, b) => b.marketAttractiveness - a.marketAttractiveness);
    const topCandidate = ranked[0]?.region ?? null;
    const expansionPressure = clamp(
      (100 - readinessScore) * 0.4 + baseline.opportunityDensity * 0.35 + marketSize.capturePotential * 0.25
    );

    return {
      candidates,
      readinessScore,
      topCandidate,
      expansionPressure,
      narrative: `Geographic readiness ${Math.round(readinessScore)}; top candidate ${topCandidate ?? "none"}.`,
    };
  }
}
