import type { CognitiveBiasEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { CognitiveBiasSuite } from "@/lib/platform/intelligence/behavioral/types";

export class CognitiveBiasEngine implements CognitiveBiasEngineContract {
  assess(input: Parameters<CognitiveBiasEngineContract["assess"]>[0]): CognitiveBiasSuite {
    const suite = input.areas.cognitive_bias;
    const records = suite.records.map(record => ({
      id: input.createId("beh-bias"),
      title: record.title,
      biasRisk: record.score,
      lenses: record.lenses,
      narrative: `Cognitive bias: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      biasIndex: input.baseline.cognitiveBiasRisk,
      narrative: `Cognitive bias suite index ${Math.round(input.baseline.cognitiveBiasRisk)}.`,
    };
  }
}
