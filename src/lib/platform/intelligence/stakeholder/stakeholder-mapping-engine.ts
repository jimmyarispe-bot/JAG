import type { StakeholderMappingEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { StakeholderMappingSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class StakeholderMappingEngine implements StakeholderMappingEngineContract {
  assess(input: Parameters<StakeholderMappingEngineContract["assess"]>[0]): StakeholderMappingSuite {
    const areas = ["stakeholder_identification", "stakeholder_mapping", "influence_analysis"] as const;
    const records = areas.flatMap(area =>
      input.areas[area].records.map(record => ({
        id: input.createId("stk-mapping"),
        title: record.title,
        area,
        coverage: record.score,
        lenses: record.lenses,
        narrative: record.narrative,
      }))
    );
    const coverageIndex = (input.baseline.areaScores.stakeholder_mapping + input.baseline.areaScores.stakeholder_identification) / 2;
    return {
      records,
      score: coverageIndex,
      coverageIndex,
      narrative: `Stakeholder mapping suite coverage index ${Math.round(coverageIndex)}.`,
    };
  }
}
