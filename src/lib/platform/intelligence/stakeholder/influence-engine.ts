import type { InfluenceEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { InfluenceSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class InfluenceEngine implements InfluenceEngineContract {
  assess(input: Parameters<InfluenceEngineContract["assess"]>[0]): InfluenceSuite {
    const areas = ["influence_analysis", "board_stakeholders", "government_stakeholders"] as const;
    const records = areas.flatMap(area =>
      input.areas[area].records.map(record => ({
        id: input.createId("stk-influence"),
        title: record.title,
        area,
        influence: record.score,
        lenses: record.lenses,
        narrative: record.narrative,
      }))
    );
    const influenceIndex = 100 - input.baseline.influencePressure;
    return {
      records,
      score: influenceIndex,
      influenceIndex,
      narrative: `Influence suite index ${Math.round(influenceIndex)}.`,
    };
  }
}
