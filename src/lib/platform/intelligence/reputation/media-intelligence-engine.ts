import type { MediaIntelligenceEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import type { MediaIntelligenceSuite } from "@/lib/platform/intelligence/reputation/types";

export class MediaIntelligenceEngine implements MediaIntelligenceEngineContract {
  assess(input: Parameters<MediaIntelligenceEngineContract["assess"]>[0]): MediaIntelligenceSuite {
    const suite = input.areas.media_intelligence;
    const records = suite.records.map(record => ({
      id: input.createId("rep-media"),
      title: record.title,
      exposure: record.score,
      lenses: record.lenses,
      narrative: `Media: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      exposureIndex: 100 - input.baseline.mediaExposure,
      narrative: `Media intelligence suite exposure index ${Math.round(100 - input.baseline.mediaExposure)}.`,
    };
  }
}
