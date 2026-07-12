/**
 * Demographic Intelligence — cohort fit, population and employment alignment.
 */

import type { DemographicIntelligence as DemographicIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CustomerDemandSuite,
  DemographicCohortRecord,
  DemographicSuite,
  MarketBaseline,
} from "@/lib/platform/intelligence/market/types";

const COHORTS = [
  "Families with school-age children",
  "Early childhood households",
  "Dual-income professional families",
  "Transfer / relocation households",
  "Employer-sponsored education seekers",
];

export class DemographicIntelligence implements DemographicIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    customerDemand: CustomerDemandSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): DemographicSuite {
    const { baseline, customerDemand, createId } = input;
    void input.now;
    const cohorts: DemographicCohortRecord[] = COHORTS.map((cohort, index) => {
      const fitScore = clamp(
        baseline.demographicFit + (index % 3) * 4 - (index % 2) * 5
      );
      const growthRate = clamp(
        baseline.demandMomentum * 0.4 + fitScore * 0.4 + (index % 4) * 3 - 8,
        -5,
        35
      );
      return {
        id: createId("mkt-demo"),
        cohort,
        fitScore,
        growthRate,
        sizeIndex: clamp(fitScore * 0.7 + growthRate * 0.3 + 20),
        narrative: `${cohort} fit ${Math.round(fitScore)}; growth ${Math.round(growthRate)}.`,
      };
    });
    const fitScore = clamp(
      cohorts.reduce((sum, cohort) => sum + cohort.fitScore, 0) / cohorts.length
    );
    const populationMomentum = clamp(
      cohorts.reduce((sum, cohort) => sum + cohort.growthRate, 0) / cohorts.length + 40
    );
    const employmentAlignment = clamp(
      fitScore * 0.5 + customerDemand.demandScore * 0.3 + baseline.economicTailwind * 0.2
    );

    return {
      cohorts,
      fitScore,
      populationMomentum,
      employmentAlignment,
      narrative: `Demographic fit ${Math.round(fitScore)}; population momentum ${Math.round(populationMomentum)}.`,
    };
  }
}
