import type { UncertaintyEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { UncertaintySuite } from "@/lib/platform/intelligence/wisdom/types";

export class UncertaintyEngine implements UncertaintyEngineContract {
  assess(input: Parameters<UncertaintyEngineContract["assess"]>[0]): UncertaintySuite {
    const suite = input.areas.uncertainty_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("wis-uncertainty"),
      title: record.title,
      uncertaintyIndex: record.score,
      lenses: record.lenses,
      narrative: `Uncertainty: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      uncertaintyIndex: input.baseline.confidenceLevel,
      narrative: `Uncertainty suite index ${Math.round(input.baseline.confidenceLevel)}.`,
    };
  }
}
