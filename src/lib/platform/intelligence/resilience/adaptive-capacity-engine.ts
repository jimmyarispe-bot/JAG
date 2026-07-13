import type { AdaptiveCapacityEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { AdaptiveCapacitySuite } from "@/lib/platform/intelligence/resilience/types";

export class AdaptiveCapacityEngine implements AdaptiveCapacityEngineContract {
  assess(input: Parameters<AdaptiveCapacityEngineContract["assess"]>[0]): AdaptiveCapacitySuite {
    const suite = input.areas.adaptive_capacity;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-adaptive"),
      title: record.title,
      capacity: record.score,
      lenses: record.lenses,
      narrative: `Adaptive capacity: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      adaptiveIndex: input.baseline.adaptiveCapacity,
      narrative: `Adaptive capacity suite index ${Math.round(input.baseline.adaptiveCapacity)}.`,
    };
  }
}
