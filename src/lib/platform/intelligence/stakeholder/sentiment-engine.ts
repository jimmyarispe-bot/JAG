import type { SentimentEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { SentimentSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class SentimentEngine implements SentimentEngineContract {
  assess(input: Parameters<SentimentEngineContract["assess"]>[0]): SentimentSuite {
    const suite = input.areas.satisfaction_sentiment;
    const records = suite.records.map(record => ({
      id: input.createId("stk-sentiment"),
      title: record.title,
      sentiment: record.score,
      lenses: record.lenses,
      narrative: `Sentiment: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      sentimentIndex: input.baseline.satisfactionIndex,
      narrative: `Sentiment suite index ${Math.round(input.baseline.satisfactionIndex)}.`,
    };
  }
}
