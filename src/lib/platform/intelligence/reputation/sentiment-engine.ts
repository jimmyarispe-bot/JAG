import type { SentimentEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import type { SentimentSuite } from "@/lib/platform/intelligence/reputation/types";

export class SentimentEngine implements SentimentEngineContract {
  assess(input: Parameters<SentimentEngineContract["assess"]>[0]): SentimentSuite {
    const suite = input.areas.public_perception;
    const records = suite.records.map(record => ({
      id: input.createId("rep-sentiment"),
      title: record.title,
      sentiment: record.score,
      lenses: record.lenses,
      narrative: `Sentiment: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      sentimentIndex: input.baseline.publicPerception,
      narrative: `Sentiment suite index ${Math.round(input.baseline.publicPerception)}.`,
    };
  }
}
