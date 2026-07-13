import type { StrategicReasoningEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { StrategicReasoningSuite } from "@/lib/platform/intelligence/wisdom/types";

export class StrategicReasoningEngine implements StrategicReasoningEngineContract {
  assess(input: Parameters<StrategicReasoningEngineContract["assess"]>[0]): StrategicReasoningSuite {
    const suite = input.areas.strategic_reasoning;
    const records = suite.records.map(record => ({
      id: input.createId("wis-reasoning"),
      title: record.title,
      reasoningIndex: record.score,
      lenses: record.lenses,
      narrative: `Strategic reasoning: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      reasoningIndex: input.baseline.strategicValue,
      narrative: `Strategic reasoning suite index ${Math.round(input.baseline.strategicValue)}.`,
    };
  }
}
