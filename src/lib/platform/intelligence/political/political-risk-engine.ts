import type { PoliticalRiskEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { priorityFromScore } from "@/lib/platform/intelligence/political/models";
import type { PoliticalRiskSuite } from "@/lib/platform/intelligence/political/types";

export class PoliticalRiskEngine implements PoliticalRiskEngineContract {
  assess(input: Parameters<PoliticalRiskEngineContract["assess"]>[0]): PoliticalRiskSuite {
    const areas = ["geopolitical_risk", "elections_leadership", "public_sentiment"] as const;
    const records = areas.flatMap(area =>
      input.areas[area].records.map(record => ({
        id: input.createId("pol-risk-item"),
        title: record.title,
        area,
        severity: priorityFromScore(record.score),
        score: 100 - record.score,
        lenses: record.lenses,
        narrative: record.narrative,
      }))
    );
    const aggregateRisk = (input.baseline.geopoliticalRisk + (100 - input.baseline.politicalStability) + input.baseline.legislativePressure) / 3;
    return {
      records,
      score: 100 - aggregateRisk,
      aggregateRisk,
      narrative: `Political risk suite aggregates geopolitical, elections, and sentiment (${Math.round(aggregateRisk)} risk).`,
    };
  }
}
