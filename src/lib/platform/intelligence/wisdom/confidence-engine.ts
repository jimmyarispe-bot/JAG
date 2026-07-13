import type { ConfidenceEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { ConfidenceSuite } from "@/lib/platform/intelligence/wisdom/types";

export class ConfidenceEngine implements ConfidenceEngineContract {
  assess(input: Parameters<ConfidenceEngineContract["assess"]>[0]): ConfidenceSuite {
    const suite = input.areas.confidence_calibration;
    const records = suite.records.map(record => ({
      id: input.createId("wis-confidence"),
      title: record.title,
      calibrationIndex: record.score,
      lenses: record.lenses,
      narrative: `Confidence calibration: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      calibrationIndex: input.baseline.confidenceLevel,
      narrative: `Confidence suite index ${Math.round(input.baseline.confidenceLevel)}.`,
    };
  }
}
