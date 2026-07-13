import type { EngagementEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { EngagementSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class EngagementEngine implements EngagementEngineContract {
  assess(input: Parameters<EngagementEngineContract["assess"]>[0]): EngagementSuite {
    const suite = input.areas.engagement;
    const records = suite.records.map(record => ({
      id: input.createId("stk-engagement"),
      title: record.title,
      quality: record.score,
      lenses: record.lenses,
      narrative: `Engagement quality: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      qualityIndex: input.baseline.engagementQuality,
      narrative: `Engagement suite quality index ${Math.round(input.baseline.engagementQuality)}.`,
    };
  }
}
