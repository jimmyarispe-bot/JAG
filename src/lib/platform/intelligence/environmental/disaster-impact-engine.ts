import type { DisasterImpactEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import type { DisasterImpactSuite } from "@/lib/platform/intelligence/environmental/types";

export class DisasterImpactEngine implements DisasterImpactEngineContract {
  assess(input: Parameters<DisasterImpactEngineContract["assess"]>[0]): DisasterImpactSuite {
    const suite = input.areas.natural_disaster;
    const records = suite.records.map(record => ({
      id: input.createId("env-disaster"),
      title: record.title,
      impact: 100 - record.score,
      lenses: record.lenses,
      narrative: `Disaster impact from ${record.title}: ${Math.round(100 - record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      impactIndex: input.baseline.facilityExposure,
      narrative: `Disaster impact suite index ${Math.round(input.baseline.facilityExposure)}.`,
    };
  }
}
