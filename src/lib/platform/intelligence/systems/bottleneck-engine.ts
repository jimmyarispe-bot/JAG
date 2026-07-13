import type { BottleneckEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { BottleneckSuite } from "@/lib/platform/intelligence/systems/types";

export class BottleneckEngine implements BottleneckEngineContract {
  assess(input: Parameters<BottleneckEngineContract["assess"]>[0]): BottleneckSuite {
    const suite = input.areas.bottleneck_detection;
    const records = suite.records.map(record => ({
      id: input.createId("sys-bottleneck"),
      title: record.title,
      saturation: record.score,
      lenses: record.lenses,
      narrative: `Bottleneck analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      bottleneckIndex: input.baseline.bottleneckRisk,
      narrative: `Bottleneck suite index ${Math.round(input.baseline.bottleneckRisk)}.`,
    };
  }
}
