import type { DecisionModelingEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { DecisionModelingSuite } from "@/lib/platform/intelligence/behavioral/types";

export class DecisionModelingEngine implements DecisionModelingEngineContract {
  assess(input: Parameters<DecisionModelingEngineContract["assess"]>[0]): DecisionModelingSuite {
    const suite = input.areas.decision_behavior;
    const records = suite.records.map(record => ({
      id: input.createId("beh-decision"),
      title: record.title,
      confidence: record.score,
      lenses: record.lenses,
      narrative: `Decision modeling: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      decisionIndex: input.baseline.decisionConfidence,
      narrative: `Decision modeling suite index ${Math.round(input.baseline.decisionConfidence)}.`,
    };
  }
}
