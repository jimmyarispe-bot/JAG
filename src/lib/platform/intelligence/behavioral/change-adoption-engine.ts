import type { ChangeAdoptionEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { ChangeAdoptionSuite } from "@/lib/platform/intelligence/behavioral/types";

export class ChangeAdoptionEngine implements ChangeAdoptionEngineContract {
  assess(input: Parameters<ChangeAdoptionEngineContract["assess"]>[0]): ChangeAdoptionSuite {
    const suite = input.areas.adoption_forecasting;
    const records = suite.records.map(record => ({
      id: input.createId("beh-adoption"),
      title: record.title,
      adoption: record.score,
      lenses: record.lenses,
      narrative: `Change adoption: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      adoptionIndex: input.baseline.adoptionProbability,
      narrative: `Change adoption suite index ${Math.round(input.baseline.adoptionProbability)}.`,
    };
  }
}
